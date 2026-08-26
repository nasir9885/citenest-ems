import "server-only";

import { redirect } from "next/navigation";

import {
  requireAdmin,
  requireTenantContext,
  TenantAccessError,
} from "@/lib/tenant-context";

export async function requireAdminPage(): Promise<void> {
  try {
    const context = await requireTenantContext();
    requireAdmin(context);
  } catch (error: unknown) {
    if (error instanceof TenantAccessError) {
      redirect("/ems");
    }

    throw error;
  }
}
