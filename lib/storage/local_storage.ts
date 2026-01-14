import { promises as fs } from "fs";
import { join } from "path";
import { existsSync } from "fs";
import type { IStorage } from "./interface";
import type { UploadResult, StorageType, ImageMetadata } from "@/types/storage";
import logger from "../logger";

export class LocalStorage implements IStorage {
    private baseDir: string;

    constructor(baseDir: string = "uploads") {
        this.baseDir = baseDir;
        this.ensureDirectoryExists();
    }

    getType(): StorageType {
        return "local";
    }

    /**
     * Ensure upload directory exists
     */
    private async ensureDirectoryExists(): Promise<void> {
        if (!existsSync(this.baseDir)) {
            await fs.mkdir(this.baseDir, { recursive: true });
            logger.info(`Created upload directory: ${this.baseDir}`);
        }
    }

    /**
     * Generate file path based on date and filename
     */
    private generateFilePath(filename: string): string {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const timestamp = Date.now();
        const ext = filename.split(".").pop() || "";
        const baseName = filename.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_");
        const uniqueFilename = `${baseName}_${timestamp}.${ext}`;
        return join(year.toString(), month, day, uniqueFilename);
    }

    async upload(
        file: Buffer | string,
        filename: string,
        metadata?: ImageMetadata
    ): Promise<UploadResult> {
        const relativePath = this.generateFilePath(filename);
        const fullPath = join(this.baseDir, relativePath);

        // Ensure directory exists
        const dirPath = join(this.baseDir, relativePath.split("/").slice(0, -1).join("/"));
        if (!existsSync(dirPath)) {
            await fs.mkdir(dirPath, { recursive: true });
        }

        // Write file
        const fileBuffer = typeof file === "string" ? await fs.readFile(file) : file;
        await fs.writeFile(fullPath, fileBuffer);

        logger.info(`File uploaded to local storage: ${relativePath}`);

        return {
            path: relativePath,
            url: await this.getUrl(relativePath),
            storageType: "local",
        };
    }

    async delete(path: string): Promise<void> {
        const fullPath = join(this.baseDir, path);
        try {
            if (existsSync(fullPath)) {
                await fs.unlink(fullPath);
                logger.info(`File deleted from local storage: ${path}`);
            }
        } catch (error) {
            logger.error(`Error deleting file from local storage: ${path}`, error);
            throw error;
        }
    }

    async getUrl(path: string): Promise<string> {
        // For local storage, return a relative URL that can be served by Next.js
        // In production, this should be configured to use a CDN or static file server
        return `/api/files/${path}`;
    }

    async exists(path: string): Promise<boolean> {
        const fullPath = join(this.baseDir, path);
        return existsSync(fullPath);
    }
}
