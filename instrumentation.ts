/**
 * Next.js instrumentation file
 * This file is executed when the application starts
 * Used to initialize database migrations and cleanup scheduler
 */

export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        // Run database migrations on startup
        const { runMigrations } = await import("./lib/db/migrations");
        await runMigrations();
        
        // Initialize cleanup scheduler
        const { initializeCleanupScheduler } = await import("./lib/cleanup/init");
        initializeCleanupScheduler();
    }
}
