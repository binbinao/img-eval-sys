"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import ScoreDisplay from "./score_display";

interface EvaluationResultProps {
    evaluationId: number;
}

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

export default function EvaluationResult({ evaluationId }: EvaluationResultProps) {
    const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchEvaluation();
    }, [evaluationId]);

    const fetchEvaluation = async () => {
        try {
            const response = await fetch(`/api/evaluations/${evaluationId}`);
            if (!response.ok) {
                throw new Error("获取评估结果失败");
            }
            const data = await response.json();
            setEvaluation(data);

            // If status is pending or processing, poll for updates
            if (data.status === "pending" || data.status === "processing") {
                setTimeout(fetchEvaluation, 2000);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "获取评估结果失败");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="card">
                <p style={{ textAlign: "center" }}>加载中...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card">
                <div className="error-message">{error}</div>
            </div>
        );
    }

    if (!evaluation) {
        return (
            <div className="card">
                <div className="error-message">未找到评估结果</div>
            </div>
        );
    }

    return (
        <div>
            <div className="card">
                <h2 style={{ marginBottom: "20px" }}>评估结果</h2>

                {evaluation.status === "pending" || evaluation.status === "processing" ? (
                    <div style={{ textAlign: "center", padding: "40px" }}>
                        <p style={{ fontSize: "18px", marginBottom: "10px" }}>
                            {evaluation.status === "pending" ? "等待处理中..." : "正在评估中..."}
                        </p>
                        <p style={{ color: "var(--secondary)" }}>请稍候，评估完成后将自动显示结果</p>
                    </div>
                ) : evaluation.status === "failed" ? (
                    <div className="error-message">评估失败，请重试</div>
                ) : (
                    <>
                        <div style={{ marginBottom: "30px" }}>
                            <img
                                src={evaluation.imageUrl}
                                alt="Evaluated"
                                style={{
                                    maxWidth: "100%",
                                    borderRadius: "var(--border-radius)",
                                    boxShadow: "var(--shadow-lg)",
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: "30px" }}>
                            <h3 style={{ marginBottom: "20px", fontSize: "24px" }}>
                                总体评分: {evaluation.scores.overall.toFixed(1)} / 10
                            </h3>

                            <ScoreDisplay label="构图" score={evaluation.scores.composition} />
                            <ScoreDisplay label="技术质量" score={evaluation.scores.technicalQuality} />
                            <ScoreDisplay label="艺术价值" score={evaluation.scores.artisticMerit} />
                            <ScoreDisplay label="光线" score={evaluation.scores.lighting} />
                            <ScoreDisplay label="主体" score={evaluation.scores.subjectMatter} />
                            <ScoreDisplay label="后期处理" score={evaluation.scores.postProcessing} />
                        </div>

                        <div className="card" style={{ backgroundColor: "var(--light)" }}>
                            <h3 style={{ marginBottom: "15px" }}>评价总结</h3>
                            <div style={{ lineHeight: "1.8" }}>
                                <ReactMarkdown>{evaluation.summary}</ReactMarkdown>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
