import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all content groups for a property
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    if (!propertyId) {
      return NextResponse.json(
        { error: "propertyId is required" },
        { status: 400 }
      );
    }

    // Verify property belongs to user
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        userId: session.user.id,
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found or access denied" },
        { status: 404 }
      );
    }

    const contentGroups = await prisma.contentGroup.findMany({
      where: {
        propertyId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ contentGroups });
  } catch (error: any) {
    console.error("Error fetching content groups:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch content groups" },
      { status: 500 }
    );
  }
}

// POST - Create a new content group
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, name, description, color, conditions } = body;

    if (!propertyId || !name || !conditions) {
      return NextResponse.json(
        { error: "propertyId, name, and conditions are required" },
        { status: 400 }
      );
    }

    // Verify property belongs to user
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        userId: session.user.id,
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found or access denied" },
        { status: 404 }
      );
    }

    const contentGroup = await prisma.contentGroup.create({
      data: {
        userId: session.user.id,
        propertyId,
        name,
        description,
        color: color || "#3b82f6",
        conditions,
      },
    });

    return NextResponse.json({ contentGroup }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating content group:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create content group" },
      { status: 500 }
    );
  }
}
