import "server-only";

const TENANT_ATTRIBUTE = "citenest_ems_tenant_key";
const ACCESS_GROUP = "citenest-ems-all-users";
const ADMIN_GROUP = "citenest-ems-admins";
const USER_GROUP = "citenest-ems-users";

export type ManagedUserRole = "admin" | "user";

type AuthentikGroup = {
  pk: string;
  name: string;
};

type AuthentikUser = {
  pk: number;
  username: string;
  name: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  groups_obj: AuthentikGroup[] | null;
  attributes: Record<string, unknown>;
  path: string;
  last_login: string | null;
};

type Paginated<T> = {
  results: T[];
};

export type TenantUser = {
  id: number;
  username: string;
  name: string;
  email: string;
  isActive: boolean;
  role: ManagedUserRole;
  lastLogin: string | null;
};

export class AuthentikAdminError extends Error {
  constructor(
    message: string,
    public readonly status: number = 502,
  ) {
    super(message);
    this.name = "AuthentikAdminError";
  }
}

function configuration() {
  const issuer = process.env.AUTHENTIK_ISSUER;
  const token = process.env.AUTHENTIK_API_TOKEN;
  const configuredUrl = process.env.AUTHENTIK_API_URL;

  if (!issuer || !token) {
    throw new AuthentikAdminError(
      "Authentik user management is not configured.",
      503,
    );
  }

  const baseUrl = configuredUrl
    ? new URL(configuredUrl)
    : new URL("/api/v3/", new URL(issuer).origin);

  if (!baseUrl.pathname.endsWith("/")) {
    baseUrl.pathname += "/";
  }

  return { baseUrl, token };
}

async function authentikRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const { baseUrl, token } = configuration();
  const response = await fetch(new URL(path, baseUrl), {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    let detail = "Authentik rejected the user-management request.";
    try {
      const body = (await response.json()) as { detail?: string };
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      // Do not expose response bodies or credentials in application errors.
    }
    throw new AuthentikAdminError(detail, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function tenantPath(tenantKey: string) {
  return `citenest/ems/${tenantKey}`;
}

function tenantGroup(tenantKey: string, role: ManagedUserRole) {
  return `citenest-ems-${tenantKey}-${role === "admin" ? "admins" : "users"}`;
}

function userBelongsToTenant(user: AuthentikUser, tenantKey: string) {
  return (
    user.path === tenantPath(tenantKey) &&
    user.attributes?.[TENANT_ATTRIBUTE] === tenantKey &&
    !user.is_superuser
  );
}

function roleFromUser(user: AuthentikUser): ManagedUserRole {
  const groups = new Set((user.groups_obj || []).map((group) => group.name));
  return groups.has(ADMIN_GROUP) ? "admin" : "user";
}

function publicUser(user: AuthentikUser): TenantUser {
  return {
    id: user.pk,
    username: user.username,
    name: user.name,
    email: user.email,
    isActive: user.is_active,
    role: roleFromUser(user),
    lastLogin: user.last_login,
  };
}

async function requiredGroups(tenantKey: string, role: ManagedUserRole) {
  const names = [ACCESS_GROUP, role === "admin" ? ADMIN_GROUP : USER_GROUP, tenantGroup(tenantKey, role)];
  const groups = await Promise.all(
    names.map(async (name) => {
      const query = new URLSearchParams({ name, include_users: "false" });
      const page = await authentikRequest<Paginated<AuthentikGroup>>(
        `core/groups/?${query}`,
      );
      return page.results.find((group) => group.name === name);
    }),
  );

  const missing = names.filter((_, index) => !groups[index]);
  if (missing.length > 0) {
    throw new AuthentikAdminError(
      `Required Authentik group is missing: ${missing.join(", ")}.`,
      503,
    );
  }

  return groups.map((group) => group!.pk);
}

async function getTenantUser(id: number, tenantKey: string) {
  const user = await authentikRequest<AuthentikUser>(`core/users/${id}/`);
  if (!userBelongsToTenant(user, tenantKey)) {
    throw new AuthentikAdminError("User not found.", 404);
  }
  return user;
}

export async function listTenantUsers(tenantKey: string) {
  const query = new URLSearchParams({
    path: tenantPath(tenantKey),
    include_groups: "true",
    include_roles: "false",
    ordering: "username",
    page_size: "100",
  });
  const page = await authentikRequest<Paginated<AuthentikUser>>(
    `core/users/?${query}`,
  );
  return page.results
    .filter((user) => userBelongsToTenant(user, tenantKey))
    .map(publicUser);
}

export async function createTenantUser(input: {
  tenantKey: string;
  username: string;
  name: string;
  email: string;
  role: ManagedUserRole;
  temporaryPassword: string;
}) {
  const groups = await requiredGroups(input.tenantKey, input.role);
  let created: AuthentikUser | null = null;

  try {
    created = await authentikRequest<AuthentikUser>("core/users/", {
      method: "POST",
      body: JSON.stringify({
        username: input.username,
        name: input.name,
        email: input.email,
        is_active: true,
        type: "internal",
        path: tenantPath(input.tenantKey),
        groups,
        attributes: { [TENANT_ATTRIBUTE]: input.tenantKey },
      }),
    });
    await authentikRequest<void>(`core/users/${created.pk}/set_password/`, {
      method: "POST",
      body: JSON.stringify({ password: input.temporaryPassword }),
    });
    return publicUser(created);
  } catch (error) {
    if (created) {
      try {
        await authentikRequest<void>(`core/users/${created.pk}/`, {
          method: "DELETE",
        });
      } catch {
        // Preserve the original failure; the orphan can be reconciled by a platform admin.
      }
    }
    throw error;
  }
}

export async function updateTenantUser(input: {
  tenantKey: string;
  id: number;
  name: string;
  email: string;
  role: ManagedUserRole;
  isActive: boolean;
  temporaryPassword?: string;
}) {
  const existing = await getTenantUser(input.id, input.tenantKey);
  if (
    existing.is_active &&
    roleFromUser(existing) === "admin" &&
    (!input.isActive || input.role !== "admin")
  ) {
    const tenantUsers = await listTenantUsers(input.tenantKey);
    const otherActiveAdmins = tenantUsers.filter(
      (user) => user.id !== input.id && user.isActive && user.role === "admin",
    );
    if (otherActiveAdmins.length === 0) {
      throw new AuthentikAdminError(
        "Create another active administrator before removing this administrator's access.",
        409,
      );
    }
  }
  const groups = await requiredGroups(input.tenantKey, input.role);
  const attributes = {
    ...existing.attributes,
    [TENANT_ATTRIBUTE]: input.tenantKey,
  };
  const updated = await authentikRequest<AuthentikUser>(
    `core/users/${input.id}/`,
    {
      method: "PATCH",
      body: JSON.stringify({
        name: input.name,
        email: input.email,
        is_active: input.isActive,
        path: tenantPath(input.tenantKey),
        groups,
        attributes,
      }),
    },
  );
  if (input.temporaryPassword) {
    await authentikRequest<void>(`core/users/${input.id}/set_password/`, {
      method: "POST",
      body: JSON.stringify({ password: input.temporaryPassword }),
    });
  }
  return publicUser(updated);
}
