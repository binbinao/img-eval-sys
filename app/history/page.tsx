"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import ScoreDisplay from "../components/score_display";

interface EvaluationItem {
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

export default function HistoryPage() {
    const [evaluations, setEvaluations] = useState<EvaluationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, [page]);

    const fetchHistory = async () => {
        try {
            const response = await fetch(`/api/evaluations/history?limit=10&offset=${page * 10}`);
            if (!response.ok) {
                throw new Error("获取历史记录失败");
            }
            const data = await response.json();
            
            if (page === 0) {
                setEvaluations(data.evaluations);
            } else {
                setEvaluations((prev) => [...prev, ...data.evaluations]);
            }
            
            setHasMore(data.evaluations.length === 10);
        } catch (err) {
            setError(err instanceof Error ? err.message : "获取历史记录失败");
        } finally {
            setLoading(false);
        }
    };

    if (loading && evaluations.length === 0) {
        return (
            <div className="card">
                <p style={{ textAlign: "center" }}>加载中...</p>
            </div>
        );
    }

    if (error && evaluations.length === 0) {
        return (
            <div className="card">
                <div className="error-message">{error}</div>
            </div>
        );
    }

    return (
        <div>
            <h1 style={{ marginBottom: "20px" }}>评估历史</h1>

            {evaluations.length === 0 ? (
                <div className="card">
                    <p style={{ textAlign: "center", color: "var(--secondary)" }}>
                        暂无评估记录
                    </p>
                </div>
            ) : (
                <>
                    <div style={{ display: "grid", gap: "20px" }}>
                        {evaluations.map((evaluation) => (
                            <div key={evaluation.id} className="card">
                                <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "20px" }}>
                                    <div>
                                        <img
                                            src={evaluation.imageUrl}
                                            alt="Evaluation"
                                            style={{
                                                width: "100%",
                                                borderRadius: "var(--border-radius)",
                                                boxShadow: "var(--shadow)",
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                                            <h3>评估 #{evaluation.id}</h3>
                                            <span
                                                style={{
                                                    padding: "5px 10px",
                                                    borderRadius: "var(--border-radius)",
                                                    backgroundColor:
                                                        evaluation.status === "completed"
                                                            ? "var(--success)"
                                                            : evaluation.status === "processing"
                                                            ? "var(--info)"
                                                            : "var(--secondary)",
                                                    color: "var(--white)",
                                                    fontSize: "12px",
                                                }}
                                            >
                                                {evaluation.status === "completed"
                                                    ? "已完成"
                                                    : evaluation.status === "processing"
                                                    ? "处理中"
                                                    : evaluation.status === "pending"
                                                    ? "等待中"
                                                    : "失败"}
                                            </span>
                                        </div>

                                        {evaluation.status === "completed" && (
                                            <>
                                                <div style={{ marginBottom: "15px" }}>
                                                    <strong>总体评分: {evaluation.scores.overall.toFixed(1)} / 10</strong>
                                                </div>
                                                <div style={{ marginBottom: "15px" }}>
                                                    <ScoreDisplay label="构图" score={evaluation.scores.composition} />
                                                    <ScoreDisplay label="技术质量" score={evaluation.scores.technicalQuality} />
                                                    <ScoreDisplay label="艺术价值" score={evaluation.scores.artisticMerit} />
                                                </div>
                                                <p style={{ color: "var(--secondary)", fontSize: "14px", marginBottom: "15px" }}>
                                                    {/* Show first 200 chars of summary as preview */}
                                                    {evaluation.summary.length > 200
                                                        ? evaluation.summary.substring(0, 200) + "..."
                                                        : evaluation.summary}
                                                </p>
                                            </>
                                        )}

                                        <Link
                                            href={`/evaluations/${evaluation.id}`}
                                            className="btn btn-primary"
                                            style={{ padding: "5px 15px", fontSize: "14px" }}
                                        >
                                            查看详情
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {hasMore && (
                        <div style={{ textAlign: "center", marginTop: "20px" }}>
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                className="btn btn-secondary"
                                disabled={loading}
                            >
                                {loading ? "加载中..." : "加载更多"}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
