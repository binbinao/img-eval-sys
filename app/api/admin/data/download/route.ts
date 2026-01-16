import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware/auth";
import { getStorage } from "@/lib/storage";
import logger from "@/lib/logger";

/**
 * GET /api/admin/data/download?file=<file-key>
 * Download a single file from COS
 * Only accessible by admin users
 */
export async function GET(request: NextRequest) {
    try {
        // Check authentication
        const authResult = await requireAuth(request);
        if (!authResult.authenticated) {
            return authResult.response;
        }

        // Check if user is admin
        const { userRepository } = await import("@/lib/repositories");
        const user = await userRepository.findById(authResult.userId!);
        
        if (!user || user.role !== 'admin') {
            return NextResponse.json(
                { error: "Forbidden: Admin access required" },
                { status: 403 }
            );
        }

        // Get file key from query parameters
        const searchParams = request.nextUrl.searchParams;
        const fileKey = searchParams.get('file');
        
        if (!fileKey) {
            return NextResponse.json(
                { error: "Missing file parameter" },
                { status: 400 }
            );
        }

        // Get storage and file buffer
        const storage = getStorage();
        
        // Check if file exists
        const exists = await storage.exists(fileKey);
        if (!exists) {
            return NextResponse.json(
                { error: "File not found" },
                { status: 404 }
            );
        }

        // Get file buffer
        const buffer = await (storage as any).getBuffer(fileKey);
        
        // Extract filename from key
        const filename = fileKey.split('/').pop() || 'download';

        logger.info(`Admin user ${user.id} downloaded file from COS: ${fileKey}`);

        // Return file as download
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': buffer.length.toString(),
            },
        });
    } catch (error) {
        logger.error("Error downloading file from COS:", error);
        return NextResponse.json(
            { error: "Failed to download file", message: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
