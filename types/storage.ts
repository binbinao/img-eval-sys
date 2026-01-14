/**
 * Storage type definitions
 */

export type StorageType = "local" | "cos";

export interface UploadResult {
    path: string;
    url: string;
    storageType: StorageType;
}

export interface ImageMetadata {
    width: number;
    height: number;
    format: string;
    size: number;
    mimeType: string;
}
