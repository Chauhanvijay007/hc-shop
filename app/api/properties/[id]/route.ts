import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const property = await prisma.property.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    // Get stats for the last 30 days
    const thirtyDaysAgo = subDays(new Date(), 30);

    const stats = await prisma.analyticsData.aggregate({
      where: {
        propertyId: params.id,
        date: {
          gte: thirtyDaysAgo,
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

    return NextResponse.json({
      property,
      stats: {
        clicks: stats._sum.clicks || 0,
        impressions: stats._sum.impressions || 0,
        ctr: stats._avg.ctr || 0,
        position: stats._avg.position || 0,
      },
    });
  } catch (error: any) {
    console.error("Error fetching property:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch property" },
      { status: 500 }
    );
  }
}
