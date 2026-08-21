"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

export default function AddEmployeePage() {
  const params = useParams();
  const router = useRouter();

  const lang =
    typeof params.lang === "string" ? params.lang : "en";

  const isArabic = lang === "ar";
  const t = isArabic ? ar : en;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const employee = {
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
      bankAccountNumber:
        formData.get("bankAccountNumber"),

      iban: formData.get("iban"),

      status: formData.get("status"),
    };

    try {
      const response = await fetch(
        "/api/ems/employees",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(employee),
        }
      );

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

  return (
    <main
      className={`ems-page ${isArabic ? "ems-rtl" : "ems-ltr"}`}
      dir={isArabic ? "rtl" : "ltr"}
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
        </div>
      </header>

      <section className="ems-section">
        <div className="ems-container">

          <div className="ems-form-header">
            <Link
              href={`/ems/${lang}/employees`}
              className="ems-back-link"
            >
              ← {t.employeeList}
            </Link>

            <h1>{t.addEmployee}</h1>
          </div>

          <div className="ems-form-card">

            {error && (
              <div className="ems-error">
                {error}
              </div>
            )}

            <form
              className="ems-form"
              onSubmit={handleSubmit}
            >

              <div className="ems-form-grid">

                <label>
                  {t.employeeNumber} *
                  <input
                    name="employeeNumber"
                    required
                  />
                </label>

                <label>
                  English Name *
                  <input
                    name="nameEn"
                    required
                  />
                </label>

                <label>
                  الاسم بالعربية
                  <input
                    name="nameAr"
                    dir="rtl"
                  />
                </label>

                <label>
                  English Designation
                  <input name="designationEn" />
                </label>

                <label>
                  المسمى الوظيفي بالعربية
                  <input
                    name="designationAr"
                    dir="rtl"
                  />
                </label>

                <label>
                  {t.dateOfJoining}
                  <input
                    type="date"
                    name="dateOfJoining"
                  />
                </label>

                <label>
                  {t.passportNumber}
                  <input name="passportNumber" />
                </label>

                <label>
                  {t.civilId}
                  <input name="civilId" />
                </label>

                <label>
                  {t.basicSalary} *
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    name="basicSalary"
                    required
                  />
                </label>

                <label>
                  {t.bankName}
                  <input name="bankName" />
                </label>

                <label>
                  {t.bankAccount}
                  <input name="bankAccountNumber" />
                </label>

                <label>
                  {t.iban}
                  <input name="iban" />
                </label>

                <label>
                  {t.status}
                  <select
                    name="status"
                    defaultValue="ACTIVE"
                  >
                    <option value="ACTIVE">
                      {t.active}
                    </option>

                    <option value="INACTIVE">
                      {t.inactive}
                    </option>
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
                  {saving
                    ? t.saving
                    : t.saveEmployee}
                </button>
              </div>

            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
