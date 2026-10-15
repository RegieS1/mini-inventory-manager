"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { signIn, type SignInState } from "@/app/login/actions";

export function LoginScreen({ shopName, logoUrl }: { shopName: string; logoUrl: string | null }) {
  const [state, action, pending] = useActionState(signIn, {
    error: null,
    username: "",
  } satisfies SignInState);
  const [username, setUsername] = useState(state.username);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="order-2 flex min-w-0 flex-col justify-center bg-canvas px-5 py-8 text-ink lg:order-1 lg:flex-1 lg:px-10 lg:py-12">
        <h2 className="text-base font-semibold tracking-tight lg:text-[28px]">One shop. Products, stock in, and stock out.</h2>
        <p className="mt-3 text-sm leading-6 text-muted">Sign in with the account your admin created.</p>
      </aside>
      <section className="order-1 flex w-full shrink-0 items-center justify-center bg-sidebar px-5 py-8 text-on-copper lg:order-2 lg:w-[480px] lg:px-8 lg:py-16">
        <form action={action} className="flex w-full flex-col gap-4">
          <div className="flex items-center gap-3">
            <BrandMark shopName={shopName} logoUrl={logoUrl} />
            <div>
              <p className="text-[15px] font-semibold leading-5">Kugi</p>
              <p className="text-xs text-sidebar-muted">{shopName}</p>
            </div>
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight lg:text-[28px]">Sign in</h1>
            <p className="mt-1 text-sm text-sidebar-muted">Username and password for this shop.</p>
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Username
            <input
              name="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
              placeholder="Admin"
              className="h-11 rounded-lg border border-line bg-surface px-3 font-normal text-ink placeholder:text-muted"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="h-11 rounded-lg border border-line bg-surface px-3 font-normal text-ink"
            />
          </label>
          {state.error ? (
            <p role="alert" className="text-sm text-copper-soft">
              {state.error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="h-11 rounded-lg bg-copper text-sm font-semibold text-on-copper transition hover:brightness-110 active:translate-y-px active:brightness-90 disabled:opacity-60"
          >
            {pending ? "Signing in..." : "Sign in"}
          </button>
          <Link href="/welcome" className="self-start text-sm font-semibold text-on-copper">
            View the sample
          </Link>
        </form>
      </section>
    </div>
  );
}
