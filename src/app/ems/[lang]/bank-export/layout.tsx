import type { ReactNode } from "react";

import { requireAdminPage } from "@/lib/admin-page";

export default async function BankExportLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireAdminPage();
  return children;
}
