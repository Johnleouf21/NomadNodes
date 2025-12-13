"use client";

import { Save, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditModeActionsProps {
  isLoading: boolean;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * Edit mode action buttons and IPFS notice
 */
export function EditModeActions({ isLoading, onSave, onCancel }: EditModeActionsProps) {
  return (
    <>
      {/* IPFS Notice */}
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950/50">
        <div className="flex items-start gap-2">
          <Upload className="mt-0.5 h-3 w-3 text-orange-600 dark:text-orange-400" />
          <p className="text-xs text-orange-800 dark:text-orange-200">
            Saving will upload metadata to IPFS and update the blockchain.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={onSave} disabled={isLoading} className="flex-1" size="sm">
          <Save className="mr-2 h-3 w-3" />
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isLoading} size="sm">
          <X className="mr-2 h-3 w-3" />
          Cancel
        </Button>
      </div>
    </>
  );
}
