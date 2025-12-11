"use client";

import * as React from "react";
import {
  Building2,
  MapPin,
  User,
  Star,
  Eye,
  RefreshCw,
  Loader2,
  BedDouble,
  DollarSign,
  Users,
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  useAdminProperties,
  useAllRoomTypes,
  type AdminProperty,
  type RoomType,
} from "@/lib/hooks/contracts/useAdminPlatform";

export function PropertiesOversightTab() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterActive, setFilterActive] = React.useState<"all" | "active" | "inactive">("all");
  const [expandedProperty, setExpandedProperty] = React.useState<string | null>(null);

  const { data: properties, isLoading, refetch } = useAdminProperties();
  const {
    data: allRoomTypes,
    isLoading: isLoadingRoomTypes,
    refetch: refetchRoomTypes,
  } = useAllRoomTypes();

  // Group room types by property
  const roomTypesByProperty = React.useMemo(() => {
    if (!allRoomTypes) return {};
    return allRoomTypes.reduce(
      (acc, rt) => {
        if (!acc[rt.propertyId]) acc[rt.propertyId] = [];
        acc[rt.propertyId].push(rt);
        return acc;
      },
      {} as Record<string, RoomType[]>
    );
  }, [allRoomTypes]);

  const filteredProperties = React.useMemo(() => {
    if (!properties) return [];
    return properties.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.propertyId.includes(searchQuery) ||
        p.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesActive =
        filterActive === "all" ||
        (filterActive === "active" && p.isActive) ||
        (filterActive === "inactive" && !p.isActive);
      return matchesSearch && matchesActive;
    });
  }, [properties, searchQuery, filterActive]);

  const handleRefresh = () => {
    refetch();
    refetchRoomTypes();
  };

  const toggleExpand = (propertyId: string) => {
    setExpandedProperty(expandedProperty === propertyId ? null : propertyId);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <Input
            placeholder="Search by ID, host, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex gap-2">
            <Button
              variant={filterActive === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterActive("all")}
            >
              All ({properties?.length || 0})
            </Button>
            <Button
              variant={filterActive === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterActive("active")}
            >
              Active ({properties?.filter((p) => p.isActive).length || 0})
            </Button>
            <Button
              variant={filterActive === "inactive" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterActive("inactive")}
            >
              Inactive ({properties?.filter((p) => !p.isActive).length || 0})
            </Button>
          </div>
          <div className="text-muted-foreground ml-auto text-sm">
            <BedDouble className="mr-1 inline h-4 w-4" />
            {allRoomTypes?.length || 0} room types total
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardContent>
      </Card>

      {/* Properties List */}
      {isLoading || isLoadingRoomTypes ? (
        <Card>
          <CardContent className="flex min-h-[200px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      ) : filteredProperties.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[200px] flex-col items-center justify-center">
            <Building2 className="text-muted-foreground mb-4 h-12 w-12" />
            <p className="text-muted-foreground">No properties found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProperties.map((property) => {
            const propertyRoomTypes = roomTypesByProperty[property.id] || [];
            const isExpanded = expandedProperty === property.id;
            const createdDate = property.createdAt
              ? new Date(Number(property.createdAt) * 1000).toLocaleDateString()
              : "N/A";

            return (
              <PropertyCard
                key={property.id}
                property={property}
                roomTypes={propertyRoomTypes}
                isExpanded={isExpanded}
                onToggleExpand={() => toggleExpand(property.id)}
                createdDate={createdDate}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

interface PropertyCardProps {
  property: AdminProperty;
  roomTypes: RoomType[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  createdDate: string;
}

function PropertyCard({
  property,
  roomTypes,
  isExpanded,
  onToggleExpand,
  createdDate,
}: PropertyCardProps) {
  const activeRoomTypes = roomTypes.filter((rt) => rt.isActive && !rt.isDeleted);
  const totalSupply = roomTypes.reduce((sum, rt) => sum + Number(rt.totalSupply || 0), 0);
  const priceRange =
    roomTypes.length > 0
      ? {
          min: Math.min(...roomTypes.map((rt) => Number(rt.pricePerNight) / 1e6)),
          max: Math.max(...roomTypes.map((rt) => Number(rt.pricePerNight) / 1e6)),
        }
      : null;

  return (
    <Card className={!property.isActive ? "opacity-70" : ""}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant={property.isActive ? "default" : "secondary"}>
                {property.isActive ? "Active" : "Inactive"}
              </Badge>
              <span className="text-muted-foreground text-xs">#{property.propertyId}</span>
              <Badge variant="outline" className="ml-2">
                {property.propertyType}
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="text-muted-foreground h-4 w-4 shrink-0" />
                <span className="truncate">{property.location || "Unknown"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="text-muted-foreground h-4 w-4 shrink-0" />
                <span className="font-mono text-xs">
                  {property.host.slice(0, 6)}...{property.host.slice(-4)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 shrink-0 text-yellow-500" />
                <span>
                  {(Number(property.averageRating) / 100).toFixed(1)} ({property.totalRatings}{" "}
                  reviews)
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="text-muted-foreground h-4 w-4 shrink-0" />
                <span>Listed {createdDate}</span>
              </div>
            </div>

            {/* Room Types Summary */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <BedDouble className="text-muted-foreground h-4 w-4" />
                <span className="font-medium">{roomTypes.length}</span>
                <span className="text-muted-foreground">room types</span>
                {activeRoomTypes.length !== roomTypes.length && (
                  <span className="text-muted-foreground">({activeRoomTypes.length} active)</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Users className="text-muted-foreground h-4 w-4" />
                <span className="font-medium">{totalSupply}</span>
                <span className="text-muted-foreground">total units</span>
              </div>
              {priceRange && (
                <div className="flex items-center gap-1">
                  <DollarSign className="text-muted-foreground h-4 w-4" />
                  <span className="font-medium">
                    ${priceRange.min.toFixed(0)} - ${priceRange.max.toFixed(0)}
                  </span>
                  <span className="text-muted-foreground">/night</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`/property/${property.propertyId}`} target="_blank">
                <Eye className="mr-1 h-4 w-4" />
                View
              </a>
            </Button>
            {roomTypes.length > 0 && (
              <Button variant="ghost" size="sm" onClick={onToggleExpand}>
                {isExpanded ? (
                  <>
                    <ChevronUp className="mr-1 h-4 w-4" />
                    Hide rooms
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-1 h-4 w-4" />
                    Show rooms
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Expanded Room Types */}
        {isExpanded && roomTypes.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Room Types</h4>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {roomTypes.map((rt) => (
                  <RoomTypeCard key={rt.id} roomType={rt} />
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function RoomTypeCard({ roomType }: { roomType: RoomType }) {
  const isActive = roomType.isActive && !roomType.isDeleted;
  const pricePerNight = Number(roomType.pricePerNight) / 1e6;
  const cleaningFee = Number(roomType.cleaningFee) / 1e6;

  return (
    <div className={`rounded-lg border p-3 ${isActive ? "bg-muted/30" : "bg-muted/10 opacity-60"}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">
          {roomType.name || `Room Type #${roomType.roomTypeId}`}
        </span>
        <Badge variant={isActive ? "outline" : "secondary"} className="text-xs">
          {isActive ? "Active" : roomType.isDeleted ? "Deleted" : "Inactive"}
        </Badge>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Price/night</span>
          <span className="font-medium">${pricePerNight.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cleaning fee</span>
          <span>${cleaningFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Max guests</span>
          <span>{roomType.maxGuests}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total supply</span>
          <span>{roomType.totalSupply} units</span>
        </div>
      </div>
    </div>
  );
}
