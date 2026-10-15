import { AccountStatusButton } from "@/components/account-status-button";
import { CreateAccountForm } from "@/components/create-account-form";
import { DeleteAccountButton } from "@/components/delete-account-button";
import { SetPasswordButton } from "@/components/set-password-button";
import { PageHeader } from "@/components/page-header";
import { allows, currentAccount, guestUsername, listAccounts } from "@/lib/accounts";
import { grantsExtraPermissions, permissionSectionLabels, permissionSections } from "@/lib/permissions";

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
      <ul className="mt-6 max-w-3xl divide-y divide-line rounded-xl border border-line bg-surface">
        {accounts.map((account) => (
          <li key={account.username} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <div>
              <p className="font-semibold">
                {account.username}{" "}
                <span className="text-xs font-medium text-muted">
                  {account.username === guestUsername ? "Sample" : account.active ? "Active" : "Disabled"}
                </span>
              </p>
              <p className="mt-1 text-muted">
                {permissionSections
                  .filter((section) => account.permissions[section].read)
                  .map((section) => permissionSectionLabels[section])
                  .join(" · ") || "No sections"}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              {canEdit && signedIn?.username === "admin" && account.username === "admin" ? (
                <SetPasswordButton username={account.username} />
              ) : null}
              {canEdit && signedIn && account.username !== "admin" && account.username !== guestUsername && !grantsExtraPermissions(signedIn.permissions, account.permissions) ? (
                <>
                  <SetPasswordButton username={account.username} />
                  {account.username !== signedIn.username ? (
                    <AccountStatusButton username={account.username} active={account.active} />
                  ) : null}
                </>
              ) : null}
              {canDelete && account.username !== "admin" && account.username !== guestUsername && account.username !== signedIn?.username ? (
                <DeleteAccountButton username={account.username} />
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {canCreate && signedIn ? <CreateAccountForm ceiling={signedIn.permissions} /> : null}
    </>
  );
}
