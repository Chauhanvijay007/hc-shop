import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

// GET - Get a single SEO test with results
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

    const seoTest = await prisma.seoTest.findFirst({
      where: {
        id: id,
        userId: session.user.id,
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

    if (!seoTest) {
      return NextResponse.json(
        { error: "SEO test not found" },
        { status: 404 }
      );
    }

    // If test is still running, calculate current results
    if (seoTest.status === "running") {
      const currentTestMetrics = await prisma.analyticsData.groupBy({
        by: ["page"],
        where: {
          propertyId: seoTest.propertyId,
          page: { in: seoTest.testPages },
          date: {
            gte: seoTest.startDate,
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

      const currentControlMetrics = await prisma.analyticsData.groupBy({
        by: ["page"],
        where: {
          propertyId: seoTest.propertyId,
          page: { in: seoTest.controlPages },
          date: {
            gte: seoTest.startDate,
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

      const results = {
        current: {
          testPages: currentTestMetrics,
          controlPages: currentControlMetrics,
          period: {
            start: seoTest.startDate.toISOString(),
            end: new Date().toISOString(),
          },
        },
      };

      return NextResponse.json({
        seoTest: {
          ...seoTest,
          results,
        }
      });
    }

    return NextResponse.json({ seoTest });
  } catch (error: any) {
    console.error("Error fetching SEO test:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch SEO test" },
      { status: 500 }
    );
  }
}

// PUT - Update SEO test (e.g., complete the test)
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
    const { status, endDate } = body;

    // Verify ownership
    const existing = await prisma.seoTest.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "SEO test not found" },
        { status: 404 }
      );
    }

    // If completing the test, calculate final results
    let updateData: any = {};

    if (status === "completed" && endDate) {
      const finalTestMetrics = await prisma.analyticsData.groupBy({
        by: ["page"],
        where: {
          propertyId: existing.propertyId,
          page: { in: existing.testPages },
          date: {
            gte: existing.startDate,
            lte: new Date(endDate),
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

      const finalControlMetrics = await prisma.analyticsData.groupBy({
        by: ["page"],
        where: {
          propertyId: existing.propertyId,
          page: { in: existing.controlPages },
          date: {
            gte: existing.startDate,
            lte: new Date(endDate),
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

      updateData = {
        status: "completed",
        endDate: new Date(endDate),
        results: {
          final: {
            testPages: finalTestMetrics,
            controlPages: finalControlMetrics,
            period: {
              start: existing.startDate.toISOString(),
              end: new Date(endDate).toISOString(),
            },
          },
        },
      };
    } else {
      updateData = { status };
    }

    const seoTest = await prisma.seoTest.update({
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

    return NextResponse.json({ seoTest });
  } catch (error: any) {
    console.error("Error updating SEO test:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update SEO test" },
      { status: 500 }
    );
  }
}

// DELETE - Delete an SEO test
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
    const existing = await prisma.seoTest.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "SEO test not found" },
        { status: 404 }
      );
    }

    await prisma.seoTest.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting SEO test:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete SEO test" },
      { status: 500 }
    );
  }
}
