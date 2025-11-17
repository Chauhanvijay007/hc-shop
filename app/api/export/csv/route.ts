import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, days = 30, device = "all", country = "all", dataType = "analytics" } = body;

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

    let csvData: string;
    let filename: string;

    if (dataType === "analytics") {
      // Fetch analytics data
      const data = await prisma.analyticsData.findMany({
        where,
        orderBy: [
          { date: "desc" },
          { clicks: "desc" },
        ],
        take: 50000, // Limit to 50k rows
      });

      // Generate CSV
      const headers = ["Date", "Page", "Query", "Country", "Device", "Clicks", "Impressions", "CTR", "Position"];
      const rows = data.map((row) => [
        row.date.toISOString().split("T")[0],
        row.page,
        row.query,
        row.country,
        row.device,
        row.clicks.toString(),
        row.impressions.toString(),
        (row.ctr * 100).toFixed(2),
        row.position.toFixed(2),
      ]);

      csvData = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      filename = `${property.displayName || property.siteUrl}-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    } else {
      // Daily snapshots
      const snapshots = await prisma.dailySnapshot.findMany({
        where: {
          propertyId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          date: "desc",
        },
      });

      const headers = ["Date", "Clicks", "Impressions", "CTR", "Avg Position", "Unique Queries", "Unique Pages"];
      const rows = snapshots.map((row) => [
        row.date.toISOString().split("T")[0],
        row.totalClicks.toString(),
        row.totalImpressions.toString(),
        (row.avgCtr * 100).toFixed(2),
        row.avgPosition.toFixed(2),
        row.uniqueQueries.toString(),
        row.uniquePages.toString(),
      ]);

      csvData = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      filename = `${property.displayName || property.siteUrl}-daily-${new Date().toISOString().split("T")[0]}.csv`;
    }

    // Return CSV as downloadable file
    return new NextResponse(csvData, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Error exporting CSV:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export CSV" },
      { status: 500 }
    );
  }
}
