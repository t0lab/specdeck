import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

// Boot-time env validation (fail-fast at build/start). Imported from the root
// layout so a malformed env is caught before any page renders.
//
// Mock-only feature: there are NO secrets here yet. Secrets/API keys live ONLY
// in the backend (Gateway / Agent Server) per the Constitution — never in the
// Next.js client. The single forward-looking var is the public Gateway URL,
// kept OPTIONAL so the mock app boots with no `.env` at all.
//
// `client` keys MUST be prefixed `NEXT_PUBLIC_` (t3-env enforces this at the
// type level); only those values are inlined into the browser bundle.
export const env = createEnv({
  server: {},
  client: {
    NEXT_PUBLIC_GATEWAY_URL: z.url().optional(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_GATEWAY_URL: process.env.NEXT_PUBLIC_GATEWAY_URL,
  },
  // Treat empty strings in `.env` as "unset" so optional vars stay optional.
  emptyStringAsUndefined: true,
});
