"use server";

import { revalidatePath } from "next/cache";
import {
  accountPermissions,
  allows,
  createStoredAccount,
  currentAccount,
  deleteStoredAccount,
  setAccountActive,
  setAccountPassword,
} from "@/lib/accounts";
import {
  grantsExtraPermissions,
  permissionActions,
  permissionSections,
  type PermissionAction,
  type Permissions,
} from "@/lib/permissions";

export type CreateAccountState = {
  error: string | null;
  saved: string | null;
};

export async function createAccount(
  state: CreateAccountState,
  formData: FormData,
): Promise<CreateAccountState> {
  if (!(await allows("accounts", "write"))) {
    return { error: "Your account cannot create accounts.", saved: null };
  }

  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!/^[A-Za-z0-9]{3,20}$/.test(username)) {
    return { error: "Username must be 3 to 20 letters or numbers.", saved: null };
  }

  if (password.length < 4) {
    return { error: "Password must be at least 4 characters.", saved: null };
  }

  const actor = await currentAccount();

  if (!actor) {
    return { error: "Sign in again before creating an account.", saved: null };
  }

  const permissions = {} as Permissions;

  for (const section of permissionSections) {
    permissions[section] = { read: false, write: false, edit: false, delete: false };

    for (const action of permissionActions) {
      permissions[section][action as PermissionAction] = formData.get(`${section}.${action}`) === "on";
    }
  }

  const result = await createStoredAccount(username, password, permissions, actor.permissions);

  if (result.error) {
    return { error: result.error, saved: null };
  }

  revalidatePath("/configuration");
  return { error: null, saved: `${username} can sign in with the switches you set.` };
}

export async function deleteAccount(state: { error: string | null }, formData: FormData) {
  if (!(await allows("accounts", "delete"))) {
    return { error: "Your account cannot delete accounts." };
  }

  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const current = await currentAccount();

  if (current?.username === username) {
    return { error: "Sign in with another admin account before deleting this one." };
  }

  const result = await deleteStoredAccount(username);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/configuration");
  return { error: null };
}

export type SetPasswordState = {
  error: string | null;
  saved: boolean;
};

export async function setPassword(state: SetPasswordState, formData: FormData): Promise<SetPasswordState> {
  if (!(await allows("accounts", "edit"))) {
    return { error: "Your account cannot change passwords.", saved: false };
  }

  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const actor = await currentAccount();

  if (username === "admin") {
    if (actor?.username !== "admin") {
      return { error: "Only the signed-in admin can change that password.", saved: false };
    }
  }

  if (username === "guest") {
    return { error: "The sample account keeps the published password.", saved: false };
  }

  const target = await accountPermissions(username);

  if (!target) {
    return { error: "That account was not found.", saved: false };
  }

  if (!actor || grantsExtraPermissions(actor.permissions, target)) {
    return { error: "You can only change a password for an account within your permissions.", saved: false };
  }

  const result = await setAccountPassword(username, password);

  if (result.error) {
    return { error: result.error, saved: false };
  }

  revalidatePath("/configuration");
  return { error: null, saved: true };
}

export type AccountStatusState = {
  error: string | null;
};

export async function setAccountStatus(
  state: AccountStatusState,
  formData: FormData,
): Promise<AccountStatusState> {
  if (!(await allows("accounts", "edit"))) {
    return { error: "Your account cannot change accounts." };
  }

  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const active = String(formData.get("active") ?? "") === "true";
  const actor = await currentAccount();
  const target = await accountPermissions(username);

  if (actor?.username === username) {
    return { error: "You cannot disable the account you are signed in with." };
  }

  if (!target) {
    return { error: "That account was not found." };
  }

  if (!actor || grantsExtraPermissions(actor.permissions, target)) {
    return { error: "You can only change an account within your permissions." };
  }

  const result = await setAccountActive(username, active);

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/configuration");
  return { error: null };
}
