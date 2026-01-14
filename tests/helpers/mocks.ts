/**
 * Test mocks and fixtures
 */

export const mockUser = {
    id: 1,
    email: "test@example.com",
    password: "Test123!@#",
    passwordHash: "$2a$10$testhash", // Mock hash
};

export const mockApiKey = "ie_test1234567890abcdefghijklmnopqrstuvwxyz";

export const mockEvaluation = {
    id: 1,
    user_id: 1,
    image_path: "test/image.jpg",
    image_storage_type: "local" as const,
    overall_score: 8.5,
    composition_score: 9,
    technical_quality_score: 8,
    artistic_merit_score: 8.5,
    lighting_score: 8,
    subject_matter_score: 9,
    post_processing_score: 7.5,
    text_summary: "测试评价总结",
    evaluation_status: "completed" as const,
    created_at: new Date(),
    updated_at: new Date(),
};

export const mockImageBuffer = Buffer.from("fake image data");

export const mockImageMetadata = {
    width: 1920,
    height: 1080,
    format: "jpeg",
    size: 1024000,
    mimeType: "image/jpeg",
};
