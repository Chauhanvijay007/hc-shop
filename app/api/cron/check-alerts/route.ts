import { NextRequest, NextResponse } from "next/server";
import { checkAlertRules } from "@/lib/alert-service";

/**
 * Cron job to check alert rules and create alerts
 *
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-alerts",
 *     "schedule": "0 0-23/6 * * *"
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

    console.log("Starting alert rule checks...");

    const alertsCreated = await checkAlertRules();

    console.log(`Alert check completed: ${alertsCreated} alerts created`);

    return NextResponse.json({
      alertsCreated,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Alert check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
