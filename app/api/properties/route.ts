import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all properties for the user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const properties = await prisma.property.findMany({
      where: {
        userId: session.user.id,
        isHidden: false,
      },
      include: {
        _count: {
          select: {
            analyticsData: true,
            dailySnapshots: true,
          },
        },
      },
      orderBy: [
        { isFavorite: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ properties });
  } catch (error: any) {
    console.error("Error fetching properties:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch properties" },
      { status: 500 }
    );
  }
}

// POST - Add a new property
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { siteUrl, displayName, tags = [], brandedKeywords = [] } = body;

    if (!siteUrl) {
      return NextResponse.json(
        { error: "siteUrl is required" },
        { status: 400 }
      );
    }

    // Check if property already exists
    const existing = await prisma.property.findUnique({
      where: {
        userId_siteUrl: {
          userId: session.user.id,
          siteUrl,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Property already exists" },
        { status: 409 }
      );
    }

    const property = await prisma.property.create({
      data: {
        userId: session.user.id,
        siteUrl,
        displayName: displayName || siteUrl,
        tags,
        brandedKeywords,
      },
    });

    return NextResponse.json({ property }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating property:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create property" },
      { status: 500 }
    );
  }
}
