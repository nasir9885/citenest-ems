import { NextResponse } from "next/server";

import {
  AuthentikAdminError,
  updateTenantUser,
  type ManagedUserRole,
} from "@/lib/authentik-admin";
import {
  requireAdmin,
  requireTenantContext,
  TenantAccessError,
} from "@/lib/tenant-context";

type RouteProps = { params: Promise<{ id: string }> };

function failure(error: unknown) {
  if (error instanceof TenantAccessError || error instanceof AuthentikAdminError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.status },
    );
  }
  console.error("Unable to update tenant user:", error);
  return NextResponse.json(
    { success: false, message: "Unable to update user." },
    { status: 500 },
  );
}

function role(value: unknown): ManagedUserRole | null {
  return value === "admin" || value === "user" ? value : null;
}

export async function PATCH(request: Request, { params }: RouteProps) {
  try {
    const context = await requireTenantContext();
    requireAdmin(context);
    const { id: rawId } = await params;
    const id = Number(rawId);
    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const userRole = role(body.role);
    const temporaryPassword = String(body.temporaryPassword || "");

    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json(
        { success: false, message: "Invalid user." },
        { status: 400 },
      );
    }
    if (!name || !email || !email.includes("@") || !userRole) {
      return NextResponse.json(
        { success: false, message: "Name, email, and role are required." },
        { status: 400 },
      );
    }
    if (temporaryPassword && temporaryPassword.length < 12) {
      return NextResponse.json(
        { success: false, message: "New password must contain at least 12 characters." },
        { status: 400 },
      );
    }

    const user = await updateTenantUser({
      tenantKey: context.tenantKey,
      id,
      name,
      email,
      role: userRole,
      isActive: body.isActive === true,
      temporaryPassword: temporaryPassword || undefined,
    });
    return NextResponse.json({ success: true, user });
  } catch (error: unknown) {
    return failure(error);
  }
}
