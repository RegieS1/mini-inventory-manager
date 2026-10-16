"use client";

import { useActionState } from "react";
import { setPassword, type SetPasswordState } from "@/app/configuration/actions";

export function SetPasswordButton({ username }: { username: string }) {
  const [state, action, pending] = useActionState(setPassword, {
    error: null,
    saved: false,
  } satisfies SetPasswordState);

  return (
    <form action={action} className="flex w-full min-w-0 items-center gap-2">
      <input type="hidden" name="username" value={username} />
      <input
        name="password"
        type="password"
        required
        minLength={4}
        autoComplete="new-password"
        placeholder="New password"
        aria-label={`New password for ${username}`}
        className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-copper px-3 py-1.5 text-xs font-semibold text-on-copper transition hover:brightness-110 active:translate-y-px disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save"}
      </button>
      {state.error ? <p className="text-xs text-stock-out">{state.error}</p> : null}
      {state.saved ? <p className="text-xs text-stock-in">{username} can sign in with the new password.</p> : null}
    </form>
  );
}
