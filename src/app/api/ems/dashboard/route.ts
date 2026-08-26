import { NextResponse } from "next/server";

import pool from "@/lib/db";
import {
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

export async function GET() {
  try {
    const context = await requireTenantContext();

    const [employeeResult, attendanceResult] = await Promise.all([
      pool.query(
        `
          SELECT COUNT(*)::INTEGER AS total_employees
          FROM employees
          WHERE tenant_id = $1
            AND status = 'ACTIVE'
        `,
        [context.tenantId],
      ),

      pool.query(
        `
          SELECT
            COUNT(*) FILTER (
              WHERE status = 'PRESENT'
            )::INTEGER AS present_today,
            COUNT(*) FILTER (
              WHERE status = 'ABSENT'
            )::INTEGER AS absent_today
          FROM employee_attendance
          WHERE tenant_id = $1
            AND attendance_date = CURRENT_DATE
        `,
        [context.tenantId],
      ),
    ]);

    let monthlyPayroll: string | number | null = null;

    if (context.role === "admin") {
      const payrollResult = await pool.query(
        `
          SELECT COALESCE(SUM(net_salary), 0) AS monthly_payroll
          FROM salary_payments
          WHERE tenant_id = $1
            AND salary_month =
              EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER
            AND salary_year =
              EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
        `,
        [context.tenantId],
      );

      monthlyPayroll = payrollResult.rows[0].monthly_payroll;
    }

    return NextResponse.json(
      {
        success: true,
        dashboard: {
          role: context.role,
          totalEmployees:
            employeeResult.rows[0].total_employees,
          presentToday:
            attendanceResult.rows[0].present_today,
          absentToday:
            attendanceResult.rows[0].absent_today,
          monthlyPayroll,
        },
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

    console.error("Unable to load EMS dashboard:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load dashboard information.",
      },
      { status: 500 },
    );
  }
}