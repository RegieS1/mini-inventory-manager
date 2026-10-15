import { Sidebar } from "@/components/sidebar";
import { getBranding } from "@/lib/branding";
import { currentAccount } from "@/lib/accounts";
import { emptyPermissions } from "@/lib/permissions";

export async function SessionSidebar() {
  const [account, branding] = await Promise.all([currentAccount(), getBranding()]);

  return (
    <Sidebar
      permissions={account?.permissions ?? emptyPermissions()}
      shopName={branding.shopName}
      logoUrl={branding.logoUrl}
    />
  );
}
