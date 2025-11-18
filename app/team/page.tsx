"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function TeamPage() {
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("viewer");
  const queryClient = useQueryClient();

  // Fetch properties
  const { data: propertiesData } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const response = await fetch("/api/properties");
      if (!response.ok) throw new Error("Failed to fetch properties");
      return response.json();
    },
  });

  // Fetch team members for selected property
  const { data: teamData, isLoading: loadingTeam } = useQuery({
    queryKey: ["team", selectedProperty],
    queryFn: async () => {
      if (!selectedProperty) return null;
      const response = await fetch(`/api/team?propertyId=${selectedProperty}`);
      if (!response.ok) throw new Error("Failed to fetch team");
      return response.json();
    },
    enabled: !!selectedProperty,
  });

  // Invite member mutation
  const inviteMutation = useMutation({
    mutationFn: async (data: { propertyId: string; email: string; role: string }) => {
      const response = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to invite team member");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", selectedProperty] });
      setInviteEmail("");
    },
  });

  // Remove member mutation
  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await fetch(`/api/team/${memberId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to remove team member");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", selectedProperty] });
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty || !inviteEmail) return;

    inviteMutation.mutate({
      propertyId: selectedProperty,
      email: inviteEmail,
      role: inviteRole,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="mt-2 text-gray-600">
            Invite team members and manage their access to your properties
          </p>
        </div>

        {/* Property Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700">
            Select Property
          </label>
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="mt-1 block w-full max-w-md rounded-lg border border-gray-300 px-4 py-2"
          >
            <option value="">Select a property</option>
            {propertiesData?.properties?.map((property: any) => (
              <option key={property.id} value={property.id}>
                {property.displayName || property.siteUrl}
              </option>
            ))}
          </select>
        </div>

        {selectedProperty && (
          <>
            {/* Invite Form */}
            <div className="mb-8 rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold">Invite Team Member</h2>
              <form onSubmit={handleInvite} className="flex gap-4">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                  <option value="client">Client</option>
                </select>
                <button
                  type="submit"
                  disabled={inviteMutation.isPending}
                  className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {inviteMutation.isPending ? "Inviting..." : "Invite"}
                </button>
              </form>
              {inviteMutation.isError && (
                <p className="mt-2 text-sm text-red-600">
                  {inviteMutation.error instanceof Error
                    ? inviteMutation.error.message
                    : "Failed to invite"}
                </p>
              )}
            </div>

            {/* Team Members List */}
            <div className="rounded-lg bg-white shadow">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold">Team Members</h2>
              </div>
              {loadingTeam ? (
                <div className="p-6 text-center text-gray-600">Loading team...</div>
              ) : !teamData?.teamMembers || teamData.teamMembers.length === 0 ? (
                <div className="p-6 text-center text-gray-600">
                  No team members yet. Invite someone to get started!
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {teamData.teamMembers.map((member: any) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between px-6 py-4"
                    >
                      <div className="flex items-center gap-4">
                        {member.user.image && (
                          <img
                            src={member.user.image}
                            alt={member.user.name}
                            className="h-10 w-10 rounded-full"
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {member.user.name || "Unknown"}
                          </div>
                          <div className="text-sm text-gray-600">
                            {member.user.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 capitalize"
                        >
                          {member.role}
                        </span>
                        <button
                          onClick={() => {
                            if (confirm("Remove this team member?")) {
                              removeMutation.mutate(member.id);
                            }
                          }}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
