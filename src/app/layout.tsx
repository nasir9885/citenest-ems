import type { Metadata } from "next";
import type { ReactNode } from "react";
import ThemeToggle from "@/components/theme-toggle";
import "./globals.css";

const themeInitializer = `
  try {
    const savedTheme = localStorage.getItem("citenest-ems-theme");
    const systemTheme = matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    const theme = savedTheme === "light" || savedTheme === "dark"
      ? savedTheme
      : systemTheme;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.dataset.theme = "light";
  }
`;

export const metadata: Metadata = {
  title: "CiteNest Employee Management",
  description: "Employee, attendance, payroll, and workforce management.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializer }} />
      </head>
      <body>
        {children}
        <div className="theme-toggle-shell">
          <ThemeToggle />
        </div>
      </body>
    </html>
  );
}
