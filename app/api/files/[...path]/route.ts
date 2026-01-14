import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import logger from "@/lib/logger";

/**
 * Serve files from local storage
 * GET /api/files/[...path]
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { path: string[] } }
) {
    try {
        const filePath = params.path.join("/");
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
    } catch (error) {
        logger.error("Error serving file:", error);
        return NextResponse.json(
            { error: "Internal server error" },
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
