"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function languagePath(pathname: string, language: "en" | "ar") {
  if (/^\/ems\/(en|ar)(\/|$)/.test(pathname)) {
    return pathname.replace(/^\/ems\/(en|ar)/, `/ems/${language}`);
  }

  return `/ems/${language}`;
}

export default function EmsLanguageSwitch() {
  const pathname = usePathname();
  const isArabic = pathname.startsWith("/ems/ar");

  return (
    <nav className="ems-global-language" aria-label="Language">
      <Link
        href={languagePath(pathname, "en")}
        aria-current={!isArabic ? "page" : undefined}
      >
        EN
      </Link>
      <Link
        href={languagePath(pathname, "ar")}
        aria-current={isArabic ? "page" : undefined}
      >
        ع
      </Link>
    </nav>
  );
}
