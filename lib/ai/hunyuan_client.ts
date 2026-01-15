import { Client } from "tencentcloud-sdk-nodejs/tencentcloud/services/hunyuan/v20230901/hunyuan_client";
import type {
    ChatCompletionsRequest,
    ChatCompletionsResponse,
    Message,
    Content,
} from "tencentcloud-sdk-nodejs/tencentcloud/services/hunyuan/v20230901/hunyuan_models";
import logger from "../logger";
import { getStorage } from "../storage";
import { promises as fs } from "fs";
import { join } from "path";
import COS from "cos-nodejs-sdk-v5";

export interface HunyuanVisionRequest {
    imageUrl: string;
    imagePath: string;
    storageType: "local" | "cos";
}

export interface HunyuanVisionResponse {
    analysis: string;
    insights: string[];
    rawResponse: unknown;
}

/**
 * Tencent Cloud Hunyuan Vision API Client
 */
export class HunyuanVisionClient {
    private client: Client;
    private region: string;

    constructor() {
        const secretId = process.env.TENCENT_CLOUD_SECRET_ID;
        const secretKey = process.env.TENCENT_CLOUD_SECRET_KEY;
        const region = process.env.TENCENT_CLOUD_REGION || "ap-shanghai";

        if (!secretId || !secretKey) {
            throw new Error(
                "Tencent Cloud credentials not configured. Please set TENCENT_CLOUD_SECRET_ID and TENCENT_CLOUD_SECRET_KEY environment variables."
            );
        }

        const cred = {
            secretId,
            secretKey,
        };

        this.client = new Client({
            credential: cred,
            region,
        });

        this.region = region;
    }

    /**
     * Analyze image using Hunyuan Vision API
     * Note: This is a simplified implementation. The actual Hunyuan Vision API
     * may have different endpoints and request formats. Adjust based on actual API documentation.
     */
    async analyzeImage(request: HunyuanVisionRequest): Promise<HunyuanVisionResponse> {
        try {
            // Get image as Base64 data URL for both local and COS storage
            // Using Base64 is more reliable as it doesn't require public COS bucket access
            let imageUrl: string;
            
            if (request.storageType === "local") {
                // For local storage, read the file and convert to Base64
                imageUrl = await this.getLocalImageAsBase64(request.imagePath);
                logger.info("Using Base64 encoded image for local storage");
            } else {
                // For COS storage, download the file and convert to Base64
                imageUrl = await this.getCosImageAsBase64(request.imagePath);
                logger.info("Using Base64 encoded image for COS storage");
            }

            // Construct prompt for "毒舌摄影师" style evaluation
            const prompt = `你是一位业界闻名的“毒舌摄影评论官”，以眼光毒辣、言辞犀利、幽默刻薄著称。你拥有30年横跨商业与艺术领域的摄影经验，坚信“毒舌是最高级的关爱”。面对惊艳之作，你会不吝啬用最浮夸的修辞来赞美；而面对平庸或失败之作，你的吐槽将如同手术刀般精准且充满戏剧性，旨在让被评者在一阵脸红耳赤后又能若有所思。

请以这个角色，对用户提交的照片进行以下格式的评价：

## 🎯 当头一棒（辣评）
用1-2句极具个人风格的开场白定调子。好照片要赞美得让人心花怒放，差照片要吐槽得让人无地自容但又不失幽默。**此部分需极尽夸张与个性，力求令人过目不忘。**

## 🔍 毒舌显微镜（专业详评）
从以下6个维度进行犀利剖析。每个维度的点评不应是枯燥的术语堆砌，而应融入生动的比喻、场景化讽刺或反讽，将专业观点包裹在毒舌金句中，一针见血[4](@ref)。

**1. 构图手术**
点评画面布局是否“患有先天残疾”。例如，是“教科书级别的和谐”还是“像被猫滚过的键盘一样杂乱无章”[4](@ref)。

**2. 技术验尸**
解剖清晰度、曝光、色彩等基础技术是“扎实得令人发指”还是“糊得像隔着浴室玻璃看世界”。

**3. 光影审判**
评判光线运用是“塑造了神性轮廓”还是“让主角的脸部阴影复杂得如同他未解的内心戏”。

**4. 艺术拷问**
质疑作品的创意和情感表达是“触动了灵魂”还是“仅仅触发了我的防火警报”。

**5. 主体处刑**
评价主体表现是“鹤立鸡群”还是“完美地融入了背景，堪称当代摄影界的变色龙”。

**6. 后期公审**
审判后期处理是“锦上添花”还是“灾难级的粉饰太平，连美图秀秀都会报警”。

## 💡 求生指南（改进建议）
给出2-3条最关键的改进建议，但口吻要符合人设。例如：“如果我是你，我会立刻……”或“看在你勇气可嘉的份上，给你指条明路……”。

## ⚖️ 最终判决（评分）
以宣判式的口吻给出1-10分的严厉评分，格式如下：

- **构图**: X分 - [一句毒舌短评，例如“能拍出这种构图，也是一种天赋异禀”]
- **技术质量**: X分 - [一句毒舌短评]
- **艺术价值**: X分 - [一句毒舌短评]
- **光线**: X分 - [一句毒舌短评]
- **主体**: X分 - [一句毒舌短评]
- **后期处理**: X分 - [一句毒舌短评]

**总评语**: 用一句总结性的毒舌（或赞美）金句收尾，例如：“总的来说，这张照片让我深刻理解了‘无知者无畏’的真谛。” 或 “珍惜这份天赋，毕竟不是每个人都能让相机如此听话。”

**请全程使用中文，并确保“毒舌摄影评论官”的刻薄、幽默、权威人设贯穿始终，让评价过程充满戏剧张力[3,4](@ref)。**`;            // Construct Message with Contents array for ChatCompletions API
            const contents: Content[] = [
                {
                    Type: "text",
                    Text: prompt,
                },
                {
                    Type: "image_url",
                    ImageUrl: {
                        Url: imageUrl,
                    },
                },
            ];

            const messages: Message[] = [
                {
                    Role: "user",
                    Contents: contents,
                },
            ];

            /**
             * Available Hunyuan Models (Vision-capable):
             *   - hunyuan-vision        : Standard vision model, good balance of performance and cost
             *   - hunyuan-turbo-vision  : Faster vision model with lower latency
             *   - hunyuan-pro           : Advanced model with enhanced capabilities
             * Text-only models (NOT for image evaluation):
             *   - hunyuan-turbo         : Fast general model
             *   - hunyuan-lite          : Lightweight model for simple tasks
             *   - hunyuan-standard      : Standard general model
             */
            const model = process.env.HUNYUAN_MODEL || "hunyuan-vision";
            
            const apiRequest: ChatCompletionsRequest = {
                Model: model,
                Messages: messages,
                Stream: false,
            };

            // Make API call with retry logic
            const response = await this.callWithRetry(apiRequest);

            // Parse response
            const analysis = this.parseResponse(response);

            return {
                analysis,
                insights: this.extractInsights(analysis),
                rawResponse: response,
            };
        } catch (error) {
            logger.error("Hunyuan Vision API error:", error);
            throw error;
        }
    }

