import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";
import { getCleanupScheduler } from "@/lib/cleanup";
import { CleanupService } from "@/lib/cleanup/cleanup_service";
import logger from "@/lib/logger";

/**
 * POST /api/admin/cleanup
 * Manually trigger cleanup process
 * Requires authentication
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);

        if (!authResult.authenticated) {
            return authResult.response || NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const scheduler = getCleanupScheduler();
        await scheduler.runCleanup();

        logger.info("Manual cleanup triggered via API");

        return NextResponse.json({
            message: "Cleanup process started",
        });
    } catch (error) {
        logger.error("Manual cleanup error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/admin/cleanup/status
 * Get cleanup scheduler status
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

        const scheduler = getCleanupScheduler();
        const status = scheduler.getStatus();

        // Get cleanup stats
        const retentionDays = parseInt(
            process.env.CLEANUP_RETENTION_DAYS || "3",
            10
        );
        const cleanupService = new CleanupService(retentionDays);
        const stats = await cleanupService.getCleanupStats();

        return NextResponse.json({
            scheduler: status,
            stats,
        });
    } catch (error) {
        logger.error("Get cleanup status error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
