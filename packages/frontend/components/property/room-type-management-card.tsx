"use client";

import * as React from "react";
import { Edit2, Trash2, AlertTriangle, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useUpdateRoomTypeName,
  useUpdateRoomTypeSupply,
  useDeleteRoomType,
} from "@/lib/hooks/property";
import { toast } from "sonner";

interface RoomTypeManagementCardProps {
  tokenId: bigint;
  roomName: string;
  maxSupply: number;
  isActive: boolean;
  isDeleted?: boolean;
  onUpdate?: () => void;
}

export function RoomTypeManagementCard({
  tokenId,
  roomName,
  maxSupply,
  isActive,
  isDeleted = false,
  onUpdate,
}: RoomTypeManagementCardProps) {
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [newName, setNewName] = React.useState(roomName);
  const [isEditingSupply, setIsEditingSupply] = React.useState(false);
  const [newSupply, setNewSupply] = React.useState(maxSupply);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const { updateName, isPending: isUpdatingName, isSuccess: nameSuccess } = useUpdateRoomTypeName();
  const {
    updateRoomTypeSupply,
    isPending: isUpdatingSupply,
    isSuccess: supplySuccess,
  } = useUpdateRoomTypeSupply();
  const { deleteRoomType, isPending: isDeleting, isSuccess: deleteSuccess } = useDeleteRoomType();

  // Handle name update success
  React.useEffect(() => {
    if (nameSuccess) {
      toast.success("Room type name updated", {
        description: `Successfully renamed to "${newName}"`,
      });
      setIsEditingName(false);
      onUpdate?.();
    }
  }, [nameSuccess, newName, onUpdate]);

  // Handle supply update success
  React.useEffect(() => {
    if (supplySuccess) {
      toast.success("Room supply updated", {
        description: `Max supply changed to ${newSupply} units`,
      });
      setIsEditingSupply(false);
      onUpdate?.();
    }
  }, [supplySuccess, newSupply, onUpdate]);

  // Handle delete success
  React.useEffect(() => {
    if (deleteSuccess) {
      toast.success("Room type deleted", {
        description: "The room type has been successfully deleted",
      });
      setShowDeleteDialog(false);
      onUpdate?.();
    }
  }, [deleteSuccess, onUpdate]);

  const handleUpdateName = () => {
    if (!newName.trim()) {
      toast.error("Invalid name", {
        description: "Room name cannot be empty",
      });
      return;
    }

    if (newName === roomName) {
      setIsEditingName(false);
      return;
    }

    updateName(tokenId, newName);
  };

  const handleUpdateSupply = () => {
    if (newSupply <= 0) {
      toast.error("Invalid supply", {
        description: "Supply must be greater than 0. Use delete to remove the room type.",
      });
      return;
    }

    if (newSupply === maxSupply) {
      setIsEditingSupply(false);
      return;
    }

    if (newSupply < maxSupply) {
      toast.warning("Reducing supply", {
        description: `This will burn ${maxSupply - newSupply} token(s). Make sure you own them.`,
      });
    }

    updateRoomTypeSupply(tokenId, BigInt(newSupply));
  };

  const handleDelete = () => {
    deleteRoomType(tokenId);
  };

  if (isDeleted) {
    return (
      <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-100">
              {roomName}
              <Badge variant="destructive">Deleted</Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-800 dark:text-red-200">
            This room type has been deleted and can no longer be booked or modified.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-8 w-64"
                    placeholder="Room type name"
                    disabled={isUpdatingName}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleUpdateName}
                    disabled={isUpdatingName}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setNewName(roomName);
                      setIsEditingName(false);
                    }}
                    disabled={isUpdatingName}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  {roomName}
                  <Button size="sm" variant="ghost" onClick={() => setIsEditingName(true)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "Active" : "Inactive"}
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Supply Management */}
          <div className="space-y-2">
            <Label>Maximum Supply</Label>
            {isEditingSupply ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={newSupply}
                  onChange={(e) => setNewSupply(parseInt(e.target.value) || 0)}
                  className="h-9 w-32"
                  disabled={isUpdatingSupply}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleUpdateSupply}
                  disabled={isUpdatingSupply}
                >
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Apply
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setNewSupply(maxSupply);
                    setIsEditingSupply(false);
                  }}
                  disabled={isUpdatingSupply}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-base">
                  {maxSupply} units
                </Badge>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingSupply(true)}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            {isEditingSupply && (
              <p className="text-muted-foreground text-xs">
                {newSupply > maxSupply
                  ? `Will mint ${newSupply - maxSupply} new token(s)`
                  : newSupply < maxSupply
                    ? `Will burn ${maxSupply - newSupply} token(s) - make sure you own them`
                    : "No change"}
              </p>
            )}
          </div>

          {/* Token ID */}
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs">Token ID</Label>
            <p className="font-mono text-xs">{tokenId.toString()}</p>
          </div>

          {/* Danger Zone */}
          <div className="space-y-2 rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-900 dark:bg-red-950/50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <Label className="text-sm font-semibold text-red-900 dark:text-red-100">
                Danger Zone
              </Label>
            </div>
            <p className="text-xs text-red-800 dark:text-red-200">
              Deleting this room type is permanent and cannot be undone. It will only work if there
              are no active bookings.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="w-full"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete Room Type
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Room Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{roomName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 rounded-lg border border-orange-200 bg-orange-50/50 p-3 dark:border-orange-900 dark:bg-orange-950/50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                Requirements
              </p>
            </div>
            <ul className="list-inside list-disc space-y-1 text-xs text-orange-800 dark:text-orange-200">
              <li>No active bookings for this room type</li>
              <li>All future reservations must be completed or cancelled</li>
              <li>The room type will be marked as deleted permanently</li>
            </ul>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
