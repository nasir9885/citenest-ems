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

export async function GET() {
  try {
    const context = await requireTenantContext();
    const result = await pool.query(
      `SELECT d.id, d.department_code, d.name_en, d.name_ar, d.description,
              d.status, COUNT(e.id)::INTEGER AS employee_count
       FROM departments d
       LEFT JOIN employees e ON e.tenant_id = d.tenant_id AND e.department_id = d.id
       WHERE d.tenant_id = $1
       GROUP BY d.id
       ORDER BY d.name_en`,
      [context.tenantId],
    );
    return NextResponse.json({ success: true, role: context.role, departments: result.rows });
  } catch (error: unknown) {
    if (error instanceof TenantAccessError) return accessError(error);
    console.error("Unable to load departments:", error);
    return NextResponse.json({ success: false, message: "Unable to load departments." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireTenantContext();
    requireAdmin(context);
    const body = await request.json();
    const code = String(body.departmentCode || "").trim().toUpperCase();
    const nameEn = String(body.nameEn || "").trim();
    const nameAr = String(body.nameAr || "").trim() || null;
    const description = String(body.description || "").trim() || null;
    if (!code || !nameEn) {
      return NextResponse.json({ success: false, message: "Department code and English name are required." }, { status: 400 });
      }
      const result = await pool.query(
      `INSERT INTO departments (tenant_id, department_code, name_en, name_ar, description,
  created_by,
  updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $6)
       RETURNING id, department_code, name_en, name_ar, description, status`,
          [context.tenantId, code, nameEn, nameAr, description, context.userEmail,],
    );
    return NextResponse.json({ success: true, department: result.rows[0] }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof TenantAccessError) return accessError(error);
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ success: false, message: "Department code already exists." }, { status: 409 });
    }
    console.error("Unable to create department:", error);
    return NextResponse.json({ success: false, message: "Unable to create department." }, { status: 500 });
  }
}
