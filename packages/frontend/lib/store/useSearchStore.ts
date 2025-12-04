/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Search Store
 * Manages property search filters and state
 */

import { create } from "zustand";
import { persist, StorageValue } from "zustand/middleware";

export interface SearchFilters {
  location: string;
  checkIn: Date | null;
  checkOut: Date | null;
  guests: number;
  priceRange: [number, number];
  propertyType: string[];
  amenities: string[];
}

interface SearchState {
  // Search filters
  filters: SearchFilters;

  // Search results state
  isSearching: boolean;
  searchQuery: string;

  // Actions
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  setSearchQuery: (query: string) => void;
  setIsSearching: (isSearching: boolean) => void;
}

const defaultFilters: SearchFilters = {
  location: "",
  checkIn: null,
  checkOut: null,
  guests: 1,
  priceRange: [0, 1000],
  propertyType: [],
  amenities: [],
};

// Helper to parse dates from localStorage (they get serialized as strings)
function parseStoredFilters(stored: any): SearchFilters {
  if (!stored) return defaultFilters;

  return {
    ...defaultFilters,
    ...stored,
    // Convert string dates back to Date objects
    checkIn: stored.checkIn ? new Date(stored.checkIn) : null,
    checkOut: stored.checkOut ? new Date(stored.checkOut) : null,
  };
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      // Initial state
      filters: defaultFilters,
      isSearching: false,
      searchQuery: "",

      // Actions
      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),

      resetFilters: () =>
        set({
          filters: defaultFilters,
          searchQuery: "",
        }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      setIsSearching: (isSearching) => set({ isSearching }),
    }),
    {
      name: "nomadnodes-search",
      partialize: (state) => ({ filters: state.filters }), // Only persist filters
      // Custom storage to handle Date serialization/deserialization
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;

          try {
            const parsed = JSON.parse(str);
            return {
              ...parsed,
              state: {
                ...parsed.state,
                filters: parseStoredFilters(parsed.state?.filters),
              },
            };
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);
