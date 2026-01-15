import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import logger from "@/lib/logger";

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();
        
        // Clear session data
        session.userId = undefined;
        session.email = undefined;
        session.isLoggedIn = false;
        
        // Destroy the session
        session.destroy();

        logger.info("User logged out successfully");

        const response = NextResponse.json({
            message: "Logout successful",
        });
        
        // Explicitly clear the session cookie
        response.cookies.set("image-evaluation-session", "", {
            expires: new Date(0),
            path: "/",
        });

        return response;
    } catch (error) {
        logger.error("Logout error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
