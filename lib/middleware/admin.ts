import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "./auth";
import { userRepository } from "@/lib/repositories";
import logger from "@/lib/logger";

/**
 * Admin middleware - requires user to have admin role
 */
export async function requireAdmin(request: NextRequest): Promise<{
    authenticated: boolean;
    userId?: number;
    response?: NextResponse;
}> {
    // First check if user is authenticated
    const authResult = await requireAuth(request);
    
    if (!authResult.authenticated || !authResult.userId) {
        return authResult;
    }

    // Check if user is admin
    const isAdmin = await userRepository.isAdmin(authResult.userId);
    
    if (!isAdmin) {
        logger.warn(`Non-admin user ${authResult.userId} attempted to access admin resource`);
        return {
            authenticated: false,
            response: NextResponse.json(
                { error: "Forbidden - Admin access required" },
                { status: 403 }
            ),
        };
    }

    return {
        authenticated: true,
        userId: authResult.userId,
    };
}
