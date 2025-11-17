import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    const days = parseInt(searchParams.get("days") || "30");

    if (!propertyId) {
      return NextResponse.json(
        { error: "propertyId is required" },
        { status: 400 }
      );
    }

    // Get property with branded keywords
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

    const brandedKeywords = property.brandedKeywords;
    const startDate = subDays(new Date(), days);

    // Get branded queries stats
    const brandedStats = await prisma.analyticsData.aggregate({
      where: {
        propertyId,
        date: { gte: startDate },
        query: {
          in: brandedKeywords,
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

    // Get non-branded queries stats
    const nonBrandedStats = await prisma.analyticsData.aggregate({
      where: {
        propertyId,
        date: { gte: startDate },
        query: {
          notIn: brandedKeywords.length > 0 ? brandedKeywords : ["__none__"],
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

    // Get branded queries over time
    const brandedTimeline = await prisma.$queryRaw`
      SELECT
        DATE(date) as date,
        SUM(clicks) as clicks,
        SUM(impressions) as impressions,
        AVG(ctr) as ctr,
        AVG(position) as position
      FROM "AnalyticsData"
      WHERE "propertyId" = ${propertyId}
        AND date >= ${startDate}
        AND query = ANY(${brandedKeywords}::text[])
      GROUP BY DATE(date)
      ORDER BY DATE(date) ASC
    `;

    // Get non-branded queries over time
    const nonBrandedTimeline = await prisma.$queryRaw`
      SELECT
        DATE(date) as date,
        SUM(clicks) as clicks,
        SUM(impressions) as impressions,
        AVG(ctr) as ctr,
        AVG(position) as position
      FROM "AnalyticsData"
      WHERE "propertyId" = ${propertyId}
        AND date >= ${startDate}
        AND query != ALL(${brandedKeywords.length > 0 ? brandedKeywords : ["__none__"]}::text[])
      GROUP BY DATE(date)
      ORDER BY DATE(date) ASC
    `;

    return NextResponse.json({
      branded: {
        clicks: brandedStats._sum.clicks || 0,
        impressions: brandedStats._sum.impressions || 0,
        ctr: brandedStats._avg.ctr || 0,
        position: brandedStats._avg.position || 0,
        timeline: brandedTimeline,
      },
      nonBranded: {
        clicks: nonBrandedStats._sum.clicks || 0,
        impressions: nonBrandedStats._sum.impressions || 0,
        ctr: nonBrandedStats._avg.ctr || 0,
        position: nonBrandedStats._avg.position || 0,
        timeline: nonBrandedTimeline,
      },
      brandedKeywords,
    });
  } catch (error: any) {
    console.error("Error fetching branded analytics:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch branded analytics" },
      { status: 500 }
    );
  }
}
