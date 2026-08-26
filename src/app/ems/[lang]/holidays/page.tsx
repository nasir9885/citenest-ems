"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Holiday = {
  id: number;
  holiday_name_en: string;
  holiday_name_ar: string | null;
  holiday_date: string;
  holiday_type: string;
  is_recurring: boolean;
  status: string;
};

export default function HolidaysPage() {
  const params = useParams();
  const lang = typeof params.lang === "string" ? params.lang : "en";
  const isArabic = lang === "ar";
  const [year, setYear] = useState(new Date().getFullYear());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [role, setRole] = useState<"admin" | "user">("user");
  const [error, setError] = useState("");

  const load = useCallback(async (selectedYear: number) => {
    const response = await fetch(`/api/ems/holidays?year=${selectedYear}`, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Unable to load holidays.");
    setHolidays(result.holidays);
    setRole(result.role === "admin" ? "admin" : "user");
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => void load(year).catch((e: Error) => setError(e.message)), 0);
    return () => window.clearTimeout(id);
  }, [load, year]);

  async function createHoliday(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const response = await fetch("/api/ems/holidays", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nameEn: data.get("nameEn"), nameAr: data.get("nameAr"),
        holidayDate: data.get("holidayDate"), holidayType: data.get("holidayType"),
        isRecurring: data.get("isRecurring") === "on", description: data.get("description") }),
    });
    const result = await response.json();
    if (!response.ok) return setError(result.message || "Unable to create holiday.");
    form.reset();
    await load(year);
  }

  return (
    <main className={`ems-page ${isArabic ? "ems-rtl" : "ems-ltr"}`} dir={isArabic ? "rtl" : "ltr"}>
      <section className="ems-section"><div className="ems-container">
        <div className="ems-page-toolbar"><div>
          <Link href={`/ems/${lang}`} className="ems-back-link">← Back to Dashboard</Link>
          <h1>{isArabic ? "قائمة العطلات" : "Holiday Calendar"}</h1>
        </div><label>Year <input type="number" min="2000" max="2100" value={year} onChange={(e) => setYear(Number(e.target.value))} /></label></div>
        {error && <div className="ems-error">{error}</div>}
        {role === "admin" && (
          <form className="ems-inline-master-form" onSubmit={createHoliday}>
            <input name="nameEn" placeholder="Holiday name" required />
            <input name="nameAr" placeholder="اسم العطلة" dir="rtl" />
            <input name="holidayDate" type="date" required />
            <select name="holidayType"><option value="PUBLIC">Public</option><option value="COMPANY">Company</option></select>
            <label className="ems-checkbox"><input name="isRecurring" type="checkbox" /> Recurring</label>
            <button className="primary-action" type="submit">Add Holiday</button>
          </form>
        )}
        <div className="ems-table-wrapper"><table className="ems-table"><thead><tr>
          <th>Date</th><th>Holiday</th><th>Type</th><th>Recurring</th><th>Status</th>
        </tr></thead><tbody>{holidays.map((holiday) => (
          <tr key={holiday.id}><td>{holiday.holiday_date.substring(0, 10)}</td>
            <td>{isArabic ? holiday.holiday_name_ar || holiday.holiday_name_en : holiday.holiday_name_en}</td>
            <td>{holiday.holiday_type}</td><td>{holiday.is_recurring ? "Yes" : "No"}</td><td>{holiday.status}</td></tr>
        ))}</tbody></table></div>
      </div></section>
    </main>
  );
}
