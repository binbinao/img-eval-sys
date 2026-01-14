import { query, getPool } from "../db/connection";
import type { User, CreateUserInput } from "@/types/database";
import type { ResultSetHeader } from "mysql2";

export class UserRepository {
    /**
     * Create a new user
     */
    async create(input: CreateUserInput): Promise<User> {
        const pool = getPool();
        const [result] = await pool.execute<ResultSetHeader>(
            `INSERT INTO users (email, password_hash) 
             VALUES (?, ?)`,
            [input.email, input.password_hash]
        );

        // MySQL2 returns insertId directly in the result object
        const insertId = result.insertId;
        
        if (!insertId) {
            throw new Error("Failed to create user - no insert ID returned");
        }

        const user = await this.findById(insertId);
        if (!user) {
            throw new Error("Failed to create user");
        }
        return user;
    }

    /**
     * Find user by ID
     */
    async findById(id: number): Promise<User | null> {
        const users = await query<User>(
            "SELECT * FROM users WHERE id = ?",
            [id]
        );
        return users[0] || null;
    }

    /**
     * Find user by email
     */
    async findByEmail(email: string): Promise<User | null> {
        const users = await query<User>(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );
        return users[0] || null;
    }

    /**
     * Check if email exists
     */
    async emailExists(email: string): Promise<boolean> {
        const users = await query<{ count: number }>(
            "SELECT COUNT(*) as count FROM users WHERE email = ?",
            [email]
        );
        return users[0].count > 0;
    }
}

export const userRepository = new UserRepository();
