"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";

export interface PonderProperty {
  id: string;
  propertyId: bigint;
  host: string; // wallet address of the host
  hostSbtTokenId: bigint;
  isActive: boolean;
  averageRating: bigint;
  totalRatings: bigint;
  createdAt: bigint;
  updatedAt: bigint;
  propertyType: string;
  location: string;
  ipfsHash: string; // IPFS hash for metadata
}

interface PonderPropertiesPage {
  items: PonderProperty[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

interface UsePonderPropertiesOptions {
  isActive?: boolean;
  location?: string;
  propertyType?: string;
  limit?: number;
}

interface UsePonderPropertiesInfiniteOptions {
  isActive?: boolean;
  pageSize?: number;
}

const PONDER_URL = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";

/**
 * Fetch a single page of properties from Ponder GraphQL
 */
async function fetchPropertiesPage(
  isActive: boolean,
  limit: number,
  cursor?: string
): Promise<PonderPropertiesPage> {
  const whereClause = `where: { isActive: ${isActive} }`;
  const afterClause = cursor ? `, after: "${cursor}"` : "";

  const graphqlQuery = `
    query {
      propertys(${whereClause}, limit: ${limit}${afterClause}, orderBy: "createdAt", orderDirection: "desc") {
        items {
          id
          propertyId
          host
          hostSbtTokenId
          isActive
          averageRating
          totalRatings
          createdAt
          updatedAt
          propertyType
          location
          ipfsHash
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const response = await fetch(`${PONDER_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: graphqlQuery }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch properties from Ponder");
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0]?.message || "GraphQL error");
  }

  const data = result.data?.propertys;
  return {
    items: data?.items || [],
    pageInfo: data?.pageInfo || { hasNextPage: false, endCursor: null },
  };
}

/**
 * Hook for infinite scrolling / load more pagination
 */
export function usePonderPropertiesInfinite(options: UsePonderPropertiesInfiniteOptions = {}) {
  const { isActive = true, pageSize = 12 } = options;

  const query = useInfiniteQuery({
    queryKey: ["propertiesInfinite", { isActive, pageSize }],
    queryFn: async ({ pageParam }) => {
      return fetchPropertiesPage(isActive, pageSize, pageParam as string | undefined);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.pageInfo.hasNextPage && lastPage.pageInfo.endCursor) {
        return lastPage.pageInfo.endCursor;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
  });

  // Flatten all pages into a single array
  const allProperties = query.data?.pages.flatMap((page) => page.items) || [];

  return {
    properties: allProperties,
    loading: query.isLoading,
    loadingMore: query.isFetchingNextPage,
    error: query.error,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}

/**
 * Hook to fetch properties for a specific host address
 */
export function usePonderHostProperties(hostAddress: string | undefined) {
  const query = useQuery<PonderProperty[]>({
    queryKey: ["hostProperties", hostAddress?.toLowerCase()],
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true, // Refetch when user comes back
    enabled: !!hostAddress,
    queryFn: async (): Promise<PonderProperty[]> => {
      if (!hostAddress) return [];

      const graphqlQuery = `
        query {
          propertys(where: { host: "${hostAddress.toLowerCase()}" }, limit: 100, orderBy: "createdAt", orderDirection: "desc") {
            items {
              id
              propertyId
              host
              hostSbtTokenId
              isActive
              averageRating
              totalRatings
              createdAt
              updatedAt
              propertyType
              location
              ipfsHash
            }
          }
        }
      `;

      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: graphqlQuery }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch host properties from Ponder");
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0]?.message || "GraphQL error");
      }

      return result.data?.propertys?.items || [];
    },
  });

  // Extract property IDs as bigints for backward compatibility
  const propertyIds = query.data?.map((p) => BigInt(p.propertyId)) || [];

  return {
    properties: query.data || [],
    propertyIds,
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Original hook for simple queries (non-paginated)
 */
export function usePonderProperties(options: UsePonderPropertiesOptions = {}) {
  const { isActive = true, location, propertyType, limit = 50 } = options;

  const query = useQuery<PonderProperty[]>({
    queryKey: ["properties", { isActive, location, propertyType, limit }],
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<PonderProperty[]> => {
      // Build GraphQL filter
      const whereConditions: string[] = [];

      if (isActive !== undefined) {
        whereConditions.push(`isActive: ${isActive}`);
      }

      if (location) {
        whereConditions.push(`location_contains: "${location}"`);
      }

      if (propertyType) {
        whereConditions.push(`propertyType: "${propertyType}"`);
      }

      const whereClause =
        whereConditions.length > 0 ? `where: { ${whereConditions.join(", ")} }` : "";

      const graphqlQuery = `
        query {
          propertys(${whereClause}, limit: ${limit}, orderBy: "createdAt", orderDirection: "desc") {
            items {
              id
              propertyId
              host
              hostSbtTokenId
              isActive
              averageRating
              totalRatings
              createdAt
              updatedAt
              propertyType
              location
              ipfsHash
            }
          }
        }
      `;

      const response = await fetch(`${PONDER_URL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: graphqlQuery }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch properties from Ponder");
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0]?.message || "GraphQL error");
      }

      return result.data?.propertys?.items || [];
    },
  });

  return {
    properties: (query.data || []) as PonderProperty[],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
