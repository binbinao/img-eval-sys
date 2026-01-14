import { validateImageFile } from "./validation";
import { extractImageMetadata, validateImage, isImageCorrupted } from "./processing";
import type { ImageMetadata } from "@/types/storage";

/**
 * Comprehensive image validation with detailed error messages
 */
export async function validateImageWithDetails(
    fileBuffer: Buffer,
    filename: string
): Promise<{
    valid: boolean;
    errors: string[];
    metadata?: ImageMetadata;
}> {
    const result = await validateImageFile(fileBuffer, filename);
    return result;
}

/**
 * Get image format from buffer
 */
export async function getImageFormat(fileBuffer: Buffer): Promise<string | null> {
    try {
        const { extractImageMetadata } = await import("./processing");
        const metadata = await extractImageMetadata(fileBuffer);
        return metadata.format;
    } catch {
        return null;
    }
}

/**
 * Check if image is valid format
 */
export async function isValidImageFormat(fileBuffer: Buffer): Promise<boolean> {
    const format = await getImageFormat(fileBuffer);
    if (!format) return false;
    
    const { validateImageFormat } = await import("./processing");
    return validateImageFormat(format);
}

export {
    validateImageFile,
    extractImageMetadata,
    validateImage,
    isImageCorrupted,
};
