import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware/auth";
import { getStorage } from "@/lib/storage";
import logger from "@/lib/logger";
import archiver from "archiver";

/**
 * GET /api/admin/data/zip?folder=<folder-prefix>
 * Download a folder as ZIP from COS
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

        // Get folder prefix from query parameters
        const searchParams = request.nextUrl.searchParams;
        const folder = searchParams.get('folder');
        
        if (!folder) {
            return NextResponse.json(
                { error: "Missing folder parameter" },
                { status: 400 }
            );
        }

        // Get storage and list files
        const storage = getStorage();
        const files = await storage.listFiles(folder);

        if (files.length === 0) {
            return NextResponse.json(
                { error: "No files found in folder" },
                { status: 404 }
            );
        }

        logger.info(`Admin user ${user.id} downloading ${files.length} files from folder: ${folder}`);

        // Create a transform stream for the ZIP
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        // Create response with proper headers
        const response = new NextResponse(
            new ReadableStream({
                async start(controller) {
                    // Pipe archive output to the response
                    archive.on('data', (chunk: Buffer) => {
                        controller.enqueue(chunk);
                    });

                    archive.on('end', () => {
                        controller.close();
                    });

                    archive.on('error', (err: Error) => {
                        logger.error('Archive error:', err);
                        controller.error(err);
                    });

                    // Add files to archive
                    const storageWithGetBuffer = storage as any;
                    
                    for (const file of files) {
                        try {
                            const buffer = await storageWithGetBuffer.getBuffer(file.key);
                            const filename = file.key.substring(folder.length);
                            archive.append(buffer, { name: filename });
                        } catch (err) {
                            logger.error(`Error adding file to archive: ${file.key}`, err);
                            // Continue with other files even if one fails
                        }
                    }

                    // Finalize the archive
                    archive.finalize();
                }
            }),
            {
                headers: {
                    'Content-Type': 'application/zip',
                    'Content-Disposition': `attachment; filename="backup_${folder.replace(/\//g, '_')}_${Date.now()}.zip"`,
                }
            }
        );

        return response;
    } catch (error) {
        logger.error("Error creating ZIP archive:", error);
        return NextResponse.json(
            { error: "Failed to create ZIP archive", message: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
