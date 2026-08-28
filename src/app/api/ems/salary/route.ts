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

function validPeriod(month: number, year: number): boolean {
  return (
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12 &&
    Number.isInteger(year) &&
    year >= 2000 &&
    year <= 2100
  );
}

export async function GET(request: Request) {
  try {
    const context = await requireTenantContext();
    requireAdmin(context);

    const url = new URL(request.url);
    const month = Number(url.searchParams.get("month"));
    const year = Number(url.searchParams.get("year"));

    if (!validPeriod(month, year)) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid month and year are required.",
        },
        { status: 400 },
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
          ON s.tenant_id = e.tenant_id
         AND s.employee_id = e.id
         AND s.salary_month = $2
         AND s.salary_year = $3
        WHERE e.tenant_id = $1
          AND e.status = 'ACTIVE'
        ORDER BY e.employee_number
      `,
      [context.tenantId, month, year],
    );

    return NextResponse.json({
      success: true,
      employees: result.rows,
    });
  } catch (error: unknown) {
    if (error instanceof TenantAccessError) {
      return accessErrorResponse(error);
    }

    console.error("Unable to load payroll:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load payroll.",
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
    const month = Number(body.month);
    const year = Number(body.year);
    const records = Array.isArray(body.records) ? body.records : [];

    if (!validPeriod(month, year)) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid month and year are required.",
        },
        { status: 400 },
      );
    }

    const normalizedRecords = [];

    for (const record of records) {
      const employeeId = String(record.employeeId ?? "").trim();
      const basicSalary = Number(record.basicSalary ?? 0);
      const allowances = Number(record.allowances ?? 0);
      const deductions = Number(record.deductions ?? 0);

      const paymentStatus = String(
        record.paymentStatus || "PENDING",
      )
        .trim()
        .toUpperCase();

      const paymentDate = record.paymentDate || null;
      const remarks = String(record.remarks || "").trim() || null;

      if (!/^[1-9]\d*$/.test(employeeId)) {
        return NextResponse.json(
          {
            success: false,
            message: "A payroll employee ID is invalid.",
          },
          { status: 400 },
        );
      }

      if (
        !Number.isFinite(basicSalary) ||
        !Number.isFinite(allowances) ||
        !Number.isFinite(deductions) ||
        basicSalary < 0 ||
        allowances < 0 ||
        deductions < 0 ||
        deductions > basicSalary + allowances
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "A payroll amount is invalid.",
          },
          { status: 400 },
        );
      }

      if (
        paymentStatus !== "PENDING" &&
        paymentStatus !== "PAID"
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "A payroll payment status is invalid.",
          },
          { status: 400 },
        );
      }

      if (paymentStatus === "PAID" && !paymentDate) {
        return NextResponse.json(
          {
            success: false,
            message: "Paid payroll records require a payment date.",
          },
          { status: 400 },
        );
      }

      normalizedRecords.push({
        employeeId,
        basicSalary,
        allowances,
        deductions,
        paymentStatus,
        paymentDate,
        remarks,
      });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      for (const record of normalizedRecords) {
        await client.query(
          `
            INSERT INTO salary_payments (
              tenant_id,
              employee_id,
              salary_month,
              salary_year,
              basic_salary,
              allowances,
              deductions,
              payment_status,
              payment_date,
              remarks,              created_by,
              updated_by
            )
            VALUES (
              $1, $2, $3, $4, $5,
              $6, $7, $8, $9, $10,
              $11, $11
            )
            ON CONFLICT (
              tenant_id,
              employee_id,
              salary_month,
              salary_year
            )
            DO UPDATE SET
              basic_salary = EXCLUDED.basic_salary,
              allowances = EXCLUDED.allowances,
              deductions = EXCLUDED.deductions,
              payment_status = EXCLUDED.payment_status,
              payment_date = EXCLUDED.payment_date,
              remarks = EXCLUDED.remarks,
              updated_by = EXCLUDED.updated_by,
              updated_at = CURRENT_TIMESTAMP
          `,
          [
            context.tenantId,
            record.employeeId,
            month,
            year,
            record.basicSalary,
            record.allowances,
            record.deductions,
            record.paymentStatus,
            record.paymentDate,
            record.remarks,
            context.userEmail,
          ],
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: unknown) {
    if (error instanceof TenantAccessError) {
      return accessErrorResponse(error);
    }

    const pgError = error as { code?: string };

    if (pgError.code === "23503") {
      return NextResponse.json(
        {
          success: false,
          message: "An employee does not belong to this tenant.",
        },
        { status: 400 },
      );
    }

    if (pgError.code === "23514" || pgError.code === "22007") {
      return NextResponse.json(
        {
          success: false,
          message: "A payroll value or payment date is invalid.",
        },
        { status: 400 },
      );
    }

    console.error("Unable to save payroll:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to save payroll.",
      },
      { status: 500 },
    );
  }
}