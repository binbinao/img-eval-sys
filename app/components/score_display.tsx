"use client";

interface ScoreDisplayProps {
    label: string;
    score: number;
    maxScore?: number;
}

export default function ScoreDisplay({ label, score, maxScore = 10 }: ScoreDisplayProps) {
    const percentage = (score / maxScore) * 100;
    const getColor = () => {
        if (percentage >= 80) return "var(--success)";
        if (percentage >= 60) return "var(--info)";
        if (percentage >= 40) return "var(--warning)";
        return "var(--danger)";
    };

    return (
        <div style={{ marginBottom: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <span style={{ fontWeight: "500" }}>{label}</span>
                <span style={{ fontWeight: "bold", color: getColor() }}>
                    {score.toFixed(1)} / {maxScore}
                </span>
            </div>
            <div className="score-bar">
                <div
                    className="score-bar-fill"
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: getColor(),
                    }}
                />
            </div>
        </div>
    );
}
