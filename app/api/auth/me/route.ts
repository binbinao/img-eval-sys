import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware/auth";
import { userRepository } from "@/lib/repositories";
import logger from "@/lib/logger";

export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);
        
        if (!authResult.authenticated || !authResult.userId) {
            return authResult.response || NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const user = await userRepository.findById(authResult.userId);
        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                created_at: user.created_at,
            },
        });
    } catch (error) {
        logger.error("Get current user error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
