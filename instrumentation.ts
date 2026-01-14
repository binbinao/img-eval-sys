/**
 * Next.js instrumentation file
 * This file is executed when the application starts
 * Used to initialize cleanup scheduler
 */

export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        const { initializeCleanupScheduler } = await import("./lib/cleanup/init");
        initializeCleanupScheduler();
    }
}
