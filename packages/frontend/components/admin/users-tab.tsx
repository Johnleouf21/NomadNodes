"use client";

import * as React from "react";
import { User, Home, Users, Loader2, Ban, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  usePonderHosts,
  usePonderTravelers,
  useSuspendHost,
  useUnsuspendHost,
  useSuspendTraveler,
  useUnsuspendTraveler,
  type PonderHost,
  type PonderTraveler,
} from "@/lib/hooks/contracts/useAdminPlatform";
import type { Address } from "viem";

interface UsersManagementTabProps {
  isOwner: boolean;
  onRefresh: () => void;
}

export function UsersManagementTab({ isOwner, onRefresh }: UsersManagementTabProps) {
  const [userType, setUserType] = React.useState<"hosts" | "travelers">("hosts");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showSuspendedOnly, setShowSuspendedOnly] = React.useState(false);

  const { data: hosts, isLoading: isLoadingHosts, refetch: refetchHosts } = usePonderHosts();
  const {
    data: travelers,
    isLoading: isLoadingTravelers,
    refetch: refetchTravelers,
  } = usePonderTravelers();

  const {
    suspendHost,
    isPending: isSuspendingHost,
    isSuccess: suspendHostSuccess,
    reset: resetSuspendHost,
  } = useSuspendHost();
  const {
    unsuspendHost,
    isPending: isUnsuspendingHost,
    isSuccess: unsuspendHostSuccess,
    reset: resetUnsuspendHost,
  } = useUnsuspendHost();
  const {
    suspendTraveler,
    isPending: isSuspendingTraveler,
    isSuccess: suspendTravelerSuccess,
    reset: resetSuspendTraveler,
  } = useSuspendTraveler();
  const {
    unsuspendTraveler,
    isPending: isUnsuspendingTraveler,
    isSuccess: unsuspendTravelerSuccess,
    reset: resetUnsuspendTraveler,
  } = useUnsuspendTraveler();

  React.useEffect(() => {
    if (suspendHostSuccess) {
      toast.success("Host suspended");
      resetSuspendHost();
      refetchHosts();
      onRefresh();
    }
  }, [suspendHostSuccess, resetSuspendHost, refetchHosts, onRefresh]);

  React.useEffect(() => {
    if (unsuspendHostSuccess) {
      toast.success("Host unsuspended");
      resetUnsuspendHost();
      refetchHosts();
      onRefresh();
    }
  }, [unsuspendHostSuccess, resetUnsuspendHost, refetchHosts, onRefresh]);

  React.useEffect(() => {
    if (suspendTravelerSuccess) {
      toast.success("Traveler suspended");
      resetSuspendTraveler();
      refetchTravelers();
      onRefresh();
    }
  }, [suspendTravelerSuccess, resetSuspendTraveler, refetchTravelers, onRefresh]);

  React.useEffect(() => {
    if (unsuspendTravelerSuccess) {
      toast.success("Traveler unsuspended");
      resetUnsuspendTraveler();
      refetchTravelers();
      onRefresh();
    }
  }, [unsuspendTravelerSuccess, resetUnsuspendTraveler, refetchTravelers, onRefresh]);

  const filteredHosts = React.useMemo(() => {
    if (!hosts) return [];
    return hosts.filter((h) => {
      const matchesSearch =
        !searchQuery || h.wallet.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSuspended = !showSuspendedOnly || h.isSuspended;
      return matchesSearch && matchesSuspended;
    });
  }, [hosts, searchQuery, showSuspendedOnly]);

  const filteredTravelers = React.useMemo(() => {
    if (!travelers) return [];
    return travelers.filter((t) => {
      const matchesSearch =
        !searchQuery || t.wallet.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSuspended = !showSuspendedOnly || t.isSuspended;
      return matchesSearch && matchesSuspended;
    });
  }, [travelers, searchQuery, showSuspendedOnly]);

  const isLoading = userType === "hosts" ? isLoadingHosts : isLoadingTravelers;
  const users = userType === "hosts" ? filteredHosts : filteredTravelers;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <div className="flex gap-2">
            <Button
              variant={userType === "hosts" ? "default" : "outline"}
              size="sm"
              onClick={() => setUserType("hosts")}
            >
              <Home className="mr-2 h-4 w-4" />
              Hosts ({hosts?.length || 0})
            </Button>
            <Button
              variant={userType === "travelers" ? "default" : "outline"}
              size="sm"
              onClick={() => setUserType("travelers")}
            >
              <User className="mr-2 h-4 w-4" />
              Travelers ({travelers?.length || 0})
            </Button>
          </div>
          <Input
            placeholder="Search by address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex items-center gap-2">
            <Switch
              id="suspended-only"
              checked={showSuspendedOnly}
              onCheckedChange={setShowSuspendedOnly}
            />
            <Label htmlFor="suspended-only" className="text-sm">
              Suspended only
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      {isLoading ? (
        <Card>
          <CardContent className="flex min-h-[200px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[200px] flex-col items-center justify-center">
            <Users className="text-muted-foreground mb-4 h-12 w-12" />
            <p className="text-muted-foreground">No {userType} found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {userType === "hosts"
            ? (users as PonderHost[]).map((host) => (
                <HostCard
                  key={host.id}
                  host={host}
                  isOwner={isOwner}
                  onSuspend={() => suspendHost(host.wallet as Address)}
                  onUnsuspend={() => unsuspendHost(host.wallet as Address)}
                  isSuspending={isSuspendingHost}
                  isUnsuspending={isUnsuspendingHost}
                />
              ))
            : (users as PonderTraveler[]).map((traveler) => (
                <TravelerCard
                  key={traveler.id}
                  traveler={traveler}
                  isOwner={isOwner}
                  onSuspend={() => suspendTraveler(traveler.wallet as Address)}
                  onUnsuspend={() => unsuspendTraveler(traveler.wallet as Address)}
                  isSuspending={isSuspendingTraveler}
                  isUnsuspending={isUnsuspendingTraveler}
                />
              ))}
        </div>
      )}
    </div>
  );
}

