import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";
import { getEvaluationService } from "@/lib/services/evaluation_service";
import logger from "@/lib/logger";

/**
 * GET /api/evaluations/queue/status
 * Get evaluation queue status
 * Requires authentication
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);

        if (!authResult.authenticated) {
            return authResult.response || NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const service = getEvaluationService();
        const status = service.getQueueStatus();

        return NextResponse.json({
            status,
        });
    } catch (error) {
        logger.error("Get queue status error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
