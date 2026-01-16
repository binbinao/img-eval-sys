"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface FileInfo {
    key: string;
    size: number;
    lastModified: Date;
    url: string;
}

interface FolderInfo {
    prefix: string;
    name: string;
    fileCount: number;
}

interface TreeNode {
    type: 'folder' | 'file';
    name: string;
    path: string;
    size?: number;
    lastModified?: Date;
    url?: string;
    children?: TreeNode[];
    expanded?: boolean;
}

export default function AdminDataPage() {
    const router = useRouter();
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [folders, setFolders] = useState<FolderInfo[]>([]);
    const [treeData, setTreeData] = useState<TreeNode[]>([]);
    const [currentPrefix, setCurrentPrefix] = useState<string>("images/");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
    const [downloadingFolder, setDownloadingFolder] = useState<string | null>(null);

    const fetchFiles = useCallback(async (prefix?: string) => {
        try {
            setLoading(true);
            setError(null);
            
            const url = prefix 
                ? `/api/admin/data/files?prefix=${encodeURIComponent(prefix)}`
                : "/api/admin/data/files";
            
            const response = await fetch(url);
            
            if (response.status === 403) {
                router.push("/");
                return;
            }
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to fetch files");
            }
            
            const data = await response.json();
            setFiles(data.files || []);
            
            // Debug: Log file sizes
            if (data.files && data.files.length > 0) {
                const totalSize = data.files.reduce((acc: number, f: FileInfo) => {
                    const fileSize = Number(f.size) || 0;
                    console.log(`File: ${f.key}, Raw size: ${f.size}, Parsed size: ${fileSize}, MB: ${(fileSize / 1024 / 1024).toFixed(2)}`);
                    return acc + fileSize;
                }, 0);
                console.log(`Total files: ${data.files.length}, Total size: ${totalSize} bytes`);
            }
            
            // Extract unique folders from file keys
            const folderSet = new Set<string>();
            const folderCounts = new Map<string, number>();
            
            data.files?.forEach((file: FileInfo) => {
                const relativePath = file.key.substring((prefix || "images/").length);
                const parts = relativePath.split('/');
                if (parts.length > 1) {
                    const folder = parts[0];
                    folderSet.add(folder);
                    folderCounts.set(folder, (folderCounts.get(folder) || 0) + 1);
                }
            });
            
            const folderList: FolderInfo[] = Array.from(folderSet).map(folder => ({
                prefix: `${prefix || "images/"}${folder}/`,
                name: folder,
                fileCount: folderCounts.get(folder) || 0,
            })).sort((a, b) => a.name.localeCompare(b.name));
            
            setFolders(folderList);
            
            // Organize into tree structure
            const tree = organizeIntoTree(data.files || [], folderList, prefix || "images/");
            setTreeData(tree);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    const handleDownloadFile = async (fileKey: string) => {
        if (downloadingFile) return;
        
        setDownloadingFile(fileKey);
        setError(null);

        try {
            const url = `/api/admin/data/download?file=${encodeURIComponent(fileKey)}`;
            window.location.href = url;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to download file");
        } finally {
            setDownloadingFile(null);
        }
    };

    const handleDownloadFolder = async (folderPrefix: string, folderName: string) => {
        if (downloadingFolder) return;
        
        setDownloadingFolder(folderPrefix);
        setError(null);

        try {
            const url = `/api/admin/data/zip?folder=${encodeURIComponent(folderPrefix)}`;
            window.location.href = url;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to download folder");
        } finally {
            setDownloadingFolder(null);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (!bytes || isNaN(bytes) || bytes === 0) return "0.00 B";
        
        // Safety check: if value is too large, cap it at EB
        if (bytes > Number.MAX_SAFE_INTEGER) {
            return "∞";
        }
        
        const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB"];
        let size = bytes;
        let unitIndex = 0;
        
        // Find appropriate unit
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        // Format with 2 decimal places
        return size.toFixed(2) + " " + units[unitIndex];
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const handleBack = () => {
        const parts = currentPrefix.split('/').filter(p => p);
        if (parts.length > 1) {
            parts.pop();
            const newPrefix = parts.join('/') + '/';
            setCurrentPrefix(newPrefix);
            fetchFiles(newPrefix);
        } else if (parts.length === 1) {
            setCurrentPrefix("images/");
            fetchFiles("images/");
        }
    };

    const handleFolderClick = (folder: FolderInfo) => {
        setCurrentPrefix(folder.prefix);
        fetchFiles(folder.prefix);
    };

    // Helper function to organize files into tree structure
    const organizeIntoTree = (files: FileInfo[], folders: FolderInfo[], currentPrefix: string): TreeNode[] => {
        const nodes: TreeNode[] = [];
        const folderMap = new Map<string, TreeNode>();
        
        // Create folder nodes
        folders.forEach(folder => {
            const node: TreeNode = {
                type: 'folder',
                name: folder.name,
                path: folder.prefix,
                expanded: true, // Default expand first level
                children: [],
            };
            folderMap.set(folder.name, node);
            nodes.push(node);
        });
        
        // Organize files into folders
        files.forEach(file => {
            const relativePath = file.key.substring(currentPrefix.length);
            const parts = relativePath.split('/');
            
            if (parts.length > 1) {
                // File is in a folder
                const folderName = parts[0];
                const folderNode = folderMap.get(folderName);
                if (folderNode) {
                    folderNode.children!.push({
                        type: 'file',
                        name: parts.slice(1).join('/'),
                        path: file.key,
                        size: file.size,
                        lastModified: file.lastModified,
                        url: file.url,
                    });
                }
            } else {
                // File is at root level
                nodes.push({
                    type: 'file',
                    name: relativePath,
                    path: file.key,
                    size: file.size,
                    lastModified: file.lastModified,
                    url: file.url,
                });
            }
        });
        
        return nodes;
    };

    // Toggle expand/collapse for tree nodes
    const toggleNode = (nodePath: string) => {
        const toggleRecursive = (nodes: TreeNode[]): TreeNode[] => {
            return nodes.map(node => {
                if (node.path === nodePath && node.type === 'folder') {
                    return { ...node, expanded: !node.expanded };
                }
                if (node.children) {
                    return { ...node, children: toggleRecursive(node.children) };
                }
                return node;
            });
        };
        
        setTreeData(toggleRecursive(treeData));
    };

    // TreeNode component for rendering tree structure
    const TreeNode = ({ node, level = 0 }: { node: TreeNode; level?: number }) => {
        const indentWidth = level * 24;
        
        // Inline styles to ensure they work in nested components
        const rowStyle: React.CSSProperties = {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: '12px 15px',
            borderBottom: '1px solid #e5e7eb',
            gap: '0',
        };
        
        const folderRowStyle: React.CSSProperties = {
            ...rowStyle,
            cursor: 'pointer',
            backgroundColor: 'transparent',
        };
        
        const fileRowStyle: React.CSSProperties = {
            ...rowStyle,
            backgroundColor: '#fafafa',
        };
        
        const colNameStyle: React.CSSProperties = {
            flex: 1,
            minWidth: '200px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '8px',
        };
        
        const colSizeStyle: React.CSSProperties = {
            width: '100px',
            textAlign: 'right',
            color: '#333',
            fontSize: '13px',
            flexShrink: 0,
        };
        
        const colDateStyle: React.CSSProperties = {
            width: '150px',
            textAlign: 'right',
            color: '#333',
            fontSize: '13px',
            flexShrink: 0,
        };
        
        const colActionsStyle: React.CSSProperties = {
            width: '120px',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: '8px',
            flexShrink: 0,
        };
        
        const btnDownloadStyle: React.CSSProperties = {
            padding: '6px 12px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
        };
        
        const btnIconStyle: React.CSSProperties = {
            padding: '6px 10px',
            background: '#f3f4f6',
            color: '#333',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
        };
        
        return (
            <div>
                {node.type === 'folder' ? (
                    <div 
                        style={folderRowStyle}
                        onClick={() => toggleNode(node.path)}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <div style={colNameStyle}>
                            <span style={{ width: `${indentWidth}px`, display: 'inline-block', flexShrink: 0 }}></span>
                            <span style={{ fontSize: '10px', color: '#333', width: '16px', textAlign: 'center', flexShrink: 0 }}>
                                {node.expanded ? '▼' : '▶'}
                            </span>
                            <span style={{ fontSize: '18px', flexShrink: 0 }}>📁</span>
                            <span style={{ fontSize: '14px', color: '#333' }}>{node.name}</span>
                            <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>
                                ({node.children?.length || 0} 个文件)
                            </span>
                        </div>
                        <div style={colSizeStyle}></div>
                        <div style={colDateStyle}></div>
                        <div style={colActionsStyle}>
                            <button
                                style={{
                                    ...btnDownloadStyle,
                                    opacity: downloadingFolder === node.path ? 0.6 : 1,
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadFolder(node.path, node.name);
                                }}
                                disabled={downloadingFolder === node.path}
                            >
                                {downloadingFolder === node.path ? '⏳' : '⬇️'} 下载
                            </button>
                        </div>
                    </div>
                ) : (
                    <div 
                        style={fileRowStyle}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                    >
                        <div style={colNameStyle}>
                            <span style={{ width: `${indentWidth + 24}px`, display: 'inline-block', flexShrink: 0 }}></span>
                            <span style={{ fontSize: '18px', flexShrink: 0 }}>🖼️</span>
                            <span style={{ fontSize: '14px', color: '#333', wordBreak: 'break-all' }}>{node.name}</span>
                        </div>
                        <div style={colSizeStyle}>{formatFileSize(node.size || 0)}</div>
                        <div style={colDateStyle}>{formatDate(node.lastModified!)}</div>
                        <div style={colActionsStyle}>
                            <button
                                style={{
                                    ...btnIconStyle,
                                    opacity: downloadingFile === node.path ? 0.6 : 1,
                                }}
                                onClick={() => handleDownloadFile(node.path)}
                                disabled={downloadingFile === node.path}
                                title="下载"
                            >
                                {downloadingFile === node.path ? '⏳' : '⬇️'}
                            </button>
                            <a
                                href={node.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={btnIconStyle}
                                title="预览"
                            >
                                👁️
                            </a>
                        </div>
                    </div>
                )}
                
                {node.type === 'folder' && node.expanded && node.children && (
                    <div>
                        {node.children.map((child, index) => (
                            <TreeNode key={index} node={child} level={level + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner" />
                <p>Loading data...</p>
                <style jsx global>{`
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
        <div className="admin-data-page">
            <div className="page-header">
                <h1>📊 数据管理</h1>
                <p className="subtitle">查看和管理COS上的数据文件</p>
            </div>

            {error && (
                <div className="error-message">
                    <span>⚠️</span> {error}
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            <div className="breadcrumb">
                <button 
                    className="breadcrumb-item"
                    onClick={() => {
                        setCurrentPrefix("images/");
                        fetchFiles("images/");
                    }}
                >
                    📁 Root
                </button>
                {currentPrefix !== "images/" && (
                    <>
                        <span className="separator">/</span>
                        <button 
                            className="breadcrumb-item back"
                            onClick={handleBack}
                        >
                            ⬅️ Back
                        </button>
                    </>
                )}
                <span className="current-path">{currentPrefix}</span>
            </div>

            <div className="stats">
                <div className="stat-item">
                    <span className="stat-value">{folders.length}</span>
                    <span className="stat-label">文件夹</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{files.length}</span>
                    <span className="stat-label">文件</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">
                        {formatFileSize(files.reduce((acc, f) => acc + (Number(f.size) || 0), 0))}
                    </span>
                    <span className="stat-label">总大小</span>
                </div>
            </div>

            {treeData.length > 0 && (
                <div style={{
                    background: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    padding: '20px',
                    overflowX: 'auto',
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: '12px 15px',
                        background: '#f3f4f6',
                        borderRadius: '6px',
                        marginBottom: '10px',
                        fontWeight: 600,
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: '#333',
                    }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>名称</div>
                        <div style={{ width: '100px', textAlign: 'right', flexShrink: 0 }}>大小</div>
                        <div style={{ width: '150px', textAlign: 'right', flexShrink: 0 }}>修改时间</div>
                        <div style={{ width: '120px', textAlign: 'right', flexShrink: 0 }}>操作</div>
                    </div>
                    <div style={{ minHeight: '200px' }}>
                        {treeData.map((node, index) => (
                            <TreeNode key={index} node={node} />
                        ))}
                    </div>
                </div>
            )}

            {treeData.length === 0 && !loading && (
                <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <p>暂无文件</p>
                </div>
            )}

            <style jsx>{`
                .admin-data-page {
                    max-width: 1200px;
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

                .breadcrumb {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 20px;
                    padding: 15px;
                    background: var(--light);
                    border-radius: var(--border-radius);
                    font-size: 14px;
                }

                .breadcrumb-item {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--primary);
                    font-size: 14px;
                    padding: 5px 10px;
                    border-radius: var(--border-radius);
                    transition: background 0.2s;
                }

                .breadcrumb-item:hover {
                    background: white;
                }

                .breadcrumb-item.back {
                    color: var(--dark);
                }

                .separator {
                    color: var(--dark);
                    opacity: 0.5;
                }

                .current-path {
                    color: var(--dark);
                    opacity: 0.7;
                    margin-left: auto;
                }

                .stats {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .stat-item {
                    background: var(--white);
                    padding: 20px 30px;
                    border-radius: var(--border-radius);
                    box-shadow: var(--shadow);
                    text-align: center;
                    flex: 1;
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

                .folders-container {
                    background: var(--white);
                    border-radius: var(--border-radius);
                    box-shadow: var(--shadow);
                    padding: 20px;
                    margin-bottom: 30px;
                }

                .folders-container h2 {
                    font-size: 18px;
                    margin-bottom: 15px;
                    color: var(--dark);
                }

                .folders-grid {
                    grid-template-columns: 1fr;
                }

                /* Tree Styles - Using Flexbox for reliable alignment */
                .tree-container {
                    background: var(--white);
                    border-radius: var(--border-radius);
                    box-shadow: var(--shadow);
                    padding: 20px;
                    overflow-x: auto;
                }

                .tree-row {
                    display: flex;
                    align-items: center;
                    padding: 12px 15px;
                    border-bottom: 1px solid var(--border);
                }

                .tree-row:last-child {
                    border-bottom: none;
                }

                .tree-header {
                    background: var(--light);
                    border-radius: var(--border-radius);
                    margin-bottom: 10px;
                    font-weight: 600;
                    font-size: 13px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: var(--dark);
                }

                .tree-row-folder {
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .tree-row-folder:hover {
                    background: var(--light);
                }

                .tree-row-file {
                    background: #fafafa;
                    transition: background 0.2s;
                }

                .tree-row-file:hover {
                    background: #f0f0f0;
                }

                .tree-col {
                    flex-shrink: 0;
                }

                .tree-col-name {
                    flex: 1;
                    min-width: 200px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .tree-col-size {
                    width: 100px;
                    text-align: right;
                    color: var(--dark);
                    opacity: 0.8;
                    font-size: 13px;
                }

                .tree-col-date {
                    width: 150px;
                    text-align: right;
                    color: var(--dark);
                    opacity: 0.8;
                    font-size: 13px;
                }

                .tree-col-actions {
                    width: 120px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                }

                .tree-expand-icon {
                    font-size: 10px;
                    color: var(--dark);
                    width: 16px;
                    text-align: center;
                }

                .tree-icon {
                    font-size: 18px;
                }

                .tree-name {
                    font-size: 14px;
                    color: var(--dark);
                    word-break: break-all;
                }

                .tree-count {
                    font-size: 12px;
                    color: var(--dark);
                    opacity: 0.5;
                    margin-left: 8px;
                }

                .tree {
                    min-height: 200px;
                }

                .tree-node {
                    /* No border here, border is on tree-row */
                }

                .tree-children {
                    /* Children are indented via inline style */
                }

                .btn-download {
                    padding: 6px 12px;
                    background: var(--primary);
                    color: white;
                    border: none;
                    border-radius: var(--border-radius);
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }

                .btn-download:hover:not(:disabled) {
                    background: var(--primary-dark);
                }

                .btn-download:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .btn-icon {
                    padding: 6px 10px;
                    background: var(--light);
                    color: var(--dark);
                    border: 1px solid var(--border);
                    border-radius: var(--border-radius);
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }

                .btn-icon:hover {
                    background: white;
                    border-color: var(--primary);
                }

                .btn-icon:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                @media (max-width: 768px) {
                    .stats {
                        flex-direction: column;
                    }

                    .folders-grid {
                        grid-template-columns: 1fr;
                    }

                    .tree-row {
                        flex-wrap: wrap;
                        padding: 10px;
                    }

                    .tree-col-name {
                        width: 100%;
                        margin-bottom: 8px;
                    }

                    .tree-col-size,
                    .tree-col-date {
                        width: auto;
                        text-align: left;
                    }

                    .tree-col-actions {
                        width: auto;
                        margin-left: auto;
                    }
                }
            `}</style>
        </div>
    );
}
