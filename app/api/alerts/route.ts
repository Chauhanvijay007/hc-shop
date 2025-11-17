import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all alerts for user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const propertyId = searchParams.get("propertyId");

    const where: any = {
      userId: session.user.id,
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    const alerts = await prisma.alert.findMany({
      where,
      include: {
        property: {
          select: {
            siteUrl: true,
            displayName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    const unreadCount = await prisma.alert.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    });

    return NextResponse.json({ alerts, unreadCount });
  } catch (error: any) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

// POST - Create manual alert
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, type, severity, title, message } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const alert = await prisma.alert.create({
      data: {
        userId: session.user.id,
        propertyId: propertyId || null,
        type,
        severity: severity || "medium",
        title,
        message,
      },
    });

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating alert:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create alert" },
      { status: 500 }
    );
  }
}
