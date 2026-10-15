import { createHmac } from "node:crypto";

const cookieName = "stockflow_session";

function sign(username: string) {
  return createHmac("sha256", "stockflow-local-session").update(username).digest("hex");
}

export function sessionCookieName() {
  return cookieName;
}

export async function createSessionValue(username: string) {
  const name = username.trim().toLowerCase();
  return `${name}.${sign(name)}`;
}

export async function usernameFromSession(value: string | undefined) {
  if (!value) {
    return null;
  }

  const split = value.lastIndexOf(".");
  if (split <= 0) {
    return null;
  }

  const username = value.slice(0, split);
  const signature = value.slice(split + 1);

  if (!/^[a-z0-9]+$/.test(username) || signature !== sign(username)) {
    return null;
  }

  return username;
}

export async function isSessionValue(value: string | undefined) {
  return (await usernameFromSession(value)) !== null;
}
