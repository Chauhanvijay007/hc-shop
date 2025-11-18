import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT - Update team member role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json(
        { error: "Role is required" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["admin", "editor", "viewer", "client"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Get the team member
    const teamMember = await prisma.teamMember.findUnique({
      where: { id },
      include: {
        property: true,
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    // Check if user is property owner or admin
    const hasPermission = await prisma.property.findFirst({
      where: {
        id: teamMember.propertyId,
        OR: [
          { userId: session.user.id },
          {
            teamMembers: {
              some: {
                userId: session.user.id,
                role: "admin",
              },
            },
          },
        ],
      },
    });

    if (!hasPermission) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Update role
    const updated = await prisma.teamMember.update({
      where: { id },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ teamMember: updated });
  } catch (error: any) {
    console.error("Error updating team member:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update team member" },
      { status: 500 }
    );
  }
}

// DELETE - Remove team member
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

    // Get the team member
    const teamMember = await prisma.teamMember.findUnique({
      where: { id },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    // Check if user is property owner or admin
    const hasPermission = await prisma.property.findFirst({
      where: {
        id: teamMember.propertyId,
        OR: [
          { userId: session.user.id },
          {
            teamMembers: {
              some: {
                userId: session.user.id,
                role: "admin",
              },
            },
          },
        ],
      },
    });

    if (!hasPermission) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Delete team member
    await prisma.teamMember.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error removing team member:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove team member" },
      { status: 500 }
    );
  }
}
