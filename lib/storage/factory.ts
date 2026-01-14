import type { IStorage } from "./interface";
import { LocalStorage } from "./local_storage";
import { CosStorage } from "./cos_storage";
import logger from "../logger";

/**
 * Create storage instance based on environment configuration
 */
export function createStorage(): IStorage {
    const storageType = process.env.STORAGE_TYPE || "local";

    if (storageType === "cos") {
        try {
            return new CosStorage();
        } catch (error) {
            logger.error("Failed to create COS storage, falling back to local:", error);
            return new LocalStorage();
        }
    }

    return new LocalStorage();
}

/**
 * Get storage instance (singleton pattern)
 */
let storageInstance: IStorage | null = null;

export function getStorage(): IStorage {
    if (!storageInstance) {
        storageInstance = createStorage();
    }
    return storageInstance;
}
