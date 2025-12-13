"use client";

/**
 * Hook to manage check-in scanner state
 */

import * as React from "react";
import type { ScannedData, MatchedBooking, PendingCheckIn } from "../types";

/**
 * State management for check-in scanner
 */
export function useCheckInState() {
  const [activeTab, setActiveTab] = React.useState("manual");
  const [isScanning, setIsScanning] = React.useState(false);
  const [scannedData, setScannedData] = React.useState<ScannedData | null>(null);
  const [matchedBooking, setMatchedBooking] = React.useState<MatchedBooking | null>(null);
  const [selectedBookingId, setSelectedBookingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pendingBookingForCheckIn, setPendingBookingForCheckIn] =
    React.useState<PendingCheckIn | null>(null);

  const handleReset = React.useCallback(() => {
    setScannedData(null);
    setMatchedBooking(null);
    setSelectedBookingId(null);
    setPendingBookingForCheckIn(null);
    setError(null);
    setIsScanning(false);
  }, []);

  const handleOpenScanner = React.useCallback(() => {
    setIsScanning(true);
  }, []);

  return {
    // Tab state
    activeTab,
    setActiveTab,

    // Scanning state
    isScanning,
    setIsScanning,
    scannedData,
    setScannedData,

    // Booking state
    matchedBooking,
    setMatchedBooking,
    selectedBookingId,
    setSelectedBookingId,

    // Error state
    error,
    setError,

    // Pending check-in for chained calls
    pendingBookingForCheckIn,
    setPendingBookingForCheckIn,

    // Actions
    handleReset,
    handleOpenScanner,
  };
}
