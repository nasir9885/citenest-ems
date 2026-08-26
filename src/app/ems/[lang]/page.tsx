"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

type DashboardData = {
  role: "admin" | "user";
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  monthlyPayroll: string | number | null;
};

export default function EMSDashboard() {
  const params = useParams();

  const lang = typeof params.lang === "string" ? params.lang : "en";

  const isArabic = lang === "ar";
  const t = isArabic ? ar : en;

  const [dashboard, setDashboard] = useState<DashboardData>({
    role: "user",
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    monthlyPayroll: null,
  });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch("/api/ems/dashboard", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          setError(result.message || "Unable to load dashboard.");
          return;
        }

        setDashboard(result.dashboard);
      } catch {
        setError("Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <main
      className={`ems-page ${isArabic ? "ems-rtl" : "ems-ltr"}`}
      dir={isArabic ? "rtl" : "ltr"}
      lang={isArabic ? "ar" : "en"}
    >
      <header className="ems-header">
        <div className="ems-container ems-nav">
          <div>
            <Link href="/" className="ems-brand">
              CiteNest
            </Link>

            <span className="ems-app-name">{t.appName}</span>
          </div>

          <div className="ems-language-switch">
            <Link href="/ems/en" className={lang === "en" ? "active" : ""}>
              English
            </Link>

            <Link href="/ems/ar" className={lang === "ar" ? "active" : ""}>
              العربية
            </Link>
          </div>
        </div>
      </header>

      <section className="ems-section">
        <div className="ems-container">
          <div className="ems-title-row">
            <div>
              <p className="ems-eyebrow">{t.appName}</p>

              <h1>{t.dashboard}</h1>

              <p className="ems-subtitle">
                {isArabic
                  ? "إدارة الموظفين والحضور والرواتب وملفات البنك."
                  : "Manage employees, attendance, payroll and bank salary exports."}
              </p>
            </div>
          </div>

          {error && <div className="ems-error">{error}</div>}

          <div className="ems-stats-grid">
            <div className="ems-stat-card">
              <span>{t.totalEmployees}</span>

              <strong>{loading ? "..." : dashboard.totalEmployees}</strong>
            </div>

            <div className="ems-stat-card">
              <span>{t.presentToday}</span>

              <strong>{loading ? "..." : dashboard.presentToday}</strong>
            </div>

            <div className="ems-stat-card">
              <span>{t.absentToday}</span>

              <strong>{loading ? "..." : dashboard.absentToday}</strong>
            </div>

            {dashboard.role === "admin" && (
              <div className="ems-stat-card">
                <span>{t.monthlyPayroll}</span>

                <strong>
                  {loading
                    ? "..."
                    : Number(dashboard.monthlyPayroll ?? 0).toFixed(3)}
                </strong>
              </div>
            )}
          </div>

          <div className="ems-module-grid">
            <Link href={`/ems/${lang}/employees`} className="ems-module-card">
              <span className="ems-module-number">01</span>

              <h2>{t.employees}</h2>

              <p>
                {isArabic
                  ? "إضافة الموظفين وتحديث بياناتهم وإدارة معلوماتهم."
                  : "Add employees, update records and manage employee information."}
              </p>
            </Link>

            <Link href={`/ems/${lang}/attendance`} className="ems-module-card">
              <span className="ems-module-number">02</span>

              <h2>{t.attendance}</h2>

              <p>
                {isArabic
                  ? "تسجيل الحضور والغياب والإجازات يومياً."
                  : "Record daily attendance, absence and leave."}
              </p>
            </Link>

            <Link href={`/ems/${lang}/departments`} className="ems-module-card">
              <span className="ems-module-number">05</span>
              <h2>{isArabic ? "الأقسام" : "Departments"}</h2>
              <p>
                {isArabic
                  ? "إدارة هيكل الأقسام وتوزيع الموظفين."
                  : "Manage the organization structure and employee departments."}
              </p>
            </Link>

            <Link href={`/ems/${lang}/holidays`} className="ems-module-card">
              <span className="ems-module-number">06</span>
              <h2>{isArabic ? "العطلات" : "Holiday Calendar"}</h2>
              <p>
                {isArabic
                  ? "إدارة العطلات الرسمية وعطلات الشركة."
                  : "Maintain public holidays and company closure dates."}
              </p>
            </Link>

            {dashboard.role === "admin" && (
              <>
                <Link
                  href={`/ems/${lang}/users`}
                  className="ems-module-card"
                >
                  <span className="ems-module-number">07</span>
                  <h2>{isArabic ? "المستخدمون" : "User Management"}</h2>
                  <p>
                    {isArabic
                      ? "إنشاء حسابات المستخدمين وإدارة صلاحيات المؤسسة."
                      : "Create sign-in accounts and manage tenant access."}
                  </p>
                </Link>

                <Link
                  href={`/ems/${lang}/salary`}
                  className="ems-module-card"
                >
                  <span className="ems-module-number">03</span>

                  <h2>{t.salary}</h2>

                  <p>
                    {isArabic
                      ? "إنشاء ومراجعة رواتب الموظفين الشهرية."
                      : "Generate and review monthly employee salary payments."}
                  </p>
                </Link>

                <Link
                  href={`/ems/${lang}/bank-export`}
                  className="ems-module-card"
                >
                  <span className="ems-module-number">04</span>

                  <h2>{t.bankExport}</h2>

                  <p>
                    {isArabic
                      ? "تصدير ملف الرواتب لإرساله إلى البنك."
                      : "Export salary payment files for submission to the bank."}
                  </p>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
