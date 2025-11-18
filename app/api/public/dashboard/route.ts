import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays, format } from "date-fns";

// GET - Public dashboard data for magic link
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const days = parseInt(searchParams.get("days") || "30");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Verify token
    const magicLink = await prisma.magicLink.findUnique({
      where: { token },
    });

    if (!magicLink) {
      return NextResponse.json(
        { error: "Invalid link" },
        { status: 404 }
      );
    }

    // Check if expired
    if (magicLink.expiresAt && magicLink.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This link has expired" },
        { status: 410 }
      );
    }

    // Check if max views reached
    if (magicLink.maxViews && magicLink.viewCount >= magicLink.maxViews) {
      return NextResponse.json(
        { error: "This link has reached its view limit" },
        { status: 410 }
      );
    }

    // Get properties
    const properties = await prisma.property.findMany({
      where: {
        id: { in: magicLink.propertyIds },
      },
      select: {
        id: true,
        siteUrl: true,
        displayName: true,
      },
    });

    // Get analytics data for each property
    const startDate = subDays(new Date(), days);
    const endDate = new Date();

    const dashboardData = await Promise.all(
      properties.map(async (property) => {
        // Get daily snapshots
        const dailyData = await prisma.dailySnapshot.findMany({
          where: {
            propertyId: property.id,
            date: {
              gte: startDate,
              lte: endDate,
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

        // Get aggregate metrics
        const aggregateMetrics = await prisma.dailySnapshot.aggregate({
          where: {
            propertyId: property.id,
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          _sum: {
            totalClicks: true,
            totalImpressions: true,
          },
          _avg: {
            avgCtr: true,
            avgPosition: true,
          },
        });

        // Get top queries
        const topQueries = await prisma.analyticsData.groupBy({
          by: ["query"],
          where: {
            propertyId: property.id,
            date: {
              gte: startDate,
              lte: endDate,
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
          take: 10,
        });

        // Get top pages
        const topPages = await prisma.analyticsData.groupBy({
          by: ["page"],
          where: {
            propertyId: property.id,
            date: {
              gte: startDate,
              lte: endDate,
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
          take: 10,
        });

        return {
          property,
          metrics: {
            totalClicks: aggregateMetrics._sum.totalClicks || 0,
            totalImpressions: aggregateMetrics._sum.totalImpressions || 0,
            avgCtr: aggregateMetrics._avg.avgCtr || 0,
            avgPosition: aggregateMetrics._avg.avgPosition || 0,
          },
          dailyData,
          topQueries,
          topPages,
        };
      })
    );

    return NextResponse.json({
      properties: dashboardData,
      period: {
        start: format(startDate, "yyyy-MM-dd"),
        end: format(endDate, "yyyy-MM-dd"),
        days,
      },
    });
  } catch (error: any) {
    console.error("Error fetching public dashboard:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
