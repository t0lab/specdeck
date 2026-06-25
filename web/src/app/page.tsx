"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

// Empty = same origin: the browser hits /api/* on this domain, and the
// Cloudflare tunnel routes /api to the gateway. Set NEXT_PUBLIC_GATEWAY_URL
// for local non-docker dev (e.g. http://localhost:8000).
const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "";

export default function Home() {
  const [health, setHealth] = useState("—");
  const [ticks, setTicks] = useState<string[]>([]);

  async function pingGateway() {
    setHealth("…");
    try {
      const res = await fetch(`${GATEWAY}/api/health`);
      setHealth(JSON.stringify(await res.json()));
    } catch (err) {
      setHealth(`error: ${String(err)}`);
    }
  }

  function startStream() {
    setTicks([]);
    const es = new EventSource(`${GATEWAY}/api/stream`);
    es.addEventListener("tick", (e) =>
      setTicks((t) => [...t, (e as MessageEvent).data]),
    );
    es.addEventListener("done", () => es.close());
    es.onerror = () => es.close();
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-20">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">🎛️ SpecDeck</h1>
        <p className="text-muted-foreground">
          Skeleton — web → gateway → agent. Review at the intent level, not the
          diff.
        </p>
      </header>

      <section className="space-y-3 rounded-lg border p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-medium">Gateway health</h2>
          <Button size="sm" onClick={pingGateway}>
            Ping /health
          </Button>
        </div>
        <pre className="overflow-x-auto rounded bg-muted p-3 text-sm">
          {health}
        </pre>
      </section>

      <section className="space-y-3 rounded-lg border p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-medium">SSE stream</h2>
          <Button size="sm" variant="secondary" onClick={startStream}>
            Start /api/stream
          </Button>
        </div>
        <pre className="min-h-16 overflow-x-auto rounded bg-muted p-3 text-sm">
          {ticks.length ? ticks.join("\n") : "—"}
        </pre>
      </section>

      <footer className="mt-auto text-sm text-muted-foreground">
        Gateway: <code>{GATEWAY || "(same origin)"}</code>
      </footer>
    </main>
  );
}
