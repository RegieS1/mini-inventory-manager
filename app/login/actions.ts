"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAccount } from "@/lib/accounts";
import { createSessionValue, sessionCookieName } from "@/lib/session";

export type SignInState = {
  error: string | null;
  username: string;
};

export async function signIn(state: SignInState, formData: FormData): Promise<SignInState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  const account = await verifyAccount(username, password);

  if (!account) {
    return { error: "That username or password is incorrect.", username };
  }

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName(), await createSessionValue(account.username), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  redirect("/");
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName());
  redirect("/welcome");
}
