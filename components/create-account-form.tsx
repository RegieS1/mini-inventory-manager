"use client";

import { useActionState, useState } from "react";
import { createAccount, type CreateAccountState } from "@/app/configuration/actions";
import {
  closedPermissions,
  permissionActions,
  permissionSectionLabels,
  permissionSections,
  type PermissionAction,
  type Permissions,
} from "@/lib/permissions";

type Grid = Record<string, Record<PermissionAction, boolean>>;

function initialGrid(ceiling: Permissions): Grid {
  return Object.fromEntries(
    permissionSections.map((section) => [
      section,
      {
        read: ceiling[section].read,
        write: ceiling[section].write,
        edit: ceiling[section].edit && !closedPermissions[section]?.includes("edit"),
        delete: ceiling[section].delete && !closedPermissions[section]?.includes("delete"),
      },
    ]),
  );
}

export function CreateAccountForm({ ceiling }: { ceiling: Permissions }) {
  const [grid, setGrid] = useState<Grid>(() => initialGrid(ceiling));
  const [state, action, pending] = useActionState(createAccount, {
    error: null,
    saved: null,
  } satisfies CreateAccountState);

  function toggle(sectionId: string, permission: PermissionAction) {
    const section = sectionId as keyof Permissions;
    const closed = closedPermissions[section]?.includes(permission);
    const held = ceiling[section][permission];

    if (closed || !held) {
      return;
    }

    setGrid((current) => {
      const row = { ...current[sectionId], [permission]: !current[sectionId][permission] };

      if (permission === "read" && !row.read) {
        row.write = false;
        row.edit = false;
        row.delete = false;
      }

      return { ...current, [sectionId]: row };
    });
  }

  return (
    <form action={action} className="mt-8 max-w-3xl">
      <h2 className="text-lg font-semibold">New account</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Username</span>
          <input name="username" required autoComplete="off" className="h-11 rounded-lg border border-line bg-surface px-3" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Password</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="new-password"
            className="h-11 rounded-lg border border-line bg-surface px-3"
          />
        </label>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-copper-soft text-xs text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Section</th>
              {permissionActions.map((permission) => (
                <th key={permission} className="px-4 py-3 font-medium capitalize">
                  {permission}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissionSections.map((section) => (
              <tr key={section} className="border-t border-line">
                <th scope="row" className="px-4 py-4 text-left font-semibold">
                  {permissionSectionLabels[section]}
                  {section === "movements" ? (
                    <p className="mt-1 text-xs font-normal text-muted">
                      Posted movements are kept. Edit and delete stay off.
                    </p>
                  ) : null}
                </th>
                {permissionActions.map((permission) => {
                  const isLocked = closedPermissions[section]?.includes(permission) ?? false;
                  const beyondAccount = !ceiling[section][permission];
                  const needsRead = permission !== "read" && !grid[section].read;

                  return (
                    <td key={permission} className="px-4 py-4">
                      <input
                        type="checkbox"
                        name={`${section}.${permission}`}
                        checked={grid[section][permission]}
                        disabled={isLocked || beyondAccount || needsRead}
                        onChange={() => toggle(section, permission)}
                        className="size-4 accent-copper disabled:opacity-40"
                        aria-label={`${permissionSectionLabels[section]} ${permission}`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {state.error ? (
        <p role="alert" className="mt-4 text-sm text-stock-out">
          {state.error}
        </p>
      ) : null}
      {state.saved ? <p className="mt-4 text-sm text-stock-in">{state.saved}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-lg bg-copper px-4 py-2.5 text-sm font-semibold text-on-copper disabled:opacity-60"
      >
        {pending ? "Saving..." : "Create account"}
      </button>
    </form>
  );
}
