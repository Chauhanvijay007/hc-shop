import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT - Update an annotation
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
    const { date, title, description, type, isShared } = body;

    // Verify ownership
    const existing = await prisma.annotation.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Annotation not found" },
        { status: 404 }
      );
    }

    const annotation = await prisma.annotation.update({
      where: {
        id: params.id,
      },
      data: {
        date: date ? new Date(date) : undefined,
        title,
        description,
        type,
        isShared,
      },
    });

    return NextResponse.json({ annotation });
  } catch (error: any) {
    console.error("Error updating annotation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update annotation" },
      { status: 500 }
    );
  }
}

// DELETE - Delete an annotation
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
    const existing = await prisma.annotation.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Annotation not found" },
        { status: 404 }
      );
    }

    await prisma.annotation.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting annotation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete annotation" },
      { status: 500 }
    );
  }
}
