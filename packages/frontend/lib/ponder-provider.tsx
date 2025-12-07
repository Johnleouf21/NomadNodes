"use client";

import { PonderProvider } from "@ponder/react";
import { ponderClient } from "./ponder-client";
import { ReactNode } from "react";

// Note: This provider must be wrapped inside a QueryClientProvider
// The QueryClient is provided by ContextProvider (context/index.tsx)
export function PonderClientProvider({ children }: { children: ReactNode }) {
  return <PonderProvider client={ponderClient}>{children}</PonderProvider>;
}
