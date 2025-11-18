import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - List team members for a property
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    if (!propertyId) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 }
      );
    }

    // Check if user has access to this property
    const hasAccess = await prisma.property.findFirst({
      where: {
        id: propertyId,
        OR: [
          { userId: session.user.id },
          {
            teamMembers: {
              some: {
                userId: session.user.id,
                role: { in: ["admin", "editor"] },
              },
            },
          },
        ],
      },
    });

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const teamMembers = await prisma.teamMember.findMany({
      where: {
        propertyId,
      },
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
      orderBy: {
        joinedAt: "desc",
      },
    });

    return NextResponse.json({ teamMembers });
  } catch (error: any) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch team members" },
      { status: 500 }
    );
  }
}

// POST - Invite a team member
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, email, role } = body;

    if (!propertyId || !email || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Check if user is property owner or admin
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
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

    if (!property) {
      return NextResponse.json(
        { error: "Access denied or property not found" },
        { status: 403 }
      );
    }

    // Find or create the user being invited
    let invitedUser = await prisma.user.findUnique({
      where: { email },
    });

    // If user doesn't exist, we'll need to send them an invitation email
    // For now, we require the user to exist
    if (!invitedUser) {
      return NextResponse.json(
        { error: "User not found. They must sign up first." },
        { status: 404 }
      );
    }

    // Check if already a team member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        userId_propertyId: {
          userId: invitedUser.id,
          propertyId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a team member" },
        { status: 400 }
      );
    }

    // Create team member
    const teamMember = await prisma.teamMember.create({
      data: {
        userId: invitedUser.id,
        propertyId,
        role,
        invitedBy: session.user.id,
      },
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

    return NextResponse.json({ teamMember }, { status: 201 });
  } catch (error: any) {
    console.error("Error inviting team member:", error);
    return NextResponse.json(
      { error: error.message || "Failed to invite team member" },
      { status: 500 }
    );
  }
}