interface HostCardProps {
  host: PonderHost;
  isOwner: boolean;
  onSuspend: () => void;
  onUnsuspend: () => void;
  isSuspending: boolean;
  isUnsuspending: boolean;
}

function HostCard({
  host,
  isOwner,
  onSuspend,
  onUnsuspend,
  isSuspending,
  isUnsuspending,
}: HostCardProps) {
  const memberDate = host.memberSince
    ? new Date(Number(host.memberSince) * 1000).toLocaleDateString()
    : "N/A";
  const lastActive = host.lastActivityAt
    ? new Date(Number(host.lastActivityAt) * 1000).toLocaleDateString()
    : "N/A";

  return (
    <Card className={host.isSuspended ? "border-red-500" : ""}>
      <CardContent className="flex items-center justify-between pt-6">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              host.isSuspended ? "bg-red-100" : "bg-muted"
            }`}
          >
            <Home className={`h-6 w-6 ${host.isSuspended ? "text-red-500" : ""}`} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-sm font-medium">
                {host.wallet.slice(0, 6)}...{host.wallet.slice(-4)}
              </p>
              <Badge variant="outline">{host.tier || "Newcomer"}</Badge>
              {host.isSuperHost && <Badge className="bg-yellow-500 text-white">SuperHost</Badge>}
              {host.isSuspended && <Badge variant="destructive">Suspended</Badge>}
            </div>
            <p className="text-muted-foreground text-xs">
              {host.totalPropertiesListed} properties · {host.completedBookings} completed · Rating:{" "}
              {(Number(host.averageRating) / 100).toFixed(1)}/5 · {host.totalReviewsReceived}{" "}
              reviews
            </p>
            <p className="text-muted-foreground text-xs">
              Member since {memberDate} · Last active {lastActive}
            </p>
          </div>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            {host.isSuspended ? (
              <Button size="sm" variant="outline" onClick={onUnsuspend} disabled={isUnsuspending}>
                {isUnsuspending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="mr-1 h-4 w-4" />
                )}
                Unsuspend
              </Button>
            ) : (
              <Button size="sm" variant="destructive" onClick={onSuspend} disabled={isSuspending}>
                {isSuspending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Ban className="mr-1 h-4 w-4" />
                )}
                Suspend
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TravelerCardProps {
  traveler: PonderTraveler;
  isOwner: boolean;
  onSuspend: () => void;
  onUnsuspend: () => void;
  isSuspending: boolean;
  isUnsuspending: boolean;
}

function TravelerCard({
  traveler,
  isOwner,
  onSuspend,
  onUnsuspend,
  isSuspending,
  isUnsuspending,
}: TravelerCardProps) {
  const memberDate = traveler.memberSince
    ? new Date(Number(traveler.memberSince) * 1000).toLocaleDateString()
    : "N/A";
  const lastActive = traveler.lastActivityAt
    ? new Date(Number(traveler.lastActivityAt) * 1000).toLocaleDateString()
    : "N/A";

  return (
    <Card className={traveler.isSuspended ? "border-red-500" : ""}>
      <CardContent className="flex items-center justify-between pt-6">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              traveler.isSuspended ? "bg-red-100" : "bg-muted"
            }`}
          >
            <User className={`h-6 w-6 ${traveler.isSuspended ? "text-red-500" : ""}`} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-sm font-medium">
                {traveler.wallet.slice(0, 6)}...{traveler.wallet.slice(-4)}
              </p>
              <Badge variant="outline">{traveler.tier || "Newcomer"}</Badge>
              {traveler.isSuspended && <Badge variant="destructive">Suspended</Badge>}
            </div>
            <p className="text-muted-foreground text-xs">
              {traveler.totalBookings} bookings · {traveler.completedStays} completed ·{" "}
              {traveler.cancellations} cancelled · Rating:{" "}
              {(Number(traveler.averageRating) / 100).toFixed(1)}/5 ·{" "}
              {traveler.totalReviewsReceived} reviews
            </p>
            <p className="text-muted-foreground text-xs">
              Member since {memberDate} · Last active {lastActive}
            </p>
          </div>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            {traveler.isSuspended ? (
              <Button size="sm" variant="outline" onClick={onUnsuspend} disabled={isUnsuspending}>
                {isUnsuspending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="mr-1 h-4 w-4" />
                )}
                Unsuspend
              </Button>
            ) : (
              <Button size="sm" variant="destructive" onClick={onSuspend} disabled={isSuspending}>
                {isSuspending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Ban className="mr-1 h-4 w-4" />
                )}
                Suspend
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
