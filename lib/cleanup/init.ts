/**
 * Initialize cleanup scheduler on application start
 * This should be called when the application starts
 */

import { getCleanupScheduler } from "./scheduler";
import logger from "../logger";

let initialized = false;

export function initializeCleanupScheduler(): void {
    if (initialized) {
        return;
    }

    try {
        const scheduler = getCleanupScheduler();
        scheduler.start();
        initialized = true;
        logger.info("Cleanup scheduler initialized");
    } catch (error) {
        logger.error("Failed to initialize cleanup scheduler:", error);
    }
}
