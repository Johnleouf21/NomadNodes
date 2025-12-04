"use client";

import * as React from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ProfileHeader } from "@/components/profile/profile-header";
import { SBTDisplay } from "@/components/profile/sbt-display";
import { ProfileStats } from "@/components/profile/profile-stats";
import { ActivityHistory } from "@/components/profile/activity-history";
import { Badges } from "@/components/profile/badges";

export default function ProfilePage() {
  return (
    <ProtectedRoute requireSBT="any">
      <div className="container min-h-screen px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-8">
          <ProfileHeader />
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - SBT & Badges */}
            <div className="space-y-8">
              <SBTDisplay />
              <Badges />
            </div>

            {/* Right Column - Stats & Activity */}
            <div className="space-y-8 lg:col-span-2">
              <ProfileStats />
              <ActivityHistory />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
