import sharp from "sharp";
import type { ImageMetadata } from "@/types/storage";
import logger from "../logger";

/**
 * Extract image metadata using Sharp
 */
export async function extractImageMetadata(
    imageBuffer: Buffer
): Promise<ImageMetadata> {
    try {
        const metadata = await sharp(imageBuffer).metadata();
        const stats = await sharp(imageBuffer).stats();

        return {
            width: metadata.width || 0,
            height: metadata.height || 0,
            format: metadata.format || "unknown",
            size: imageBuffer.length,
            mimeType: getMimeType(metadata.format || "unknown"),
        };
    } catch (error) {
        logger.error("Error extracting image metadata:", error);
        throw new Error("Failed to extract image metadata");
    }
}

/**
 * Validate image format
 */
export function validateImageFormat(format: string): boolean {
    const allowedFormats = ["jpeg", "jpg", "png", "webp", "tiff"];
    return allowedFormats.includes(format.toLowerCase());
}

/**
 * Get MIME type from format
 */
function getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
        jpeg: "image/jpeg",
        jpg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
        tiff: "image/tiff",
    };
    return mimeTypes[format.toLowerCase()] || "application/octet-stream";
}

/**
 * Validate image file
 */
export async function validateImage(imageBuffer: Buffer): Promise<{
    valid: boolean;
    error?: string;
    metadata?: ImageMetadata;
}> {
    try {
        // Check if it's a valid image
        const metadata = await sharp(imageBuffer).metadata();

        if (!metadata.format) {
            return {
                valid: false,
                error: "Invalid image format: unable to detect format",
            };
        }

        if (!validateImageFormat(metadata.format)) {
            return {
                valid: false,
                error: `Unsupported image format: ${metadata.format}. Supported formats: JPEG, PNG, WebP, TIFF`,
            };
        }

        const imageMetadata = await extractImageMetadata(imageBuffer);

        return {
            valid: true,
            metadata: imageMetadata,
        };
    } catch (error) {
        logger.error("Image validation error:", error);
        return {
            valid: false,
            error: "Invalid or corrupted image file",
        };
    }
}

/**
 * Check if image is corrupted
 */
export async function isImageCorrupted(imageBuffer: Buffer): Promise<boolean> {
    try {
        await sharp(imageBuffer).metadata();
        return false;
    } catch {
        return true;
    }
}
