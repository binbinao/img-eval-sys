import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/navbar";
import AppLayout from "./components/app_layout";

export const metadata: Metadata = {
    title: "Image Evaluation System",
    description: "Professional photographer's perspective image evaluation",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="zh-CN">
            <body>
                <Navbar />
                <AppLayout>{children}</AppLayout>
            </body>
        </html>
    );
}
