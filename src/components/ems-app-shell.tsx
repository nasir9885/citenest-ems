"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

type EmsAppShellProps = {
    children: ReactNode;
    role: "admin" | "user";
};

export default function EmsAppShell({
    children,
    role,
}: EmsAppShellProps) {
    const pathname = usePathname();

    const isArabic = pathname.startsWith("/ems/ar");
    const lang = isArabic ? "ar" : "en";

    const [menuOpen, setMenuOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem("ems-theme");

        if (savedTheme === "dark") {
            setDarkMode(true);
            document.documentElement.classList.add("ems-dark");
        }
    }, []);

    function toggleDarkMode() {
        const nextDarkMode = !darkMode;

        setDarkMode(nextDarkMode);

        document.documentElement.classList.toggle("ems-dark", nextDarkMode);
        localStorage.setItem("ems-theme", nextDarkMode ? "dark" : "light");
    }

    function isActive(path: string) {
        return pathname === path;
    }

    const menuItems = [
        {
            href: `/ems/${lang}`,
            label: isArabic ? "لوحة التحكم" : "Dashboard",
            icon: "⌂",
        },
        {
            href: `/ems/${lang}/employees`,
            label: isArabic ? "الموظفون" : "Employees",
            icon: "♙",
        },
        {
            href: `/ems/${lang}/attendance`,
            label: isArabic ? "الحضور" : "Attendance",
            icon: "✓",
        },
        {
            href: `/ems/${lang}/departments`,
            label: isArabic ? "الأقسام" : "Departments",
            icon: "▦",
        },
        {
            href: `/ems/${lang}/holidays`,
            label: isArabic ? "العطلات" : "Holidays",
            icon: "◆",
        },
    ];

    if (role === "admin") {
        menuItems.push(
            {
                href: `/ems/${lang}/salary`,
                label: isArabic ? "الرواتب" : "Salary",
                icon: "¤",
            },
            {
                href: `/ems/${lang}/bank-export`,
                label: isArabic ? "تصدير البنك" : "Bank Export",
                icon: "⇩",
            },
            {
                href: `/ems/${lang}/users`,
                label: isArabic ? "إدارة المستخدمين" : "User Management",
                icon: "♟",
            },
        );
    }

    return (
        <div
            className={`ems-app-shell ${isArabic ? "ems-rtl" : "ems-ltr"}`}
            dir={isArabic ? "rtl" : "ltr"}
        >
            <aside className={`ems-sidebar ${menuOpen ? "open" : ""}`}>
                <div className="ems-sidebar-brand">
                    <Link href={`/ems/${lang}`}>
                        <strong>CiteNest</strong>
                        <span>EMS</span>
                    </Link>
                </div>

                <nav
                    className="ems-sidebar-nav"
                    aria-label={isArabic ? "قائمة النظام" : "EMS navigation"}
                >
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={isActive(item.href) ? "active" : ""}
                            onClick={() => setMenuOpen(false)}
                        >
                            <span className="ems-menu-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="ems-sidebar-footer">
                    <button
                        type="button"
                        className="ems-theme-toggle"
                        onClick={toggleDarkMode}
                    >
                        <span>{darkMode ? "☀" : "☾"}</span>
                        <span>
                            {darkMode
                                ? isArabic
                                    ? "الوضع الفاتح"
                                    : "Light mode"
                                : isArabic
                                    ? "الوضع الداكن"
                                    : "Dark mode"}
                        </span>
                    </button>
                </div>
            </aside>

            {menuOpen && (
                <button
                    type="button"
                    className="ems-menu-overlay"
                    aria-label={isArabic ? "إغلاق القائمة" : "Close menu"}
                    onClick={() => setMenuOpen(false)}
                />
            )}

            <div className="ems-app-main">
                <header className="ems-app-toolbar">
                    <button
                        type="button"
                        className="ems-menu-button"
                        aria-label={isArabic ? "فتح القائمة" : "Open menu"}
                        onClick={() => setMenuOpen(true)}
                    >
                        ☰
                    </button>

                    <div className="ems-toolbar-title">
                        {isArabic
                            ? "نظام إدارة الموظفين"
                            : "Employee Management System"}
                    </div>

                    <button
                        type="button"
                        className="ems-toolbar-theme"
                        onClick={toggleDarkMode}
                        aria-label={
                            isArabic ? "تبديل الوضع الداكن" : "Toggle dark mode"
                        }
                    >
                        {darkMode ? "☀" : "☾"}
                    </button>
                </header>

                <main className="ems-shell-content">{children}</main>
            </div>
        </div>
    );
}