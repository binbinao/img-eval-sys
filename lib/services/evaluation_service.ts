import { HunyuanVisionClient } from "../ai/hunyuan_client";
import { getStorage } from "../storage";
import { evaluationRepository } from "../repositories";
import { getEvaluationQueue } from "../queue/evaluation_queue";
import { extractScores, normalizeScores } from "../evaluation/scoring";
import { generateSummary } from "../evaluation/summary";
import logger from "../logger";

export interface EvaluationResult {
    overallScore: number;
    compositionScore: number;
    technicalQualityScore: number;
    artisticMeritScore: number;
    lightingScore: number;
    subjectMatterScore: number;
    postProcessingScore: number;
    textSummary: string;
}

/**
 * Evaluation processing service
 */
export class EvaluationService {
    private hunyuanClient: HunyuanVisionClient;
    private queue = getEvaluationQueue();

    constructor() {
        this.hunyuanClient = new HunyuanVisionClient();
        this.setupQueueHandlers();
    }

    /**
     * Setup queue event handlers
     */
    private setupQueueHandlers(): void {
        this.queue.on("processing", async (task) => {
            await this.processEvaluation(task);
        });
    }

    /**
     * Submit evaluation for processing
     */
    async submitEvaluation(evaluationId: number): Promise<void> {
        const evaluation = await evaluationRepository.findById(evaluationId);
        if (!evaluation) {
            throw new Error(`Evaluation ${evaluationId} not found`);
        }

        // Update status to processing
        await evaluationRepository.updateStatus(evaluationId, "processing");

        // Add to queue
        const task = {
            id: evaluationId,
            evaluationId,
            imagePath: evaluation.image_path,
            storageType: evaluation.image_storage_type,
            createdAt: new Date(),
        };

        this.queue.enqueue(task);
        logger.info(`Evaluation ${evaluationId} submitted to queue`);
    }

    /**
     * Process evaluation task
     */
    private async processEvaluation(task: {
        id: number;
        evaluationId: number;
        imagePath: string;
        storageType: "local" | "cos";
    }): Promise<void> {
        const timeout = this.queue.getTimeout();
        const timeoutId = setTimeout(() => {
            logger.error(`Evaluation ${task.evaluationId} timed out after ${timeout}ms`);
            this.queue.fail(task.id, new Error("Evaluation timeout"));
            this.markEvaluationFailed(task.evaluationId);
        }, timeout);

        try {
            // Get image URL
            const storage = getStorage();
            const imageUrl = await storage.getUrl(task.imagePath);

            // Call Hunyuan Vision API
            const response = await this.hunyuanClient.analyzeImage({
                imageUrl,
                imagePath: task.imagePath,
                storageType: task.storageType,
            });

            // Generate evaluation report
            const result = await this.generateEvaluationReport(response);

            // Update evaluation in database
            await this.updateEvaluationResult(task.evaluationId, result);

            // Mark as completed
            clearTimeout(timeoutId);
            this.queue.complete(task.id);

            logger.info(`Evaluation ${task.evaluationId} completed successfully`);
        } catch (error) {
            clearTimeout(timeoutId);
            logger.error(`Evaluation ${task.evaluationId} failed:`, error);
            this.queue.fail(task.id, error as Error);
            await this.markEvaluationFailed(task.evaluationId);
        }
    }

    /**
     * Generate evaluation report from AI response
     */
    private async generateEvaluationReport(
        aiResponse: { analysis: string; insights: string[] }
    ): Promise<EvaluationResult> {
        // Extract scores using improved scoring algorithm
        const rawScores = extractScores(aiResponse.analysis);
        const scores = normalizeScores(rawScores);

        // Generate summary with proper length control
        const summary = generateSummary(aiResponse.analysis, aiResponse.insights);

        return {
            overallScore: scores.overall,
            compositionScore: scores.composition,
            technicalQualityScore: scores.technicalQuality,
            artisticMeritScore: scores.artisticMerit,
            lightingScore: scores.lighting,
            subjectMatterScore: scores.subjectMatter,
            postProcessingScore: scores.postProcessing,
            textSummary: summary,
        };
    }

    /**
     * Update evaluation result in database
     */
    private async updateEvaluationResult(
        evaluationId: number,
        result: EvaluationResult
    ): Promise<void> {
        // Note: We need to update the evaluation record
        // Since we don't have an update method that updates scores, we might need to add one
        // For now, we'll use a direct query approach
        const { query } = await import("../db/connection");
        await query(
            `UPDATE evaluations 
             SET overall_score = ?,
                 composition_score = ?,
                 technical_quality_score = ?,
                 artistic_merit_score = ?,
                 lighting_score = ?,
                 subject_matter_score = ?,
                 post_processing_score = ?,
                 text_summary = ?,
                 evaluation_status = 'completed'
             WHERE id = ?`,
            [
                result.overallScore,
                result.compositionScore,
                result.technicalQualityScore,
                result.artisticMeritScore,
                result.lightingScore,
                result.subjectMatterScore,
                result.postProcessingScore,
                result.textSummary,
                evaluationId,
            ]
        );
    }

    /**
     * Mark evaluation as failed
     */
    private async markEvaluationFailed(evaluationId: number): Promise<void> {
        await evaluationRepository.updateStatus(evaluationId, "failed");
    }

    /**
     * Get queue status
     */
    getQueueStatus() {
        return this.queue.getStatus();
    }
}

// Singleton instance
let serviceInstance: EvaluationService | null = null;

export function getEvaluationService(): EvaluationService {
    if (!serviceInstance) {
        serviceInstance = new EvaluationService();
    }
    return serviceInstance;
}
