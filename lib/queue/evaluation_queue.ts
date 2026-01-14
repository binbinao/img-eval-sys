import { EventEmitter } from "events";
import logger from "../logger";

export interface QueueTask {
    id: number;
    evaluationId: number;
    imagePath: string;
    storageType: "local" | "cos";
    priority?: number;
    createdAt: Date;
}

export interface QueueStatus {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    maxConcurrent: number;
}

/**
 * Evaluation processing queue with concurrency control
 */
export class EvaluationQueue extends EventEmitter {
    private queue: QueueTask[] = [];
    private processing: Map<number, QueueTask> = new Map();
    private completed: Set<number> = new Set();
    private failed: Set<number> = new Set();
    private maxConcurrent: number;
    private timeout: number; // milliseconds

    constructor(maxConcurrent = 20, timeout = 120000) {
        super();
        this.maxConcurrent = maxConcurrent;
        this.timeout = timeout;
    }

    /**
     * Add task to queue
     */
    enqueue(task: QueueTask): void {
        this.queue.push(task);
        logger.info(`Task ${task.id} enqueued`, { evaluationId: task.evaluationId });
        this.emit("enqueued", task);
        this.processNext();
    }

    /**
     * Process next task if capacity available
     */
    private processNext(): void {
        if (this.processing.size >= this.maxConcurrent) {
            return;
        }

        if (this.queue.length === 0) {
            return;
        }

        // Sort by priority if available, otherwise FIFO
        this.queue.sort((a, b) => (b.priority || 0) - (a.priority || 0));
        const task = this.queue.shift();

        if (!task) {
            return;
        }

        this.processing.set(task.id, task);
        this.emit("processing", task);

        logger.info(`Task ${task.id} started processing`, {
            evaluationId: task.evaluationId,
            processing: this.processing.size,
            pending: this.queue.length,
        });
    }

    /**
     * Mark task as completed
     */
    complete(taskId: number): void {
        const task = this.processing.get(taskId);
        if (task) {
            this.processing.delete(taskId);
            this.completed.add(taskId);
            this.emit("completed", task);
            logger.info(`Task ${task.id} completed`, { evaluationId: task.evaluationId });
            this.processNext();
        }
    }

    /**
     * Mark task as failed
     */
    fail(taskId: number, error?: Error): void {
        const task = this.processing.get(taskId);
        if (task) {
            this.processing.delete(taskId);
            this.failed.add(taskId);
            this.emit("failed", task, error);
            logger.error(`Task ${task.id} failed`, {
                evaluationId: task.evaluationId,
                error: error?.message,
            });
            this.processNext();
        }
    }

    /**
     * Get queue status
     */
    getStatus(): QueueStatus {
        return {
            pending: this.queue.length,
            processing: this.processing.size,
            completed: this.completed.size,
            failed: this.failed.size,
            maxConcurrent: this.maxConcurrent,
        };
    }

    /**
     * Get task by ID
     */
    getTask(taskId: number): QueueTask | undefined {
        return (
            this.queue.find((t) => t.id === taskId) ||
            Array.from(this.processing.values()).find((t) => t.id === taskId)
        );
    }

    /**
     * Check if task is processing
     */
    isProcessing(taskId: number): boolean {
        return this.processing.has(taskId);
    }

    /**
     * Get timeout value
     */
    getTimeout(): number {
        return this.timeout;
    }
}

// Singleton instance
let queueInstance: EvaluationQueue | null = null;

export function getEvaluationQueue(): EvaluationQueue {
    if (!queueInstance) {
        queueInstance = new EvaluationQueue(20, 120000); // 20 concurrent, 120s timeout
    }
    return queueInstance;
}
