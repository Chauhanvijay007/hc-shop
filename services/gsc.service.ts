import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

interface SearchAnalyticsParams {
  siteUrl: string;
  startDate: string;
  endDate: string;
  dimensions?: string[];
  rowLimit?: number;
  startRow?: number;
  dimensionFilterGroups?: any[];
}

interface SearchAnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export class GSCService {
  private oauth2Client;

  constructor(accessToken: string, refreshToken?: string) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
    );

    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  /**
   * Get list of GSC properties for the authenticated user
   */
  async getProperties() {
    const webmasters = google.webmasters({ version: "v3", auth: this.oauth2Client });

    try {
      const response = await webmasters.sites.list();
      return response.data.siteEntry || [];
    } catch (error) {
      console.error("Error fetching GSC properties:", error);
      throw new Error("Failed to fetch GSC properties");
    }
  }

  /**
   * Get search analytics data from GSC
   */
  async getSearchAnalytics(params: SearchAnalyticsParams): Promise<SearchAnalyticsRow[]> {
    const webmasters = google.webmasters({ version: "v3", auth: this.oauth2Client });

    try {
      const response = await webmasters.searchanalytics.query({
        siteUrl: params.siteUrl,
        requestBody: {
          startDate: params.startDate,
          endDate: params.endDate,
          dimensions: params.dimensions || ["page", "query"],
          rowLimit: params.rowLimit || 25000,
          startRow: params.startRow || 0,
          dimensionFilterGroups: params.dimensionFilterGroups || [],
        },
      });

      return response.data.rows || [];
    } catch (error) {
      console.error("Error fetching search analytics:", error);
      throw new Error("Failed to fetch search analytics data");
    }
  }

  /**
   * Batch fetch data - paginate through all results up to 50,000 rows
   */
  async batchFetchData(params: SearchAnalyticsParams): Promise<SearchAnalyticsRow[]> {
    const allRows: SearchAnalyticsRow[] = [];
    const maxRows = 50000;
    const pageSize = 25000;
    let startRow = 0;

    while (startRow < maxRows) {
      const rows = await this.getSearchAnalytics({
        ...params,
        rowLimit: pageSize,
        startRow,
      });

      if (rows.length === 0) break;

      allRows.push(...rows);

      if (rows.length < pageSize) break;

      startRow += pageSize;
    }

    return allRows;
  }

  /**
   * Sync data to database
   */
  async syncToDatabase(
    propertyId: string,
    siteUrl: string,
    startDate: string,
    endDate: string
  ) {
    try {
      // Fetch data with all dimensions
      const data = await this.batchFetchData({
        siteUrl,
        startDate,
        endDate,
        dimensions: ["page", "query", "country", "device", "date"],
      });

      // Transform and insert into database
      const records = data.map((row) => ({
        propertyId,
        date: new Date(row.keys[4]), // date dimension
        page: row.keys[0],
        query: row.keys[1],
        country: row.keys[2],
        device: row.keys[3],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      }));

      // Batch insert (chunk into smaller batches to avoid timeout)
      const chunkSize = 1000;
      for (let i = 0; i < records.length; i += chunkSize) {
        const chunk = records.slice(i, i + chunkSize);
        await prisma.analyticsData.createMany({
          data: chunk,
          skipDuplicates: true,
        });
      }

      // Create daily snapshot
      await this.createDailySnapshot(propertyId, siteUrl, startDate, endDate);

      // Update last synced timestamp
      await prisma.property.update({
        where: { id: propertyId },
        data: { lastSyncedAt: new Date() },
      });

      return { success: true, recordCount: records.length };
    } catch (error) {
      console.error("Error syncing data to database:", error);
      throw new Error("Failed to sync data to database");
    }
  }

  /**
   * Create daily snapshot (aggregated metrics)
   */
  private async createDailySnapshot(
    propertyId: string,
    siteUrl: string,
    startDate: string,
    endDate: string
  ) {
    const data = await this.batchFetchData({
      siteUrl,
      startDate,
      endDate,
      dimensions: ["date"],
    });

    for (const row of data) {
      const date = new Date(row.keys[0]);

      await prisma.dailySnapshot.upsert({
        where: {
          propertyId_date: {
            propertyId,
            date,
          },
        },
        update: {
          totalClicks: row.clicks,
          totalImpressions: row.impressions,
          avgCtr: row.ctr,
          avgPosition: row.position,
        },
        create: {
          propertyId,
          date,
          totalClicks: row.clicks,
          totalImpressions: row.impressions,
          avgCtr: row.ctr,
          avgPosition: row.position,
          uniqueQueries: 0, // Will be calculated separately
          uniquePages: 0, // Will be calculated separately
        },
      });
    }
  }

  /**
   * Get fresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      return credentials.access_token;
    } catch (error) {
      console.error("Error refreshing access token:", error);
      throw new Error("Failed to refresh access token");
    }
  }
}

/**
 * Helper function to get GSC service for a user
 */
export async function getGSCServiceForUser(userId: string): Promise<GSCService> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: "google",
    },
  });

  if (!account || !account.access_token) {
    throw new Error("No Google account connected");
  }

  // Check if token is expired and refresh if needed
  if (account.expires_at && account.expires_at * 1000 < Date.now()) {
    if (account.refresh_token) {
      const newAccessToken = await GSCService.refreshAccessToken(account.refresh_token);

      // Update the access token in database
      await prisma.account.update({
        where: { id: account.id },
        data: { access_token: newAccessToken },
      });

      return new GSCService(newAccessToken, account.refresh_token);
    }
    throw new Error("Token expired and no refresh token available");
  }

  return new GSCService(account.access_token, account.refresh_token || undefined);
}
