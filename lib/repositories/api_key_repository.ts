import { query, getPool } from "../db/connection";
import type { ApiKey, CreateApiKeyInput } from "@/types/database";
import type { ResultSetHeader } from "mysql2";

export class ApiKeyRepository {
    /**
     * Create a new API key
     */
    async create(input: CreateApiKeyInput): Promise<ApiKey> {
        const pool = getPool();
        const [result] = await pool.execute<ResultSetHeader>(
            `INSERT INTO api_keys (user_id, key_hash) 
             VALUES (?, ?)`,
            [input.user_id, input.key_hash]
        );

        // MySQL2 returns insertId directly in the result object
        const insertId = result.insertId;
        
        if (!insertId) {
            throw new Error("Failed to create API key - no insert ID returned");
        }

        const apiKey = await this.findById(insertId);
        if (!apiKey) {
            throw new Error("Failed to create API key");
        }
        return apiKey;
    }

    /**
     * Find API key by ID
     */
    async findById(id: number): Promise<ApiKey | null> {
        const keys = await query<ApiKey>(
            "SELECT * FROM api_keys WHERE id = ?",
            [id]
        );
        return keys[0] || null;
    }

    /**
     * Find API key by key hash
     */
    async findByKeyHash(keyHash: string): Promise<ApiKey | null> {
        const keys = await query<ApiKey>(
            "SELECT * FROM api_keys WHERE key_hash = ?",
            [keyHash]
        );
        return keys[0] || null;
    }

    /**
     * Find API key by user ID
     */
    async findByUserId(userId: number): Promise<ApiKey | null> {
        const keys = await query<ApiKey>(
            "SELECT * FROM api_keys WHERE user_id = ?",
            [userId]
        );
        return keys[0] || null;
    }

    /**
     * Check if user has API key
     */
    async userHasApiKey(userId: number): Promise<boolean> {
        const keys = await query<{ count: number }>(
            "SELECT COUNT(*) as count FROM api_keys WHERE user_id = ?",
            [userId]
        );
        return keys[0].count > 0;
    }

    /**
     * Find API key by user ID (for retrieval)
     */
    async findByUserIdForRetrieval(userId: number): Promise<ApiKey | null> {
        // Note: This returns the key_hash, but in production,
        // we should never return the actual key, only confirm it exists
        const keys = await query<ApiKey>(
            "SELECT * FROM api_keys WHERE user_id = ? LIMIT 1",
            [userId]
        );
        return keys[0] || null;
    }

    /**
     * Find all API keys (for verification - use with caution)
     * Note: This is inefficient for large scale. Consider optimizing with
     * a lookup table or different storage strategy for production.
     */
    async findAll(): Promise<ApiKey[]> {
        return await query<ApiKey>("SELECT * FROM api_keys");
    }
}

export const apiKeyRepository = new ApiKeyRepository();
