"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Department = {
  id: number;
  department_code: string;
  name_en: string;
  name_ar: string | null;
  description: string | null;
  status: string;
  employee_count: number;
};

export default function DepartmentsPage() {
  const params = useParams();
  const lang = typeof params.lang === "string" ? params.lang : "en";
  const isArabic = lang === "ar";
  const [departments, setDepartments] = useState<Department[]>([]);
  const [role, setRole] = useState<"admin" | "user">("user");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/ems/departments", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Unable to load departments.");
    setDepartments(result.departments);
    setRole(result.role === "admin" ? "admin" : "user");
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => void load().catch((e: Error) => setError(e.message)), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  async function createDepartment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const response = await fetch("/api/ems/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        departmentCode: data.get("departmentCode"),
        nameEn: data.get("nameEn"),
        nameAr: data.get("nameAr"),
        description: data.get("description"),
      }),
    });
    const result = await response.json();
    if (!response.ok) return setError(result.message || "Unable to create department.");
    form.reset();
    await load();
  }

  return (
    <main className={`ems-page ${isArabic ? "ems-rtl" : "ems-ltr"}`} dir={isArabic ? "rtl" : "ltr"}>
      <section className="ems-section"><div className="ems-container">
        <div className="ems-page-toolbar"><div>
          <Link href={`/ems/${lang}`} className="ems-back-link">← Back to Dashboard</Link>
          <h1>{isArabic ? "الأقسام" : "Departments"}</h1>
        </div></div>
        {error && <div className="ems-error">{error}</div>}
        {role === "admin" && (
          <form className="ems-inline-master-form" onSubmit={createDepartment}>
            <input name="departmentCode" placeholder="Code" required />
            <input name="nameEn" placeholder="English name" required />
            <input name="nameAr" placeholder="الاسم بالعربية" dir="rtl" />
            <input name="description" placeholder="Description" />
            <button className="primary-action" type="submit">Add Department</button>
          </form>
        )}
        <div className="ems-table-wrapper"><table className="ems-table"><thead><tr>
          <th>Code</th><th>Department</th><th>Employees</th><th>Status</th>
        </tr></thead><tbody>{departments.map((department) => (
          <tr key={department.id}><td>{department.department_code}</td>
            <td>{isArabic ? department.name_ar || department.name_en : department.name_en}</td>
            <td>{department.employee_count}</td><td>{department.status}</td></tr>
        ))}</tbody></table></div>
      </div></section>
    </main>
  );
}
