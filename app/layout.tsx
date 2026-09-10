import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Endpoint Explorer",
  description:
    "Understand how your trial endpoint is behaving. Product concept built on synthetic demo data.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
