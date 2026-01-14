import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireApiKey } from "@/lib/middleware";
import { evaluationRepository } from "@/lib/repositories";
import { getStorage } from "@/lib/storage";
import logger from "@/lib/logger";

/**
 * GET /api/evaluations/:id
 * Get evaluation report by ID
 * Supports both session-based and API key authentication
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Try session-based auth first, fallback to API key
        let userId: number | null = null;
        const sessionAuth = await requireAuth(request);

        if (sessionAuth.authenticated && sessionAuth.userId) {
            userId = sessionAuth.userId;
        } else {
            const apiKeyAuth = await requireApiKey(request);
            if (apiKeyAuth.authenticated && apiKeyAuth.userId) {
                userId = apiKeyAuth.userId;
            } else {
                return apiKeyAuth.response || NextResponse.json(
                    { error: "Unauthorized" },
                    { status: 401 }
                );
            }
        }

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const evaluationId = parseInt(params.id, 10);
        if (isNaN(evaluationId)) {
            return NextResponse.json(
                { error: "Invalid evaluation ID" },
                { status: 400 }
            );
        }

        // Get evaluation
        const evaluation = await evaluationRepository.findById(evaluationId);
        if (!evaluation) {
            return NextResponse.json(
                { error: "Evaluation not found" },
                { status: 404 }
            );
        }

        // Verify ownership
        if (evaluation.user_id !== userId) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        // Get image URL
        const storage = getStorage();
        const imageUrl = await storage.getUrl(evaluation.image_path);

        // Format response
        // Note: MySQL decimal fields are returned as strings, need to convert to numbers
        const response = {
            id: evaluation.id,
            imageUrl,
            scores: {
                overall: parseFloat(evaluation.overall_score as unknown as string) || 0,
                composition: parseFloat(evaluation.composition_score as unknown as string) || 0,
                technicalQuality: parseFloat(evaluation.technical_quality_score as unknown as string) || 0,
                artisticMerit: parseFloat(evaluation.artistic_merit_score as unknown as string) || 0,
                lighting: parseFloat(evaluation.lighting_score as unknown as string) || 0,
                subjectMatter: parseFloat(evaluation.subject_matter_score as unknown as string) || 0,
                postProcessing: parseFloat(evaluation.post_processing_score as unknown as string) || 0,
            },
            summary: evaluation.text_summary,
            status: evaluation.evaluation_status,
            createdAt: evaluation.created_at,
            updatedAt: evaluation.updated_at,
        };

        return NextResponse.json(response);
    } catch (error) {
        logger.error("Get evaluation error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
