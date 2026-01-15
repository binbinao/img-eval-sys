"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface AuthFormProps {
    mode: "login" | "register";
}

export default function AuthForm({ mode }: AuthFormProps) {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const validateForm = (): boolean => {
        if (!email || !password) {
            setError("请填写所有必填字段");
            return false;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("请输入有效的邮箱地址");
            return false;
        }

        if (mode === "register") {
            if (password.length < 8) {
                setError("密码长度至少为 8 个字符");
                return false;
            }

            if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
                setError("密码必须包含大小写字母、数字和特殊字符");
                return false;
            }

            if (password !== confirmPassword) {
                setError("两次输入的密码不一致");
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "操作失败");
                return;
            }

            // Redirect to home page on success using full page reload
            // This ensures session cookies are properly recognized by the client
            window.location.href = "/";
        } catch (err) {
            setError("网络错误，请稍后重试");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ maxWidth: "400px", margin: "50px auto" }}>
            <h2 style={{ marginBottom: "20px", textAlign: "center" }}>
                {mode === "login" ? "登录" : "注册"}
            </h2>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label" htmlFor="email">
                        邮箱
                    </label>
                    <input
                        id="email"
                        type="email"
                        className="form-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="password">
                        密码
                    </label>
                    <input
                        id="password"
                        type="password"
                        className="form-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {mode === "register" && (
                    <div className="form-group">
                        <label className="form-label" htmlFor="confirmPassword">
                            确认密码
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            className="form-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                )}

                {error && <div className="error-message">{error}</div>}

                <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: "100%", marginTop: "20px" }}
                    disabled={loading}
                >
                    {loading ? "处理中..." : mode === "login" ? "登录" : "注册"}
                </button>
            </form>

            <div style={{ marginTop: "20px", textAlign: "center" }}>
                {mode === "login" ? (
                    <a href="/register" style={{ color: "var(--primary)", textDecoration: "none" }}>
                        还没有账号？立即注册
                    </a>
                ) : (
                    <a href="/login" style={{ color: "var(--primary)", textDecoration: "none" }}>
                        已有账号？立即登录
                    </a>
                )}
            </div>
        </div>
    );
}
