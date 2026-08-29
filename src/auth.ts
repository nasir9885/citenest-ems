import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";

const EMS_ACCESS_GROUP = "citenest-ems-all-users";
const EMS_ADMIN_GROUP = "citenest-ems-admins";
const EMS_USER_GROUP = "citenest-ems-users";

type EmsRole = "admin" | "user";

const issuer = process.env.AUTHENTIK_ISSUER;
const clientId = process.env.AUTHENTIK_CLIENT_ID;
const clientSecret = process.env.AUTHENTIK_CLIENT_SECRET;

if (!issuer || !clientId || !clientSecret) {
  throw new Error("Authentik OIDC configuration is missing");
}

function groupsFromProfile(profile: Record<string, unknown>): string[] {
  return Array.isArray(profile.groups)
    ? profile.groups.filter(
        (group): group is string => typeof group === "string",
      )
    : [];
}

function tenantKeyFromProfile(
  profile: Record<string, unknown>,
): string | null {
  const tenantKey = profile.tenant_key;

  if (typeof tenantKey !== "string") {
    return null;
  }

  const normalized = tenantKey.trim();

  return normalized.length > 0 ? normalized : null;
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

function hasEmsAccess(groups: readonly string[]): boolean {
  return groups.includes(EMS_ACCESS_GROUP) && roleFromGroups(groups) !== null;
}

const authentik: Provider = {
  id: "authentik",
  name: "Authentik",
  type: "oidc",
  issuer,
  clientId,
  clientSecret,
  authorization: {
    params: {
      scope: "openid profile email citenest_ems",
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [authentik],

  secret: process.env.AUTH_SECRET,

  trustHost: true,

  session: {
    strategy: "jwt",
  },

  pages: {
    error: "/",
  },

  callbacks: {
      signIn: async ({ profile }) => {
          console.log(
              "AUTHENTIK PROFILE:",
              JSON.stringify(profile, null, 2),
          );

          if (!profile) {
              return false;
          }

          const groups = groupsFromProfile(profile);
          const tenantKey = tenantKeyFromProfile(profile);

          return tenantKey !== null && hasEmsAccess(groups);
      },

    jwt: async ({ token, profile }) => {
if (profile) {
  const groups = groupsFromProfile(profile);

  token.groups = groups;
  token.tenantKey = tenantKeyFromProfile(profile);
  token.role = roleFromGroups(groups);

  if (typeof profile.email === "string") {
    token.email = profile.email;
  }
}

      return token;
    },

    session: async ({ session, token }) => {
      session.user.groups = Array.isArray(token.groups)
        ? token.groups.filter(
            (group): group is string => typeof group === "string",
          )
        : [];

      session.user.tenantKey =
        typeof token.tenantKey === "string" ? token.tenantKey : "";

      session.user.role =
        token.role === "admin" || token.role === "user"
          ? token.role
          : "user";
session.user.email =
  typeof token.email === "string" ? token.email : "";
      return session;
    },
  },
});