import { NextRequest, NextResponse } from "next/server";
import { createDb, users, type NewUser } from "@/lib/db";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  referralCode: z.string().min(8).max(16),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const db = createDb();
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    if (!validatedData.referralCode) {
      return NextResponse.json(
        { error: "Referral code is required" },
        { status: 400 }
      );
    }

    if (
      validatedData.referralCode.length < 8 ||
      validatedData.referralCode.length > 16
    ) {
      return NextResponse.json(
        { error: "Authorization Failed" },
        { status: 401 }
      );
    }

    // Check if referral code is valid (you can implement your own logic here)
    const envReferralCode = process.env.REFERRAL_CODE;
    if (!envReferralCode) {
      return NextResponse.json(
        { error: "Authorization Failed" },
        { status: 401 }
      );
    }

    const referralCode = validatedData.referralCode;
    const hashedReferralCode = crypto
      .createHash("sha256")
      .update(referralCode)
      .digest("hex");
    if (hashedReferralCode !== envReferralCode) {
      return NextResponse.json(
        { error: "Authorization Failed" },
        { status: 401 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Create user
    const newUser: NewUser = {
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      role: "admin", // First user is admin, or you can modify this logic
    };

    const result = await db.insert(users).values(newUser).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    });

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}
