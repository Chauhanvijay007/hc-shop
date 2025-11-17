import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncQueue } from "@/lib/sync-queue";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;
    const job = syncQueue.getJob(jobId);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify user owns this job
    if (job.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({ job });
  } catch (error: any) {
    console.error("Error fetching sync status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch sync status" },
      { status: 500 }
    );
  }
}
