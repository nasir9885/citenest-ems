"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

type Employee = {
  id: number;
  employee_number: string;
  name_en: string;
  name_ar: string | null;
  designation_en: string | null;
  designation_ar: string | null;
  date_of_joining: string | null;
  civil_id: string | null;
  basic_salary: string;
  status: string;
};

export default function EmployeesPage() {
  const params = useParams();

  const lang =
    typeof params.lang === "string" ? params.lang : "en";

  const isArabic = lang === "ar";
  const t = isArabic ? ar : en;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEmployees() {
      try {
        const response = await fetch("/api/ems/employees", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          setError(result.message || "Unable to load employees.");
          return;
        }

        setEmployees(result.employees);
      } catch {
        setError("Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    }

    loadEmployees();
  }, []);

  return (
    <main
      className={`ems-page ${isArabic ? "ems-rtl" : "ems-ltr"}`}
      dir={isArabic ? "rtl" : "ltr"}
    >
      <header className="ems-header">
        <div className="ems-container ems-nav">
          <div>
            <Link href={`/ems/${lang}`} className="ems-brand">
              CiteNest
            </Link>

            <span className="ems-app-name">
              {t.appName}
            </span>
          </div>

          <div className="ems-language-switch">
            <Link href="/ems/en/employees">
              English
            </Link>

            <Link href="/ems/ar/employees">
              العربية
            </Link>
          </div>
        </div>
      </header>

      <section className="ems-section">
        <div className="ems-container">
          <div className="ems-page-toolbar">
            <div>
              <Link
                href={`/ems/${lang}`}
                className="ems-back-link"
              >
                ← {t.backToDashboard}
              </Link>

              <h1>{t.employeeList}</h1>
            </div>

            <Link
              href={`/ems/${lang}/employees/new`}
              className="primary-action"
            >
              + {t.addEmployee}
            </Link>
          </div>

          {loading && (
            <div className="ems-message">
              {t.loading}
            </div>
          )}

          {error && (
            <div className="ems-error">
              {error}
            </div>
          )}

          {!loading && !error && employees.length === 0 && (
            <div className="ems-message">
              {t.noEmployees}
            </div>
          )}

          {!loading && !error && employees.length > 0 && (
            <div className="ems-table-wrapper">
              <table className="ems-table">
                <thead>
                  <tr>
                    <th>{t.employeeNumber}</th>
                    <th>{t.employeeName}</th>
                    <th>{t.designation}</th>
                    <th>{t.dateOfJoining}</th>
                    <th>{t.civilId}</th>
                    <th>{t.basicSalary}</th>
                    <th>{t.status}</th>
                    <th>{t.actions}</th>
                  </tr>
                </thead>

                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id}>
                      <td>
                        <strong>
                          {employee.employee_number}
                        </strong>
                      </td>

                      <td>
                        {isArabic
                          ? employee.name_ar || employee.name_en
                          : employee.name_en}
                      </td>

                      <td>
                        {isArabic
                          ? employee.designation_ar ||
                            employee.designation_en ||
                            "—"
                          : employee.designation_en || "—"}
                      </td>

                      <td>
                        {employee.date_of_joining
                          ? new Date(
                              employee.date_of_joining
                            ).toLocaleDateString(
                              isArabic ? "ar" : "en"
                            )
                          : "—"}
                      </td>

                      <td>{employee.civil_id || "—"}</td>

                      <td className="ems-number">
                        {Number(
                          employee.basic_salary
                        ).toFixed(3)}
                      </td>

                      <td>
                        <span
                          className={`ems-status ems-status-${employee.status.toLowerCase()}`}
                        >
                          {employee.status}
                        </span>
                      </td>
<td>
  <Link
    href={`/ems/${lang}/employees/${employee.id}`}
    className="ems-edit-link"
  >
    {t.edit}
  </Link>
</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
