import { query, getPool } from "../db/connection";
import type { User, CreateUserInput, UserRole } from "@/types/database";
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

    /**
     * Get all users (for admin)
     */
    async findAll(): Promise<User[]> {
        return await query<User>(
            "SELECT id, email, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC"
        );
    }

    /**
     * Update user role
     */
    async updateRole(userId: number, role: UserRole): Promise<User | null> {
        const pool = getPool();
        await pool.execute(
            "UPDATE users SET role = ? WHERE id = ?",
            [role, userId]
        );
        return await this.findById(userId);
    }

    /**
     * Check if user is admin
     */
    async isAdmin(userId: number): Promise<boolean> {
        const users = await query<{ role: UserRole }>(
            "SELECT role FROM users WHERE id = ?",
            [userId]
        );
        return users[0]?.role === 'admin';
    }

    /**
     * Update user active status
     */
    async updateActiveStatus(userId: number, isActive: boolean): Promise<User | null> {
        const pool = getPool();
        await pool.execute(
            "UPDATE users SET is_active = ? WHERE id = ?",
            [isActive ? 1 : 0, userId]
        );
        return await this.findById(userId);
    }

    /**
     * Check if user is active
     */
    async isActive(userId: number): Promise<boolean> {
        const users = await query<{ is_active: number }>(
            "SELECT is_active FROM users WHERE id = ?",
            [userId]
        );
        return users[0]?.is_active === 1;
    }
}

export const userRepository = new UserRepository();
