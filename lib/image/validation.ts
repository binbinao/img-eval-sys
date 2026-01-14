import type { ImageMetadata } from "@/types/storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate file size
 */
export function validateFileSize(size: number): {
    valid: boolean;
    error?: string;
} {
    if (size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        };
    }

    if (size === 0) {
        return {
            valid: false,
            error: "File is empty",
        };
    }

    return { valid: true };
}

/**
 * Validate file type by extension
 */
export function validateFileExtension(filename: string): {
    valid: boolean;
    error?: string;
} {
    const ext = filename.split(".").pop()?.toLowerCase();
    const allowedExtensions = ["jpg", "jpeg", "png", "webp", "tiff"];

    if (!ext || !allowedExtensions.includes(ext)) {
        return {
            valid: false,
            error: `Invalid file extension. Allowed extensions: ${allowedExtensions.join(", ")}`,
        };
    }

    return { valid: true };
}

/**
 * Comprehensive image validation
 */
export interface ImageValidationResult {
    valid: boolean;
    errors: string[];
    metadata?: ImageMetadata;
}

export async function validateImageFile(
    fileBuffer: Buffer,
    filename: string
): Promise<ImageValidationResult> {
    const errors: string[] = [];

    // Validate file extension
    const extValidation = validateFileExtension(filename);
    if (!extValidation.valid) {
        errors.push(extValidation.error!);
    }

    // Validate file size
    const sizeValidation = validateFileSize(fileBuffer.length);
    if (!sizeValidation.valid) {
        errors.push(sizeValidation.error!);
    }

    // If basic validations fail, return early
    if (errors.length > 0) {
        return {
            valid: false,
            errors,
        };
    }

    // Validate image format and extract metadata
    const { validateImage, extractImageMetadata } = await import("./processing");
    const imageValidation = await validateImage(fileBuffer);

    if (!imageValidation.valid) {
        errors.push(imageValidation.error || "Invalid image");
        return {
            valid: false,
            errors,
        };
    }

    return {
        valid: true,
        errors: [],
        metadata: imageValidation.metadata,
    };
}
