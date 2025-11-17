import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, subMonths, subYears, format, differenceInDays } from "date-fns";

// GET - Compare analytics between two periods
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const compareType = searchParams.get("compareType") || "previous_period";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!propertyId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required parameters" },
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

    const currentStart = new Date(startDate);
    const currentEnd = new Date(endDate);
    const daysDiff = differenceInDays(currentEnd, currentStart);

    // Calculate comparison period based on compareType
    let comparisonStart: Date;
    let comparisonEnd: Date;

    switch (compareType) {
      case "previous_period":
        comparisonEnd = subDays(currentStart, 1);
        comparisonStart = subDays(comparisonEnd, daysDiff);
        break;
      case "previous_year":
        comparisonStart = subYears(currentStart, 1);
        comparisonEnd = subYears(currentEnd, 1);
        break;
      case "previous_month":
        comparisonStart = subMonths(currentStart, 1);
        comparisonEnd = subMonths(currentEnd, 1);
        break;
      default:
        comparisonEnd = subDays(currentStart, 1);
        comparisonStart = subDays(comparisonEnd, daysDiff);
    }

    // Get current period data
    const currentData = await prisma.dailySnapshot.aggregate({
      where: {
        propertyId,
        date: {
          gte: currentStart,
          lte: currentEnd,
        },
      },
      _sum: {
        totalClicks: true,
        totalImpressions: true,
        uniquePages: true,
      },
      _avg: {
        avgCtr: true,
        avgPosition: true,
      },
    });

    // Get comparison period data
    const comparisonData = await prisma.dailySnapshot.aggregate({
      where: {
        propertyId,
        date: {
          gte: comparisonStart,
          lte: comparisonEnd,
        },
      },
      _sum: {
        totalClicks: true,
        totalImpressions: true,
        uniquePages: true,
      },
      _avg: {
        avgCtr: true,
        avgPosition: true,
      },
    });

    // Get daily breakdown for charts
    const currentDaily = await prisma.dailySnapshot.findMany({
      where: {
        propertyId,
        date: {
          gte: currentStart,
          lte: currentEnd,
        },
      },
      orderBy: {
        date: "asc",
      },
      select: {
        date: true,
        totalClicks: true,
        totalImpressions: true,
        avgCtr: true,
        avgPosition: true,
      },
    });

    const comparisonDaily = await prisma.dailySnapshot.findMany({
      where: {
        propertyId,
        date: {
          gte: comparisonStart,
          lte: comparisonEnd,
        },
      },
      orderBy: {
        date: "asc",
      },
      select: {
        date: true,
        totalClicks: true,
        totalImpressions: true,
        avgCtr: true,
        avgPosition: true,
      },
    });

    // Get top queries comparison
    const currentTopQueries = await prisma.analyticsData.groupBy({
      by: ["query"],
      where: {
        propertyId,
        date: {
          gte: currentStart,
          lte: currentEnd,
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
      orderBy: {
        _sum: {
          clicks: "desc",
        },
      },
      take: 20,
    });

    const comparisonTopQueries = await prisma.analyticsData.groupBy({
      by: ["query"],
      where: {
        propertyId,
        date: {
          gte: comparisonStart,
          lte: comparisonEnd,
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
      orderBy: {
        _sum: {
          clicks: "desc",
        },
      },
      take: 20,
    });

    // Calculate percentage changes
    const calculateChange = (current: number, comparison: number) => {
      if (!comparison) return comparison === current ? 0 : 100;
      return ((current - comparison) / comparison) * 100;
    };

    const currentMetrics = {
      clicks: currentData._sum.totalClicks || 0,
      impressions: currentData._sum.totalImpressions || 0,
      ctr: currentData._avg.avgCtr || 0,
      position: currentData._avg.avgPosition || 0,
      uniquePages: currentData._sum.uniquePages || 0,
    };

    const comparisonMetrics = {
      clicks: comparisonData._sum.totalClicks || 0,
      impressions: comparisonData._sum.totalImpressions || 0,
      ctr: comparisonData._avg.avgCtr || 0,
      position: comparisonData._avg.avgPosition || 0,
      uniquePages: comparisonData._sum.uniquePages || 0,
    };

    const changes = {
      clicks: calculateChange(currentMetrics.clicks, comparisonMetrics.clicks),
      impressions: calculateChange(currentMetrics.impressions, comparisonMetrics.impressions),
      ctr: calculateChange(currentMetrics.ctr, comparisonMetrics.ctr),
      position: calculateChange(currentMetrics.position, comparisonMetrics.position),
      uniquePages: calculateChange(currentMetrics.uniquePages, comparisonMetrics.uniquePages),
    };

    return NextResponse.json({
      current: {
        period: {
          start: format(currentStart, "yyyy-MM-dd"),
          end: format(currentEnd, "yyyy-MM-dd"),
        },
        metrics: currentMetrics,
        daily: currentDaily,
        topQueries: currentTopQueries,
      },
      comparison: {
        period: {
          start: format(comparisonStart, "yyyy-MM-dd"),
          end: format(comparisonEnd, "yyyy-MM-dd"),
        },
        metrics: comparisonMetrics,
        daily: comparisonDaily,
        topQueries: comparisonTopQueries,
      },
      changes,
      compareType,
    });
  } catch (error: any) {
    console.error("Error fetching comparison data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch comparison data" },
      { status: 500 }
    );
  }
}
