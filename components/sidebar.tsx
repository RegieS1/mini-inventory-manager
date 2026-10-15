"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { BrandMark } from "@/components/brand-mark";
import { clearNavStack, currentHref, markSidebarNav, trackHref } from "@/components/back-button";
import { signOut } from "@/app/login/actions";
import type { Permissions } from "@/lib/permissions";

const navItems = [
  { href: "/", label: "Dashboard", short: "Home", section: null },
  { href: "/products", label: "Products", short: "Products", section: "products" },
  { href: "/movements", label: "Stock Movements", short: "Stock", section: "movements" },
  { href: "/configuration", label: "Configuration", short: "Config", section: "accounts" },
  { href: "/settings", label: "Settings", short: "Settings", section: "settings" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({
  permissions,
  shopName,
  logoUrl,
}: {
  permissions: Permissions;
  shopName: string;
  logoUrl: string | null;
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  const href = currentHref(pathname, search.toString());
  const items = navItems.filter((item) => item.section === null || permissions[item.section].read);

  useEffect(() => {
    trackHref(href);
  }, [href]);

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-sidebar px-4 py-3 text-on-copper md:hidden">
        <BrandMark shopName={shopName} logoUrl={logoUrl} className="size-8 text-sm" />
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-5">Kugi</p>
          <p className="truncate text-xs text-sidebar-muted">{shopName}</p>
        </div>
        <form action={signOut} className="ml-auto" onSubmit={clearNavStack}>
          <button type="submit" suppressHydrationWarning className="rounded-lg px-3 py-2 text-sm font-medium text-on-copper">
            Log out
          </button>
        </form>
      </header>
      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-sidebar-raised bg-sidebar px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 text-on-copper md:hidden"
        aria-label="Main"
      >
        {items.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => markSidebarNav(item.href)}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center rounded-lg px-1 py-2 text-[11px] leading-4 ${
                active ? "font-semibold text-on-copper" : "font-medium text-sidebar-muted"
              }`}
            >
              {item.short}
            </Link>
          );
        })}
      </nav>
      <aside className="hidden w-[248px] shrink-0 flex-col bg-sidebar px-4 py-6 text-on-copper md:flex md:min-h-screen">
        <div className="flex items-center gap-3">
          <BrandMark shopName={shopName} logoUrl={logoUrl} />
          <div>
            <p className="text-[15px] font-semibold leading-5">Kugi</p>
            <p className="text-xs text-sidebar-muted">{shopName}</p>
          </div>
        </div>
        <nav className="mt-6 flex flex-col gap-1" aria-label="Main">
          {items.map((item) => {
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => markSidebarNav(item.href)}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper ${
                  active
                    ? "bg-sidebar-raised font-semibold text-on-copper"
                    : "font-medium text-sidebar-muted hover:bg-sidebar-raised/60"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <form action={signOut} onSubmit={clearNavStack}>
            <button
              type="submit"
              suppressHydrationWarning
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-sidebar-muted hover:bg-sidebar-raised/60"
            >
              Log out
            </button>
          </form>
          <p className="mt-3 text-xs text-sidebar-muted">Single shop · PHP (₱)</p>
        </div>
      </aside>
    </>
  );
}

export function SidebarFallback() {
  return (
    <aside className="flex w-full shrink-0 flex-col bg-sidebar px-4 py-5 md:min-h-screen md:w-[248px]" />
  );
}
