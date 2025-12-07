/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * IPFS utilities for uploading and fetching metadata
 */

import type { PropertyMetadata, RoomTypeData } from "@/lib/hooks/property/types";

// IPFS gateways (order matters - dedicated gateway first for CORS support)
const IPFS_GATEWAYS = [
  "https://green-yammering-puma-886.mypinata.cloud/ipfs/",
  "https://w3s.link/ipfs/",
  "https://dweb.link/ipfs/",
  "https://ipfs.io/ipfs/",
];

// In-memory cache for IPFS data
const ipfsCache = new Map<string, { data: any; timestamp: number }>();
const IPFS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Clear a specific IPFS hash from the cache
 */
export function clearIPFSCache(hashOrUrl?: string): void {
  if (hashOrUrl) {
    // Clear specific hash
    ipfsCache.delete(hashOrUrl);
    // Also try to clear the extracted hash
    const hash = extractIPFSHash(hashOrUrl);
    if (hash && hash !== hashOrUrl) {
      ipfsCache.delete(hash);
    }
  } else {
    // Clear entire cache
    ipfsCache.clear();
  }
}

/**
 * Extract pure IPFS hash from various formats
 */
function extractIPFSHash(hashOrUrl: string): string | null {
  if (!hashOrUrl || hashOrUrl === "QmPlaceholder") {
    return null;
  }

  // Already a gateway URL - extract the hash
  for (const gateway of IPFS_GATEWAYS) {
    if (hashOrUrl.startsWith(gateway)) {
      return hashOrUrl.replace(gateway, "");
    }
  }

  // IPFS protocol URL
  if (hashOrUrl.startsWith("ipfs://")) {
    return hashOrUrl.replace("ipfs://", "");
  }

  // Other HTTP URLs - not an IPFS hash
  if (hashOrUrl.startsWith("http://") || hashOrUrl.startsWith("https://")) {
    return null;
  }

  // Pure IPFS hash
  return hashOrUrl;
}

/**
 * Fetch data from IPFS with gateway fallback and caching
 * Handles multiple formats:
 * - Pure IPFS hash: QmXxx... or bafyxxx...
 * - IPFS protocol URL: ipfs://QmXxx...
 * - Gateway URL: https://gateway.pinata.cloud/ipfs/QmXxx...
 */
export async function fetchFromIPFS<T = any>(hashOrUrl: string): Promise<T | null> {
  if (!hashOrUrl || hashOrUrl === "QmPlaceholder") {
    return null;
  }

  // Check cache first
  const cached = ipfsCache.get(hashOrUrl);
  if (cached && Date.now() - cached.timestamp < IPFS_CACHE_TTL) {
    return cached.data as T;
  }

  // Extract the pure hash
  const hash = extractIPFSHash(hashOrUrl);

  if (!hash) {
    // It's a regular URL, try to fetch directly
    try {
      const response = await fetch(hashOrUrl, {
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = (await response.json()) as T;
        ipfsCache.set(hashOrUrl, { data, timestamp: Date.now() });
        return data;
      }
    } catch (error) {
      console.warn(`Failed to fetch from URL: ${hashOrUrl}`);
    }
    return null;
  }

  // Check cache with hash key too
  const cachedByHash = ipfsCache.get(hash);
  if (cachedByHash && Date.now() - cachedByHash.timestamp < IPFS_CACHE_TTL) {
    return cachedByHash.data as T;
  }

  // Try each gateway until one succeeds
  for (const gateway of IPFS_GATEWAYS) {
    try {
      const url = `${gateway}${hash}`;
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
        // Set a timeout
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        console.warn(`Gateway ${gateway} returned ${response.status} for ${hash}`);
        continue;
      }

      const data = await response.json();
      // Cache with both keys
      const cacheEntry = { data, timestamp: Date.now() };
      ipfsCache.set(hash, cacheEntry);
      ipfsCache.set(hashOrUrl, cacheEntry);
      return data as T;
    } catch (error) {
      // Try next gateway
      continue;
    }
  }

  // Cache null result to prevent repeated failed fetches
  ipfsCache.set(hashOrUrl, { data: null, timestamp: Date.now() });
  console.warn(`Failed to fetch IPFS data from hash: ${hash}`);
  return null;
}

/**
 * Upload a file (image) to IPFS via Pinata
 */
export async function uploadFileToIPFS(file: File): Promise<string> {
  const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT;

  if (!pinataJWT) {
    console.warn("PINATA_JWT not configured, cannot upload to IPFS");
    throw new Error("IPFS upload not configured");
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    const pinataMetadata = JSON.stringify({
      name: file.name,
    });
    formData.append("pinataMetadata", pinataMetadata);

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pinataJWT}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.IpfsHash;
  } catch (error) {
    console.error("Failed to upload file to IPFS:", error);
    throw error;
  }
}

/**
 * Upload property metadata to IPFS via Pinata
 */
export async function uploadPropertyMetadataToIPFS(metadata: PropertyMetadata): Promise<string> {
  const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT;

  if (!pinataJWT) {
    console.warn("PINATA_JWT not configured, using placeholder");
    return "QmPlaceholder";
  }

  try {
    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pinataJWT}`,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `property-${metadata.name}`,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.IpfsHash;
  } catch (error) {
    console.error("Failed to upload property metadata to IPFS:", error);
    throw error;
  }
}

/**
 * Upload room type metadata to IPFS
 */
export async function uploadRoomTypeMetadataToIPFS(roomType: RoomTypeData): Promise<string> {
  const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT;

  if (!pinataJWT) {
    console.warn("PINATA_JWT not configured, using placeholder");
    return "QmPlaceholder";
  }

  try {
    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pinataJWT}`,
      },
      body: JSON.stringify({
        pinataContent: roomType,
        pinataMetadata: {
          name: `room-type-${roomType.name}`,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Pinata upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.IpfsHash;
  } catch (error) {
    console.error("Failed to upload room type metadata to IPFS:", error);
    throw error;
  }
}

/**
 * Format IPFS hash for display
 */
export function formatIPFSHash(hash: string): string {
  if (!hash || hash === "QmPlaceholder") {
    return "No IPFS hash";
  }
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

/**
 * Get direct IPFS gateway URL
 * Handles multiple formats:
 * - Pure IPFS hash: QmXxx... or bafyxxx...
 * - IPFS protocol URL: ipfs://QmXxx...
 * - Already a gateway URL: https://gateway.pinata.cloud/ipfs/QmXxx...
 * - Regular HTTP URL: https://...
 */
export function getIPFSUrl(hashOrUrl: string, preferredGateway = 0): string {
  if (!hashOrUrl || hashOrUrl === "QmPlaceholder") {
    return "";
  }

  // Already a full HTTP(S) URL - return as is
  if (hashOrUrl.startsWith("http://") || hashOrUrl.startsWith("https://")) {
    return hashOrUrl;
  }

  // IPFS protocol URL - extract hash
  if (hashOrUrl.startsWith("ipfs://")) {
    const hash = hashOrUrl.replace("ipfs://", "");
    return `${IPFS_GATEWAYS[preferredGateway]}${hash}`;
  }

  // Pure IPFS hash (Qm... or bafy...)
  return `${IPFS_GATEWAYS[preferredGateway]}${hashOrUrl}`;
}
