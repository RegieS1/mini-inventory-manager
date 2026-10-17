import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { viewSample } from "@/app/welcome/actions";
import { BrandMark } from "@/components/brand-mark";
import { InstallAppButton } from "@/components/install-app-button";
import { currentAccount, guestPassword, guestUsername } from "@/lib/accounts";
import { getBranding } from "@/lib/branding";

export const metadata: Metadata = {
  title: "Kugi",
  description: "Look through a sample shop, or sign in to the real one.",
};

async function Landing() {
  const [branding, account] = await Promise.all([getBranding(), currentAccount()]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-10 text-ink">
      <div className="flex items-center gap-3">
        <BrandMark shopName={branding.shopName} logoUrl={branding.logoUrl} />
        <div>
          <p className="text-[15px] font-semibold leading-5">Kugi</p>
          <p className="text-xs text-muted">{branding.shopName}</p>
        </div>
      </div>
      <h1 className="mt-8 text-2xl font-semibold tracking-tight md:text-[28px]">One shop. Products, stock in, and stock out.</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
        View the sample to look through the products and stock history already stored here. The sample can only read. It
        cannot add products, record stock, or change accounts.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <form action={viewSample}>
          <button
            type="submit"
            className="rounded-lg bg-copper px-4 py-2.5 text-sm font-semibold text-on-copper transition hover:brightness-110 active:translate-y-px active:brightness-90"
          >
            View sample
          </button>
        </form>
        {account ? (
          <Link href="/" className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold">
            Continue to the shop
          </Link>
        ) : (
          <Link href="/login" className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold">
            Sign in
          </Link>
        )}
      </div>
      <p className="mt-4 text-sm text-muted">
        Sample sign-in: <span className="font-semibold text-ink">{guestUsername}</span> · password{" "}
        <span className="font-semibold text-ink">{guestPassword}</span>
      </p>
      <section className="mt-10 rounded-xl border border-line bg-surface p-5">
        <h2 className="font-semibold">On a phone</h2>
        <div className="mt-4">
          <InstallAppButton />
        </div>
      </section>
      <section className="mt-4 rounded-xl border border-line bg-surface p-5">
        <h2 className="font-semibold">On a computer</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Open this same page in the browser. There is no separate installer. View sample opens the shop stored in Kugi.
        </p>
      </section>
    </main>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<p className="px-5 py-10 text-sm text-muted">Loading Kugi...</p>}>
      <Landing />
    </Suspense>
  );
}
