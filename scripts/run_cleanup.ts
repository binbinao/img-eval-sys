#!/usr/bin/env tsx

/**
 * Standalone cleanup script
 * Can be run manually or via cron job
 */

import { CleanupService } from "../lib/cleanup/cleanup_service";
import logger from "../lib/logger";

const retentionDays = parseInt(process.env.CLEANUP_RETENTION_DAYS || "3", 10);

async function main() {
    logger.info("Starting manual cleanup", { retentionDays });

    try {
        const cleanupService = new CleanupService(retentionDays);
        const stats = await cleanupService.runCleanup();

        console.log("Cleanup completed:");
        console.log(`  Total found: ${stats.totalFound}`);
        console.log(`  Total deleted: ${stats.totalDeleted}`);
        console.log(`  Total failed: ${stats.totalFailed}`);
        console.log(`  Duration: ${stats.duration}ms`);

        if (stats.errors.length > 0) {
            console.log("\nErrors:");
            stats.errors.forEach((error) => {
                console.log(`  Evaluation ${error.evaluationId}: ${error.error}`);
            });
        }

        process.exit(stats.totalFailed > 0 ? 1 : 0);
    } catch (error) {
        logger.error("Cleanup failed:", error);
        console.error("Cleanup failed:", error);
        process.exit(1);
    }
}

main();
