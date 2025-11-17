import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT - Update alert (mark as read, mute, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isRead, isMuted } = body;

    // Verify ownership
    const existing = await prisma.alert.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Alert not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (typeof isRead === "boolean") updateData.isRead = isRead;
    if (typeof isMuted === "boolean") updateData.isMuted = isMuted;

    const alert = await prisma.alert.update({
      where: { id: id },
      data: updateData,
    });

    return NextResponse.json({ alert });
  } catch (error: any) {
    console.error("Error updating alert:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update alert" },
      { status: 500 }
    );
  }
}

// DELETE - Delete an alert
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.alert.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Alert not found" },
        { status: 404 }
      );
    }

    await prisma.alert.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting alert:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete alert" },
      { status: 500 }
    );
  }
}
