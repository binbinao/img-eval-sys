"use client";

import { useState, useRef, DragEvent } from "react";
import { useRouter } from "next/navigation";

export default function ImageUpload() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileSelect = (selectedFile: File) => {
        setError("");
        setSuccess("");

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
    };

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

    const handleUpload = async () => {
        if (!file) {
            setError("请选择要上传的图片");
            return;
        }

        setUploading(true);
        setError("");
        setSuccess("");

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
                return;
            }

            setSuccess("图片上传成功！正在处理评估...");
            
            // Redirect to evaluation result page
            if (data.evaluation?.id) {
                setTimeout(() => {
                    router.push(`/evaluations/${data.evaluation.id}`);
                }, 1500);
            }
        } catch (err) {
            setError("网络错误，请稍后重试");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="card">
            <h2 style={{ marginBottom: "20px" }}>上传图片</h2>

            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                    border: `2px dashed ${isDragging ? "var(--primary)" : "var(--border)"}`,
                    borderRadius: "var(--border-radius)",
                    padding: "40px",
                    textAlign: "center",
                    cursor: "pointer",
                    backgroundColor: isDragging ? "rgba(0, 112, 243, 0.05)" : "transparent",
                    transition: "all 0.3s ease",
                }}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/tiff"
                    onChange={handleFileInputChange}
                    style={{ display: "none" }}
                />

                {preview ? (
                    <div>
                        <img
                            src={preview}
                            alt="Preview"
                            style={{
                                maxWidth: "100%",
                                maxHeight: "300px",
                                borderRadius: "var(--border-radius)",
                                marginBottom: "20px",
                            }}
                        />
                        <p style={{ color: "var(--secondary)", marginBottom: "10px" }}>
                            {file?.name} ({((file?.size || 0) / 1024 / 1024).toFixed(2)} MB)
                        </p>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setFile(null);
                                setPreview(null);
                            }}
                            className="btn btn-secondary"
                            style={{ marginRight: "10px" }}
                        >
                            重新选择
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleUpload();
                            }}
                            className="btn btn-primary"
                            disabled={uploading}
                        >
                            {uploading ? "上传中..." : "上传并评估"}
                        </button>
                    </div>
                ) : (
                    <div>
                        <p style={{ fontSize: "18px", marginBottom: "10px" }}>
                            拖拽图片到这里或点击选择
                        </p>
                        <p style={{ color: "var(--secondary)", fontSize: "14px" }}>
                            支持 JPEG, PNG, WebP, TIFF，最大 10MB
                        </p>
                    </div>
                )}
            </div>

            {error && (
                <div className="error-message" style={{ marginTop: "15px" }}>
                    {error}
                </div>
            )}
            {success && (
                <div className="success-message" style={{ marginTop: "15px" }}>
                    {success}
                </div>
            )}
        </div>
    );
}
