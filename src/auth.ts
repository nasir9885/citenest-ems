import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";

const issuer = process.env.AUTHENTIK_ISSUER;
const clientId = process.env.AUTHENTIK_CLIENT_ID;
const clientSecret = process.env.AUTHENTIK_CLIENT_SECRET;

if (!issuer || !clientId || !clientSecret) {
  throw new Error("Authentik OIDC configuration is missing");
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
      scope: "openid profile email",
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
    jwt: async ({ token, profile }) => {
      if (profile) {
        const groups = Array.isArray(profile.groups)
          ? profile.groups.filter(
              (group): group is string => typeof group === "string",
            )
          : [];

        token.groups = groups;
      }

      return token;
    },
  },
});
