import { evaluationRepository } from "../repositories";
import { getStorage } from "../storage";
import logger from "../logger";

export interface CleanupStats {
    totalFound: number;
    totalDeleted: number;
    totalFailed: number;
    errors: Array<{ evaluationId: number; error: string }>;
    startTime: Date;
    endTime?: Date;
    duration?: number; // milliseconds
}

/**
 * Image cleanup service
 * Removes images older than specified days (default 3 days)
 */
export class CleanupService {
    private retentionDays: number;

    constructor(retentionDays = 3) {
        this.retentionDays = retentionDays;
    }

    /**
     * Run cleanup process
     */
    async runCleanup(): Promise<CleanupStats> {
        const stats: CleanupStats = {
            totalFound: 0,
            totalDeleted: 0,
            totalFailed: 0,
            errors: [],
            startTime: new Date(),
        };

        logger.info("Starting image cleanup process", {
            retentionDays: this.retentionDays,
        });

        try {
            // Find evaluations older than retention days
            const oldEvaluations = await evaluationRepository.findOlderThanDays(
                this.retentionDays
            );

            stats.totalFound = oldEvaluations.length;

            logger.info(`Found ${stats.totalFound} evaluations to cleanup`);

            if (stats.totalFound === 0) {
                stats.endTime = new Date();
                stats.duration = stats.endTime.getTime() - stats.startTime.getTime();
                return stats;
            }

            // Get storage instance
            const storage = getStorage();

            // Process each evaluation
            for (const evaluation of oldEvaluations) {
                try {
                    // Skip if no image path
                    if (!evaluation.image_path || evaluation.image_path === "") {
                        logger.warn(`Evaluation ${evaluation.id} has no image path, skipping`);
                        continue;
                    }

                    // Delete image from storage
                    await storage.delete(evaluation.image_path);

                    // Update evaluation record to clear image path
                    await this.clearImagePath(evaluation.id);

                    stats.totalDeleted++;

                    logger.info(`Deleted image for evaluation ${evaluation.id}`, {
                        imagePath: evaluation.image_path,
                        storageType: evaluation.image_storage_type,
                    });
                } catch (error) {
                    stats.totalFailed++;
                    const errorMessage =
                        error instanceof Error ? error.message : "Unknown error";
                    stats.errors.push({
                        evaluationId: evaluation.id,
                        error: errorMessage,
                    });

                    logger.error(`Failed to delete image for evaluation ${evaluation.id}:`, error);
                }
            }

            stats.endTime = new Date();
            stats.duration = stats.endTime.getTime() - stats.startTime.getTime();

            logger.info("Cleanup process completed", {
                totalFound: stats.totalFound,
                totalDeleted: stats.totalDeleted,
                totalFailed: stats.totalFailed,
                duration: stats.duration,
            });

            return stats;
        } catch (error) {
            stats.endTime = new Date();
            stats.duration = stats.endTime.getTime() - stats.startTime.getTime();

            logger.error("Cleanup process failed:", error);
            throw error;
        }
    }

    /**
     * Clear image path from evaluation record
     * This preserves the evaluation record while removing the image reference
     */
    private async clearImagePath(evaluationId: number): Promise<void> {
        const { query } = await import("../db/connection");
        await query(
            `UPDATE evaluations 
             SET image_path = NULL,
                 image_storage_type = NULL
             WHERE id = ?`,
            [evaluationId]
        );
    }

    /**
     * Get cleanup statistics for monitoring
     */
    async getCleanupStats(): Promise<{
        pendingCleanup: number;
        retentionDays: number;
    }> {
        const oldEvaluations = await evaluationRepository.findOlderThanDays(
            this.retentionDays
        );

        return {
            pendingCleanup: oldEvaluations.length,
            retentionDays: this.retentionDays,
        };
    }
}
