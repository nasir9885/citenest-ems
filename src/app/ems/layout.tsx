import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth";
import EmsLanguageSwitch from "@/components/ems-language-switch";
import {
  requireTenantContext,
  TenantAccessError,
} from "@/lib/tenant-context";

const authentikIssuer = process.env.AUTHENTIK_ISSUER;

if (!authentikIssuer) {
  throw new Error("Authentik issuer configuration is missing");
}

const authentikEndSessionUrl = new URL(
  "end-session/",
  authentikIssuer,
).toString();

export default async function EmsLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  let role: "admin" | "user";
  let tenantDisplayName: string;

  try {
    const context = await requireTenantContext();
    role = context.role;
    tenantDisplayName = context.tenantDisplayName;
  } catch (error: unknown) {
    if (error instanceof TenantAccessError) {
      redirect("/");
    }

    throw error;
  }

  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const displayName =
    session.user.name?.trim() ||
    session.user.email?.trim() ||
    "EMS user";

  return (
    <>
      <div className="ems-user-bar">
        <div className="ems-user-bar-content">
          <div className="ems-tenant-brand">
            <span className="ems-tenant-logo">CiteNest</span>
            <span className="ems-tenant-name">
              <small>Organization</small>
              {tenantDisplayName}
            </span>
          </div>

          <div className="ems-user-actions">
            <EmsLanguageSwitch />

            <div className="ems-user-identity">
              <span className="ems-user-name">{displayName}</span>
              <span className="ems-user-role">
                {role === "admin" ? "Administrator" : "User"}
              </span>
            </div>

            <form
              action={async () => {
                "use server";
                await signOut({ redirect: false });
                redirect(authentikEndSessionUrl);
              }}
            >
              <button type="submit" className="ems-sign-out">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>

      {children}
    </>
  );
}
