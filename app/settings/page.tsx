import { ShopSettingsForm } from "@/components/shop-settings-form";
import { PageHeader } from "@/components/page-header";
import { allows } from "@/lib/accounts";
import { getBranding } from "@/lib/branding";

export const instant = false;

export default async function SettingsPage() {
  if (!(await allows("settings", "read"))) {
    return <p className="text-sm text-muted">Your account cannot open settings.</p>;
  }

  const branding = await getBranding();
  const canWrite = await allows("settings", "write");

  return (
    <>
      <PageHeader
        title="Settings"
        description="The app name is Kugi. The store name and logo are yours to change."
      />
      {canWrite ? (
        <ShopSettingsForm shopName={branding.shopName} logoUrl={branding.logoUrl} />
      ) : (
        <p className="mt-6 text-sm text-muted">
          {branding.shopName}. Your account can view settings, and cannot change them.
        </p>
      )}
    </>
  );
}
