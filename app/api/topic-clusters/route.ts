import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all topic clusters for a property
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

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

    const topicClusters = await prisma.topicCluster.findMany({
      where: {
        propertyId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ topicClusters });
  } catch (error: any) {
    console.error("Error fetching topic clusters:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch topic clusters" },
      { status: 500 }
    );
  }
}

// POST - Create a new topic cluster
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, name, keywords } = body;

    if (!propertyId || !name || !keywords) {
      return NextResponse.json(
        { error: "propertyId, name, and keywords are required" },
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

    const topicCluster = await prisma.topicCluster.create({
      data: {
        userId: session.user.id,
        propertyId,
        name,
        keywords: Array.isArray(keywords) ? keywords : [keywords],
      },
    });

    return NextResponse.json({ topicCluster }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating topic cluster:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create topic cluster" },
      { status: 500 }
    );
  }
}
