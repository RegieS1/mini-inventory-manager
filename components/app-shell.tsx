"use client";

import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { SetupNotice } from "@/components/setup-notice";
import { SidebarFallback } from "@/components/sidebar";

function Frame({
  notice,
  sidebar,
  children,
}: {
  notice: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/welcome" || pathname === "/login" || pathname.startsWith("/login/")) {
    return <div className="min-h-full bg-canvas text-ink">{children}</div>;
  }

  return (
    <div className="flex min-h-full flex-col bg-canvas text-ink md:flex-row">
      <Suspense fallback={<SidebarFallback />}>{sidebar}</Suspense>
      <div className="flex w-full min-w-0 flex-1 flex-col overflow-x-hidden">
        {notice}
        <main className="w-full min-w-0 flex-1 overflow-x-hidden px-4 py-5 pb-24 md:px-7 md:py-7 md:pb-7">{children}</main>
      </div>
    </div>
  );
}

export function AppShell({
  configured,
  sidebar,
  children,
}: {
  configured: boolean;
  sidebar: ReactNode;
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<SidebarFallback />}>
      <Frame notice={<SetupNotice configured={configured} />} sidebar={sidebar}>
        {children}
      </Frame>
    </Suspense>
  );
}
