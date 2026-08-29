import { NextResponse } from "next/server";

import pool from "@/lib/db";
import {
  requireAdmin,
  requireTenantContext,
  TenantAccessError,
} from "@/lib/tenant-context";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function accessErrorResponse(error: TenantAccessError) {
  return NextResponse.json(
    {
      success: false,
      message: error.message,
    },
    { status: error.status },
  );
}

function isValidEmployeeId(id: string): boolean {
  return /^[1-9]\d*$/.test(id);
}

export async function GET(_request: Request, { params }: RouteProps) {
  try {
    const context = await requireTenantContext();
    const { id } = await params;

    if (!isValidEmployeeId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Employee ID is invalid.",
        },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `
        SELECT
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
          work_email,
          phone_number,
          present_address,
          permanent_address,
          photo_storage_key,
          department_id,
          status,
          created_at,
          updated_at
        FROM employees
        WHERE tenant_id = $1
          AND id = $2
      `,
      [context.tenantId, id],
    );

    const employee = result.rows[0];

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          message: "Employee not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      employee,
    });
  } catch (error: unknown) {
    if (error instanceof TenantAccessError) {
      return accessErrorResponse(error);
    }

    console.error("Unable to load employee:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load employee.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: RouteProps) {
  try {
    const context = await requireTenantContext();
    requireAdmin(context);

    const { id } = await params;

    if (!isValidEmployeeId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Employee ID is invalid.",
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const employeeNumber = String(body.employeeNumber || "").trim();
    const nameEn = String(body.nameEn || "").trim();
    const nameAr = String(body.nameAr || "").trim() || null;

    const designationEn =
      String(body.designationEn || "").trim() || null;

    const designationAr =
      String(body.designationAr || "").trim() || null;

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
        UPDATE employees
        SET
          employee_number = $1,
          name_en = $2,
          name_ar = $3,
          designation_en = $4,
          designation_ar = $5,
          date_of_joining = $6,
          passport_number = $7,
          civil_id = $8,
          basic_salary = $9,
          bank_name = $10,
          bank_account_number = $11,
          iban = $12,
          status = $13,
          work_email = $14,
          phone_number = $15,
          present_address = $16,
          permanent_address = $17,
          department_id = $18
        WHERE tenant_id = $19
          AND id = $20
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
          created_by,
          created_at,
          updated_by,
          updated_at
      `,
      [
        employeeNumber,
        nameEn,
        nameAr,
        designationEn,
        designationAr,
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
          context.tenantId,
          id,
          context.userEmail,
      ],
    );

    const employee = result.rows[0];

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          message: "Employee not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      employee,
    });
  } catch (error: unknown) {
    if (error instanceof TenantAccessError) {
      return accessErrorResponse(error);
    }

    console.error("Unable to update employee:", error);

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
        message: "Unable to update employee.",
      },
      { status: 500 },
    );
  }
}
