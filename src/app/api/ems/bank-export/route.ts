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

function escapeCsv(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);

  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  try {
    const context = await requireTenantContext();
    requireAdmin(context);

    const url = new URL(request.url);
    const month = Number(url.searchParams.get("month"));
    const year = Number(url.searchParams.get("year"));
    const format = url.searchParams.get("format");

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
          e.employee_number,
          e.name_en,
          e.name_ar,
          e.bank_name,
          e.bank_account_number,
          e.iban,
          s.salary_month,
          s.salary_year,
          s.basic_salary,
          s.allowances,
          s.deductions,
          s.net_salary,
          s.payment_status
        FROM salary_payments s
        JOIN employees e
          ON e.tenant_id = s.tenant_id
         AND e.id = s.employee_id
        WHERE s.tenant_id = $1
          AND s.salary_month = $2
          AND s.salary_year = $3
        ORDER BY e.employee_number
      `,
      [context.tenantId, month, year],
    );

    if (format === "csv") {
      const headers = [
        "Employee Number",
        "Employee Name",
        "Bank Name",
        "Account Number",
        "IBAN",
        "Month",
        "Year",
        "Basic Salary",
        "Allowances",
        "Deductions",
        "Net Salary",
        "Payment Status",
      ];

      const lines = [
        headers.map(escapeCsv).join(","),
        ...result.rows.map((row) =>
          [
            row.employee_number,
            row.name_en,
            row.bank_name,
            row.bank_account_number,
            row.iban,
            row.salary_month,
            row.salary_year,
            row.basic_salary,
            row.allowances,
            row.deductions,
            row.net_salary,
            row.payment_status,
          ]
            .map(escapeCsv)
            .join(","),
        ),
      ];

      const csv = `\uFEFF${lines.join("\n")}`;

      return new Response(csv, {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition":
            `attachment; filename="salary_bank_export_${year}_${String(
              month,
            ).padStart(2, "0")}.csv"`,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        records: result.rows,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error: unknown) {
    if (error instanceof TenantAccessError) {
      return accessErrorResponse(error);
    }

    console.error("Unable to load salary export:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load bank salary export.",
      },
      { status: 500 },
    );
  }
}