import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireApiKey } from "@/lib/middleware";
import { getEvaluationService } from "@/lib/services/evaluation_service";
import { evaluationRepository } from "@/lib/repositories";
import logger from "@/lib/logger";

/**
 * POST /api/evaluations/process
 * Trigger evaluation processing for a pending evaluation
 * Supports both session-based and API key authentication
 */
export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const { evaluationId } = body;

        if (!evaluationId) {
            return NextResponse.json(
                { error: "evaluationId is required" },
                { status: 400 }
            );
        }

        // Verify evaluation belongs to user
        const evaluation = await evaluationRepository.findById(evaluationId);
        if (!evaluation) {
            return NextResponse.json(
                { error: "Evaluation not found" },
                { status: 404 }
            );
        }

        if (evaluation.user_id !== userId) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        // Submit to evaluation service
        const service = getEvaluationService();
        await service.submitEvaluation(evaluationId);

        logger.info(`Evaluation ${evaluationId} submitted for processing`, { userId });

        return NextResponse.json({
            message: "Evaluation submitted for processing",
            evaluationId,
        });
    } catch (error) {
        logger.error("Evaluation processing error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
