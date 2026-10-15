"use client";

import { useActionState } from "react";
import { setAccountStatus, type AccountStatusState } from "@/app/configuration/actions";

export function AccountStatusButton({ username, active }: { username: string; active: boolean }) {
  const [state, action, pending] = useActionState(setAccountStatus, { error: null } satisfies AccountStatusState);

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="username" value={username} />
      <input type="hidden" name="active" value={active ? "false" : "true"} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold transition hover:bg-canvas active:translate-y-px disabled:opacity-60"
      >
        {pending ? "Saving..." : active ? "Disable" : "Enable"}
      </button>
      {state.error ? <p className="text-xs text-stock-out">{state.error}</p> : null}
    </form>
  );
}
