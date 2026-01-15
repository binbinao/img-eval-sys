"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userEmail, setUserEmail] = useState("");

    const checkAuth = useCallback(async () => {
        try {
            const response = await fetch("/api/auth/me");
            if (response.ok) {
                const data = await response.json();
                setIsAuthenticated(true);
                // API returns {user: {email: "..."}} structure
                setUserEmail(data.user?.email || data.email || "");
            } else {
                setIsAuthenticated(false);
                setUserEmail("");
            }
        } catch {
            setIsAuthenticated(false);
            setUserEmail("");
        }
    }, []);

    // Check auth on mount and when pathname changes
    useEffect(() => {
        checkAuth();
    }, [pathname, checkAuth]);

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            setIsAuthenticated(false);
            setUserEmail("");
            router.push("/login");
            router.refresh();
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-content">
                <Link href="/" className="navbar-brand">
                    🎭 毒舌摄影师辣评
                </Link>

                <div className="navbar-right">
                    {isAuthenticated ? (
                        <>
                            <span className="user-email">{userEmail}</span>
                            <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                                退出
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="nav-link">
                                登录
                            </Link>
                            <Link href="/register" className="btn btn-primary btn-sm">
                                注册
                            </Link>
                        </>
                    )}
                </div>
            </div>

            <style jsx>{`
                .navbar {
                    background: var(--white);
                    box-shadow: var(--shadow);
                    height: 60px;
                    display: flex;
                    align-items: center;
                    padding: 0 20px;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                }

                .navbar-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    width: 100%;
                }

                :global(.navbar-brand) {
                    text-decoration: none;
                    color: var(--dark);
                    font-size: 20px;
                    font-weight: bold;
                }

                .navbar-right {
                    display: flex;
                    gap: 15px;
                    align-items: center;
                }

                :global(.nav-link) {
                    text-decoration: none;
                    color: var(--dark);
                    font-size: 14px;
                }

                :global(.nav-link:hover) {
                    color: var(--primary);
                }

                .user-email {
                    color: var(--dark);
                    font-size: 14px;
                    font-weight: 500;
                    padding: 4px 10px;
                    background: var(--light);
                    border-radius: 4px;
                }

                :global(.btn-sm) {
                    padding: 6px 12px;
                    font-size: 14px;
                }
            `}</style>
        </nav>
    );
}
