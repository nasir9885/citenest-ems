import { NextResponse } from "next/server";

import pool from "@/lib/db";
import {
  requireAdmin,
  requireTenantContext,
  TenantAccessError,
} from "@/lib/tenant-context";

function accessErrorResponse(error: TenantAccessError) {
  return NextResponse.json(
    {
      success: false,
      message: error.message,
    },
    { status: error.status },
  );
}

export async function GET(request: Request) {
  try {
    const context = await requireTenantContext();
    const searchParams = new URL(request.url).searchParams;
    const query = String(searchParams.get("q") || "").trim();
    const status = String(searchParams.get("status") || "").trim().toUpperCase();
    const departmentId = String(searchParams.get("departmentId") || "").trim();

    if (status && status !== "ACTIVE" && status !== "INACTIVE") {
      return NextResponse.json({ success: false, message: "Employee status filter is invalid." }, { status: 400 });
    }

    if (departmentId && !/^[1-9]\d*$/.test(departmentId)) {
      return NextResponse.json({ success: false, message: "Department filter is invalid." }, { status: 400 });
    }

    const result = await pool.query(
      `
        SELECT
          e.id,
          e.employee_number,
          e.name_en,
          e.name_ar,
          e.designation_en,
          e.designation_ar,
          d.name_en AS department_name_en,
          d.name_ar AS department_name_ar,
          e.date_of_joining,
          e.passport_number,
          e.civil_id,
          e.basic_salary,
          e.bank_name,
          e.bank_account_number,
          e.iban,
          e.status,
          e.created_at,
          e.updated_at
        FROM employees e
        LEFT JOIN departments d
          ON d.tenant_id = e.tenant_id
         AND d.id = e.department_id
        WHERE e.tenant_id = $1
          AND (
            $2 = '' OR
            e.employee_number ILIKE '%' || $2 || '%' OR
            e.name_en ILIKE '%' || $2 || '%' OR
            COALESCE(e.name_ar, '') ILIKE '%' || $2 || '%' OR
            COALESCE(e.civil_id, '') ILIKE '%' || $2 || '%' OR
            COALESCE(e.work_email, '') ILIKE '%' || $2 || '%' OR
            COALESCE(e.phone_number, '') ILIKE '%' || $2 || '%'
          )
          AND ($3 = '' OR e.status = $3)
          AND ($4 = '' OR e.department_id = $4::BIGINT)
        ORDER BY e.employee_number
      `,
      [context.tenantId, query, status, departmentId],
    );

    return NextResponse.json({
      success: true,
      role: context.role,
      employees: result.rows,
    });
  } catch (error: unknown) {
    if (error instanceof TenantAccessError) {
      return accessErrorResponse(error);
    }

    console.error("Unable to load employees:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load employees.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireTenantContext();
    requireAdmin(context);

    const body = await request.json();

    const employeeNumber = String(body.employeeNumber || "").trim();
    const nameEn = String(body.nameEn || "").trim();
    const nameAr = String(body.nameAr || "").trim();

    const designationEn = String(body.designationEn || "").trim();
    const designationAr = String(body.designationAr || "").trim();

    const dateOfJoining = body.dateOfJoining || null;

    const passportNumber =
      String(body.passportNumber || "").trim() || null;

    const civilId = String(body.civilId || "").trim() || null;

    const basicSalary = Number(body.basicSalary || 0);

    const bankName = String(body.bankName || "").trim() || null;

    const bankAccountNumber =
      String(body.bankAccountNumber || "").trim() || null;

    const iban = String(body.iban || "").trim() || null;
    const workEmail = String(body.workEmail || "").trim().toLowerCase() || null;
    const phoneNumber = String(body.phoneNumber || "").trim() || null;
    const presentAddress = String(body.presentAddress || "").trim() || null;
    const permanentAddress = String(body.permanentAddress || "").trim() || null;
    const departmentId = String(body.departmentId || "").trim() || null;

    if (departmentId && !/^[1-9]\d*$/.test(departmentId)) {
      return NextResponse.json({ success: false, message: "Department is invalid." }, { status: 400 });
    }

    const status = String(body.status || "ACTIVE")
      .trim()
      .toUpperCase();

    if (!employeeNumber || !nameEn) {
      return NextResponse.json(
        {
          success: false,
          message: "Employee number and English name are required.",
        },
        { status: 400 },
      );
    }

    if (!Number.isFinite(basicSalary) || basicSalary < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Basic salary is invalid.",
        },
        { status: 400 },
      );
    }

    if (status !== "ACTIVE" && status !== "INACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "Employee status is invalid.",
        },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `
        INSERT INTO employees (
          tenant_id,
          employee_number,
          name_en,
          name_ar,
          designation_en,
          designation_ar,
          date_of_joining,
          passport_number,
          civil_id,
          basic_salary,
          bank_name,
          bank_account_number,
          iban,
          status,
          work_email,
          phone_number,
          present_address,
          permanent_address
          ,department_id
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19
        )
        RETURNING
          id,
          employee_number,
          name_en,
          name_ar,
          designation_en,
          designation_ar,
          date_of_joining,
          passport_number,
          civil_id,
          basic_salary,
          bank_name,
          bank_account_number,
          iban,
          status,
          created_at,
          updated_at
      `,
      [
        context.tenantId,
        employeeNumber,
        nameEn,
        nameAr || null,
        designationEn || null,
        designationAr || null,
        dateOfJoining,
        passportNumber,
        civilId,
        basicSalary,
        bankName,
        bankAccountNumber,
        iban,
        status,
        workEmail,
        phoneNumber,
        presentAddress,
        permanentAddress,
        departmentId,
      ],
    );

    return NextResponse.json(
      {
        success: true,
        employee: result.rows[0],
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    if (error instanceof TenantAccessError) {
      return accessErrorResponse(error);
    }

    console.error("Unable to create employee:", error);

    const pgError = error as { code?: string };

    if (pgError.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Employee number, passport number, or civil ID already exists.",
        },
        { status: 409 },
      );
    }

    if (pgError.code === "23503") {
      return NextResponse.json(
        { success: false, message: "The selected department is unavailable for this tenant." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to save employee.",
      },
      { status: 500 },
    );
  }
}
