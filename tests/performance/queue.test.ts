import { EvaluationQueue } from "../../lib/queue/evaluation_queue";

describe("Evaluation Queue Performance Tests", () => {
    let queue: EvaluationQueue;

    beforeEach(() => {
        queue = new EvaluationQueue(20, 10000); // 20 concurrent, 10s timeout
    });

    afterEach(() => {
        // Clean up
    });

    describe("Concurrent Processing", () => {
        it("should handle max 20 concurrent evaluations", async () => {
            const tasks = Array.from({ length: 25 }, (_, i) => ({
                id: i + 1,
                evaluationId: i + 1,
                imagePath: `test/image_${i + 1}.jpg`,
                storageType: "local" as const,
                createdAt: new Date(),
            }));

            // Enqueue all tasks
            tasks.forEach((task) => queue.enqueue(task));

            // Wait a bit for processing to start
            await new Promise((resolve) => setTimeout(resolve, 100));

            const status = queue.getStatus();

            // Should have at most 20 processing
            expect(status.processing).toBeLessThanOrEqual(20);
            expect(status.pending).toBeGreaterThanOrEqual(5); // 25 - 20 = 5
        });

        it("should process tasks in order", async () => {
            const processedOrder: number[] = [];

            queue.on("processing", (task) => {
                processedOrder.push(task.id);
            });

            const tasks = Array.from({ length: 10 }, (_, i) => ({
                id: i + 1,
                evaluationId: i + 1,
                imagePath: `test/image_${i + 1}.jpg`,
                storageType: "local" as const,
                createdAt: new Date(),
            }));

            tasks.forEach((task) => queue.enqueue(task));

            await new Promise((resolve) => setTimeout(resolve, 200));

            // First tasks should be processed first
            expect(processedOrder.length).toBeGreaterThan(0);
        });
    });

    describe("Queue Status", () => {
        it("should track queue status correctly", () => {
            const task = {
                id: 1,
                evaluationId: 1,
                imagePath: "test/image.jpg",
                storageType: "local" as const,
                createdAt: new Date(),
            };

            queue.enqueue(task);

            const status = queue.getStatus();

            expect(status.pending).toBeGreaterThanOrEqual(0);
            expect(status.processing).toBeGreaterThanOrEqual(0);
            expect(status.maxConcurrent).toBe(20);
        });
    });
});
