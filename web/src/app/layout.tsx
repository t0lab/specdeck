import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted IBM Plex (subset: latin + latin-ext + Vietnamese). Static instances
// 400/500/600 for Sans, 400/500 for Mono — no CDN requests (FR-006 / SC-005).
const plexSans = localFont({
  src: [
    { path: "../fonts/IBMPlexSans-Regular-subset.ttf", weight: "400", style: "normal" },
    { path: "../fonts/IBMPlexSans-Medium-subset.ttf", weight: "500", style: "normal" },
    { path: "../fonts/IBMPlexSans-SemiBold-subset.ttf", weight: "600", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const plexMono = localFont({
  src: [
    { path: "../fonts/IBMPlexMono-Regular-subset.ttf", weight: "400", style: "normal" },
    { path: "../fonts/IBMPlexMono-Medium-subset.ttf", weight: "500", style: "normal" },
  ],
  variable: "--font-mono",
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
});

export const metadata: Metadata = {
  title: "SpecDeck",
  description:
    "Control deck for orchestrating async coding agents — review specs, not diffs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
