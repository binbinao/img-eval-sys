"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/types/database";

interface UserInfo {
    id: number;
    email: string;
    role: UserRole;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<UserInfo[]>([]);
    const [currentUser, setCurrentUser] = useState<{ id: number; role: UserRole } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
    const [togglingActiveUserId, setTogglingActiveUserId] = useState<number | null>(null);

    const fetchUsers = useCallback(async () => {
        try {
            const response = await fetch("/api/admin/users");
            if (response.status === 403) {
                router.push("/");
                return;
            }
            if (!response.ok) {
                throw new Error("Failed to fetch users");
            }
            const data = await response.json();
            setUsers(data.users);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    }, [router]);

    const fetchCurrentUser = useCallback(async () => {
        try {
            const response = await fetch("/api/auth/me");
            if (response.ok) {
                const data = await response.json();
                setCurrentUser({ id: data.user.id, role: data.user.role });
            }
        } catch {
            // Ignore
        }
    }, []);

    useEffect(() => {
        fetchCurrentUser();
        fetchUsers();
    }, [fetchCurrentUser, fetchUsers]);

    const handleActiveToggle = async (userId: number, currentActive: boolean) => {
        if (togglingActiveUserId) return;
        
        // Prevent self-deactivation
        if (currentUser?.id === userId) {
            setError("You cannot change your own active status");
            return;
        }

        setTogglingActiveUserId(userId);
        setError(null);

        try {
            const response = await fetch(`/api/admin/users/${userId}/active`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_active: !currentActive }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to update active status");
            }

            // Update local state
            setUsers(users.map(user => 
                user.id === userId ? { ...user, is_active: !currentActive } : user
            ));
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setTogglingActiveUserId(null);
        }
    };

