import { NextRequest, NextResponse } from "next/server";
import { userRepository } from "@/lib/repositories";
import { verifyPassword } from "@/lib/auth/password";
import { sanitizeEmail } from "@/lib/auth/validation";
import { createSession } from "@/lib/auth/session";
import logger from "@/lib/logger";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        // Sanitize email
        const sanitizedEmail = sanitizeEmail(email);

        // Find user by email
        const user = await userRepository.findByEmail(sanitizedEmail);
        if (!user) {
            logger.warn("Login attempt with non-existent email", { email: sanitizedEmail });
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Verify password
        const isValidPassword = await verifyPassword(password, user.password_hash);
        if (!isValidPassword) {
            logger.warn("Login attempt with invalid password", { userId: user.id });
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Check if user is active
        if (!user.is_active) {
            logger.warn("Login attempt with disabled account", { userId: user.id, email: user.email });
            return NextResponse.json(
                { error: "你的账号已经被禁用，请联系管理员处理。" },
                { status: 403 }
            );
        }

        // Create session
        await createSession(user.id, user.email);

        logger.info("User logged in successfully", { userId: user.id, email: user.email });

        return NextResponse.json({
            message: "Login successful",
            user: {
                id: user.id,
                email: user.email,
            },
        });
    } catch (error) {
        logger.error("Login error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
