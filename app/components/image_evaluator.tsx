"use client";

import { useState, useRef, DragEvent, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import ScoreDisplay from "./score_display";

interface EvaluationData {
    id: number;
    imageUrl: string;
    scores: {
        overall: number;
        composition: number;
        technicalQuality: number;
        artisticMerit: number;
        lighting: number;
        subjectMatter: number;
        postProcessing: number;
    };
    summary: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

// App introduction markdown content
const APP_INTRODUCTION = `# 🎭 毒舌摄影师辣评

> **"毒舌是最高级的关爱"** —— 让你的每一张照片都值得被认真对待！

---

## ✨ 这是什么？

**毒舌摄影师辣评**是一款基于 AI 视觉技术的专业摄影评价系统。我们请来了一位"业界闻名"的**毒舌摄影评论官**——拥有30年横跨商业与艺术领域的摄影经验，以眼光毒辣、言辞犀利、幽默刻薄著称。

面对惊艳之作，他会不吝啬用最浮夸的修辞来赞美；而面对平庸或失败之作，他的吐槽将如同手术刀般精准且充满戏剧性——旨在让你在一阵脸红耳赤后又能若有所思。

---

## 🎯 六大专业评分维度

我们从以下六个专业角度对你的摄影作品进行深度剖析：

| 维度 | 说明 |
|------|------|
| 📐 **构图** | 画面布局是否和谐？主体位置是否得当？ |
| 🔧 **技术质量** | 清晰度、曝光、色彩等基础技术是否扎实？ |
| 🎨 **艺术价值** | 作品的创意和情感表达是否打动人心？ |
| 💡 **光线** | 光线运用是塑造了神性轮廓还是制造了混乱？ |
| 🎯 **主体** | 主体表现是鹤立鸡群还是完美融入背景？ |
| 🖌️ **后期处理** | 后期是锦上添花还是灾难级的粉饰太平？ |

---

## 🌟 核心特性

### 🗡️ 毒舌风格评价
- **当头一棒**：极具个性的开场白，好照片赞美得让人心花怒放，差照片吐槽得让人无地自容却不失幽默
- **毒舌显微镜**：专业观点包裹在犀利金句中，一针见血的深度剖析
- **求生指南**：毒舌口吻下的真诚改进建议
- **最终判决**：宣判式的严厉评分和毒舌短评

### 🤖 AI 驱动的专业分析
- 基于腾讯云混元视觉大模型
- 30年摄影经验浓缩的专业评判标准
- 1-10分严格评分体系

---

## 📖 如何使用

1. **注册/登录** —— 创建你的账户
2. **上传图片** —— 拖拽或点击选择你的摄影作品
3. **点击"毒舌辣评"** —— 等待 AI 摄影师审阅
4. **接受审判** —— 查看专业评分和犀利点评

---

**准备好接受毒舌摄影师的审判了吗？登录后上传你的第一张作品！**

*📷 愿你的每一次快门都值得被毒舌 📷*
`;

export default function ImageEvaluator() {
    // Auth state
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    // Upload state
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Evaluation state
    const [evaluationId, setEvaluationId] = useState<number | null>(null);
    const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
    const [processing, setProcessing] = useState(false);

    // Check authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch("/api/auth/me");
                setIsAuthenticated(response.ok);
            } catch {
                setIsAuthenticated(false);
            }
        };
        checkAuth();
    }, []);

    // File selection handler
    const handleFileSelect = (selectedFile: File) => {
        setError("");

        // Validate file type
        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/tiff"];
        if (!validTypes.includes(selectedFile.type)) {
            setError("不支持的文件格式。支持 JPEG, PNG, WebP, TIFF");
            return;
        }

        // Validate file size (10MB)
        const maxSize = 10 * 1024 * 1024;
        if (selectedFile.size > maxSize) {
            setError("文件大小不能超过 10MB");
            return;
        }

        setFile(selectedFile);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);

        // Clear previous evaluation
        setEvaluation(null);
        setEvaluationId(null);
    };

    // Drag and drop handlers
    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileSelect(droppedFile);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            handleFileSelect(selectedFile);
        }
    };

    // Upload handler
    const handleUpload = async () => {
        if (!file) {
            setError("请选择要上传的图片");
            return;
        }

        setUploading(true);
        setProcessing(true);
        setError("");
        setEvaluation(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/images/upload", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || data.details?.join(", ") || "上传失败");
                setUploading(false);
                setProcessing(false);
                return;
            }

            setUploading(false);

            // Set evaluation ID to start polling
            if (data.evaluation?.id) {
                setEvaluationId(data.evaluation.id);
            }
        } catch (err) {
            setError("网络错误，请稍后重试");
            setUploading(false);
            setProcessing(false);
        }
    };

    // Fetch evaluation data
    const fetchEvaluation = useCallback(async () => {
        if (!evaluationId) return;

        try {
            const response = await fetch(`/api/evaluations/${evaluationId}`);
            if (!response.ok) {
                throw new Error("获取评估结果失败");
            }
            const data = await response.json();
            setEvaluation(data);

            // If completed or failed, stop processing
            if (data.status === "completed" || data.status === "failed") {
                setProcessing(false);
            } else {
                // Continue polling
                setTimeout(fetchEvaluation, 2000);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "获取评估结果失败");
            setProcessing(false);
        }
    }, [evaluationId]);

    // Start fetching when evaluationId changes
    useEffect(() => {
        if (evaluationId) {
            fetchEvaluation();
        }
    }, [evaluationId, fetchEvaluation]);

    // Clear and reset
    const handleClear = () => {
        setFile(null);
        setPreview(null);
        setError("");
        setEvaluationId(null);
        setEvaluation(null);
        setUploading(false);
        setProcessing(false);
    };

    // Helper function to get score color
    const getScoreColor = (score: number) => {
        if (score >= 8) return "var(--success)";
        if (score >= 6) return "var(--info)";
        if (score >= 4) return "var(--warning)";
        return "var(--danger)";
    };

    // Show loading while checking auth
    if (isAuthenticated === null) {
        return (
            <div className="evaluator-container">
                <div className="loading-state">
                    <div className="spinner" />
                    <p>加载中...</p>
                </div>
                <style jsx>{`
                    .evaluator-container {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 400px;
                    }
                    .loading-state {
                        text-align: center;
                        color: var(--secondary);
                    }
                `}</style>
            </div>
        );
    }

    // Show introduction when not authenticated
    if (!isAuthenticated) {
        return (
            <div className="intro-container">
                <div className="intro-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{APP_INTRODUCTION}</ReactMarkdown>
                    <div className="intro-actions">
                        <Link href="/login" className="intro-btn intro-btn-primary">
                            立即登录
                        </Link>
                        <Link href="/register" className="intro-btn intro-btn-secondary">
                            注册账户
                        </Link>
                    </div>
                </div>
                <style jsx global>{`
                    .intro-container {
                        max-width: 900px;
                        margin: 0 auto;
                    }
                    .intro-content {
                        background: var(--white);
                        border-radius: var(--border-radius);
                        box-shadow: var(--shadow);
                        padding: 40px;
                    }
                    .intro-content h1 {
                        font-size: 32px;
                        margin-bottom: 15px;
                        text-align: center;
                    }
                    .intro-content blockquote {
                        background: var(--light);
                        border-left: 4px solid var(--primary);
                        padding: 15px 20px;
                        margin: 20px 0;
                        border-radius: 0 var(--border-radius) var(--border-radius) 0;
                        font-style: italic;
                    }
                    .intro-content h2 {
                        font-size: 22px;
                        margin: 30px 0 15px 0;
                        color: var(--dark);
                    }
                    .intro-content h3 {
                        font-size: 18px;
                        margin: 20px 0 10px 0;
                        color: var(--dark);
                    }
                    .intro-content table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 15px 0;
                    }
                    .intro-content th,
                    .intro-content td {
                        padding: 12px 15px;
                        border: 1px solid var(--border);
                        text-align: left;
                    }
                    .intro-content th {
                        background: var(--light);
                        font-weight: 600;
                    }
                    .intro-content tr:nth-child(even) {
                        background: var(--light);
                    }
                    .intro-content ul,
                    .intro-content ol {
                        padding-left: 25px;
                        margin: 10px 0;
                    }
                    .intro-content li {
                        margin: 8px 0;
                        line-height: 1.6;
                    }
                    .intro-content hr {
                        border: none;
                        border-top: 1px solid var(--border);
                        margin: 25px 0;
                    }
                    .intro-content strong {
                        color: var(--primary);
                    }
                    .intro-content em {
                        color: var(--secondary);
                    }
                    .intro-content p {
                        line-height: 1.8;
                        margin: 10px 0;
                    }
                    .intro-actions {
                        display: flex;
                        gap: 15px;
                        justify-content: center;
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid var(--border);
                    }
                    .intro-btn {
                        display: inline-block;
                        padding: 12px 30px;
                        font-size: 16px;
                        border-radius: var(--border-radius);
                        text-decoration: none;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        font-weight: 500;
                    }
                    .intro-btn-primary {
                        background-color: var(--primary);
                        color: var(--white);
                    }
                    .intro-btn-primary:hover {
                        background-color: var(--primary-hover);
                    }
                    .intro-btn-secondary {
                        background-color: var(--secondary);
                        color: var(--white);
                    }
                    .intro-btn-secondary:hover {
                        background-color: #5a6268;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="evaluator-container">
            {/* Top Section: Upload and Scores side by side */}
            <div className="top-section">
                {/* Left: Upload Section */}
                <div className="evaluator-section upload-section">
                    <div className="section-header">
                        <h2>上传图片</h2>
                    </div>
                    <div className="section-content">
                        <div
                            className={`upload-zone ${isDragging ? "dragging" : ""} ${preview ? "has-preview" : ""}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => !preview && fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp,image/tiff"
                                onChange={handleFileInputChange}
                                style={{ display: "none" }}
                            />

                            {preview ? (
                                <div className="preview-container">
                                    <img src={preview} alt="Preview" className="preview-image" />
                                    <div className="preview-info">
                                        <p className="file-name">{file?.name}</p>
                                        <p className="file-size">
                                            {((file?.size || 0) / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="upload-placeholder">
                                    <div className="upload-icon">📷</div>
                                    <p className="upload-text">拖拽图片到这里</p>
                                    <p className="upload-hint">或点击选择文件</p>
                                    <p className="upload-formats">支持 JPEG, PNG, WebP, TIFF，最大 10MB</p>
                                </div>
                            )}
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <div className="button-group">
                            {preview && (
                                <>
                                    <button onClick={handleClear} className="btn btn-secondary">
                                        清除
                                    </button>
                                    <button
                                        onClick={handleUpload}
                                        className="btn btn-primary"
                                        disabled={uploading || processing}
                                    >
                                        {uploading ? "上传中..." : processing ? "处理中..." : "毒舌辣评"}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Scores Section */}
                <div className="evaluator-section scores-section">
                    <div className="section-header">
                        <h2>评分结果</h2>
                    </div>
                    <div className="section-content">
                        {processing ? (
                            <div className="processing-state">
                                <div className="spinner" />
                                <p className="processing-text">AI 正在分析您的图片...</p>
                                <p className="processing-hint">请稍候，这可能需要几秒钟</p>
                            </div>
                        ) : evaluation && evaluation.status !== "failed" ? (
                            <div className="scores-content">
                                {/* Overall Score */}
                                <div className="overall-score">
                                    <span className="score-label">总体评分</span>
                                    <span
                                        className="score-value"
                                        style={{ color: getScoreColor(evaluation.scores.overall) }}
                                    >
                                        {evaluation.scores.overall.toFixed(1)}
                                    </span>
                                    <span className="score-max">/ 10</span>
                                </div>

                                {/* Category Scores */}
                                <div className="category-scores">
                                    <ScoreDisplay label="构图" score={evaluation.scores.composition} />
                                    <ScoreDisplay label="技术质量" score={evaluation.scores.technicalQuality} />
                                    <ScoreDisplay label="艺术价值" score={evaluation.scores.artisticMerit} />
                                    <ScoreDisplay label="光线" score={evaluation.scores.lighting} />
                                    <ScoreDisplay label="主体" score={evaluation.scores.subjectMatter} />
                                    <ScoreDisplay label="后期处理" score={evaluation.scores.postProcessing} />
                                </div>
                            </div>
                        ) : evaluation && evaluation.status === "failed" ? (
                            <div className="error-state">
                                <p>评估失败，请重试</p>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">📊</div>
                                <p className="empty-text">评分结果将显示在这里</p>
                                <p className="empty-hint">请先上传图片并开始评估</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Section: Professional Review */}
            <div className="evaluator-section review-section">
                <div className="section-header">
                    <h2>专业评价</h2>
                </div>
                <div className="section-content">
                    {processing ? (
                        <div className="processing-state">
                            <div className="spinner" />
                            <p className="processing-text">正在生成专业评价...</p>
                        </div>
                    ) : evaluation && evaluation.status !== "failed" ? (
                        <div className="markdown-content">
                            <ReactMarkdown>{evaluation.summary}</ReactMarkdown>
                        </div>
                    ) : evaluation && evaluation.status === "failed" ? (
                        <div className="error-state">
                            <p>评估失败，请重试</p>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">📝</div>
                            <p className="empty-text">专业评价将显示在这里</p>
                            <p className="empty-hint">请先上传图片并开始评估</p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .evaluator-container {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .top-section {
                    display: grid;
                    grid-template-columns: 35% 65%;
                    gap: 20px;
                }

                @media (max-width: 900px) {
                    .top-section {
                        grid-template-columns: 1fr;
                    }
                }

                .evaluator-section {
                    background: var(--white);
                    border-radius: var(--border-radius);
                    box-shadow: var(--shadow);
                    overflow: hidden;
                }

                .upload-section {
                    min-height: 504px;
                    display: flex;
                    flex-direction: column;
                }

                .scores-section {
                    min-height: 504px;
                    display: flex;
                    flex-direction: column;
                }

                .upload-section .section-content,
                .scores-section .section-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }

                .section-header {
                    padding: 15px 20px;
                    border-bottom: 1px solid var(--border);
                    background: var(--light);
                }

                .section-header h2 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                }

                .section-content {
                    padding: 20px;
                }

                .upload-zone {
                    border: 2px dashed var(--border);
                    border-radius: var(--border-radius);
                    padding: 40px 20px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .upload-zone:hover {
                    border-color: var(--primary);
                    background: rgba(0, 112, 243, 0.02);
                }

                .upload-zone.dragging {
                    border-color: var(--primary);
                    background: rgba(0, 112, 243, 0.05);
                }

                .upload-zone.has-preview {
                    cursor: default;
                    padding: 20px;
                }

                .upload-placeholder {
                    color: var(--secondary);
                }

                .upload-icon {
                    font-size: 48px;
                    margin-bottom: 15px;
                }

                .upload-text {
                    font-size: 18px;
                    margin-bottom: 5px;
                    color: var(--dark);
                }

                .upload-hint {
                    font-size: 14px;
                    margin-bottom: 15px;
                }

                .upload-formats {
                    font-size: 12px;
                    color: var(--secondary);
                }

                .preview-container {
                    width: 100%;
                    text-align: center;
                }

                .preview-image {
                    max-width: 100%;
                    max-height: 250px;
                    border-radius: var(--border-radius);
                    box-shadow: var(--shadow);
                }

                .preview-info {
                    margin-top: 15px;
                }

                .file-name {
                    font-weight: 500;
                    color: var(--dark);
                    word-break: break-all;
                }

                .file-size {
                    font-size: 14px;
                    color: var(--secondary);
                }

                .button-group {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                    justify-content: center;
                }

                .processing-state,
                .empty-state,
                .error-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    color: var(--secondary);
                    padding: 40px 20px;
                    min-height: 200px;
                }

                .empty-icon {
                    font-size: 48px;
                    margin-bottom: 15px;
                    opacity: 0.5;
                }

                .empty-text {
                    font-size: 16px;
                    color: var(--dark);
                    margin-bottom: 5px;
                }

                .empty-hint {
                    font-size: 14px;
                }

                .processing-text {
                    font-size: 16px;
                    color: var(--dark);
                    margin-top: 15px;
                    margin-bottom: 5px;
                }

                .processing-hint {
                    font-size: 14px;
                }

                .scores-content {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .overall-score {
                    text-align: center;
                    padding: 20px;
                    background: var(--light);
                    border-radius: var(--border-radius);
                }

                .score-label {
                    display: block;
                    font-size: 14px;
                    color: var(--secondary);
                    margin-bottom: 5px;
                }

                .score-value {
                    font-size: 48px;
                    font-weight: bold;
                    line-height: 1;
                }

                .score-max {
                    font-size: 18px;
                    color: var(--secondary);
                    margin-left: 5px;
                }

                .category-scores {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .review-section {
                    min-height: 504px;
                }

                .markdown-content {
                    line-height: 1.8;
                    color: var(--dark);
                }

                .markdown-content :global(h2) {
                    font-size: 18px;
                    font-weight: 600;
                    margin: 20px 0 10px 0;
                    padding-bottom: 8px;
                    border-bottom: 1px solid var(--border);
                    color: var(--dark);
                }

                .markdown-content :global(h3) {
                    font-size: 16px;
                    font-weight: 600;
                    margin: 15px 0 8px 0;
                    color: var(--dark);
                }

                .markdown-content :global(p) {
                    margin: 10px 0;
                    line-height: 1.8;
                }

                .markdown-content :global(strong) {
                    font-weight: 600;
                    color: var(--primary);
                }

                .markdown-content :global(ul),
                .markdown-content :global(ol) {
                    margin: 10px 0;
                    padding-left: 20px;
                }

                .markdown-content :global(li) {
                    margin: 5px 0;
                    line-height: 1.6;
                }

                .markdown-content :global(hr) {
                    border: none;
                    border-top: 1px solid var(--border);
                    margin: 15px 0;
                }

                .error-state {
                    color: var(--danger);
                }
            `}</style>
        </div>
    );
}
