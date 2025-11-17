import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT - Update alert rule
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
    const { name, config, isEnabled, notifyEmail, notifyApp } = body;

    // Verify ownership
    const existing = await prisma.alertRule.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Alert rule not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (config) updateData.config = config;
    if (typeof isEnabled === "boolean") updateData.isEnabled = isEnabled;
    if (typeof notifyEmail === "boolean") updateData.notifyEmail = notifyEmail;
    if (typeof notifyApp === "boolean") updateData.notifyApp = notifyApp;

    const alertRule = await prisma.alertRule.update({
      where: { id: id },
      data: updateData,
      include: {
        property: {
          select: {
            siteUrl: true,
            displayName: true,
          },
        },
      },
    });

    return NextResponse.json({ alertRule });
  } catch (error: any) {
    console.error("Error updating alert rule:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update alert rule" },
      { status: 500 }
    );
  }
}

// DELETE - Delete an alert rule
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
    const existing = await prisma.alertRule.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Alert rule not found" },
        { status: 404 }
      );
    }

    await prisma.alertRule.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting alert rule:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete alert rule" },
      { status: 500 }
    );
  }
}
