/**
 * Simple in-memory queue for sync jobs
 * For production, consider using Bull/BullMQ with Redis
 */

interface SyncJob {
  id: string;
  propertyId: string;
  siteUrl: string;
  userId: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

class SyncQueue {
  private jobs: Map<string, SyncJob> = new Map();
  private running: Set<string> = new Set();
  private maxConcurrent = 3;

  addJob(propertyId: string, siteUrl: string, userId: string): string {
    const id = `${propertyId}-${Date.now()}`;
    const job: SyncJob = {
      id,
      propertyId,
      siteUrl,
      userId,
      status: "pending",
      progress: 0,
      createdAt: new Date(),
    };

    this.jobs.set(id, job);
    this.processQueue();
    return id;
  }

  getJob(id: string): SyncJob | undefined {
    return this.jobs.get(id);
  }

  getJobsByProperty(propertyId: string): SyncJob[] {
    return Array.from(this.jobs.values()).filter(
      (job) => job.propertyId === propertyId
    );
  }

  updateJob(id: string, updates: Partial<SyncJob>) {
    const job = this.jobs.get(id);
    if (job) {
      Object.assign(job, updates);
    }
  }

  private async processQueue() {
    if (this.running.size >= this.maxConcurrent) {
      return;
    }

    const pendingJob = Array.from(this.jobs.values()).find(
      (job) => job.status === "pending"
    );

    if (!pendingJob) {
      return;
    }

    this.running.add(pendingJob.id);
    this.updateJob(pendingJob.id, {
      status: "running",
      startedAt: new Date(),
    });

    // Note: Actual sync processing happens in the API route
    // This is just a queue manager for tracking status
  }

  completeJob(id: string, error?: string) {
    this.running.delete(id);
    this.updateJob(id, {
      status: error ? "failed" : "completed",
      progress: 100,
      error,
      completedAt: new Date(),
    });

    // Process next job
    this.processQueue();

    // Clean up old jobs (keep last 100)
    if (this.jobs.size > 100) {
      const sorted = Array.from(this.jobs.values()).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      sorted.slice(100).forEach((job) => this.jobs.delete(job.id));
    }
  }

  getAllJobs(): SyncJob[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
}

// Singleton instance
export const syncQueue = new SyncQueue();
