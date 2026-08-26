import type { DefaultSession } from "next-auth";

type EmsRole = "admin" | "user";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      groups: string[];
      tenantKey: string;
      role: EmsRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    groups?: string[];
    tenantKey?: string | null;
    role?: EmsRole | null;
  }
}

export {};