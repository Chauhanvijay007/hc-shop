import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Verify and access a magic link
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const magicLink = await prisma.magicLink.findUnique({
      where: { token },
    });

    if (!magicLink) {
      return NextResponse.json(
        { error: "Invalid link" },
        { status: 404 }
      );
    }

    // Check if expired
    if (magicLink.expiresAt && magicLink.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This link has expired" },
        { status: 410 }
      );
    }

    // Check if max views reached
    if (magicLink.maxViews && magicLink.viewCount >= magicLink.maxViews) {
      return NextResponse.json(
        { error: "This link has reached its view limit" },
        { status: 410 }
      );
    }

    // Check password if required
    if (magicLink.password) {
      if (!password || password !== magicLink.password) {
        return NextResponse.json(
          { error: "Invalid password" },
          { status: 401 }
        );
      }
    }

    // Increment view count
    await prisma.magicLink.update({
      where: { token },
      data: {
        viewCount: magicLink.viewCount + 1,
      },
    });

    // Return success with property IDs
    return NextResponse.json({
      success: true,
      propertyIds: magicLink.propertyIds,
      token: magicLink.token,
    });
  } catch (error: any) {
    console.error("Error verifying magic link:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify link" },
      { status: 500 }
    );
  }
}
