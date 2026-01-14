import { query, getPool } from "../db/connection";
import type {
    Evaluation,
    CreateEvaluationInput,
} from "@/types/database";
import type { ResultSetHeader } from "mysql2";

export class EvaluationRepository {
    /**
     * Create a new evaluation
     */
    async create(input: CreateEvaluationInput): Promise<Evaluation> {
        const status = input.evaluation_status || "pending";
        const pool = getPool();
        const [result] = await pool.execute<ResultSetHeader>(
            `INSERT INTO evaluations (
                user_id, image_path, image_storage_type,
                overall_score, composition_score, technical_quality_score,
                artistic_merit_score, lighting_score, subject_matter_score,
                post_processing_score, text_summary, evaluation_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                input.user_id,
                input.image_path,
                input.image_storage_type,
                input.overall_score,
                input.composition_score,
                input.technical_quality_score,
                input.artistic_merit_score,
                input.lighting_score,
                input.subject_matter_score,
                input.post_processing_score,
                input.text_summary,
                status,
            ]
        );

        // Handle both possible MySQL2 result formats
        const insertId = result.insertId;
        if (!insertId) {
            throw new Error("Failed to create evaluation - no insert ID returned");
        }

        const evaluation = await this.findById(insertId);
        if (!evaluation) {
            throw new Error("Failed to create evaluation");
        }
        return evaluation;
    }

    /**
     * Find evaluation by ID
     */
    async findById(id: number): Promise<Evaluation | null> {
        const evaluations = await query<Evaluation>(
            "SELECT * FROM evaluations WHERE id = ?",
            [id]
        );
        return evaluations[0] || null;
    }

    /**
     * Find evaluations by user ID
     */
    async findByUserId(
        userId: number,
        limit = 50,
        offset = 0
    ): Promise<Evaluation[]> {
        // MySQL prepared statements don't handle LIMIT/OFFSET params well
        // Ensure they are valid integers and embed them directly in the query
        const safeLimit = Math.max(1, Math.min(1000, Number(limit) || 50));
        const safeOffset = Math.max(0, Number(offset) || 0);
        
        return await query<Evaluation>(
            `SELECT * FROM evaluations 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT ${safeLimit} OFFSET ${safeOffset}`,
            [userId]
        );
    }

    /**
     * Update evaluation status
     */
    async updateStatus(
        id: number,
        status: Evaluation["evaluation_status"]
    ): Promise<void> {
        await query(
            "UPDATE evaluations SET evaluation_status = ? WHERE id = ?",
            [status, id]
        );
    }

    /**
     * Find evaluations older than specified days for cleanup
     */
    async findOlderThanDays(days: number): Promise<Evaluation[]> {
        return await query<Evaluation>(
            `SELECT * FROM evaluations 
             WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
             AND image_path IS NOT NULL
             AND image_path != ''`,
            [days]
        );
    }

    /**
     * Find pending evaluations
     */
    async findPending(): Promise<Evaluation[]> {
        return await query<Evaluation>(
            `SELECT * FROM evaluations 
             WHERE evaluation_status = 'pending'
             ORDER BY created_at ASC`
        );
    }
}

export const evaluationRepository = new EvaluationRepository();
