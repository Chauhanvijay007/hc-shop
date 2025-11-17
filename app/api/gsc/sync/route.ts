import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGSCServiceForUser } from "@/services/gsc.service";
import { prisma } from "@/lib/prisma";
import { subDays, format } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, siteUrl, days = 30 } = body;

    if (!propertyId || !siteUrl) {
      return NextResponse.json(
        { error: "propertyId and siteUrl are required" },
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

    const gscService = await getGSCServiceForUser(session.user.id);

    // Calculate date range (GSC data has ~3 days delay)
    const endDate = format(subDays(new Date(), 3), "yyyy-MM-dd");
    const startDate = format(subDays(new Date(), days + 3), "yyyy-MM-dd");

    // Sync data
    const result = await gscService.syncToDatabase(
      propertyId,
      siteUrl,
      startDate,
      endDate
    );

    return NextResponse.json({
      success: true,
      message: `Synced ${result.recordCount} records`,
      startDate,
      endDate,
    });
  } catch (error: any) {
    console.error("Error syncing data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync data" },
      { status: 500 }
    );
  }
}
