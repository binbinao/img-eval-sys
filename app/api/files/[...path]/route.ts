import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import logger from "@/lib/logger";
import { getStorage } from "@/lib/storage";
import { CosStorage } from "@/lib/storage/cos_storage";

/**
 * Serve files from local or COS storage
 * GET /api/files/[...path]
 * 
 * For local storage: /api/files/2024/01/14/image.jpg
 * For COS storage: /api/files/cos/images/2024/01/14/image.jpg
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    try {
        const pathParts = params.path;
        
        // Check if this is a COS storage request (starts with "cos")
        if (pathParts[0] === "cos") {
            // COS storage request
            const cosPath = pathParts.slice(1).join("/"); // Remove "cos" prefix
            return await serveCosFile(cosPath);
        } else {
            // Local storage request
            const filePath = pathParts.join("/");
            return await serveLocalFile(filePath);
        }
    } catch (error) {
        logger.error("Error serving file:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * Serve file from local storage
 */
async function serveLocalFile(filePath: string): Promise<NextResponse> {
    const fullPath = join(process.cwd(), "uploads", filePath);

    // Security: prevent directory traversal
    const normalizedPath = join(process.cwd(), "uploads", filePath);
    if (!normalizedPath.startsWith(join(process.cwd(), "uploads"))) {
        return NextResponse.json(
            { error: "Invalid file path" },
            { status: 400 }
        );
    }

    if (!existsSync(fullPath)) {
        return NextResponse.json(
            { error: "File not found" },
            { status: 404 }
        );
    }

    const fileBuffer = await readFile(fullPath);
    const ext = filePath.split(".").pop()?.toLowerCase();

    // Determine content type
    const contentType = getContentType(ext || "");

    return new NextResponse(fileBuffer, {
        headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=3600",
        },
    });
}

/**
 * Serve file from COS storage (proxy)
 */
async function serveCosFile(filePath: string): Promise<NextResponse> {
    try {
        // Create COS storage instance to get the file
        const cosStorage = new CosStorage();
        
        // Check if file exists
        const exists = await cosStorage.exists(filePath);
        if (!exists) {
            return NextResponse.json(
                { error: "File not found" },
                { status: 404 }
            );
        }

        // Get file buffer from COS
        const fileBuffer = await cosStorage.getBuffer(filePath);
        const ext = filePath.split(".").pop()?.toLowerCase();

        // Determine content type
        const contentType = getContentType(ext || "");

        // Convert Buffer to Uint8Array for NextResponse
        const uint8Array = new Uint8Array(fileBuffer);

        return new NextResponse(uint8Array, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=3600",
            },
        });
    } catch (error) {
        logger.error("Error serving COS file:", error);
        return NextResponse.json(
            { error: "Failed to retrieve file from storage" },
            { status: 500 }
        );
    }
}

function getContentType(ext: string): string {
    const contentTypes: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
        tiff: "image/tiff",
    };
    return contentTypes[ext] || "application/octet-stream";
}
