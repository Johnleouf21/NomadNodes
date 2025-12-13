"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useSetAutoApprove, useSetModerator } from "@/lib/hooks/contracts/adminReviews";
import type { Address } from "viem";

interface AdminSettingsTabProps {
  autoApproveEnabled: boolean;
  autoApproveThreshold: number;
  onRefresh: () => void;
}

export function AdminSettingsTab({
  autoApproveEnabled,
  autoApproveThreshold,
  onRefresh,
}: AdminSettingsTabProps) {
  const [newAutoApprove, setNewAutoApprove] = React.useState(autoApproveEnabled);
  const [newThreshold, setNewThreshold] = React.useState(autoApproveThreshold.toString());
  const [newModeratorAddress, setNewModeratorAddress] = React.useState("");
  const [isAddingModerator, setIsAddingModerator] = React.useState(true);

  const {
    setAutoApprove,
    isPending: isSettingAutoApprove,
    isSuccess: autoApproveSet,
    reset: resetAutoApprove,
  } = useSetAutoApprove();
  const {
    setModerator,
    isPending: isSettingModerator,
    isSuccess: moderatorSet,
    reset: resetModerator,
  } = useSetModerator();

  React.useEffect(() => {
    setNewAutoApprove(autoApproveEnabled);
    setNewThreshold(autoApproveThreshold.toString());
  }, [autoApproveEnabled, autoApproveThreshold]);

  React.useEffect(() => {
    if (autoApproveSet) {
      toast.success("Settings updated");
      resetAutoApprove();
      onRefresh();
    }
  }, [autoApproveSet, resetAutoApprove, onRefresh]);

  React.useEffect(() => {
    if (moderatorSet) {
      toast.success(isAddingModerator ? "Moderator added" : "Moderator removed");
      setNewModeratorAddress("");
      resetModerator();
      onRefresh();
    }
  }, [moderatorSet, isAddingModerator, resetModerator, onRefresh]);

  const handleSaveAutoApprove = () => {
    setAutoApprove(newAutoApprove, parseInt(newThreshold) || 0);
  };

  const handleSetModerator = () => {
    if (newModeratorAddress.startsWith("0x")) {
      setModerator(newModeratorAddress as Address, isAddingModerator);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Auto-Approve Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Auto-Approve Settings</CardTitle>
          <CardDescription>Configure automatic review approval</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-approve">Enable Auto-Approve</Label>
            <Switch
              id="auto-approve"
              checked={newAutoApprove}
              onCheckedChange={setNewAutoApprove}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="threshold">Rating Threshold</Label>
            <Input
              id="threshold"
              type="number"
              min="0"
              max="5"
              value={newThreshold}
              onChange={(e) => setNewThreshold(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Reviews with this rating or above will be auto-approved (0 = all)
            </p>
          </div>
          <Button
            onClick={handleSaveAutoApprove}
            disabled={isSettingAutoApprove}
            className="w-full"
          >
            {isSettingAutoApprove && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </CardContent>
      </Card>

      {/* Moderator Management */}
      <Card>
        <CardHeader>
          <CardTitle>Moderator Management</CardTitle>
          <CardDescription>Add or remove review moderators</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="moderator-address">Moderator Address</Label>
            <Input
              id="moderator-address"
              placeholder="0x..."
              value={newModeratorAddress}
              onChange={(e) => setNewModeratorAddress(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Action</Label>
            <div className="flex items-center gap-2">
              <span
                className={
                  !isAddingModerator ? "text-primary font-medium" : "text-muted-foreground"
                }
              >
                Remove
              </span>
              <Switch checked={isAddingModerator} onCheckedChange={setIsAddingModerator} />
              <span
                className={isAddingModerator ? "text-primary font-medium" : "text-muted-foreground"}
              >
                Add
              </span>
            </div>
          </div>
          <Separator />
          <Button
            onClick={handleSetModerator}
            disabled={isSettingModerator || !newModeratorAddress}
            variant={isAddingModerator ? "default" : "destructive"}
            className="w-full"
          >
            {isSettingModerator && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isAddingModerator ? "Add Moderator" : "Remove Moderator"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
