/**
 * User Store
 * Manages user profile and preferences (client-side only)
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Address } from "viem";

export type UserRole = "traveler" | "host" | "both";

export interface UserProfile {
  address: Address | null;
  role: UserRole;
  hasHostSBT: boolean;
  hasTravelerSBT: boolean;
  preferredCurrency: "USDC" | "EURC";
  language: "en" | "fr" | "es" | "de";
  emailNotifications: boolean;
  walletNotifications: boolean;
}

interface UserState {
  // User profile
  profile: UserProfile;

  // Preferences
  theme: "light" | "dark" | "system";

  // Actions
  setProfile: (profile: Partial<UserProfile>) => void;
  setRole: (role: UserRole) => void;
  setPreferredCurrency: (currency: "USDC" | "EURC") => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  resetProfile: () => void;
}

const defaultProfile: UserProfile = {
  address: null,
  role: "traveler",
  hasHostSBT: false,
  hasTravelerSBT: false,
  preferredCurrency: "USDC",
  language: "en",
  emailNotifications: true,
  walletNotifications: true,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      // Initial state
      profile: defaultProfile,
      theme: "system",

      // Actions
      setProfile: (newProfile) =>
        set((state) => ({
          profile: { ...state.profile, ...newProfile },
        })),

      setRole: (role) =>
        set((state) => ({
          profile: { ...state.profile, role },
        })),

      setPreferredCurrency: (currency) =>
        set((state) => ({
          profile: { ...state.profile, preferredCurrency: currency },
        })),

      setTheme: (theme) => set({ theme }),

      resetProfile: () =>
        set({
          profile: defaultProfile,
        }),
    }),
    {
      name: "nomadnodes-user",
    }
  )
);
