import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGSCServiceForUser } from "@/services/gsc.service";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const gscService = await getGSCServiceForUser(session.user.id);
    const properties = await gscService.getProperties();

    return NextResponse.json({ properties });
  } catch (error: any) {
    console.error("Error fetching properties:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch properties" },
      { status: 500 }
    );
  }
}
