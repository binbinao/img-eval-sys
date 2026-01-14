import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";
import logger from "@/lib/logger";

export async function POST(request: NextRequest) {
    try {
        await destroySession();

        logger.info("User logged out successfully");

        return NextResponse.json({
            message: "Logout successful",
        });
    } catch (error) {
        logger.error("Logout error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
