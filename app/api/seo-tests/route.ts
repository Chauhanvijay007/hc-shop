import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

// GET - List all SEO tests for user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const status = searchParams.get("status");

    const where: any = {
      userId: session.user.id,
    };

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (status) {
      where.status = status;
    }

    const seoTests = await prisma.seoTest.findMany({
      where,
      include: {
        property: {
          select: {
            siteUrl: true,
            displayName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ seoTests });
  } catch (error: any) {
    console.error("Error fetching SEO tests:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch SEO tests" },
      { status: 500 }
    );
  }
}

// POST - Create a new SEO test
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      propertyId,
      name,
      startDate,
      testPages,
      controlPages,
      testType,
    } = body;

    if (!propertyId || !name || !startDate || !testType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify property ownership
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

    // Get baseline metrics for test and control pages
    const baselineStartDate = subDays(new Date(startDate), 30);
    const baselineEndDate = subDays(new Date(startDate), 1);

    const testPagesMetrics = await prisma.analyticsData.groupBy({
      by: ["page"],
      where: {
        propertyId,
        page: { in: testPages || [] },
        date: {
          gte: baselineStartDate,
          lte: baselineEndDate,
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

    const controlPagesMetrics = await prisma.analyticsData.groupBy({
      by: ["page"],
      where: {
        propertyId,
        page: { in: controlPages || [] },
        date: {
          gte: baselineStartDate,
          lte: baselineEndDate,
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

    const seoTest = await prisma.seoTest.create({
      data: {
        userId: session.user.id,
        propertyId,
        name,
        startDate: new Date(startDate),
        testPages: testPages || [],
        controlPages: controlPages || [],
        testType,
        status: "running",
        metrics: {
          baseline: {
            testPages: testPagesMetrics,
            controlPages: controlPagesMetrics,
            period: {
              start: baselineStartDate.toISOString(),
              end: baselineEndDate.toISOString(),
            },
          },
        },
      },
      include: {
        property: {
          select: {
            siteUrl: true,
            displayName: true,
          },
        },
      },
    });

    return NextResponse.json({ seoTest }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating SEO test:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create SEO test" },
      { status: 500 }
    );
  }
}
