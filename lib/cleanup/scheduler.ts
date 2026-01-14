import { CleanupService } from "./cleanup_service";
import logger from "../logger";

export interface SchedulerConfig {
    enabled: boolean;
    intervalHours: number; // How often to run cleanup (in hours)
    retentionDays: number; // How many days to keep images
}

/**
 * Cleanup scheduler
 * Runs cleanup service at regular intervals
 */
export class CleanupScheduler {
    private cleanupService: CleanupService;
    private intervalId: NodeJS.Timeout | null = null;
    private config: SchedulerConfig;
    private isRunning = false;

    constructor(config: SchedulerConfig) {
        this.config = config;
        this.cleanupService = new CleanupService(config.retentionDays);
    }

    /**
     * Start the scheduler
     */
    start(): void {
        if (!this.config.enabled) {
            logger.info("Cleanup scheduler is disabled");
            return;
        }

        if (this.intervalId) {
            logger.warn("Cleanup scheduler is already running");
            return;
        }

        logger.info("Starting cleanup scheduler", {
            intervalHours: this.config.intervalHours,
            retentionDays: this.config.retentionDays,
        });

        // Run immediately on start
        this.runCleanup();

        // Schedule periodic runs
        const intervalMs = this.config.intervalHours * 60 * 60 * 1000;
        this.intervalId = setInterval(() => {
            this.runCleanup();
        }, intervalMs);
    }

    /**
     * Stop the scheduler
     */
    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            logger.info("Cleanup scheduler stopped");
        }
    }

    /**
     * Run cleanup once
     */
    async runCleanup(): Promise<void> {
        if (this.isRunning) {
            logger.warn("Cleanup is already running, skipping this run");
            return;
        }

        this.isRunning = true;

        try {
            const stats = await this.cleanupService.runCleanup();

            // Log statistics
            logger.info("Cleanup run completed", {
                totalFound: stats.totalFound,
                totalDeleted: stats.totalDeleted,
                totalFailed: stats.totalFailed,
                duration: stats.duration,
            });

            // Alert on failures
            if (stats.totalFailed > 0) {
                logger.warn("Cleanup had failures", {
                    totalFailed: stats.totalFailed,
                    errors: stats.errors,
                });
            }
        } catch (error) {
            logger.error("Cleanup run failed:", error);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Get scheduler status
     */
    getStatus(): {
        enabled: boolean;
        running: boolean;
        intervalHours: number;
        retentionDays: number;
    } {
        return {
            enabled: this.config.enabled,
            running: this.intervalId !== null,
            intervalHours: this.config.intervalHours,
            retentionDays: this.config.retentionDays,
        };
    }
}

// Singleton instance
let schedulerInstance: CleanupScheduler | null = null;

/**
 * Get or create cleanup scheduler instance
 */
export function getCleanupScheduler(): CleanupScheduler {
    if (!schedulerInstance) {
        const enabled = process.env.CLEANUP_ENABLED === "true";
        const intervalHours = parseInt(
            process.env.CLEANUP_INTERVAL_HOURS || "24",
            10
        );
        const retentionDays = parseInt(
            process.env.CLEANUP_RETENTION_DAYS || "3",
            10
        );

        schedulerInstance = new CleanupScheduler({
            enabled,
            intervalHours,
            retentionDays,
        });
    }

    return schedulerInstance;
}
