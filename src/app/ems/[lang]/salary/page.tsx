"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";

import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

type PayrollEmployee = {
  id: number;
  employee_number: string;

  name_en: string;
  name_ar: string | null;

  designation_en: string | null;
  designation_ar: string | null;

  employee_basic_salary: string;

  basic_salary: string | null;
  allowances: string | null;
  deductions: string | null;
  net_salary: string | null;

  payment_status: string | null;
  payment_date: string | null;

  remarks: string | null;
};

function currentMonth() {
  return new Date().getMonth() + 1;
}

function currentYear() {
  return new Date().getFullYear();
}

export default function SalaryPage() {
  const params = useParams();

  const lang = typeof params.lang === "string" ? params.lang : "en";

  const isArabic = lang === "ar";
  const t = isArabic ? ar : en;

  const [month, setMonth] = useState(currentMonth());

  const [year, setYear] = useState(currentYear());

  const [employees, setEmployees] = useState<PayrollEmployee[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  async function loadPayroll(selectedMonth = month, selectedYear = year) {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/ems/salary?month=${selectedMonth}&year=${selectedYear}`,
        {
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Unable to load payroll.");
        return;
      }

      const rows = result.employees.map((employee: PayrollEmployee) => ({
        ...employee,

        basic_salary: employee.basic_salary ?? employee.employee_basic_salary,

        allowances: employee.allowances ?? "0",

        deductions: employee.deductions ?? "0",

        payment_status: employee.payment_status ?? "PENDING",

        payment_date: employee.payment_date
          ? employee.payment_date.substring(0, 10)
          : "",

        remarks: employee.remarks ?? "",
      }));

      setEmployees(rows);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  function updateEmployee(
    id: number,
    field:
      | "basic_salary"
      | "allowances"
      | "deductions"
      | "payment_status"
      | "payment_date"
      | "remarks",
    value: string,
  ) {
    setEmployees((current) =>
      current.map((employee) =>
        employee.id === id
          ? {
              ...employee,
              [field]: value,
            }
          : employee,
      ),
    );
  }

  function calculateNet(employee: PayrollEmployee) {
    const basic = Number(employee.basic_salary || 0);

    const allowances = Number(employee.allowances || 0);

    const deductions = Number(employee.deductions || 0);

    return basic + allowances - deductions;
  }

  const totalPayroll = useMemo(
    () => employees.reduce((sum, employee) => sum + calculateNet(employee), 0),
    [employees],
  );

  async function savePayroll() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/ems/salary", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          month,
          year,

          records: employees.map((employee) => ({
            employeeId: employee.id,

            basicSalary: employee.basic_salary,

            allowances: employee.allowances,

            deductions: employee.deductions,

            paymentStatus: employee.payment_status,

            paymentDate: employee.payment_date || null,

            remarks: employee.remarks || null,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Unable to save payroll.");
        return;
      }

      setSuccess(t.payrollSaved);

      await loadPayroll();
    } catch {
      setError("Unable to save payroll.");
    } finally {
      setSaving(false);
    }
  }

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

            <span className="ems-app-name">{t.appName}</span>
          </div>

          <div className="ems-language-switch">
            <Link href="/ems/en/salary">English</Link>

            <Link href="/ems/ar/salary">العربية</Link>
          </div>
        </div>
      </header>

      <section className="ems-section">
        <div className="ems-container">
          <div className="ems-page-toolbar">
            <div>
              <Link href={`/ems/${lang}`} className="ems-back-link">
                ← {t.backToDashboard}
              </Link>

              <h1>{t.salary}</h1>
            </div>
          </div>

          <div className="salary-toolbar">
            <label>
              {t.salaryMonth}

              <select
                value={month}
                onChange={(event) => {
                  const selectedMonth = Number(event.target.value);
                  setMonth(selectedMonth);
                  void loadPayroll(selectedMonth, year);
                }}
              >
                {Array.from({ length: 12 }, (_, index) => (
                  <option key={index + 1} value={index + 1}>
                    {new Date(2000, index, 1).toLocaleString(
                      isArabic ? "ar" : "en",
                      {
                        month: "long",
                      },
                    )}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {t.salaryYear}

              <input
                type="number"
                min="2000"
                max="2100"
                value={year}
                onChange={(event) => {
                  const selectedYear = Number(event.target.value);
                  setYear(selectedYear);
                  void loadPayroll(month, selectedYear);
                }}
              />
            </label>

            <div className="salary-total">
              <span>{t.totalPayroll}</span>

              <strong>{totalPayroll.toFixed(3)}</strong>
            </div>

            <button
              type="button"
              className="primary-action"
              onClick={savePayroll}
              disabled={saving || loading || employees.length === 0}
            >
              {saving ? t.savingPayroll : t.savePayroll}
            </button>
          </div>

          {success && <div className="ems-success">{success}</div>}

          {error && <div className="ems-error">{error}</div>}

          {loading && <div className="ems-message">{t.loading}</div>}

          {!loading && !error && employees.length === 0 && (
            <div className="ems-message">{t.noPayrollEmployees}</div>
          )}

          {!loading && employees.length > 0 && (
            <div className="ems-table-wrapper">
              <table className="ems-table salary-table">
                <thead>
                  <tr>
                    <th>{t.employeeNumber}</th>

                    <th>{t.employeeName}</th>

                    <th>{t.basicSalary}</th>

                    <th>{t.allowances}</th>

                    <th>{t.deductions}</th>

                    <th>{t.netSalary}</th>

                    <th>{t.paymentStatus}</th>

                    <th>{t.paymentDate}</th>

                    <th>{t.remarks}</th>
                  </tr>
                </thead>

                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id}>
                      <td>
                        <strong>{employee.employee_number}</strong>
                      </td>

                      <td>
                        {isArabic
                          ? employee.name_ar || employee.name_en
                          : employee.name_en}
                      </td>

                      <td>
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          value={employee.basic_salary || "0"}
                          onChange={(event) =>
                            updateEmployee(
                              employee.id,
                              "basic_salary",
                              event.target.value,
                            )
                          }
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          value={employee.allowances || "0"}
                          onChange={(event) =>
                            updateEmployee(
                              employee.id,
                              "allowances",
                              event.target.value,
                            )
                          }
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          value={employee.deductions || "0"}
                          onChange={(event) =>
                            updateEmployee(
                              employee.id,
                              "deductions",
                              event.target.value,
                            )
                          }
                        />
                      </td>

                      <td className="ems-number salary-net">
                        {calculateNet(employee).toFixed(3)}
                      </td>

                      <td>
                        <select
                          value={employee.payment_status || "PENDING"}
                          onChange={(event) =>
                            updateEmployee(
                              employee.id,
                              "payment_status",
                              event.target.value,
                            )
                          }
                        >
                          <option value="PENDING">{t.pending}</option>

                          <option value="PAID">{t.paid}</option>
                        </select>
                      </td>

                      <td>
                        <input
                          type="date"
                          value={employee.payment_date || ""}
                          onChange={(event) =>
                            updateEmployee(
                              employee.id,
                              "payment_date",
                              event.target.value,
                            )
                          }
                        />
                      </td>

                      <td>
                        <input
                          type="text"
                          value={employee.remarks || ""}
                          onChange={(event) =>
                            updateEmployee(
                              employee.id,
                              "remarks",
                              event.target.value,
                            )
                          }
                        />
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
