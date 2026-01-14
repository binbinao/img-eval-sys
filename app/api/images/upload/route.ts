import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireApiKey } from "@/lib/middleware";
import { getStorage } from "@/lib/storage";
import { validateImageFile } from "@/lib/image";
import { evaluationRepository } from "@/lib/repositories";
import { EvaluationService } from "@/lib/services/evaluation_service";
import logger from "@/lib/logger";

/**
 * POST /api/images/upload
 * Upload an image file
 * Supports both session-based and API key authentication
 */
export async function POST(request: NextRequest) {
    try {
        // Try session-based auth first, fallback to API key
        let userId: number | null = null;
        const sessionAuth = await requireAuth(request);
        
        if (sessionAuth.authenticated && sessionAuth.userId) {
            userId = sessionAuth.userId;
        } else {
            // Try API key authentication
            const apiKeyAuth = await requireApiKey(request);
            if (apiKeyAuth.authenticated && apiKeyAuth.userId) {
                userId = apiKeyAuth.userId;
            } else {
                return apiKeyAuth.response || NextResponse.json(
                    { error: "Unauthorized" },
                    { status: 401 }
                );
            }
        }

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Parse form data
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);
        const filename = file.name || "image";

        // Validate image file
        const validation = await validateImageFile(fileBuffer, filename);
        if (!validation.valid) {
            return NextResponse.json(
                {
                    error: "Image validation failed",
                    details: validation.errors,
                },
                { status: 400 }
            );
        }

        // Get storage instance
        const storage = getStorage();
        const storageType = storage.getType();

        // Upload file to storage
        const uploadResult = await storage.upload(
            fileBuffer,
            filename,
            validation.metadata
        );

        // Create evaluation record with pending status
        const evaluation = await evaluationRepository.create({
            user_id: userId,
            image_path: uploadResult.path,
            image_storage_type: storageType,
            overall_score: 0,
            composition_score: 0,
            technical_quality_score: 0,
            artistic_merit_score: 0,
            lighting_score: 0,
            subject_matter_score: 0,
            post_processing_score: 0,
            text_summary: "",
            evaluation_status: "pending",
        });

        // Submit evaluation to AI processing queue
        try {
            const evaluationService = new EvaluationService();
            await evaluationService.submitEvaluation(evaluation.id);
            logger.info("Evaluation submitted to processing queue", {
                evaluationId: evaluation.id,
            });
        } catch (evalError) {
            logger.error("Failed to submit evaluation:", evalError);
            // Don't fail the upload, just log the error
            // The evaluation can be retried later
        }

        logger.info("Image uploaded successfully", {
            userId,
            evaluationId: evaluation.id,
            imagePath: uploadResult.path,
            storageType,
        });

        return NextResponse.json(
            {
                message: "Image uploaded successfully",
                evaluation: {
                    id: evaluation.id,
                    imageUrl: uploadResult.url,
                    imagePath: uploadResult.path,
                    storageType,
                    status: evaluation.evaluation_status,
                    metadata: validation.metadata,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        logger.error("Image upload error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
