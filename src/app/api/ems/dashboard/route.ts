import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const employeeResult = await pool.query(`
      SELECT COUNT(*)::INTEGER AS total_employees
      FROM employees
      WHERE status = 'ACTIVE'
    `);

    const attendanceResult = await pool.query(`
      SELECT
        COUNT(*) FILTER (
          WHERE status = 'PRESENT'
        )::INTEGER AS present_today,

        COUNT(*) FILTER (
          WHERE status = 'ABSENT'
        )::INTEGER AS absent_today

      FROM employee_attendance

      WHERE attendance_date = CURRENT_DATE
    `);

    const payrollResult = await pool.query(`
      SELECT
        COALESCE(
          SUM(net_salary),
          0
        ) AS monthly_payroll

      FROM salary_payments

      WHERE salary_month =
        EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER

      AND salary_year =
        EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
    `);

    return NextResponse.json({
      success: true,

      dashboard: {
        totalEmployees: employeeResult.rows[0].total_employees,

        presentToday: attendanceResult.rows[0].present_today,

        absentToday: attendanceResult.rows[0].absent_today,

        monthlyPayroll: payrollResult.rows[0].monthly_payroll,
      },
    });
  } catch (error) {
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
