import { randomBytes } from "crypto";
import { hashPassword, verifyPassword } from "./password";
import logger from "../logger";

const API_KEY_PREFIX = "ie_"; // image-evaluation prefix
const API_KEY_LENGTH = 32; // 32 bytes = 64 hex characters

/**
 * Generate a new API key
 * Format: ie_<64 hex characters>
 */
export function generateApiKey(): string {
    const randomPart = randomBytes(API_KEY_LENGTH).toString("hex");
    return `${API_KEY_PREFIX}${randomPart}`;
}

/**
 * Hash an API key for storage
 */
export async function hashApiKey(apiKey: string): Promise<string> {
    // Use the same password hashing function for consistency
    return await hashPassword(apiKey);
}

/**
 * Verify an API key against a hash
 */
export async function verifyApiKey(
    apiKey: string,
    hash: string
): Promise<boolean> {
    return await verifyPassword(apiKey, hash);
}

/**
 * Validate API key format
 */
export function validateApiKeyFormat(apiKey: string): boolean {
    if (!apiKey.startsWith(API_KEY_PREFIX)) {
        return false;
    }

    const keyPart = apiKey.slice(API_KEY_PREFIX.length);
    if (keyPart.length !== API_KEY_LENGTH * 2) {
        // 32 bytes = 64 hex characters
        return false;
    }

    // Check if it's valid hex
    return /^[0-9a-f]+$/i.test(keyPart);
}

/**
 * Extract API key from request header
 */
export function extractApiKeyFromHeader(
    authHeader: string | null
): string | null {
    if (!authHeader) {
        return null;
    }

    // Support both "Bearer <key>" and "ApiKey <key>" formats
    const parts = authHeader.trim().split(/\s+/);
    if (parts.length !== 2) {
        return null;
    }

    const [scheme, key] = parts;
    if (scheme.toLowerCase() !== "bearer" && scheme.toLowerCase() !== "apikey") {
        return null;
    }

    if (!validateApiKeyFormat(key)) {
        logger.warn("Invalid API key format in header");
        return null;
    }

    return key;
}
