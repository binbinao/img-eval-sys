import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware/auth";
import { getStorage } from "@/lib/storage";
import logger from "@/lib/logger";

/**
 * GET /api/admin/data/files
 * List files from COS storage
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

        // Get prefix from query parameters
        const searchParams = request.nextUrl.searchParams;
        const prefix = searchParams.get('prefix') || undefined;

        // Get storage and list files
        const storage = getStorage();
        const files = await storage.listFiles(prefix);

        logger.info(`Admin user ${user.id} listed files from COS with prefix: ${prefix || 'images/'}`);

        return NextResponse.json({
            success: true,
            files: files,
            count: files.length,
        });
    } catch (error) {
        logger.error("Error listing COS files:", error);
        return NextResponse.json(
            { error: "Failed to list files", message: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
