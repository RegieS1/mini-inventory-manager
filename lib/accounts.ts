import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { readFileSync } from "fs";
import path from "path";
import { cache } from "react";
import { cookies } from "next/headers";
import {
  adminPermissions,
  closedPermissions,
  emptyPermissions,
  grantsExtraPermissions,
  permissionActions,
  permissionSections,
  type PermissionAction,
  type PermissionSection,
  type Permissions,
} from "@/lib/permissions";
import { sessionCookieName, usernameFromSession } from "@/lib/session";
import { createSupabaseServerClient, getSupabaseServerConfig } from "@/lib/supabase/server";

const adminUsername = "admin";
const adminPassword = "Epanesrs";
const adminEmail = "suminguitr3gie@gmail.com";

export const guestUsername = "guest";
export const guestPassword = "sample";

type StoredAccount = {
  username: string;
  email?: string;
  passwordHash: string;
  active?: boolean;
  permissions: Permissions;
};

type AccountRow = {
  username: string;
  email: string | null;
  password_hash: string;
  active: boolean;
  permissions: Permissions;
};

export type AccountSummary = {
  username: string;
  active: boolean;
  permissions: Permissions;
};

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

function passwordMatches(password: string, stored: string) {
  const [salt, hash] = stored.split(":");

  if (!salt || !hash) {
    return false;
  }

  const next = scryptSync(password, salt, 32);
  const previous = Buffer.from(hash, "hex");

  return next.length === previous.length && timingSafeEqual(next, previous);
}

function normalizePermissions(value: Permissions): Permissions {
  const permissions = emptyPermissions();

  for (const section of permissionSections) {
    for (const action of permissionActions) {
      permissions[section][action] = Boolean(value?.[section]?.[action]);
    }

    if (!permissions[section].read) {
      permissions[section].write = false;
      permissions[section].edit = false;
      permissions[section].delete = false;
    }

    for (const action of closedPermissions[section] ?? []) {
      permissions[section][action] = false;
    }
  }

  return permissions;
}

function hostedHint(message: string) {
  if (message.includes("accounts")) {
    return `${message} Run supabase/hosted.sql in the Supabase SQL editor.`;
  }

  return message;
}

function guestPermissions(): Permissions {
  const permissions = emptyPermissions();
  permissions.products.read = true;
  permissions.movements.read = true;
  return permissions;
}

function samePermissions(left: Permissions, right: Permissions) {
  return permissionSections.every((section) =>
    permissionActions.every((action) => left[section][action] === right[section][action]),
  );
}

function fromRow(row: AccountRow): StoredAccount {
  return {
    username: row.username,
    email: row.email ?? undefined,
    passwordHash: row.password_hash,
    active: row.active,
    permissions: row.permissions,
  };
}

function toRow(account: StoredAccount): AccountRow {
  return {
    username: account.username,
    email: account.email ?? null,
    password_hash: account.passwordHash,
    active: account.active !== false,
    permissions: normalizePermissions(account.permissions),
  };
}

async function saveAccount(account: StoredAccount) {
  const { error } = await createSupabaseServerClient().from("accounts").upsert(toRow(account));

  if (error) {
    throw new Error(hostedHint(error.message));
  }
}

