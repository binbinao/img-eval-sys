import { NextRequest, NextResponse } from "next/server";
import { getSession } from "../auth/session";
import logger from "../logger";

/**
 * Authentication middleware for API routes
 */
export async function requireAuth(
    request: NextRequest
): Promise<{ authenticated: boolean; userId?: number; response?: NextResponse }> {
    try {
        const session = await getSession();
        
        if (!session.isLoggedIn || !session.userId) {
            logger.warn("Unauthorized access attempt", {
                path: request.nextUrl.pathname,
            });
            return {
                authenticated: false,
                response: NextResponse.json(
                    { error: "Unauthorized" },
                    { status: 401 }
                ),
            };
        }

        // Check if user is still active (this prevents disabled users from using existing sessions)
        const { userRepository } = await import("../repositories");
        const user = await userRepository.findById(session.userId);
        
        if (!user || !user.is_active) {
            logger.warn("Access attempt with disabled or non-existent user", {
                path: request.nextUrl.pathname,
                userId: session.userId,
            });
            // Destroy the invalid session
            await session.destroy();
            return {
                authenticated: false,
                response: NextResponse.json(
                    { error: "你的账号已经被禁用，请联系管理员处理。" },
                    { status: 403 }
                ),
            };
        }

        return {
            authenticated: true,
            userId: session.userId,
        };
    } catch (error) {
        logger.error("Error in authentication middleware:", error);
        return {
            authenticated: false,
            response: NextResponse.json(
                { error: "Internal server error" },
                { status: 500 }
            ),
        };
    }
}

/**
 * Get user context from session
 */
export async function getUserContext(): Promise<{
    userId: number | null;
    email: string | null;
}> {
    try {
        const session = await getSession();
        return {
            userId: session.userId || null,
            email: session.email || null,
        };
    } catch (error) {
        logger.error("Error getting user context:", error);
        return {
            userId: null,
            email: null,
        };
    }
}
