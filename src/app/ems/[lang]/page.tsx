"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

type DashboardData = {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  monthlyPayroll: string | number;
};

export default function EMSDashboard() {
  const params = useParams();

  const lang = typeof params.lang === "string" ? params.lang : "en";

  const isArabic = lang === "ar";
  const t = isArabic ? ar : en;

  const [dashboard, setDashboard] = useState<DashboardData>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    monthlyPayroll: 0,
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

            <div className="ems-stat-card">
              <span>{t.monthlyPayroll}</span>

              <strong>
                {loading ? "..." : Number(dashboard.monthlyPayroll).toFixed(3)}
              </strong>
            </div>
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

            <Link href={`/ems/${lang}/salary`} className="ems-module-card">
              <span className="ems-module-number">03</span>

              <h2>{t.salary}</h2>

              <p>
                {isArabic
                  ? "إنشاء ومراجعة رواتب الموظفين الشهرية."
                  : "Generate and review monthly employee salary payments."}
              </p>
            </Link>

            <Link href={`/ems/${lang}/bank-export`} className="ems-module-card">
              <span className="ems-module-number">04</span>

              <h2>{t.bankExport}</h2>

              <p>
                {isArabic
                  ? "تصدير ملف الرواتب لإرساله إلى البنك."
                  : "Export salary payment files for submission to the bank."}
              </p>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
