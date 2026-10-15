import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginScreen } from "@/components/login-screen";
import { getBranding } from "@/lib/branding";

export const metadata: Metadata = {
  title: "Sign in · Kugi",
};

async function LoginForm() {
  const branding = await getBranding();

  return <LoginScreen shopName={branding.shopName} logoUrl={branding.logoUrl} />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginScreen shopName="" logoUrl={null} />}>
      <LoginForm />
    </Suspense>
  );
}
