"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/types/database";

interface SidebarProps {
    isAuthenticated: boolean;
    userRole?: UserRole;
}

export default function Sidebar({ isAuthenticated, userRole }: SidebarProps) {
    const pathname = usePathname();

    if (!isAuthenticated) {
        return null;
    }

    const navItems = [
        { href: "/", label: "照片辣评", icon: "📷" },
        { href: "/history", label: "辣评历史", icon: "🌶" },
    ];

    // Admin-only menu items
    const adminItems = [
        { href: "/admin/users", label: "用户管理", icon: "👥" },
        { href: "/admin/data", label: "数据管理", icon: "📊" },
    ];

    return (
        <aside className="sidebar">
            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`sidebar-item ${pathname === item.href ? "active" : ""}`}
                    >
                        <span className="sidebar-icon">{item.icon}</span>
                        <span className="sidebar-label">{item.label}</span>
                    </Link>
                ))}
                
                {/* Admin-only menu items (visible only to admins, no section title) */}
                {userRole === 'admin' && adminItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`sidebar-item ${pathname === item.href ? "active" : ""}`}
                    >
                        <span className="sidebar-icon">{item.icon}</span>
                        <span className="sidebar-label">{item.label}</span>
                    </Link>
                ))}
            </nav>

            <style jsx>{`
                .sidebar {
                    width: 200px;
                    min-height: calc(100vh - 70px);
                    background: var(--white);
                    border-right: 1px solid var(--border);
                    padding: 20px 0;
                    flex-shrink: 0;
                }

                .sidebar-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    padding: 0 10px;
                }

                :global(.sidebar-item) {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 15px;
                    border-radius: var(--border-radius);
                    text-decoration: none;
                    color: var(--dark);
                    transition: all 0.2s ease;
                    font-size: 15px;
                }

                :global(.sidebar-item:hover) {
                    background: var(--light);
                }

                :global(.sidebar-item.active) {
                    background: var(--primary);
                    color: white;
                }

                .sidebar-icon {
                    font-size: 18px;
                }

                .sidebar-label {
                    font-weight: 500;
                }

                @media (max-width: 768px) {
                    .sidebar {
                        display: none;
                    }
                }
            `}</style>
        </aside>
    );
}
