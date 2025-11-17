import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get a single content group
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentGroup = await prisma.contentGroup.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!contentGroup) {
      return NextResponse.json(
        { error: "Content group not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ contentGroup });
  } catch (error: any) {
    console.error("Error fetching content group:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch content group" },
      { status: 500 }
    );
  }
}

// PUT - Update a content group
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
    const { name, description, color, conditions } = body;

    // Verify ownership
    const existing = await prisma.contentGroup.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Content group not found" },
        { status: 404 }
      );
    }

    const contentGroup = await prisma.contentGroup.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        description,
        color,
        conditions,
      },
    });

    return NextResponse.json({ contentGroup });
  } catch (error: any) {
    console.error("Error updating content group:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update content group" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a content group
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
    const existing = await prisma.contentGroup.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Content group not found" },
        { status: 404 }
      );
    }

    await prisma.contentGroup.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting content group:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete content group" },
      { status: 500 }
    );
  }
}
