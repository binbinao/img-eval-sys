"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./sidebar";

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const checkAuth = useCallback(async () => {
        try {
            const response = await fetch("/api/auth/me");
            setIsAuthenticated(response.ok);
        } catch {
            setIsAuthenticated(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [pathname, checkAuth]);

    // Don't show sidebar on auth pages
    const isAuthPage = pathname === "/login" || pathname === "/register";

    if (isAuthPage || !isAuthenticated) {
        return <main className="main-content-full">{children}</main>;
    }

    return (
        <div className="app-container">
            <Sidebar isAuthenticated={isAuthenticated} />
            <main className="main-content">{children}</main>

            <style jsx>{`
                .app-container {
                    display: flex;
                    min-height: calc(100vh - 70px);
                }

                .main-content {
                    flex: 1;
                    padding: 20px 30px;
                    background: var(--light);
                    overflow-y: auto;
                }

                .main-content-full {
                    padding: 20px;
                    max-width: 500px;
                    margin: 0 auto;
                }

                @media (max-width: 768px) {
                    .main-content {
                        padding: 15px;
                    }
                }
            `}</style>
        </div>
    );
}
