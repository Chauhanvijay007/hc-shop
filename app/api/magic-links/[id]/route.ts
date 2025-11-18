import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get a magic link
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const magicLink = await prisma.magicLink.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!magicLink) {
      return NextResponse.json(
        { error: "Magic link not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ magicLink });
  } catch (error: any) {
    console.error("Error fetching magic link:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch magic link" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a magic link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const magicLink = await prisma.magicLink.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!magicLink) {
      return NextResponse.json(
        { error: "Magic link not found" },
        { status: 404 }
      );
    }

    await prisma.magicLink.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting magic link:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete magic link" },
      { status: 500 }
    );
  }
}
