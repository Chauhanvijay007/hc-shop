import { prisma } from "@/lib/prisma";
import { subDays, format } from "date-fns";

interface AlertCheck {
  userId: string;
  propertyId?: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  triggeredBy: any;
}

/**
 * Check for traffic drops/spikes
 */
async function checkTrafficAlerts(rule: any, property: any): Promise<AlertCheck | null> {
  const config = rule.config as any;
  const threshold = config.threshold || 20; // % change
  const days = config.days || 7;

  // Get recent period
  const recentStart = subDays(new Date(), days);
  const recentEnd = new Date();

  // Get comparison period
  const comparisonStart = subDays(recentStart, days);
  const comparisonEnd = recentStart;

  const recentData = await prisma.dailySnapshot.aggregate({
    where: {
      propertyId: property.id,
      date: {
        gte: recentStart,
        lte: recentEnd,
      },
    },
    _sum: {
      totalClicks: true,
      totalImpressions: true,
    },
  });

  const comparisonData = await prisma.dailySnapshot.aggregate({
    where: {
      propertyId: property.id,
      date: {
        gte: comparisonStart,
        lt: comparisonEnd,
      },
    },
    _sum: {
      totalClicks: true,
      totalImpressions: true,
    },
  });

  const recentClicks = recentData._sum.totalClicks || 0;
  const comparisonClicks = comparisonData._sum.totalClicks || 0;

  if (comparisonClicks === 0) return null;

  const percentChange = ((recentClicks - comparisonClicks) / comparisonClicks) * 100;

  if (rule.type === "traffic_drop" && percentChange <= -threshold) {
    return {
      userId: rule.userId,
      propertyId: property.id,
      type: "traffic_drop",
      severity: percentChange <= -(threshold * 2) ? "high" : "medium",
      title: `Traffic Drop Alert: ${property.displayName || property.siteUrl}`,
      message: `Traffic has dropped by ${Math.abs(percentChange).toFixed(1)}% in the last ${days} days (${comparisonClicks} → ${recentClicks} clicks)`,
      triggeredBy: {
        recentClicks,
        comparisonClicks,
        percentChange,
        period: days,
      },
    };
  }

  if (rule.type === "traffic_spike" && percentChange >= threshold) {
    return {
      userId: rule.userId,
      propertyId: property.id,
      type: "traffic_spike",
      severity: "low",
      title: `Traffic Spike Alert: ${property.displayName || property.siteUrl}`,
      message: `Traffic has increased by ${percentChange.toFixed(1)}% in the last ${days} days (${comparisonClicks} → ${recentClicks} clicks)`,
      triggeredBy: {
        recentClicks,
        comparisonClicks,
        percentChange,
        period: days,
      },
    };
  }

  return null;
}

/**
 * Check for CTR drops
 */
async function checkCTRAlerts(rule: any, property: any): Promise<AlertCheck | null> {
  const config = rule.config as any;
  const threshold = config.threshold || 15; // % change
  const days = config.days || 7;

  const recentStart = subDays(new Date(), days);
  const recentEnd = new Date();
  const comparisonStart = subDays(recentStart, days);
  const comparisonEnd = recentStart;

  const recentData = await prisma.dailySnapshot.aggregate({
    where: {
      propertyId: property.id,
      date: {
        gte: recentStart,
        lte: recentEnd,
      },
    },
    _avg: {
      avgCtr: true,
    },
  });

  const comparisonData = await prisma.dailySnapshot.aggregate({
    where: {
      propertyId: property.id,
      date: {
        gte: comparisonStart,
        lt: comparisonEnd,
      },
    },
    _avg: {
      avgCtr: true,
    },
  });

  const recentCTR = recentData._avg.avgCtr || 0;
  const comparisonCTR = comparisonData._avg.avgCtr || 0;

  if (comparisonCTR === 0) return null;

  const percentChange = ((recentCTR - comparisonCTR) / comparisonCTR) * 100;

  if (percentChange <= -threshold) {
    return {
      userId: rule.userId,
      propertyId: property.id,
      type: "ctr_drop",
      severity: percentChange <= -(threshold * 2) ? "high" : "medium",
      title: `CTR Drop Alert: ${property.displayName || property.siteUrl}`,
      message: `Average CTR has dropped by ${Math.abs(percentChange).toFixed(1)}% in the last ${days} days (${(comparisonCTR * 100).toFixed(2)}% → ${(recentCTR * 100).toFixed(2)}%)`,
      triggeredBy: {
        recentCTR: recentCTR * 100,
        comparisonCTR: comparisonCTR * 100,
        percentChange,
        period: days,
      },
    };
  }

  return null;
}

