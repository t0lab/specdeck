"use client";

import { useSyncExternalStore } from "react";

// Reactive read of prefers-reduced-motion via useSyncExternalStore (no effect /
// setState, SSR-safe). CSS animations/transitions are already stilled by the
// media query in globals.css; this hook is for the JS-driven exceptions (e.g.
// dnd-kit's drop animation) that CSS can't reach.
const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void): () => void {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
