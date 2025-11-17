import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const days = parseInt(searchParams.get("days") || "30");
    const device = searchParams.get("device") || "all";
    const country = searchParams.get("country") || "all";

    if (!propertyId) {
      return NextResponse.json(
        { error: "propertyId is required" },
        { status: 400 }
      );
    }

    // Verify property belongs to user
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        userId: session.user.id,
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found or access denied" },
        { status: 404 }
      );
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    // Build where clause
    const where: any = {
      propertyId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (device !== "all") {
      where.device = device;
    }

    if (country !== "all") {
      where.country = country;
    }

    // Fetch daily snapshots with aggregations
    const snapshots = await prisma.dailySnapshot.findMany({
      where: {
        propertyId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    // If filters are applied, need to aggregate from raw data
    if (device !== "all" || country !== "all") {
      const rawData = await prisma.analyticsData.findMany({
        where,
        select: {
          date: true,
          clicks: true,
          impressions: true,
          ctr: true,
          position: true,
        },
      });

      // Group by date
      const grouped = rawData.reduce((acc: any, row) => {
        const dateKey = format(new Date(row.date), "yyyy-MM-dd");
        if (!acc[dateKey]) {
          acc[dateKey] = {
            date: dateKey,
            clicks: 0,
            impressions: 0,
            ctrSum: 0,
            positionSum: 0,
            count: 0,
          };
        }
        acc[dateKey].clicks += row.clicks;
        acc[dateKey].impressions += row.impressions;
        acc[dateKey].ctrSum += row.ctr;
        acc[dateKey].positionSum += row.position;
        acc[dateKey].count += 1;
        return acc;
      }, {});

      const aggregated = Object.values(grouped).map((day: any) => ({
        date: day.date,
        clicks: day.clicks,
        impressions: day.impressions,
        ctr: day.count > 0 ? (day.clicks / day.impressions) * 100 : 0,
        position: day.count > 0 ? day.positionSum / day.count : 0,
      }));

      return NextResponse.json({ data: aggregated });
    }

    // Return snapshots data
    const data = snapshots.map((snapshot) => ({
      date: format(new Date(snapshot.date), "yyyy-MM-dd"),
      clicks: snapshot.totalClicks,
      impressions: snapshot.totalImpressions,
      ctr: snapshot.avgCtr * 100,
      position: snapshot.avgPosition,
    }));

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Error fetching timeline data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch timeline data" },
      { status: 500 }
    );
  }
}