function readLocalAccounts(): StoredAccount[] | null {
  try {
    const parsed = JSON.parse(readFileSync(path.join(process.cwd(), "data", "accounts.json"), "utf8")) as StoredAccount[];
    if (!Array.isArray(parsed) || !parsed.some((account) => account.username === adminUsername)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

async function ensureGuest(accounts: StoredAccount[]) {
  const expected = guestPermissions();
  let guest = accounts.find((account) => account.username === guestUsername);
  let changed = false;

  if (!guest) {
    guest = {
      username: guestUsername,
      active: true,
      passwordHash: hashPassword(guestPassword),
      permissions: expected,
    };
    accounts.push(guest);
    changed = true;
  }

  if (guest.active === false) {
    guest.active = true;
    changed = true;
  }

  if (!samePermissions(normalizePermissions(guest.permissions), expected)) {
    guest.permissions = expected;
    changed = true;
  }

  if (!passwordMatches(guestPassword, guest.passwordHash)) {
    guest.passwordHash = hashPassword(guestPassword);
    changed = true;
  }

  if (changed) {
    await saveAccount(guest);
  }

  return accounts;
}

async function ensureAdminEmail(accounts: StoredAccount[]) {
  const admin = accounts.find((account) => account.username === adminUsername);

  if (!admin || admin.email === adminEmail) {
    return accounts;
  }

  admin.email = adminEmail;
  await saveAccount(admin);
  return accounts;
}

const loadAccounts = cache(async () => {
  if (!getSupabaseServerConfig()) {
    return [] as StoredAccount[];
  }

  const { data, error } = await createSupabaseServerClient()
    .from("accounts")
    .select("username,email,password_hash,active,permissions")
    .order("created_at");

  if (error) {
    throw new Error(hostedHint(error.message));
  }

  let accounts = ((data ?? []) as AccountRow[]).map(fromRow);

  if (!accounts.some((account) => account.username === adminUsername)) {
    const local = readLocalAccounts();
    const seeded = local ?? [
      {
        username: adminUsername,
        email: adminEmail,
        passwordHash: hashPassword(adminPassword),
        active: true,
        permissions: adminPermissions(),
      },
    ];

    for (const account of seeded) {
      await saveAccount(account);
    }

    accounts = seeded;
  }

  accounts = await ensureGuest(accounts);
  return ensureAdminEmail(accounts);
});

function summarize(account: StoredAccount): AccountSummary {
  return {
    username: account.username,
    active: account.active !== false,
    permissions: normalizePermissions(account.permissions),
  };
}

function notConfigured() {
  return { error: "Supabase is not configured." };
}

export async function listAccounts() {
  return (await loadAccounts()).map(summarize);
}

export async function verifyAccount(username: string, password: string) {
  const name = username.trim().toLowerCase();
  const accounts = await loadAccounts();
  const account =
    accounts.find((item) => item.username === name) ??
    accounts.find((item) => item.email?.toLowerCase() === name);

  if (!account || account.active === false || !passwordMatches(password, account.passwordHash)) {
    return null;
  }

  return summarize(account);
}

export async function accountPermissions(username: string) {
  const account = (await loadAccounts()).find((item) => item.username === username.trim().toLowerCase());
  return account ? summarize(account).permissions : null;
}

export async function createStoredAccount(
  username: string,
  password: string,
  permissions: Permissions,
  actor: Permissions,
) {
  if (!getSupabaseServerConfig()) {
    return notConfigured();
  }

  const name = username.trim().toLowerCase();
  const accounts = await loadAccounts();
  const normalized = normalizePermissions(permissions);

  if (grantsExtraPermissions(actor, normalized)) {
    return { error: "You can only grant permissions your account already has." };
  }

  if (accounts.some((account) => account.username === name)) {
    return { error: "That username already exists." };
  }

  await saveAccount({
    username: name,
    active: true,
    passwordHash: hashPassword(password),
    permissions: normalized,
  });
  return { error: null };
}

export async function setAccountPassword(username: string, password: string) {
  if (!getSupabaseServerConfig()) {
    return notConfigured();
  }

  if (password.length < 4) {
    return { error: "Password must be at least 4 characters." };
  }

  if (username.trim().toLowerCase() === guestUsername) {
    return { error: "The sample account keeps the published password." };
  }

  const accounts = await loadAccounts();
  const account = accounts.find((item) => item.username === username);

  if (!account) {
    return { error: "That account was not found." };
  }

  account.passwordHash = hashPassword(password);
  await saveAccount(account);
  return { error: null };
}

export async function setAccountActive(username: string, active: boolean) {
  if (!getSupabaseServerConfig()) {
    return notConfigured();
  }

  const name = username.trim().toLowerCase();

  if (name === adminUsername) {
    return { error: "The admin account stays active." };
  }

  if (name === guestUsername) {
    return { error: "The sample account stays active." };
  }

  const accounts = await loadAccounts();
  const account = accounts.find((item) => item.username === name);

  if (!account) {
    return { error: "That account was not found." };
  }

  account.active = active;
  await saveAccount(account);
  return { error: null };
}

export async function deleteStoredAccount(username: string) {
  if (!getSupabaseServerConfig()) {
    return notConfigured();
  }

  const name = username.trim().toLowerCase();

  if (name === adminUsername) {
    return { error: "The admin account stays." };
  }

  if (name === guestUsername) {
    return { error: "The sample account stays." };
  }

  const accounts = await loadAccounts();

  if (!accounts.some((account) => account.username === name)) {
    return { error: "That account was not found." };
  }

  const { error } = await createSupabaseServerClient().from("accounts").delete().eq("username", name);

  if (error) {
    return { error: hostedHint(error.message) };
  }

  return { error: null };
}

export async function currentAccount() {
  const cookieStore = await cookies();
  const username = await usernameFromSession(cookieStore.get(sessionCookieName())?.value);

  if (!username) {
    return null;
  }

  const account = (await loadAccounts()).find((item) => item.username === username);

  if (!account || account.active === false) {
    return null;
  }

  return summarize(account);
}

export async function allows(section: PermissionSection, action: PermissionAction) {
  const account = await currentAccount();
  return Boolean(account?.permissions[section][action]);
}
