"use client";

import * as React from "react";
import { Suspense } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { MessagingCenter } from "@/components/messaging";
import { Loader2 } from "lucide-react";

function MessagingCenterWrapper() {
  return <MessagingCenter />;
}

export default function MessagesPage() {
  return (
    <ProtectedRoute requireSBT="any">
      <div className="container min-h-screen px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground mt-1">
              Communicate securely with hosts and travelers
            </p>
          </div>
          <Suspense
            fallback={
              <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            }
          >
            <MessagingCenterWrapper />
          </Suspense>
        </div>
      </div>
    </ProtectedRoute>
  );
}
