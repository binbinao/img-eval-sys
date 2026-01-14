import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware/auth";
import { apiKeyRepository } from "@/lib/repositories";
import logger from "@/lib/logger";

/**
 * GET /api/user/api-key
 * Retrieve user's API key (only confirms existence, doesn't return the key)
 * Note: API keys are only returned during registration for security
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);

        if (!authResult.authenticated || !authResult.userId) {
            return authResult.response || NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const apiKey = await apiKeyRepository.findByUserIdForRetrieval(
            authResult.userId
        );

        if (!apiKey) {
            return NextResponse.json(
                { error: "API key not found" },
                { status: 404 }
            );
        }

        // For security, we don't return the actual key
        // The key is only shown once during registration
        return NextResponse.json({
            message: "API key exists",
            hasApiKey: true,
            createdAt: apiKey.created_at,
        });
    } catch (error) {
        logger.error("Get API key error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
