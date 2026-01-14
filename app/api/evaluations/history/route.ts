import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireApiKey } from "@/lib/middleware";
import { evaluationRepository } from "@/lib/repositories";
import { getStorage } from "@/lib/storage";
import logger from "@/lib/logger";

/**
 * GET /api/evaluations/history
 * Get evaluation history for authenticated user
 * Supports both session-based and API key authentication
 */
export async function GET(request: NextRequest) {
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

        // Get pagination parameters
        const searchParams = request.nextUrl.searchParams;
        const limit = parseInt(searchParams.get("limit") || "50", 10);
        const offset = parseInt(searchParams.get("offset") || "0", 10);

        // Get evaluations
        const evaluations = await evaluationRepository.findByUserId(
            userId,
            limit,
            offset
        );

        // Get storage for image URLs
        const storage = getStorage();

        // Format response
        // Note: MySQL decimal fields are returned as strings, need to convert to numbers
        const response = await Promise.all(
            evaluations.map(async (evaluation) => {
                const imageUrl = await storage.getUrl(evaluation.image_path);
                return {
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
            })
        );

        return NextResponse.json({
            evaluations: response,
            pagination: {
                limit,
                offset,
                total: response.length,
            },
        });
    } catch (error) {
        logger.error("Get evaluation history error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
