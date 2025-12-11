"use client";

import * as React from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ProfileHeader } from "@/components/profile/profile-header";
import { SBTDisplay } from "@/components/profile/sbt-display";
import { ProfileStats } from "@/components/profile/profile-stats";
import { ActivityHistory } from "@/components/profile/activity-history";
import { Badges } from "@/components/profile/badges";
import { ReviewsReceived } from "@/components/profile/reviews-received";

export default function ProfilePage() {
  return (
    <ProtectedRoute requireSBT="any">
      <div className="container min-h-screen px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Profile Header - Full Width */}
          <ProfileHeader />

          {/* Main Content Grid */}
          <div className="grid items-stretch gap-6 lg:grid-cols-12">
            {/* Left Column - SBT Display */}
            <div className="lg:col-span-4">
              <SBTDisplay />
            </div>

            {/* Right Column - Stats + Reviews stacked */}
            <div className="flex flex-col gap-6 lg:col-span-8">
              <ProfileStats />
              <ReviewsReceived />
            </div>
          </div>

          {/* Bottom Section - Activity & Badges */}
          <div className="grid items-stretch gap-6 lg:grid-cols-2">
            {/* Activity History */}
            <ActivityHistory />

            {/* Badges/Achievements */}
            <Badges />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
