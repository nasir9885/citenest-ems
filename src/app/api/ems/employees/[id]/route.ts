import { NextResponse } from "next/server";
import pool from "@/lib/db";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  { params }: RouteProps
) {
  try {
    const { id } = await params;

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
          status,
          created_at,
          updated_at
        FROM employees
        WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Employee not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      employee: result.rows[0],
    });
  } catch (error) {
    console.error("Unable to load employee:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load employee.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: RouteProps
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const employeeNumber =
      String(body.employeeNumber || "").trim();

    const nameEn =
      String(body.nameEn || "").trim();

    const nameAr =
      String(body.nameAr || "").trim() || null;

    const designationEn =
      String(body.designationEn || "").trim() || null;

    const designationAr =
      String(body.designationAr || "").trim() || null;

    const dateOfJoining =
      body.dateOfJoining || null;

    const passportNumber =
      String(body.passportNumber || "").trim() || null;

    const civilId =
      String(body.civilId || "").trim() || null;

    const basicSalary =
      Number(body.basicSalary || 0);

    const bankName =
      String(body.bankName || "").trim() || null;

    const bankAccountNumber =
      String(body.bankAccountNumber || "").trim() || null;

    const iban =
      String(body.iban || "").trim() || null;

    const status =
      String(body.status || "ACTIVE")
        .trim()
        .toUpperCase();

    if (!employeeNumber || !nameEn) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Employee number and English name are required.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(basicSalary) ||
      basicSalary < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Basic salary is invalid.",
        },
        { status: 400 }
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
          updated_at = NOW()
        WHERE id = $14
        RETURNING *
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
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Employee not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      employee: result.rows[0],
    });
  } catch (error: unknown) {
    console.error("Unable to update employee:", error);

    const pgError = error as {
      code?: string;
    };

    if (pgError.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Employee number already exists.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update employee.",
      },
      { status: 500 }
    );
  }
}
