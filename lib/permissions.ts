import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type Role = "admin" | "editor" | "viewer" | "client";

export interface PropertyAccess {
  isOwner: boolean;
  role?: Role;
  canEdit: boolean;
  canView: boolean;
  canManageTeam: boolean;
}

/**
 * Check if user has access to a property and their role
 */
export async function checkPropertyAccess(
  propertyId: string,
  userId: string
): Promise<PropertyAccess | null> {
  // Check if owner
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      userId,
    },
  });

  if (property) {
    return {
      isOwner: true,
      canEdit: true,
      canView: true,
      canManageTeam: true,
    };
  }

  // Check if team member
  const teamMember = await prisma.teamMember.findUnique({
    where: {
      userId_propertyId: {
        userId,
        propertyId,
      },
    },
  });

  if (!teamMember) {
    return null;
  }

  const role = teamMember.role as Role;

  return {
    isOwner: false,
    role,
    canEdit: ["admin", "editor"].includes(role),
    canView: true,
    canManageTeam: role === "admin",
  };
}

/**
 * Verify user has permission for a property (throws if not)
 */
export async function requirePropertyAccess(
  propertyId: string,
  userId: string,
  requiredPermission?: "edit" | "view" | "manage"
): Promise<PropertyAccess> {
  const access = await checkPropertyAccess(propertyId, userId);

  if (!access) {
    throw new Error("Access denied: You don't have access to this property");
  }

  if (requiredPermission === "edit" && !access.canEdit) {
    throw new Error("Access denied: Editor permission required");
  }

  if (requiredPermission === "manage" && !access.canManageTeam) {
    throw new Error("Access denied: Admin permission required");
  }

  return access;
}

/**
 * Get all properties user has access to (owned + team member)
 */
export async function getUserProperties(userId: string) {
  // Get owned properties
  const ownedProperties = await prisma.property.findMany({
    where: {
      userId,
    },
    include: {
      _count: {
        select: {
          analyticsData: true,
          teamMembers: true,
        },
      },
    },
  });

  // Get team member properties
  const teamMemberProperties = await prisma.teamMember.findMany({
    where: {
      userId,
    },
    include: {
      property: {
        include: {
          _count: {
            select: {
              analyticsData: true,
              teamMembers: true,
            },
          },
        },
      },
    },
  });

  const allProperties = [
    ...ownedProperties.map((p) => ({
      ...p,
      isOwner: true,
      role: "owner" as const,
    })),
    ...teamMemberProperties.map((tm) => ({
      ...tm.property,
      isOwner: false,
      role: tm.role as Role,
    })),
  ];

  return allProperties;
}

/**
 * Check if user can perform action on resource
 */
export function canPerformAction(access: PropertyAccess, action: string): boolean {
  switch (action) {
    case "view":
      return access.canView;
    case "edit":
    case "create":
    case "update":
      return access.canEdit;
    case "delete":
      return access.isOwner || access.role === "admin";
    case "manage_team":
      return access.canManageTeam;
    case "export":
      return access.canEdit;
    default:
      return false;
  }
}
