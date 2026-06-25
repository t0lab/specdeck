"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Forward-looking data-layer scaffold. The mock feature reads its data
// synchronously (static imports) so NO query runs here yet — this provider
// exists so the shell is ready when the Gateway is wired, without a later
// refactor of the root layout.
//
// Lazy `useState` init keeps one QueryClient per mount and avoids sharing a
// single client across requests on the server.
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
