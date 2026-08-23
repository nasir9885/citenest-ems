import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
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
      ORDER BY employee_number
    `);

    return NextResponse.json({
      success: true,
      employees: result.rows,
    });
  } catch (error) {
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
    const body = await request.json();

    const employeeNumber = String(body.employeeNumber || "").trim();
    const nameEn = String(body.nameEn || "").trim();
    const nameAr = String(body.nameAr || "").trim();

    const designationEn = String(body.designationEn || "").trim();
    const designationAr = String(body.designationAr || "").trim();

    const dateOfJoining = body.dateOfJoining || null;

    const passportNumber = String(body.passportNumber || "").trim() || null;

    const civilId = String(body.civilId || "").trim() || null;

    const basicSalary = Number(body.basicSalary || 0);

    const bankName = String(body.bankName || "").trim() || null;

    const bankAccountNumber =
      String(body.bankAccountNumber || "").trim() || null;

    const iban = String(body.iban || "").trim() || null;

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

    const result = await pool.query(
      `
        INSERT INTO employees (
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
          status
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12, $13
        )
        RETURNING *
      `,
      [
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
    console.error("Unable to create employee:", error);

    const pgError = error as { code?: string };

    if (pgError.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          message: "Employee number already exists.",
        },
        { status: 409 },
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
