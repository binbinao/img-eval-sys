import COS from "cos-nodejs-sdk-v5";
import type { IStorage } from "./interface";
import type { UploadResult, StorageType, ImageMetadata } from "@/types/storage";
import logger from "../logger";

export class CosStorage implements IStorage {
    private cos: COS;
    private bucket: string;
    private region: string;

    constructor() {
        const secretId = process.env.TENCENT_CLOUD_SECRET_ID;
        const secretKey = process.env.TENCENT_CLOUD_SECRET_KEY;
        const region = process.env.COS_REGION || "ap-beijing";
        const bucket = process.env.COS_BUCKET_NAME;

        if (!secretId || !secretKey || !bucket) {
            throw new Error(
                "Tencent Cloud COS credentials not configured. Please set TENCENT_CLOUD_SECRET_ID, TENCENT_CLOUD_SECRET_KEY, and COS_BUCKET_NAME environment variables."
            );
        }

        this.cos = new COS({
            SecretId: secretId,
            SecretKey: secretKey,
        });
        this.bucket = bucket;
        this.region = region;
    }

    getType(): StorageType {
        return "cos";
    }

    /**
     * Generate file path/key for COS
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
        return `images/${year}/${month}/${day}/${uniqueFilename}`;
    }

    async upload(
        file: Buffer | string,
        filename: string,
        metadata?: ImageMetadata
    ): Promise<UploadResult> {
        const key = this.generateFilePath(filename);
        const fileBuffer = typeof file === "string" ? await require("fs").promises.readFile(file) : file;

        return new Promise((resolve, reject) => {
            this.cos.putObject(
                {
                    Bucket: this.bucket,
                    Region: this.region,
                    Key: key,
                    Body: fileBuffer,
                    ContentType: metadata?.mimeType || "image/jpeg",
                },
                (err, data) => {
                    if (err) {
                        logger.error("COS upload error:", err);
                        reject(err);
                        return;
                    }

                    logger.info(`File uploaded to COS: ${key}`);

                    resolve({
                        path: key,
                        url: this.getCosUrl(key),
                        storageType: "cos",
                    });
                }
            );
        });
    }

    async delete(path: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.cos.deleteObject(
                {
                    Bucket: this.bucket,
                    Region: this.region,
                    Key: path,
                },
                (err) => {
                    if (err) {
                        logger.error(`Error deleting file from COS: ${path}`, err);
                        reject(err);
                        return;
                    }

                    logger.info(`File deleted from COS: ${path}`);
                    resolve();
                }
            );
        });
    }

    async getUrl(path: string): Promise<string> {
        return this.getCosUrl(path);
    }

    /**
     * Generate COS URL
     */
    private getCosUrl(key: string): string {
        // Generate COS URL
        // Format: https://<bucket>.cos.<region>.myqcloud.com/<key>
        return `https://${this.bucket}.cos.${this.region}.myqcloud.com/${key}`;
    }

    async exists(path: string): Promise<boolean> {
        return new Promise((resolve) => {
            this.cos.headObject(
                {
                    Bucket: this.bucket,
                    Region: this.region,
                    Key: path,
                },
                (err) => {
                    resolve(!err);
                }
            );
        });
    }
}
