import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const month = Number(url.searchParams.get("month"));
    const year = Number(url.searchParams.get("year"));

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(year)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid month and year are required.",
        },
        { status: 400 }
      );
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
          e.basic_salary AS employee_basic_salary,

          s.basic_salary,
          s.allowances,
          s.deductions,
          s.net_salary,
          s.payment_status,
          s.payment_date,
          s.remarks

        FROM employees e

        LEFT JOIN salary_payments s
          ON s.employee_id = e.id
         AND s.salary_month = $1
         AND s.salary_year = $2

        WHERE e.status = 'ACTIVE'

        ORDER BY e.employee_number
      `,
      [month, year]
    );

    return NextResponse.json({
      success: true,
      employees: result.rows,
    });
  } catch (error) {
    console.error("Unable to load payroll:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load payroll.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const client = await pool.connect();

  try {
    const body = await request.json();

    const month = Number(body.month);
    const year = Number(body.year);

    const records = Array.isArray(body.records)
      ? body.records
      : [];

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(year)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid month and year are required.",
        },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    for (const record of records) {
      const employeeId = Number(record.employeeId);

      const basicSalary = Number(record.basicSalary || 0);
      const allowances = Number(record.allowances || 0);
      const deductions = Number(record.deductions || 0);

      const paymentStatus = String(
        record.paymentStatus || "PENDING"
      )
        .trim()
        .toUpperCase();

      const paymentDate =
        record.paymentDate || null;

      const remarks =
        String(record.remarks || "").trim() || null;

      if (
        !Number.isInteger(employeeId) ||
        !Number.isFinite(basicSalary) ||
        !Number.isFinite(allowances) ||
        !Number.isFinite(deductions)
      ) {
        continue;
      }

      const netSalary =
        basicSalary + allowances - deductions;

      await client.query(
        `
          INSERT INTO salary_payments (
            employee_id,
            salary_month,
            salary_year,
            basic_salary,
            allowances,
            deductions,
            net_salary,
            payment_status,
            payment_date,
            remarks,
            updated_at
          )
          VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10, NOW()
          )

          ON CONFLICT (
            employee_id,
            salary_month,
            salary_year
          )

          DO UPDATE SET
            basic_salary = EXCLUDED.basic_salary,
            allowances = EXCLUDED.allowances,
            deductions = EXCLUDED.deductions,
            net_salary = EXCLUDED.net_salary,
            payment_status = EXCLUDED.payment_status,
            payment_date = EXCLUDED.payment_date,
            remarks = EXCLUDED.remarks,
            updated_at = NOW()
        `,
        [
          employeeId,
          month,
          year,
          basicSalary,
          allowances,
          deductions,
          netSalary,
          paymentStatus,
          paymentDate,
          remarks,
        ]
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Unable to save payroll:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to save payroll.",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
