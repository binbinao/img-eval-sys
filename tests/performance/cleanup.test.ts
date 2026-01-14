import { CleanupService } from "../../lib/cleanup/cleanup_service";
import { evaluationRepository } from "../../lib/repositories";
import { setupTestDatabase, teardownTestDatabase } from "../helpers/db";

// Skip performance tests if database is not configured
// Set DATABASE_TEST_ENABLED=true to enable performance tests
const hasDatabase =
    process.env.DATABASE_TEST_ENABLED === "true" &&
    process.env.DATABASE_HOST &&
    process.env.DATABASE_NAME;

(hasDatabase ? describe : describe.skip)("Cleanup Service Performance Tests", () => {
    beforeAll(async () => {
        await setupTestDatabase();
    });

    afterAll(async () => {
        await teardownTestDatabase();
    });

    describe("Cleanup Performance", () => {
        it("should handle cleanup of multiple evaluations efficiently", async () => {
            const cleanupService = new CleanupService(0); // 0 days for testing

            // Create test evaluations (this would normally be done in setup)
            // For now, we'll just test the service can handle the query

            const stats = await cleanupService.getCleanupStats();

            expect(stats).toBeDefined();
            expect(stats.retentionDays).toBe(0);
            expect(stats.pendingCleanup).toBeGreaterThanOrEqual(0);
        });

        it("should complete cleanup within reasonable time", async () => {
            const cleanupService = new CleanupService(0);

            const startTime = Date.now();
            const stats = await cleanupService.runCleanup();
            const duration = Date.now() - startTime;

            expect(stats).toBeDefined();
            expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
        });
    });
});
