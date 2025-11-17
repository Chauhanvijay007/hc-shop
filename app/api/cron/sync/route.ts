import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGSCServiceForUser } from "@/services/gsc.service";
import { subDays, format } from "date-fns";

/**
 * Background job to sync all properties
 * This endpoint should be called by a cron service (e.g., Vercel Cron, GitHub Actions)
 *
 * Usage with Vercel Cron:
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/sync",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (for security)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting automated data sync...");

    // Get all properties that need syncing
    const properties = await prisma.property.findMany({
      where: {
        isHidden: false,
      },
      include: {
        user: {
          include: {
            accounts: {
              where: {
                provider: "google",
              },
            },
          },
        },
      },
    });

    const results = {
      total: properties.length,
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const property of properties) {
      try {
        console.log(`Syncing property: ${property.siteUrl}`);

        // Get GSC service for this user
        const account = property.user.accounts[0];
        if (!account || !account.access_token) {
          throw new Error("No Google account connected");
        }

        const gscService = await getGSCServiceForUser(property.userId);

        // Sync last 7 days of data (to catch any updates)
        const endDate = format(subDays(new Date(), 3), "yyyy-MM-dd"); // GSC has ~3 days delay
        const startDate = format(subDays(new Date(), 10), "yyyy-MM-dd");

        await gscService.syncToDatabase(
          property.id,
          property.siteUrl,
          startDate,
          endDate
        );

        results.success++;
        console.log(`Successfully synced: ${property.siteUrl}`);
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${property.siteUrl}: ${error.message}`);
        console.error(`Failed to sync ${property.siteUrl}:`, error);
      }
    }

    console.log("Sync completed:", results);

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Cron sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Sync failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Allow manual trigger via POST
export async function POST(request: NextRequest) {
  return GET(request);
}
