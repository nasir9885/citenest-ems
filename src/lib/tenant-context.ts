import "server-only";

import { auth } from "@/auth";
import pool from "@/lib/db";

const EMS_ACCESS_GROUP = "citenest-ems-all-users";
const EMS_ADMIN_GROUP = "citenest-ems-admins";
const EMS_USER_GROUP = "citenest-ems-users";

export type EmsRole = "admin" | "user";

export type TenantContext = {
  tenantId: string;
  tenantKey: string;
  tenantDisplayName: string;
  role: EmsRole;
};

export class TenantAccessError extends Error {
  constructor(
    message: string,
    public readonly status: 401 | 403,
  ) {
    super(message);
    this.name = "TenantAccessError";
  }
}

function roleFromGroups(groups: readonly string[]): EmsRole | null {
  if (groups.includes(EMS_ADMIN_GROUP)) {
    return "admin";
  }

  if (groups.includes(EMS_USER_GROUP)) {
    return "user";
  }

  return null;
}

export async function requireTenantContext(): Promise<TenantContext> {
  const session = await auth();

  if (!session?.user) {
    throw new TenantAccessError("Authentication required", 401);
  }

  const groups = session.user.groups;
  const role = roleFromGroups(groups);
  const tenantKey = session.user.tenantKey.trim();

  if (
    !groups.includes(EMS_ACCESS_GROUP) ||
    role === null ||
    tenantKey.length === 0
  ) {
    throw new TenantAccessError("EMS access denied", 403);
  }

  const result = await pool.query<{
    id: string;
    tenant_key: string;
    display_name: string;
  }>(
    `
      SELECT id, tenant_key, display_name
      FROM tenants
      WHERE tenant_key = $1
        AND status = 'ACTIVE'
      LIMIT 1
    `,
    [tenantKey],
  );

  const tenant = result.rows[0];

  if (!tenant) {
    throw new TenantAccessError("EMS tenant is unavailable", 403);
  }

  return {
    tenantId: tenant.id,
    tenantKey: tenant.tenant_key,
    tenantDisplayName: tenant.display_name,
    role,
  };
}

export function requireAdmin(context: TenantContext): void {
  if (context.role !== "admin") {
    throw new TenantAccessError("Administrator access required", 403);
  }
}