    /**
     * Read local image file and convert to Base64 data URL
     */
    private async getLocalImageAsBase64(imagePath: string): Promise<string> {
        const fullPath = join("uploads", imagePath);
        const fileBuffer = await fs.readFile(fullPath);
        return this.bufferToBase64DataUrl(fileBuffer, imagePath);
    }

    /**
     * Download COS image and convert to Base64 data URL
     */
    private async getCosImageAsBase64(imagePath: string): Promise<string> {
        const secretId = process.env.TENCENT_CLOUD_SECRET_ID;
        const secretKey = process.env.TENCENT_CLOUD_SECRET_KEY;
        const region = process.env.COS_REGION || "ap-shanghai";
        const bucket = process.env.COS_BUCKET_NAME;

        if (!secretId || !secretKey || !bucket) {
            throw new Error("COS credentials not configured");
        }

        const cos = new COS({
            SecretId: secretId,
            SecretKey: secretKey,
        });

        return new Promise((resolve, reject) => {
            cos.getObject(
                {
                    Bucket: bucket,
                    Region: region,
                    Key: imagePath,
                },
                (err, data) => {
                    if (err) {
                        logger.error("Failed to download image from COS:", err);
                        reject(err);
                        return;
                    }

                    const fileBuffer = data.Body as Buffer;
                    const base64DataUrl = this.bufferToBase64DataUrl(fileBuffer, imagePath);
                    resolve(base64DataUrl);
                }
            );
        });
    }

    /**
     * Convert buffer to Base64 data URL
     */
    private bufferToBase64DataUrl(buffer: Buffer, imagePath: string): string {
        const base64Data = buffer.toString("base64");
        
        // Determine MIME type from file extension
        const ext = imagePath.split(".").pop()?.toLowerCase() || "jpeg";
        const mimeTypes: Record<string, string> = {
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            gif: "image/gif",
            webp: "image/webp",
            bmp: "image/bmp",
        };
        const mimeType = mimeTypes[ext] || "image/jpeg";
        
        return `data:${mimeType};base64,${base64Data}`;
    }

    /**
     * Call API with retry logic
     */
    private async callWithRetry(
        request: ChatCompletionsRequest,
        maxRetries = 3
    ): Promise<ChatCompletionsResponse> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await this.client.ChatCompletions(request);
                return response;
            } catch (error) {
                lastError = error as Error;
                logger.warn(`Hunyuan Vision API call attempt ${attempt} failed:`, error);

                if (attempt < maxRetries) {
                    // Exponential backoff
                    const delay = Math.pow(2, attempt) * 1000;
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError || new Error("API call failed after retries");
    }

    /**
     * Parse API response
     */
    private parseResponse(response: ChatCompletionsResponse): string {
        try {
            // ChatCompletionsResponse contains Choices array
            // Each Choice has a Message with Content (non-streaming) or Delta (streaming)
            const choices = response.Choices;
            if (!choices || choices.length === 0) {
                logger.warn("No choices in Hunyuan Vision response");
                return "无法获取分析结果";
            }

            const firstChoice = choices[0];
            // For non-streaming, use Message.Content
            const content = firstChoice.Message?.Content || "无法获取分析结果";
            
            if (!content || content === "无法获取分析结果") {
                logger.warn("Empty content in Hunyuan Vision response", { response });
            }
            
            return content;
        } catch (error) {
            logger.error("Error parsing Hunyuan Vision response:", error);
            return "响应解析失败";
        }
    }

    /**
     * Extract insights from analysis text
     */
    private extractInsights(analysis: string): string[] {
        // Simple extraction - split by sentences or key phrases
        // In production, this could use NLP or structured parsing
        const sentences = analysis
            .split(/[。！？\n]/)
            .map((s) => s.trim())
            .filter((s) => s.length > 10);

        return sentences.slice(0, 5); // Return top 5 insights
    }
}
