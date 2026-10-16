import { AccountStatusButton } from "@/components/account-status-button";
import { CreateAccountForm } from "@/components/create-account-form";
import { DeleteAccountButton } from "@/components/delete-account-button";
import { SetPasswordButton } from "@/components/set-password-button";
import { PageHeader } from "@/components/page-header";
import { allows, currentAccount, guestUsername, listAccounts } from "@/lib/accounts";
import { grantsExtraPermissions, permissionSectionLabels, permissionSections } from "@/lib/permissions";

export const instant = false;

export default async function ConfigurationPage() {
  if (!(await allows("accounts", "read"))) {
    return <p className="text-sm text-muted">Your account cannot open configuration.</p>;
  }

  const accounts = await listAccounts();
  const canCreate = await allows("accounts", "write");
  const canEdit = await allows("accounts", "edit");
  const canDelete = await allows("accounts", "delete");
  const signedIn = await currentAccount();

  return (
    <>
      <PageHeader
        title="Configuration"
        description="Create an account and set read, write, edit, and delete for each section. Change the admin password here while signed in as admin. Set a staff password on their row, or disable a staff account without removing stock history."
      />
      <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-surface">
        <table className="w-full min-w-[760px] table-fixed text-left text-sm">
          <thead className="bg-copper-soft text-xs text-muted">
            <tr>
              <th className="w-[18%] px-4 py-3 font-medium">Account</th>
              <th className="w-[28%] px-4 py-3 font-medium">Access</th>
              <th className="px-4 py-3 font-medium">Password</th>
              <th className="w-[24%] px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => {
              const canChangePassword =
                canEdit &&
                ((signedIn?.username === "admin" && account.username === "admin") ||
                  (signedIn &&
                    account.username !== "admin" &&
                    account.username !== guestUsername &&
                    !grantsExtraPermissions(signedIn.permissions, account.permissions)));
              const canChangeStatus =
                canEdit &&
                signedIn &&
                account.username !== "admin" &&
                account.username !== guestUsername &&
                account.username !== signedIn.username &&
                !grantsExtraPermissions(signedIn.permissions, account.permissions);

              return (
                <tr key={account.username} className="border-t border-line">
                  <td className="px-4 py-3 align-middle">
                    <p className="font-semibold">{account.username}</p>
                    <p className="text-xs text-muted">
                      {account.username === guestUsername ? "Sample" : account.active ? "Active" : "Disabled"}
                    </p>
                  </td>
                  <td className="px-4 py-3 align-middle text-muted">
                    {permissionSections
                      .filter((section) => account.permissions[section].read)
                      .map((section) => permissionSectionLabels[section])
                      .join(" · ") || "No sections"}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    {canChangePassword ? <SetPasswordButton username={account.username} /> : "—"}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex flex-wrap items-center gap-2">
                      {canChangeStatus ? <AccountStatusButton username={account.username} active={account.active} /> : null}
                      {canDelete && account.username !== "admin" && account.username !== guestUsername && account.username !== signedIn?.username ? (
                        <DeleteAccountButton username={account.username} />
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {canCreate && signedIn ? <CreateAccountForm ceiling={signedIn.permissions} /> : null}
    </>
  );
}
