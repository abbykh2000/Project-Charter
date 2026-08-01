export const USER_ROLE_COMPLIANCE_MANAGER =
  "compliance-manager";

export const USER_ROLE_CONTROL_OWNER =
  "control-owner";

export const USER_ROLE_VIEWER =
  "viewer";

export const USER_ROLES = [
  USER_ROLE_COMPLIANCE_MANAGER,
  USER_ROLE_CONTROL_OWNER,
  USER_ROLE_VIEWER,
];

export const users = [
  {
    id: "user-compliance-manager",
    name: "Compliance Manager",
    email: "compliance.manager@snoonu.com",
    department: "Compliance and Assurance",
    role: USER_ROLE_COMPLIANCE_MANAGER,
    active: true,
  },
  {
    id: "user-information-security",
    name: "Information Security Team",
    email: "information.security@snoonu.com",
    department: "Information Security",
    role: USER_ROLE_CONTROL_OWNER,
    active: true,
  },
  {
    id: "user-security-operations",
    name: "Security Operations Team",
    email: "security.operations@snoonu.com",
    department: "Security Operations",
    role: USER_ROLE_CONTROL_OWNER,
    active: true,
  },
  {
    id: "user-it-operations",
    name: "IT Operations Team",
    email: "it.operations@snoonu.com",
    department: "Information Technology",
    role: USER_ROLE_CONTROL_OWNER,
    active: true,
  },
  {
    id: "user-engineering",
    name: "Engineering Team",
    email: "engineering@snoonu.com",
    department: "Engineering",
    role: USER_ROLE_CONTROL_OWNER,
    active: true,
  },
  {
    id: "user-audit-viewer",
    name: "Internal Audit Viewer",
    email: "internal.audit@snoonu.com",
    department: "Internal Audit",
    role: USER_ROLE_VIEWER,
    active: true,
  },
];

export function getUserById(userId) {
  const normalizedId = String(userId ?? "").trim();

  return (
    users.find((user) => user.id === normalizedId) ??
    null
  );
}

export function getUserByName(userName) {
  const normalizedName = String(userName ?? "")
    .trim()
    .toLowerCase();

  return (
    users.find(
      (user) =>
        user.name.toLowerCase() === normalizedName
    ) ?? null
  );
}


function normalizeText(value) {
  return String(value ?? "").trim();
}

export function normalizeUserRole(role) {
  const normalizedRole = normalizeText(role)
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

  if (
    normalizedRole === USER_ROLE_COMPLIANCE_MANAGER ||
    normalizedRole.includes("compliance-manager")
  ) {
    return USER_ROLE_COMPLIANCE_MANAGER;
  }

  if (
    normalizedRole === USER_ROLE_VIEWER ||
    normalizedRole.includes("viewer") ||
    normalizedRole.includes("audit")
  ) {
    return USER_ROLE_VIEWER;
  }

  return USER_ROLE_CONTROL_OWNER;
}

export function normalizeDirectoryUser(user = {}) {
  const email = normalizeText(user.email).toLowerCase();
  const name =
    normalizeText(user.name) ||
    email ||
    "Unnamed user";

  return {
    id:
      normalizeText(user.id) ||
      (email ? `directory-${email}` : ""),
    name,
    email,
    department: normalizeText(user.department),
    role: normalizeUserRole(user.role),
    active: user.active !== false,
    source: normalizeText(user.source) || "local",
  };
}
