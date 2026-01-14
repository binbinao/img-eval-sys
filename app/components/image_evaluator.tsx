"use client";

import { useState, useRef, DragEvent, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
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

export default function ImageEvaluator() {
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

    return (
        <div className="evaluator-vertical">
            {/* Upload Section */}
            <div className="evaluator-section">
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

            {/* Results Section */}
            <div className="evaluator-section">
                <div className="section-header">
                    <h2>评价结果</h2>
                </div>
                <div className="section-content">
                    {processing ? (
                        <div className="processing-state">
                            <div className="spinner" />
                            <p className="processing-text">AI 正在分析您的图片...</p>
                            <p className="processing-hint">请稍候，这可能需要几秒钟</p>
                        </div>
                    ) : evaluation ? (
                        <div className="result-content">
                            {evaluation.status === "failed" ? (
                                <div className="error-state">
                                    <p>评估失败，请重试</p>
                                </div>
                            ) : (
                                <div className="result-grid">
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

                                    {/* Summary */}
                                    <div className="summary-section">
                                        <h3>专业评价</h3>
                                        <div className="markdown-content">
                                            <ReactMarkdown>{evaluation.summary}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">📊</div>
                            <p className="empty-text">评价结果将显示在这里</p>
                            <p className="empty-hint">请先上传图片并开始评估</p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .evaluator-vertical {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .evaluator-section {
                    background: var(--white);
                    border-radius: var(--border-radius);
                    box-shadow: var(--shadow);
                    overflow: hidden;
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
                    min-height: 200px;
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
                    max-height: 300px;
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

                .result-content {
                    width: 100%;
                }

                .result-grid {
                    display: grid;
                    grid-template-columns: auto 1fr;
                    gap: 20px;
                    align-items: start;
                }

                @media (max-width: 768px) {
                    .result-grid {
                        grid-template-columns: 1fr;
                    }
                }

                .overall-score {
                    text-align: center;
                    padding: 20px 30px;
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
                    flex: 1;
                }

                .summary-section {
                    grid-column: 1 / -1;
                    background: var(--light);
                    padding: 15px;
                    border-radius: var(--border-radius);
                }

                .summary-section h3 {
                    font-size: 14px;
                    margin-bottom: 10px;
                    color: var(--secondary);
                }

                .summary-section p {
                    line-height: 1.6;
                    color: var(--dark);
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
