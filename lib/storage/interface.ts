import type { UploadResult, StorageType, ImageMetadata } from "@/types/storage";

/**
 * Storage interface for different storage backends
 */
export interface IStorage {
    /**
     * Get storage type
     */
    getType(): StorageType;

    /**
     * Upload a file
     * @param file Buffer or file path
     * @param filename Original filename
     * @param metadata Optional metadata
     * @returns Upload result with path and URL
     */
    upload(
        file: Buffer | string,
        filename: string,
        metadata?: ImageMetadata
    ): Promise<UploadResult>;

    /**
     * Delete a file
     * @param path File path
     */
    delete(path: string): Promise<void>;

    /**
     * Get file URL
     * @param path File path
     * @returns Public URL to access the file
     */
    getUrl(path: string): Promise<string>;

    /**
     * Check if file exists
     * @param path File path
     * @returns True if file exists
     */
    exists(path: string): Promise<boolean>;

    /**
     * List files in a directory
     * @param prefix Directory prefix to list
     * @returns Array of file information
     */
    listFiles(prefix?: string): Promise<Array<{
        key: string;
        size: number;
        lastModified: Date;
        url: string;
    }>>;
}
