import { NextRequest, NextResponse } from "next/server";
import { extractApiKeyFromHeader, verifyApiKey } from "../auth/api_key";
import { apiKeyRepository } from "../repositories";
import logger from "../logger";

/**
 * API Key authentication middleware
 */
export async function requireApiKey(
    request: NextRequest
): Promise<{
    authenticated: boolean;
    userId?: number;
    response?: NextResponse;
}> {
    try {
        // Extract API key from header
        const authHeader = request.headers.get("authorization");
        const apiKey = extractApiKeyFromHeader(authHeader);

        if (!apiKey) {
            logger.warn("API request without valid API key", {
                path: request.nextUrl.pathname,
            });
            return {
                authenticated: false,
                response: NextResponse.json(
                    { error: "Unauthorized: API key required" },
                    { status: 401 }
                ),
            };
        }

        // Find API key in database
        // We need to check all keys and verify the hash
        // This is not efficient for large scale, but works for MVP
        const allKeys = await apiKeyRepository.findAll();

        let validKey = null;
        for (const keyRecord of allKeys) {
            const isValid = await verifyApiKey(apiKey, keyRecord.key_hash);
            if (isValid) {
                validKey = keyRecord;
                break;
            }
        }

        if (!validKey) {
            logger.warn("Invalid API key used", {
                path: request.nextUrl.pathname,
            });
            return {
                authenticated: false,
                response: NextResponse.json(
                    { error: "Unauthorized: Invalid API key" },
                    { status: 401 }
                ),
            };
        }

        return {
            authenticated: true,
            userId: validKey.user_id,
        };
    } catch (error) {
        logger.error("Error in API key authentication:", error);
        return {
            authenticated: false,
            response: NextResponse.json(
                { error: "Internal server error" },
                { status: 500 }
            ),
        };
    }
}
