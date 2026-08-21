"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useParams } from "next/navigation";

import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

type SalaryExportRecord = {
  employee_number: string;
  name_en: string;
  name_ar: string | null;

  bank_name: string | null;
  bank_account_number: string | null;
  iban: string | null;

  salary_month: number;
  salary_year: number;

  basic_salary: string;
  allowances: string;
  deductions: string;
  net_salary: string;

  payment_status: string;
};

function currentMonth() {
  return new Date().getMonth() + 1;
}

function currentYear() {
  return new Date().getFullYear();
}

export default function BankExportPage() {
  const params = useParams();

  const lang =
    typeof params.lang === "string"
      ? params.lang
      : "en";

  const isArabic = lang === "ar";
  const t = isArabic ? ar : en;

  const [month, setMonth] =
    useState(currentMonth());

  const [year, setYear] =
    useState(currentYear());

  const [records, setRecords] =
    useState<SalaryExportRecord[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadRecords() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/ems/bank-export?month=${month}&year=${year}`,
        {
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        setError(
          result.message ||
            "Unable to load salary records."
        );

        return;
      }

      setRecords(result.records);
    } catch {
      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, [month, year]);

  const totalNetSalary =
    useMemo(
      () =>
        records.reduce(
          (total, record) =>
            total +
            Number(record.net_salary || 0),
          0
        ),
      [records]
    );

  function downloadCsv() {
    window.location.href =
      `/api/ems/bank-export?month=${month}&year=${year}&format=csv`;
  }

  return (
    <main
      className={`ems-page ${
        isArabic
          ? "ems-rtl"
          : "ems-ltr"
      }`}
      dir={
        isArabic
          ? "rtl"
          : "ltr"
      }
    >
      <header className="ems-header">
        <div className="ems-container ems-nav">
          <div>
            <Link
              href={`/ems/${lang}`}
              className="ems-brand"
            >
              CiteNest
            </Link>

            <span className="ems-app-name">
              {t.appName}
            </span>
          </div>

          <div className="ems-language-switch">
            <Link href="/ems/en/bank-export">
              English
            </Link>

            <Link href="/ems/ar/bank-export">
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

              <h1>
                {t.bankSalaryExport}
              </h1>

              <p className="ems-subtitle">
                {t.selectMonthYear}
              </p>
            </div>
          </div>

          <div className="salary-toolbar">

            <label>
              {t.salaryMonth}

              <select
                value={month}
                onChange={(event) =>
                  setMonth(
                    Number(
                      event.target.value
                    )
                  )
                }
              >
                {Array.from(
                  { length: 12 },
                  (_, index) => (
                    <option
                      key={index + 1}
                      value={index + 1}
                    >
                      {new Date(
                        2000,
                        index,
                        1
                      ).toLocaleString(
                        isArabic
                          ? "ar"
                          : "en",
                        {
                          month: "long",
                        }
                      )}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              {t.salaryYear}

              <input
                type="number"
                min="2000"
                max="2100"
                value={year}
                onChange={(event) =>
                  setYear(
                    Number(
                      event.target.value
                    )
                  )
                }
              />
            </label>

            <div className="salary-total">
              <span>
                {t.totalPayroll}
              </span>

              <strong>
                {totalNetSalary.toFixed(3)}
              </strong>
            </div>

            <button
              type="button"
              className="primary-action"
              onClick={downloadCsv}
              disabled={
                loading ||
                records.length === 0
              }
            >
              {t.downloadCsv}
            </button>

          </div>

          {error && (
            <div className="ems-error">
              {error}
            </div>
          )}

          {loading && (
            <div className="ems-message">
              {t.loading}
            </div>
          )}

          {!loading &&
            !error &&
            records.length === 0 && (
              <div className="ems-message">
                {t.noSalaryRecords}
              </div>
            )}

          {!loading &&
            records.length > 0 && (
              <div className="ems-table-wrapper">

                <table className="ems-table bank-export-table">

                  <thead>
                    <tr>
                      <th>
                        {t.employeeNumber}
                      </th>

                      <th>
                        {t.employeeName}
                      </th>

                      <th>
                        {t.bankName}
                      </th>

                      <th>
                        {t.accountNumber}
                      </th>

                      <th>
                        {t.iban}
                      </th>

                      <th>
                        {t.netSalary}
                      </th>

                      <th>
                        {t.paymentStatus}
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {records.map(
                      (record) => (
                        <tr
                          key={
                            record.employee_number
                          }
                        >
                          <td>
                            <strong>
                              {
                                record.employee_number
                              }
                            </strong>
                          </td>

                          <td>
                            {isArabic
                              ? record.name_ar ||
                                record.name_en
                              : record.name_en}
                          </td>

                          <td>
                            {record.bank_name ||
                              "—"}
                          </td>

                          <td>
                            {record.bank_account_number ||
                              "—"}
                          </td>

                          <td>
                            {record.iban ||
                              "—"}
                          </td>

                          <td className="ems-number salary-net">
                            {Number(
                              record.net_salary
                            ).toFixed(3)}
                          </td>

                          <td>
                            <span
                              className={`ems-status ems-status-${record.payment_status.toLowerCase()}`}
                            >
                              {
                                record.payment_status
                              }
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>

                </table>

              </div>
            )}

        </div>
      </section>
    </main>
  );
}
