"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./sidebar";
import type { UserRole } from "@/types/database";

interface AppLayoutProps {
    children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState<UserRole | undefined>(undefined);

    const checkAuth = useCallback(async () => {
        try {
            const response = await fetch("/api/auth/me");
            if (response.ok) {
                const data = await response.json();
                setIsAuthenticated(true);
                setUserRole(data.user?.role);
            } else {
                setIsAuthenticated(false);
                setUserRole(undefined);
            }
        } catch {
            setIsAuthenticated(false);
            setUserRole(undefined);
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
            <Sidebar isAuthenticated={isAuthenticated} userRole={userRole} />
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
