import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get a single topic cluster with stats
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const topicCluster = await prisma.topicCluster.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!topicCluster) {
      return NextResponse.json(
        { error: "Topic cluster not found" },
        { status: 404 }
      );
    }

    // Get stats for keywords in this cluster
    const stats = await prisma.analyticsData.aggregate({
      where: {
        propertyId: topicCluster.propertyId,
        query: {
          in: topicCluster.keywords,
        },
      },
      _sum: {
        clicks: true,
        impressions: true,
      },
      _avg: {
        ctr: true,
        position: true,
      },
    });

    return NextResponse.json({
      topicCluster,
      stats: {
        clicks: stats._sum.clicks || 0,
        impressions: stats._sum.impressions || 0,
        avgCtr: stats._avg.ctr || 0,
        avgPosition: stats._avg.position || 0,
      },
    });
  } catch (error: any) {
    console.error("Error fetching topic cluster:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch topic cluster" },
      { status: 500 }
    );
  }
}

// PUT - Update a topic cluster
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, keywords } = body;

    // Verify ownership
    const existing = await prisma.topicCluster.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Topic cluster not found" },
        { status: 404 }
      );
    }

    const topicCluster = await prisma.topicCluster.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        keywords: Array.isArray(keywords) ? keywords : [keywords],
      },
    });

    return NextResponse.json({ topicCluster });
  } catch (error: any) {
    console.error("Error updating topic cluster:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update topic cluster" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a topic cluster
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const existing = await prisma.topicCluster.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Topic cluster not found" },
        { status: 404 }
      );
    }

    await prisma.topicCluster.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting topic cluster:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete topic cluster" },
      { status: 500 }
    );
  }
}