    const handleRoleChange = async (userId: number, newRole: UserRole) => {
        if (updatingUserId) return;
        
        // Prevent self-demotion
        if (currentUser?.id === userId && newRole === 'user') {
            setError("You cannot demote yourself");
            return;
        }

        setUpdatingUserId(userId);
        setError(null);

        try {
            const response = await fetch(`/api/admin/users/${userId}/role`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to update role");
            }

            // Update local state
            setUsers(users.map(user => 
                user.id === userId ? { ...user, role: newRole } : user
            ));
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setUpdatingUserId(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p>Loading users...</p>
                <style jsx>{`
                    .loading-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 300px;
                        gap: 15px;
                    }
                    .loading-spinner {
                        width: 40px;
                        height: 40px;
                        border: 3px solid var(--border);
                        border-top-color: var(--primary);
                        border-radius: 50%;
                        animation: spin 0.8s linear infinite;
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="admin-users-page">
            <div className="page-header">
                <h1>用户管理</h1>
                <p className="subtitle">管理系统中的所有用户及其权限</p>
            </div>

            {error && (
                <div className="error-message">
                    <span>⚠️</span> {error}
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>邮箱</th>
                            <th>角色</th>
                            <th>注册时间</th>
                            <th>操作</th>
                            <th>激活</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className={currentUser?.id === user.id ? "current-user" : ""}>
                                <td>{user.id}</td>
                                <td className="email-cell">
                                    {user.email}
                                    {currentUser?.id === user.id && (
                                        <span className="you-badge">You</span>
                                    )}
                                </td>
                                <td>
                                    <span className={`role-badge ${user.role}`}>
                                        {user.role === 'admin' ? '管理员' : '普通用户'}
                                    </span>
                                </td>
                                <td>{formatDate(user.created_at)}</td>
                                <td>
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                        disabled={updatingUserId === user.id || currentUser?.id === user.id}
                                        className="role-select"
                                    >
                                        <option value="user">普通用户</option>
                                        <option value="admin">管理员</option>
                                    </select>
                                    {updatingUserId === user.id && (
                                        <span className="updating">更新中...</span>
                                    )}
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleActiveToggle(user.id, user.is_active)}
                                        disabled={togglingActiveUserId === user.id || currentUser?.id === user.id}
                                        className={`active-toggle ${user.is_active ? 'active' : 'inactive'}`}
                                    >
                                        {togglingActiveUserId === user.id ? '...' : (user.is_active ? 'Yes' : 'No')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="stats">
                <div className="stat-item">
                    <span className="stat-value">{users.length}</span>
                    <span className="stat-label">总用户数</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{users.filter(u => u.role === 'admin').length}</span>
                    <span className="stat-label">管理员</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{users.filter(u => u.role === 'user').length}</span>
                    <span className="stat-label">普通用户</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{users.filter(u => !u.is_active).length}</span>
                    <span className="stat-label">已禁用</span>
                </div>
            </div>

            <style jsx>{`
                .admin-users-page {
                    max-width: 1000px;
                    margin: 0 auto;
                }

                .page-header {
                    margin-bottom: 30px;
                }

                .page-header h1 {
                    font-size: 28px;
                    margin-bottom: 8px;
                    color: var(--dark);
                }

                .subtitle {
                    color: var(--dark);
                    opacity: 0.7;
                    font-size: 15px;
                }

                .error-message {
                    background: #fee2e2;
                    border: 1px solid #fca5a5;
                    color: #dc2626;
                    padding: 12px 16px;
                    border-radius: var(--border-radius);
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .error-message button {
                    margin-left: auto;
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: #dc2626;
                }

                .users-table-container {
                    background: var(--white);
                    border-radius: var(--border-radius);
                    box-shadow: var(--shadow);
                    overflow: hidden;
                }

                .users-table {
                    width: 100%;
                    border-collapse: collapse;
                }

                .users-table th,
                .users-table td {
                    padding: 15px;
                    text-align: left;
                    border-bottom: 1px solid var(--border);
                    vertical-align: middle;
                    height: 56px;
                    box-sizing: border-box;
                }

                .users-table th {
                    background: var(--light);
                    font-weight: 600;
                    font-size: 13px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--dark);
                    height: 48px;
                }

                .users-table th:first-child,
                .users-table td:first-child {
                    width: 60px;
                    text-align: center;
                }

                .users-table td:first-child {
                    font-weight: 500;
                }

                .users-table tr:last-child td {
                    border-bottom: none;
                }

                .users-table tr:hover {
                    background: var(--light);
                }

                .users-table tr.current-user {
                    background: #f0f9ff;
                }

                .email-cell .you-badge {
                    margin-left: 10px;
                    vertical-align: middle;
                }

                .you-badge {
                    background: var(--primary);
                    color: white;
                    font-size: 10px;
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-weight: 600;
                }

                .role-badge {
                    display: inline-block;
                    padding: 5px 12px;
                    border-radius: var(--border-radius);
                    font-size: 12px;
                    font-weight: 500;
                    color: white;
                }

                .role-badge.admin {
                    background: var(--warning, #f59e0b);
                }

                .role-badge.user {
                    background: var(--info, #3b82f6);
                }

                .role-select {
                    padding: 8px 12px;
                    border: 1px solid var(--border);
                    border-radius: var(--border-radius);
                    font-size: 14px;
                    cursor: pointer;
                    background: white;
                }

                .role-select:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .updating {
                    margin-left: 10px;
                    font-size: 12px;
                    color: var(--primary);
                }

                .active-toggle {
                    padding: 5px 15px;
                    border-radius: var(--border-radius);
                    border: none;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    min-width: 60px;
                    color: white;
                }

                .active-toggle.active {
                    background: var(--success, #22c55e);
                }

                .active-toggle.active:hover:not(:disabled) {
                    opacity: 0.9;
                }

                .active-toggle.inactive {
                    background: var(--secondary, #6b7280);
                }

                .active-toggle.inactive:hover:not(:disabled) {
                    opacity: 0.9;
                }

                .active-toggle:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .stats {
                    display: flex;
                    gap: 20px;
                    margin-top: 30px;
                }

                .stat-item {
                    background: var(--white);
                    padding: 20px 30px;
                    border-radius: var(--border-radius);
                    box-shadow: var(--shadow);
                    text-align: center;
                }

                .stat-value {
                    display: block;
                    font-size: 32px;
                    font-weight: 700;
                    color: var(--primary);
                }

                .stat-label {
                    font-size: 13px;
                    color: var(--dark);
                    opacity: 0.7;
                }

                @media (max-width: 768px) {
                    .users-table-container {
                        overflow-x: auto;
                    }

                    .stats {
                        flex-direction: column;
                    }
                }
            `}</style>
        </div>
    );
}
