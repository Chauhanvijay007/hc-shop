import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays, addMonths } from "date-fns";

// GET - List all magic links for user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const magicLinks = await prisma.magicLink.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ magicLinks });
  } catch (error: any) {
    console.error("Error fetching magic links:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch magic links" },
      { status: 500 }
    );
  }
}

// POST - Create a new magic link
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { propertyIds, password, expiresIn, maxViews } = body;

    if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
      return NextResponse.json(
        { error: "At least one property ID is required" },
        { status: 400 }
      );
    }

    // Verify user owns all properties
    for (const propertyId of propertyIds) {
      const property = await prisma.property.findFirst({
        where: {
          id: propertyId,
          userId: session.user.id,
        },
      });

      if (!property) {
        return NextResponse.json(
          { error: `Access denied for property ${propertyId}` },
          { status: 403 }
        );
      }
    }

    // Calculate expiration date
    let expiresAt = null;
    if (expiresIn) {
      const now = new Date();
      switch (expiresIn) {
        case "1day":
          expiresAt = addDays(now, 1);
          break;
        case "7days":
          expiresAt = addDays(now, 7);
          break;
        case "30days":
          expiresAt = addDays(now, 30);
          break;
        case "90days":
          expiresAt = addDays(now, 90);
          break;
        case "1year":
          expiresAt = addMonths(now, 12);
          break;
      }
    }

    const magicLink = await prisma.magicLink.create({
      data: {
        userId: session.user.id,
        propertyIds,
        password: password || null,
        expiresAt,
        maxViews: maxViews || null,
      },
    });

    return NextResponse.json({ magicLink }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating magic link:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create magic link" },
      { status: 500 }
    );
  }
}
