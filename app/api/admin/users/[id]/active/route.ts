import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/middleware/admin";
import { userRepository } from "@/lib/repositories";
import logger from "@/lib/logger";

/**
 * PATCH /api/admin/users/[id]/active - Update user active status (admin only)
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
        const { is_active } = body;

        // Validate is_active
        if (typeof is_active !== "boolean") {
            return NextResponse.json(
                { error: "is_active must be a boolean" },
                { status: 400 }
            );
        }

        // Prevent admin from deactivating themselves
        if (userId === authResult.userId) {
            return NextResponse.json(
                { error: "You cannot change your own active status" },
                { status: 400 }
            );
        }

        const updatedUser = await userRepository.updateActiveStatus(userId, is_active);
        
        if (!updatedUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        logger.info(`Admin ${authResult.userId} changed user ${userId} active status to ${is_active}`);

        return NextResponse.json({
            success: true,
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                role: updatedUser.role,
                is_active: updatedUser.is_active,
            },
        });
    } catch (error) {
        logger.error("Update user active status error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
