import { NextResponse } from "next/server";

import pool from "@/lib/db";
import {
  requireAdmin,
  requireTenantContext,
  TenantAccessError,
} from "@/lib/tenant-context";

function accessError(error: TenantAccessError) {
  return NextResponse.json({ success: false, message: error.message }, { status: error.status });
}

export async function GET(request: Request) {
  try {
    const context = await requireTenantContext();
    const year = Number(new URL(request.url).searchParams.get("year") || new Date().getFullYear());
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ success: false, message: "Holiday year is invalid." }, { status: 400 });
    }
    const result = await pool.query(
      `SELECT id, holiday_name_en, holiday_name_ar, holiday_date, holiday_type,
              is_recurring, description, status
       FROM holidays
       WHERE tenant_id = $1 AND EXTRACT(YEAR FROM holiday_date) = $2
       ORDER BY holiday_date, holiday_name_en`,
      [context.tenantId, year],
    );
    return NextResponse.json({ success: true, role: context.role, holidays: result.rows });
  } catch (error: unknown) {
    if (error instanceof TenantAccessError) return accessError(error);
    console.error("Unable to load holidays:", error);
    return NextResponse.json({ success: false, message: "Unable to load holidays." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireTenantContext();
    requireAdmin(context);
    const body = await request.json();
    const nameEn = String(body.nameEn || "").trim();
    const nameAr = String(body.nameAr || "").trim() || null;
    const date = String(body.holidayDate || "").trim();
    const type = String(body.holidayType || "PUBLIC").toUpperCase();
    const description = String(body.description || "").trim() || null;
    if (!nameEn || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !["PUBLIC", "COMPANY"].includes(type)) {
      return NextResponse.json({ success: false, message: "Holiday name, date, or type is invalid." }, { status: 400 });
    }
      const result = await pool.query(
      `INSERT INTO holidays
         (tenant_id, holiday_name_en, holiday_name_ar, holiday_date, holiday_type, is_recurring, description,
  created_by,
  updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
       RETURNING id, holiday_name_en, holiday_name_ar, holiday_date, holiday_type, is_recurring, description, status,
  created_by,
  created_at,
  updated_by,
  updated_at`,
          [context.tenantId, nameEn, nameAr, date, type, body.isRecurring === true, description, context.userEmail,],
    );
    return NextResponse.json({ success: true, holiday: result.rows[0] }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof TenantAccessError) return accessError(error);
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ success: false, message: "This holiday already exists." }, { status: 409 });
    }
    console.error("Unable to create holiday:", error);
    return NextResponse.json({ success: false, message: "Unable to create holiday." }, { status: 500 });
  }
}
