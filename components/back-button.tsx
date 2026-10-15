"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const STORAGE_KEY = "kugi-nav-stack";
const SIDEBAR_KEY = "kugi-nav-sidebar";

type Entry = {
  href: string;
  fromSidebar: boolean;
};

export function currentHref(pathname: string, search: string) {
  return search ? `${pathname}?${search}` : pathname;
}

function readStack() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (typeof item === "string") return [{ href: item, fromSidebar: false }];
      if (item && typeof item === "object" && typeof item.href === "string") {
        return [{ href: item.href, fromSidebar: item.fromSidebar === true }];
      }
      return [];
    });
  } catch {
    return [];
  }
}

function entryIndex(stack: Entry[], href: string) {
  for (let index = stack.length - 1; index >= 0; index -= 1) {
    if (stack[index].href === href) return index;
  }
  return -1;
}

export function markSidebarNav(href: string) {
  sessionStorage.setItem(SIDEBAR_KEY, href);
}

function consumeSidebarNav(href: string) {
  const marked = sessionStorage.getItem(SIDEBAR_KEY);
  sessionStorage.removeItem(SIDEBAR_KEY);
  return marked === href.split("?")[0];
}

const listeners = new Set<() => void>();

function writeStack(stack: Entry[]) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stack.slice(-30)));
  listeners.forEach((listener) => listener());
}

export function subscribeNav(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function trackHref(href: string) {
  const fromSidebar = consumeSidebarNav(href);
  const stack = readStack();
  const last = stack.at(-1);

  if (last?.href === href) {
    return;
  }

  if (stack.at(-2)?.href === href) {
    stack.pop();
  } else {
    stack.push({ href, fromSidebar });
  }

  writeStack(stack);
}

export function previousHref(href: string, fallback: string) {
  const stack = readStack();
  const index = entryIndex(stack, href);

  if (index > 0) {
    return stack[index - 1].href;
  }

  if (index === -1 && stack.length > 0) {
    return stack.at(-1)?.href ?? fallback;
  }

  return fallback;
}

export function clearNavStack() {
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(SIDEBAR_KEY);
}

export function showBack(href: string) {
  const stack = readStack();
  const index = entryIndex(stack, href);
  if (index <= 0) return false;

  const current = stack[index];
  const previousPath = stack[index - 1].href.split("?")[0];
  return !current.fromSidebar && previousPath !== href.split("?")[0];
}

export function BackButton({
  fallback,
  className,
  children,
}: {
  fallback: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        const href = `${window.location.pathname}${window.location.search}`;
        router.push(previousHref(href, fallback));
      }}
    >
      {children}
    </button>
  );
}

const backLinkClass =
  "group -ml-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-copper transition hover:bg-copper-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper";

export function HistoryBack({
  fallback = "/",
  className = "mb-3",
}: {
  fallback?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const update = () => setShow(showBack(`${window.location.pathname}${window.location.search}`));
    update();
    return subscribeNav(update);
  }, [pathname]);

  if (!show) return null;

  return (
    <BackButton fallback={fallback} className={`${backLinkClass} ${className}`}>
      <span aria-hidden className="inline-block transition-transform group-hover:-translate-x-0.5">
        ←
      </span>
      Back
    </BackButton>
  );
}
