"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    emailReports: true,
    weeklyDigest: true,
    teamInvitations: true,
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Section */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Profile</h2>
          <div className="flex items-center gap-6">
            {session?.user?.image && (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="h-20 w-20 rounded-full"
              />
            )}
            <div>
              <div className="text-lg font-medium text-gray-900">
                {session?.user?.name || "User"}
              </div>
              <div className="text-gray-600">{session?.user?.email}</div>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Notification Preferences
          </h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Alert Notifications</div>
                <div className="text-sm text-gray-600">
                  Receive email notifications when alerts are triggered
                </div>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.emailAlerts}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    emailAlerts: e.target.checked,
                  })
                }
                className="h-5 w-5 rounded border-gray-300 text-blue-600"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Report Emails</div>
                <div className="text-sm text-gray-600">
                  Receive scheduled reports via email
                </div>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.emailReports}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    emailReports: e.target.checked,
                  })
                }
                className="h-5 w-5 rounded border-gray-300 text-blue-600"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Weekly Digest</div>
                <div className="text-sm text-gray-600">
                  Get a weekly summary of your property performance
                </div>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.weeklyDigest}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    weeklyDigest: e.target.checked,
                  })
                }
                className="h-5 w-5 rounded border-gray-300 text-blue-600"
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Team Invitations</div>
                <div className="text-sm text-gray-600">
                  Get notified when you're invited to a team
                </div>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.teamInvitations}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    teamInvitations: e.target.checked,
                  })
                }
                className="h-5 w-5 rounded border-gray-300 text-blue-600"
              />
            </label>
          </div>
          <button className="mt-6 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
            Save Preferences
          </button>
        </div>

        {/* API Keys Section */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">API Access</h2>
          <p className="mb-4 text-gray-600">
            Generate API keys for programmatic access to your data
          </p>
          <button className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">
            Generate API Key
          </button>
        </div>

        {/* Data & Privacy */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Data & Privacy
          </h2>
          <div className="space-y-3">
            <button className="block text-blue-600 hover:text-blue-700">
              Download Your Data
            </button>
            <button className="block text-blue-600 hover:text-blue-700">
              Export Analytics
            </button>
            <button className="block text-red-600 hover:text-red-700">
              Delete Account
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-lg border-2 border-red-200 bg-red-50 p-6">
          <h2 className="mb-2 text-xl font-semibold text-red-900">Danger Zone</h2>
          <p className="mb-4 text-red-700">
            These actions are irreversible. Please be certain.
          </p>
          <button className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700">
            Delete All Properties
          </button>
        </div>
      </div>
    </div>
  );
}
