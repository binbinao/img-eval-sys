import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData } from "@/types/session";

const sessionOptions = {
    password: process.env.SESSION_SECRET || "change-this-secret-key-in-production-min-32-chars",
    cookieName: "image-evaluation-session",
    cookieOptions: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: "lax" as const,
    },
};

/**
 * Get session from request
 */
export async function getSession() {
    const cookieStore = await cookies();
    return getIronSession<SessionData>(cookieStore, sessionOptions);
}

/**
 * Create session for user
 */
export async function createSession(userId: number, email: string): Promise<void> {
    const session = await getSession();
    session.userId = userId;
    session.email = email;
    session.isLoggedIn = true;
    await session.save();
}

/**
 * Destroy session
 */
export async function destroySession(): Promise<void> {
    const session = await getSession();
    session.destroy();
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
    const session = await getSession();
    return session.isLoggedIn === true && !!session.userId;
}

/**
 * Get current user ID from session
 */
export async function getCurrentUserId(): Promise<number | null> {
    const session = await getSession();
    return session.userId || null;
}
