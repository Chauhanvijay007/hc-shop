import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all alert rules for user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    const where: any = {
      userId: session.user.id,
    };

    if (propertyId) {
      where.propertyId = propertyId;
    }

    const alertRules = await prisma.alertRule.findMany({
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
    });

    return NextResponse.json({ alertRules });
  } catch (error: any) {
    console.error("Error fetching alert rules:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch alert rules" },
      { status: 500 }
    );
  }
}

// POST - Create a new alert rule
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, name, type, config, notifyEmail, notifyApp } = body;

    if (!name || !type || !config) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify property ownership if propertyId is provided
    if (propertyId) {
      const property = await prisma.property.findFirst({
        where: {
          id: propertyId,
          userId: session.user.id,
        },
      });

      if (!property) {
        return NextResponse.json(
          { error: "Property not found" },
          { status: 404 }
        );
      }
    }

    const alertRule = await prisma.alertRule.create({
      data: {
        userId: session.user.id,
        propertyId: propertyId || null,
        name,
        type,
        config,
        notifyEmail: notifyEmail ?? true,
        notifyApp: notifyApp ?? true,
      },
      include: {
        property: {
          select: {
            siteUrl: true,
            displayName: true,
          },
        },
      },
    });

    return NextResponse.json({ alertRule }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating alert rule:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create alert rule" },
      { status: 500 }
    );
  }
}
