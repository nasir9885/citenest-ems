"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

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
  passport_number: string | null;
  civil_id: string | null;
  basic_salary: string;
  bank_name: string | null;
  bank_account_number: string | null;
  iban: string | null;
  status: string;
};

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();

  const lang = typeof params.lang === "string" ? params.lang : "en";

  const id = typeof params.id === "string" ? params.id : "";

  const isArabic = lang === "ar";
  const t = isArabic ? ar : en;

  const [employee, setEmployee] = useState<Employee | null>(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEmployee() {
      try {
        const response = await fetch(`/api/ems/employees/${id}`, {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          setError(result.message || t.employeeNotFound);
          return;
        }

        setEmployee(result.employee);
      } catch {
        setError(t.employeeNotFound);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadEmployee();
    }
  }, [id, t.employeeNotFound]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    const updatedEmployee = {
      employeeNumber: formData.get("employeeNumber"),

      nameEn: formData.get("nameEn"),

      nameAr: formData.get("nameAr"),

      designationEn: formData.get("designationEn"),

      designationAr: formData.get("designationAr"),

      dateOfJoining: formData.get("dateOfJoining"),

      passportNumber: formData.get("passportNumber"),

      civilId: formData.get("civilId"),

      basicSalary: formData.get("basicSalary"),

      bankName: formData.get("bankName"),

      bankAccountNumber: formData.get("bankAccountNumber"),

      iban: formData.get("iban"),

      status: formData.get("status"),
    };

    try {
      const response = await fetch(`/api/ems/employees/${id}`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(updatedEmployee),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || t.errorEmployee);

        setSaving(false);
        return;
      }

      router.push(`/ems/${lang}/employees`);

      router.refresh();
    } catch {
      setError(t.errorEmployee);
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main
        className={`ems-page ${isArabic ? "ems-rtl" : "ems-ltr"}`}
        dir={isArabic ? "rtl" : "ltr"}
      >
        <section className="ems-section">
          <div className="ems-container">
            <div className="ems-message">{t.loading}</div>
          </div>
        </section>
      </main>
    );
  }

  if (!employee) {
    return (
      <main
        className={`ems-page ${isArabic ? "ems-rtl" : "ems-ltr"}`}
        dir={isArabic ? "rtl" : "ltr"}
      >
        <section className="ems-section">
          <div className="ems-container">
            <div className="ems-error">{error || t.employeeNotFound}</div>
          </div>
        </section>
      </main>
    );
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
        </div>
      </header>

      <section className="ems-section">
        <div className="ems-container">
          <div className="ems-form-header">
            <Link href={`/ems/${lang}/employees`} className="ems-back-link">
              ← {t.employeeList}
            </Link>

            <h1>{t.editEmployee}</h1>
          </div>

          <div className="ems-form-card">
            {error && <div className="ems-error">{error}</div>}

            <form className="ems-form" onSubmit={handleSubmit}>
              <div className="ems-form-grid">
                <label>
                  {t.employeeNumber} *
                  <input
                    name="employeeNumber"
                    defaultValue={employee.employee_number}
                    required
                  />
                </label>

                <label>
                  English Name *
                  <input
                    name="nameEn"
                    defaultValue={employee.name_en}
                    required
                  />
                </label>

                <label>
                  الاسم بالعربية
                  <input
                    name="nameAr"
                    dir="rtl"
                    defaultValue={employee.name_ar || ""}
                  />
                </label>

                <label>
                  English Designation
                  <input
                    name="designationEn"
                    defaultValue={employee.designation_en || ""}
                  />
                </label>

                <label>
                  المسمى الوظيفي بالعربية
                  <input
                    name="designationAr"
                    dir="rtl"
                    defaultValue={employee.designation_ar || ""}
                  />
                </label>

                <label>
                  {t.dateOfJoining}
                  <input
                    type="date"
                    name="dateOfJoining"
                    defaultValue={
                      employee.date_of_joining
                        ? employee.date_of_joining.substring(0, 10)
                        : ""
                    }
                  />
                </label>

                <label>
                  {t.passportNumber}
                  <input
                    name="passportNumber"
                    defaultValue={employee.passport_number || ""}
                  />
                </label>

                <label>
                  {t.civilId}
                  <input
                    name="civilId"
                    defaultValue={employee.civil_id || ""}
                  />
                </label>

                <label>
                  {t.basicSalary} *
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    name="basicSalary"
                    defaultValue={employee.basic_salary}
                    required
                  />
                </label>

                <label>
                  {t.bankName}
                  <input
                    name="bankName"
                    defaultValue={employee.bank_name || ""}
                  />
                </label>

                <label>
                  {t.bankAccount}
                  <input
                    name="bankAccountNumber"
                    defaultValue={employee.bank_account_number || ""}
                  />
                </label>

                <label>
                  {t.iban}
                  <input name="iban" defaultValue={employee.iban || ""} />
                </label>

                <label>
                  {t.status}

                  <select name="status" defaultValue={employee.status}>
                    <option value="ACTIVE">{t.active}</option>

                    <option value="INACTIVE">{t.inactive}</option>
                  </select>
                </label>
              </div>

              <div className="ems-form-actions">
                <Link
                  href={`/ems/${lang}/employees`}
                  className="secondary-action"
                >
                  {t.cancel}
                </Link>

                <button
                  type="submit"
                  className="primary-action"
                  disabled={saving}
                >
                  {saving ? t.updating : t.updateEmployee}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
