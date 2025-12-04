"use client";

import { PonderProvider } from "@ponder/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ponderClient } from "./ponder-client";
import { ReactNode, useState } from "react";

export function PonderClientProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 5000, // 5 seconds
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <PonderProvider client={ponderClient}>{children}</PonderProvider>
    </QueryClientProvider>
  );
}
