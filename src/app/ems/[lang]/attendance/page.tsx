"use client";

import Link from "next/link";
import { useState } from "react";

import { useParams } from "next/navigation";

import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

type AttendanceEmployee = {
  id: number;
  employee_number: string;

  name_en: string;
  name_ar: string | null;

  designation_en: string | null;
  designation_ar: string | null;

  status: string | null;

  check_in: string | null;
  check_out: string | null;

  remarks: string | null;
};

function todayString() {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function AttendancePage() {
  const params = useParams();

  const lang = typeof params.lang === "string" ? params.lang : "en";

  const isArabic = lang === "ar";
  const t = isArabic ? ar : en;

  const [date, setDate] = useState(todayString());

  const [employees, setEmployees] = useState<AttendanceEmployee[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  async function loadAttendance(selectedDate: string) {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/ems/attendance?date=${encodeURIComponent(selectedDate)}`,
        {
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Unable to load attendance.");

        return;
      }
      const rows = result.employees.map((employee: AttendanceEmployee) => ({
        ...employee,

        status: employee.status || "PRESENT",

        check_in: employee.check_in ? employee.check_in.substring(0, 5) : "",

        check_out: employee.check_out ? employee.check_out.substring(0, 5) : "",

        remarks: employee.remarks || "",
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
    field: "status" | "check_in" | "check_out" | "remarks",
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

  async function createAttendance() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/ems/attendance?date=${encodeURIComponent(date)}&mode=create`,
        {
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Unable to create attendance.");
        return;
      }

      const rows = result.employees.map((employee: AttendanceEmployee) => ({
        ...employee,
        status: "PRESENT",
        check_in: "",
        check_out: "",
        remarks: "",
      }));

      setEmployees(rows);
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  async function saveAttendance() {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/ems/attendance", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          date,

          records: employees.map((employee) => ({
            employeeId: employee.id,

            status: employee.status,

            checkIn: employee.check_in || null,

            checkOut: employee.check_out || null,

            remarks: employee.remarks || null,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Unable to save attendance.");

        return;
      }

      setSuccess(t.attendanceSaved);

      await loadAttendance(date);
    } catch {
      setError("Unable to save attendance.");
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
            <Link href="/ems/en/attendance">English</Link>

            <Link href="/ems/ar/attendance">العربية</Link>
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

              <h1>{t.attendance}</h1>
            </div>
          </div>

          <div className="attendance-toolbar">
            <label>
              {t.attendanceDate}

              <input
                type="date"
                value={date}
                onChange={(event) => {
  const selectedDate = event.target.value;
  setDate(selectedDate);
  void loadAttendance(selectedDate);
}}
              />
            </label>
            <button
              type="button"
              className="attendance-mark-all"
              onClick={() =>
                setEmployees((current) =>
                  current.map((employee) => ({
                    ...employee,
                    status: "PRESENT",
                  })),
                )
              }
              disabled={loading || employees.length === 0}
            >
              {isArabic ? "تحديد الكل حاضر" : "Mark All Present"}
            </button>

            <button
              type="button"
              className="primary-action"
              onClick={saveAttendance}
              disabled={saving || loading || employees.length === 0}
            >
              {saving ? t.savingAttendance : t.saveAttendance}
            </button>
          </div>

          {success && <div className="ems-success">{success}</div>}

          {error && <div className="ems-error">{error}</div>}

          {loading && <div className="ems-message">{t.loading}</div>}

          {!loading && !error && employees.length === 0 && (
            <div className="attendance-empty-state">
              <p>{t.noAttendanceData}</p>

              <button
                type="button"
                className="attendance-mark-all"
                onClick={createAttendance}
              >
                {t.createAttendance}
              </button>
            </div>
          )}

          {!loading && employees.length > 0 && (
            <div className="ems-table-wrapper">
              <table className="ems-table attendance-table">
                <thead>
                  <tr>
                    <th>{t.employeeNumber}</th>
                    <th>{t.employeeName}</th>
                    <th>Present</th>
                    <th>{t.attendanceStatus}</th>
                    <th>{t.checkIn}</th>
                    <th>{t.checkOut}</th>
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
                        {isArabic
                          ? employee.designation_ar ||
                            employee.designation_en ||
                            "—"
                          : employee.designation_en || "—"}
                      </td>
                      <td className="attendance-present-cell">
                        <input
                          type="checkbox"
                          checked={employee.status === "PRESENT"}
                          onChange={(event) =>
                            updateEmployee(
                              employee.id,
                              "status",
                              event.target.checked ? "PRESENT" : "ABSENT",
                            )
                          }
                          aria-label={`Mark ${employee.employee_number} present`}
                        />
                      </td>

                      <td>
                        <select
                          value={employee.status || "PRESENT"}

                          onChange={(event) =>
                            updateEmployee(
                              employee.id,
                              "status",
                              event.target.value,
                            )
                          }
                        >
                          <option value="PRESENT">{t.present}</option>

                          <option value="ABSENT">{t.absent}</option>

                          <option value="LEAVE">{t.leave}</option>

                          <option value="SICK">{t.sick}</option>

                          <option value="HOLIDAY">{t.holiday}</option>
                        </select>
                      </td>

                      <td>
                        <input
                          type="time"
                          value={employee.check_in || ""}

                          onChange={(event) =>
                            updateEmployee(
                              employee.id,
                              "check_in",
                              event.target.value,
                            )
                          }
                        />
                      </td>

                      <td>
                        <input
                          type="time"
                          value={employee.check_out || ""}

                          onChange={(event) =>
                            updateEmployee(
                              employee.id,
                              "check_out",
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
