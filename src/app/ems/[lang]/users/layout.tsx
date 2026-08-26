import type { ReactNode } from "react";

import { requireAdminPage } from "@/lib/admin-page";

export default async function UsersLayout({ children }: { children: ReactNode }) {
  await requireAdminPage();
  return children;
}
