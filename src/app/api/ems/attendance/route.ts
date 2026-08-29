import { NextResponse } from "next/server";

import pool from "@/lib/db";
import {
  requireAdmin,
  requireTenantContext,
  TenantAccessError,
} from "@/lib/tenant-context";

const ALLOWED_STATUSES = new Set([
  "PRESENT",
  "ABSENT",
  "LEAVE",
  "SICK",
  "HOLIDAY",
]);

function accessErrorResponse(error: TenantAccessError) {
  return NextResponse.json(
    {
      success: false,
      message: error.message,
    },
    { status: error.status },
  );
}

function isDateFormat(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function GET(request: Request) {
  try {
    const context = await requireTenantContext();
    const url = new URL(request.url);

    const date = url.searchParams.get("date");
    const mode = url.searchParams.get("mode");

    if (!date || !isDateFormat(date)) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid attendance date is required.",
        },
        { status: 400 },
      );
    }

    if (mode === "create") {
      requireAdmin(context);

      const employees = await pool.query(
        `
          SELECT
            id,
            employee_number,
            name_en,
            name_ar,
            designation_en,
            designation_ar,
            NULL::VARCHAR AS status,
            NULL::TIME AS check_in,
            NULL::TIME AS check_out,
            NULL::VARCHAR AS remarks
          FROM employees
          WHERE tenant_id = $1
            AND status = 'ACTIVE'
          ORDER BY employee_number
        `,
        [context.tenantId],
      );

      return NextResponse.json({
        success: true,
        role: context.role,
        hasAttendance: false,
        employees: employees.rows,
      });
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
          a.status,
          a.check_in,
          a.check_out,
          a.remarks
        FROM employee_attendance a
        JOIN employees e
          ON e.tenant_id = a.tenant_id
         AND e.id = a.employee_id
        WHERE a.tenant_id = $1
          AND a.attendance_date = $2
        ORDER BY e.employee_number
      `,
      [context.tenantId, date],
    );

    return NextResponse.json({
      success: true,
      role: context.role,
      hasAttendance: result.rows.length > 0,
      employees: result.rows,
    });
  } catch (error: unknown) {
    if (error instanceof TenantAccessError) {
      return accessErrorResponse(error);
    }

    console.error("Unable to load attendance:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load attendance.",
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
    const date = String(body.date || "").trim();
    const records = Array.isArray(body.records) ? body.records : [];

    if (!isDateFormat(date)) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid attendance date is required.",
        },
        { status: 400 },
      );
    }

    const normalizedRecords = [];

    for (const record of records) {
      const employeeId = String(record.employeeId ?? "").trim();
      const status = String(record.status || "PRESENT").toUpperCase();
      const checkIn = record.checkIn || null;
      const checkOut = record.checkOut || null;
      const remarks = String(record.remarks || "").trim() || null;

      if (!/^[1-9]\d*$/.test(employeeId)) {
        return NextResponse.json(
          {
            success: false,
            message: "An attendance employee ID is invalid.",
          },
          { status: 400 },
        );
      }

      if (!ALLOWED_STATUSES.has(status)) {
        return NextResponse.json(
          {
            success: false,
            message: "An attendance status is invalid.",
          },
          { status: 400 },
        );
      }

      normalizedRecords.push({
        employeeId,
        status,
        checkIn,
        checkOut,
        remarks,
      });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      for (const record of normalizedRecords) {
        await client.query(
          `
            INSERT INTO employee_attendance (
              tenant_id,
              employee_id,
              attendance_date,
              status,
              check_in,
              check_out,
              remarks,
              created_by,
              updated_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8))
            ON CONFLICT (
              tenant_id,
              employee_id,
              attendance_date
            )
            DO UPDATE SET
              status = EXCLUDED.status,
              check_in = EXCLUDED.check_in,
              check_out = EXCLUDED.check_out,
              remarks = EXCLUDED.remarks,
              updated_by = EXCLUDED.updated_by,
              updated_at = CURRENT_TIMESTAMP
          `,
          [
            context.tenantId,
            record.employeeId,
            date,
            record.status,
            record.checkIn,
            record.checkOut,
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

    if (pgError.code === "22007") {
      return NextResponse.json(
        {
          success: false,
          message: "The attendance date or time is invalid.",
        },
        { status: 400 },
      );
    }

    console.error("Unable to save attendance:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to save attendance.",
      },
      { status: 500 },
    );
  }
}
