"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PropertyHeaderProps } from "./types";

/**
 * Property detail page header with back and edit buttons
 */
export function PropertyHeader({ propertyId, isOwner }: PropertyHeaderProps) {
  const router = useRouter();

  return (
    <div className="mb-6 flex items-center justify-between">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      {isOwner && (
        <Button onClick={() => router.push(`/property/${propertyId}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Property
        </Button>
      )}
    </div>
  );
}