/**
 * Check for rank changes
 */
async function checkRankAlerts(rule: any, property: any): Promise<AlertCheck | null> {
  const config = rule.config as any;
  const threshold = config.threshold || 10; // position change
  const days = config.days || 7;

  const recentStart = subDays(new Date(), days);
  const recentEnd = new Date();
  const comparisonStart = subDays(recentStart, days);
  const comparisonEnd = recentStart;

  // Get top queries
  const topQueries = await prisma.analyticsData.groupBy({
    by: ["query"],
    where: {
      propertyId: property.id,
      date: {
        gte: comparisonStart,
      },
    },
    _sum: {
      impressions: true,
    },
    orderBy: {
      _sum: {
        impressions: "desc",
      },
    },
    take: 50,
  });

  const alerts: AlertCheck[] = [];

  for (const queryData of topQueries) {
    const query = queryData.query;

    const recentPosition = await prisma.analyticsData.aggregate({
      where: {
        propertyId: property.id,
        query,
        date: {
          gte: recentStart,
          lte: recentEnd,
        },
      },
      _avg: {
        position: true,
      },
    });

    const comparisonPosition = await prisma.analyticsData.aggregate({
      where: {
        propertyId: property.id,
        query,
        date: {
          gte: comparisonStart,
          lt: comparisonEnd,
        },
      },
      _avg: {
        position: true,
      },
    });

    const recentPos = recentPosition._avg.position || 0;
    const comparisonPos = comparisonPosition._avg.position || 0;

    if (comparisonPos === 0) continue;

    const positionChange = recentPos - comparisonPos;

    if (rule.type === "rank_drop" && positionChange >= threshold) {
      alerts.push({
        userId: rule.userId,
        propertyId: property.id,
        type: "rank_drop",
        severity: positionChange >= threshold * 2 ? "high" : "medium",
        title: `Rank Drop Alert: "${query}"`,
        message: `Position dropped from ${comparisonPos.toFixed(1)} to ${recentPos.toFixed(1)} (${positionChange.toFixed(1)} positions)`,
        triggeredBy: {
          query,
          recentPosition: recentPos,
          comparisonPosition: comparisonPos,
          positionChange,
          period: days,
        },
      });
    }

    if (rule.type === "rank_gain" && positionChange <= -threshold) {
      alerts.push({
        userId: rule.userId,
        propertyId: property.id,
        type: "rank_gain",
        severity: "low",
        title: `Rank Improvement: "${query}"`,
        message: `Position improved from ${comparisonPos.toFixed(1)} to ${recentPos.toFixed(1)} (${Math.abs(positionChange).toFixed(1)} positions)`,
        triggeredBy: {
          query,
          recentPosition: recentPos,
          comparisonPosition: comparisonPos,
          positionChange,
          period: days,
        },
      });
    }
  }

  return alerts.length > 0 ? alerts[0] : null; // Return first alert to avoid spam
}

/**
 * Process all alert rules and create alerts
 */
export async function checkAlertRules(): Promise<number> {
  const rules = await prisma.alertRule.findMany({
    where: {
      isEnabled: true,
    },
    include: {
      property: true,
    },
  });

  let alertsCreated = 0;

  for (const rule of rules) {
    try {
      // Skip if property is required but not set
      if (!rule.property && rule.propertyId) {
        continue;
      }

      let alertCheck: AlertCheck | null = null;

      // Check based on rule type
      if (["traffic_drop", "traffic_spike"].includes(rule.type)) {
        alertCheck = await checkTrafficAlerts(rule, rule.property);
      } else if (rule.type === "ctr_drop") {
        alertCheck = await checkCTRAlerts(rule, rule.property);
      } else if (["rank_drop", "rank_gain"].includes(rule.type)) {
        alertCheck = await checkRankAlerts(rule, rule.property);
      }

      // Create alert if conditions met
      if (alertCheck) {
        // Check if similar alert was created recently (avoid duplicates)
        const recentSimilarAlert = await prisma.alert.findFirst({
          where: {
            userId: alertCheck.userId,
            propertyId: alertCheck.propertyId,
            type: alertCheck.type,
            createdAt: {
              gte: subDays(new Date(), 1), // Within last 24 hours
            },
          },
        });

        if (!recentSimilarAlert) {
          await prisma.alert.create({
            data: alertCheck,
          });
          alertsCreated++;
        }
      }
    } catch (error) {
      console.error(`Error checking rule ${rule.id}:`, error);
    }
  }

  return alertsCreated;
}
