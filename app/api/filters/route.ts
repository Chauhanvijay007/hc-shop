import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List all saved filters for user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filters = await prisma.savedFilter.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ filters });
  } catch (error: any) {
    console.error("Error fetching saved filters:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch saved filters" },
      { status: 500 }
    );
  }
}

// POST - Create a new saved filter
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, filterConfig } = body;

    if (!name || !filterConfig) {
      return NextResponse.json(
        { error: "name and filterConfig are required" },
        { status: 400 }
      );
    }

    const savedFilter = await prisma.savedFilter.create({
      data: {
        userId: session.user.id,
        name,
        filterConfig,
      },
    });

    return NextResponse.json({ savedFilter }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating saved filter:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create saved filter" },
      { status: 500 }
    );
  }
}
