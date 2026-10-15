export const permissionActions = ["read", "write", "edit", "delete"] as const;
export const permissionSections = ["products", "movements", "settings", "accounts"] as const;

export type PermissionAction = (typeof permissionActions)[number];
export type PermissionSection = (typeof permissionSections)[number];
export type Permissions = Record<PermissionSection, Record<PermissionAction, boolean>>;

export const permissionSectionLabels: Record<PermissionSection, string> = {
  products: "Products",
  movements: "Stock movements",
  settings: "Settings",
  accounts: "Accounts",
};

export function emptyPermissions(): Permissions {
  return {
    products: { read: false, write: false, edit: false, delete: false },
    movements: { read: false, write: false, edit: false, delete: false },
    settings: { read: false, write: false, edit: false, delete: false },
    accounts: { read: false, write: false, edit: false, delete: false },
  };
}

export function adminPermissions(): Permissions {
  return {
    products: { read: true, write: true, edit: true, delete: true },
    movements: { read: true, write: true, edit: false, delete: false },
    settings: { read: true, write: true, edit: true, delete: true },
    accounts: { read: true, write: true, edit: true, delete: true },
  };
}

export const closedPermissions: Partial<Record<PermissionSection, PermissionAction[]>> = {
  movements: ["edit", "delete"],
};

export function grantsExtraPermissions(actor: Permissions, requested: Permissions) {
  for (const section of permissionSections) {
    for (const action of permissionActions) {
      if (requested[section][action] && !actor[section][action]) {
        return true;
      }
    }
  }

  return false;
}
