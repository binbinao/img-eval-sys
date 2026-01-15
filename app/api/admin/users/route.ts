import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/admin";
import { userRepository } from "@/lib/repositories";
import logger from "@/lib/logger";

/**
 * GET /api/admin/users - Get all users (admin only)
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAdmin(request);
        
        if (!authResult.authenticated) {
            return authResult.response || NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const users = await userRepository.findAll();
        
        // Return users without password_hash
        const safeUsers = users.map(user => ({
            id: user.id,
            email: user.email,
            role: user.role,
            is_active: Boolean(user.is_active),
            created_at: user.created_at,
            updated_at: user.updated_at,
        }));

        return NextResponse.json({ users: safeUsers });
    } catch (error) {
        logger.error("Get all users error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
