import { NextResponse } from "next/server";

import {
  AuthentikAdminError,
  createTenantUser,
  listTenantUsers,
  type ManagedUserRole,
} from "@/lib/authentik-admin";
import {
  requireAdmin,
  requireTenantContext,
  TenantAccessError,
} from "@/lib/tenant-context";

function failure(error: unknown) {
  if (error instanceof TenantAccessError || error instanceof AuthentikAdminError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.status },
    );
  }
  console.error("Unable to manage tenant users:", error);
  return NextResponse.json(
    { success: false, message: "Unable to manage users." },
    { status: 500 },
  );
}

function role(value: unknown): ManagedUserRole | null {
  return value === "admin" || value === "user" ? value : null;
}

export async function GET() {
  try {
    const context = await requireTenantContext();
    requireAdmin(context);
    const users = await listTenantUsers(context.tenantKey);
    return NextResponse.json({ success: true, users });
  } catch (error: unknown) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireTenantContext();
    requireAdmin(context);
    const body = await request.json();
    const username = String(body.username || "").trim().toLowerCase();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const userRole = role(body.role);
    const temporaryPassword = String(body.temporaryPassword || "");

    if (!/^[a-z0-9@.+_-]{3,150}$/.test(username)) {
      return NextResponse.json(
        { success: false, message: "Enter a valid username with at least 3 characters." },
        { status: 400 },
      );
    }
    if (!name || !email || !email.includes("@") || !userRole) {
      return NextResponse.json(
        { success: false, message: "Name, email, and role are required." },
        { status: 400 },
      );
    }
    if (temporaryPassword.length < 12) {
      return NextResponse.json(
        { success: false, message: "Temporary password must contain at least 12 characters." },
        { status: 400 },
      );
    }

    const user = await createTenantUser({
      tenantKey: context.tenantKey,
      username,
      name,
      email,
      role: userRole,
      temporaryPassword,
    });
    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error: unknown) {
    return failure(error);
  }
}
