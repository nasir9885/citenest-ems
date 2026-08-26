import type { ReactNode } from "react";

import { requireAdminPage } from "@/lib/admin-page";

export default async function NewEmployeeLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireAdminPage();
  return children;
}
