import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/admin";
import { userRepository } from "@/lib/repositories";
import logger from "@/lib/logger";
import type { UserRole } from "@/types/database";

/**
 * PATCH /api/admin/users/[id]/role - Update user role (admin only)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireAdmin(request);
        
        if (!authResult.authenticated) {
            return authResult.response || NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const { id } = await params;
        const userId = parseInt(id, 10);
        
        if (isNaN(userId)) {
            return NextResponse.json(
                { error: "Invalid user ID" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { role } = body;

        // Validate role
        if (!role || !['admin', 'user'].includes(role)) {
            return NextResponse.json(
                { error: "Invalid role. Must be 'admin' or 'user'" },
                { status: 400 }
            );
        }

        // Prevent admin from demoting themselves
        if (userId === authResult.userId && role === 'user') {
            return NextResponse.json(
                { error: "You cannot demote yourself" },
                { status: 400 }
            );
        }

        const updatedUser = await userRepository.updateRole(userId, role as UserRole);
        
        if (!updatedUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        logger.info(`Admin ${authResult.userId} changed user ${userId} role to ${role}`);

        return NextResponse.json({
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                role: updatedUser.role,
                created_at: updatedUser.created_at,
                updated_at: updatedUser.updated_at,
            },
        });
    } catch (error) {
        logger.error("Update user role error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
