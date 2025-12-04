/**
 * UI Store
 * Manages global UI state (modals, sidebars, notifications)
 */

import { create } from "zustand";

export type ModalType =
  | "wallet-connect"
  | "property-details"
  | "booking-confirmation"
  | "review-submit"
  | "dispute-resolution"
  | null;

interface Modal {
  type: ModalType;
  data?: any;
}

interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number;
}

interface UIState {
  // Modal state
  modal: Modal;

  // Sidebar state
  isSidebarOpen: boolean;
  sidebarView: "menu" | "filters" | "notifications" | null;

  // Notifications
  notifications: Notification[];

  // Loading states
  globalLoading: boolean;
  loadingMessage: string;

  // Actions - Modal
  openModal: (type: ModalType, data?: any) => void;
  closeModal: () => void;

  // Actions - Sidebar
  toggleSidebar: () => void;
  setSidebarView: (view: "menu" | "filters" | "notifications" | null) => void;
  closeSidebar: () => void;

  // Actions - Notifications
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Actions - Loading
  setGlobalLoading: (loading: boolean, message?: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  modal: { type: null },
  isSidebarOpen: false,
  sidebarView: null,
  notifications: [],
  globalLoading: false,
  loadingMessage: "",

  // Modal actions
  openModal: (type, data) =>
    set({
      modal: { type, data },
    }),

  closeModal: () =>
    set({
      modal: { type: null },
    }),

  // Sidebar actions
  toggleSidebar: () =>
    set((state) => ({
      isSidebarOpen: !state.isSidebarOpen,
    })),

  setSidebarView: (view) =>
    set({
      sidebarView: view,
      isSidebarOpen: view !== null,
    }),

  closeSidebar: () =>
    set({
      isSidebarOpen: false,
      sidebarView: null,
    }),

  // Notification actions
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          ...notification,
          id: Date.now().toString(),
        },
      ],
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () =>
    set({
      notifications: [],
    }),

  // Loading actions
  setGlobalLoading: (loading, message = "") =>
    set({
      globalLoading: loading,
      loadingMessage: message,
    }),
}));
