import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all annotations for a property
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!propertyId) {
      return NextResponse.json(
        { error: "propertyId is required" },
        { status: 400 }
      );
    }

    // Verify property access
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

    const where: any = {
      propertyId,
    };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const annotations = await prisma.annotation.findMany({
      where,
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json({ annotations });
  } catch (error: any) {
    console.error("Error fetching annotations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch annotations" },
      { status: 500 }
    );
  }
}

// POST - Create a new annotation
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, date, title, description, type, isShared } = body;

    if (!propertyId || !date || !title) {
      return NextResponse.json(
        { error: "propertyId, date, and title are required" },
        { status: 400 }
      );
    }

    // Verify property access
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

    const annotation = await prisma.annotation.create({
      data: {
        userId: session.user.id,
        propertyId,
        date: new Date(date),
        title,
        description,
        type: type || "custom",
        isShared: isShared || false,
      },
    });

    return NextResponse.json({ annotation }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating annotation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create annotation" },
      { status: 500 }
    );
  }
}
