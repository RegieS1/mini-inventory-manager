"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { guestPassword, guestUsername, verifyAccount } from "@/lib/accounts";
import { createSessionValue, sessionCookieName } from "@/lib/session";

export async function viewSample() {
  const account = await verifyAccount(guestUsername, guestPassword);

  if (!account) {
    redirect("/welcome");
  }

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName(), await createSessionValue(account.username), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  redirect("/products");
}
