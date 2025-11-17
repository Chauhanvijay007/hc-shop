import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all reports for user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reports = await prisma.report.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ reports });
  } catch (error: any) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

// POST - Create a new report
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, type, config, schedule, recipients, format } = body;

    if (!name || !type || !config) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Calculate nextRun if scheduled
    let nextRun = null;
    if (schedule && schedule !== "manual") {
      const now = new Date();
      switch (schedule) {
        case "daily":
          nextRun = new Date(now.setDate(now.getDate() + 1));
          break;
        case "weekly":
          nextRun = new Date(now.setDate(now.getDate() + 7));
          break;
        case "monthly":
          nextRun = new Date(now.setMonth(now.getMonth() + 1));
          break;
      }
    }

    const report = await prisma.report.create({
      data: {
        userId: session.user.id,
        name,
        description,
        type,
        config,
        schedule: schedule || "manual",
        nextRun,
        recipients: recipients || [],
        format: format || "pdf",
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create report" },
      { status: 500 }
    );
  }
}
