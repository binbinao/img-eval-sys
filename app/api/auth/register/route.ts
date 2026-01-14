import { NextRequest, NextResponse } from "next/server";
import { userRepository, apiKeyRepository } from "@/lib/repositories";
import { hashPassword, validatePassword } from "@/lib/auth/password";
import { validateEmail, sanitizeEmail } from "@/lib/auth/validation";
import { createSession } from "@/lib/auth/session";
import { generateApiKey, hashApiKey } from "@/lib/auth/api_key";
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

        // Validate email format
        const sanitizedEmail = sanitizeEmail(email);
        if (!validateEmail(sanitizedEmail)) {
            return NextResponse.json(
                { error: "Invalid email format" },
                { status: 400 }
            );
        }

        // Validate password strength
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return NextResponse.json(
                {
                    error: "Password validation failed",
                    details: passwordValidation.errors,
                },
                { status: 400 }
            );
        }

        // Check if email already exists
        const emailExists = await userRepository.emailExists(sanitizedEmail);
        if (emailExists) {
            return NextResponse.json(
                { error: "Email already registered" },
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const user = await userRepository.create({
            email: sanitizedEmail,
            password_hash: passwordHash,
        });

        // Generate and store API key
        const apiKey = generateApiKey();
        const apiKeyHash = await hashApiKey(apiKey);
        await apiKeyRepository.create({
            user_id: user.id,
            key_hash: apiKeyHash,
        });

        // Create session
        await createSession(user.id, user.email);

        logger.info("User registered successfully", { userId: user.id, email: user.email });

        return NextResponse.json(
            {
                message: "User registered successfully",
                user: {
                    id: user.id,
                    email: user.email,
                },
                apiKey: apiKey, // Return API key only on registration
            },
            { status: 201 }
        );
    } catch (error) {
        logger.error("Registration error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
