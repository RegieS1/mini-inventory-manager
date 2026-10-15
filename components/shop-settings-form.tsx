"use client";

import { useActionState } from "react";
import { saveSettings, type SettingsState } from "@/app/settings/actions";
import { BrandMark } from "@/components/brand-mark";

export function ShopSettingsForm({ shopName, logoUrl }: { shopName: string; logoUrl: string | null }) {
  const [state, action, pending] = useActionState(saveSettings, {
    error: null,
    saved: false,
  } satisfies SettingsState);

  return (
    <form action={action} className="mt-6 max-w-xl rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center gap-3">
        <BrandMark shopName={shopName} logoUrl={logoUrl} />
        <div>
          <p className="text-sm font-semibold">Kugi</p>
          <p className="text-xs text-muted">{shopName}</p>
        </div>
      </div>
      <label className="mt-4 flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Store name</span>
        <input
          name="shopName"
          defaultValue={shopName}
          required
          className="h-11 rounded-lg border border-line bg-surface px-3"
        />
      </label>
      <label className="mt-4 flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Logo</span>
        <input
          name="logo"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="h-11 w-full rounded-lg border border-line bg-surface px-2 text-sm file:mr-3 file:rounded-md file:border file:border-line file:bg-canvas file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink"
        />
        <span className="text-xs text-muted">PNG, JPEG, or WebP. Up to 1 MB. Leave empty to keep the current logo.</span>
      </label>
      {state.error ? (
        <p role="alert" className="mt-4 text-sm text-stock-out">
          {state.error}
        </p>
      ) : null}
      {state.saved ? <p className="mt-4 text-sm text-stock-in">Store name and logo are updated.</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-lg bg-copper px-4 py-2.5 text-sm font-semibold text-on-copper disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
