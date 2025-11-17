import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get a single report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const report = await prisma.report.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ report });
  } catch (error: any) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch report" },
      { status: 500 }
    );
  }
}

// PUT - Update a report
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
    const { name, description, config, schedule, recipients, format, isEnabled } = body;

    // Verify ownership
    const existing = await prisma.report.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (config) updateData.config = config;
    if (schedule) updateData.schedule = schedule;
    if (recipients) updateData.recipients = recipients;
    if (format) updateData.format = format;
    if (typeof isEnabled === "boolean") updateData.isEnabled = isEnabled;

    const report = await prisma.report.update({
      where: { id: id },
      data: updateData,
    });

    return NextResponse.json({ report });
  } catch (error: any) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update report" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a report
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
    const existing = await prisma.report.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    await prisma.report.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete report" },
      { status: 500 }
    );
  }
}
