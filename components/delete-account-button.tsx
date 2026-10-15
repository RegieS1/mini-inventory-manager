"use client";

import { useActionState, useState } from "react";
import { deleteAccount } from "@/app/configuration/actions";

export function DeleteAccountButton({ username }: { username: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deleteAccount, { error: null });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-stock-out px-3 py-1.5 text-xs font-semibold text-stock-out"
      >
        Delete
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="username" value={username} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-stock-out px-3 py-1.5 text-xs font-semibold text-on-copper disabled:opacity-60"
      >
        {pending ? "Deleting..." : "Confirm delete"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold"
      >
        Cancel
      </button>
      {state.error ? <p className="text-xs text-stock-out">{state.error}</p> : null}
    </form>
  );
}
