import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { SessionSidebar } from "@/components/session-sidebar";
import { AppShell } from "@/components/app-shell";
import { RegisterServiceWorker } from "@/components/register-service-worker";
import { SidebarFallback } from "@/components/sidebar";
import { getSupabaseServerConfig } from "@/lib/supabase/server";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kugi",
  description: "Inventory for a small shop",
  applicationName: "Kugi",
  appleWebApp: {
    capable: true,
    title: "Kugi",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1b2420",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <RegisterServiceWorker />
        <AppShell
          configured={getSupabaseServerConfig() !== null}
          sidebar={
            <Suspense fallback={<SidebarFallback />}>
              <SessionSidebar />
            </Suspense>
          }
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
