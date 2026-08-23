import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const date = url.searchParams.get("date");
    const mode = url.searchParams.get("mode");

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          message: "Attendance date is required.",
        },
        { status: 400 },
      );
    }

    /*
     * mode=create
     *
     * Load all active employees so new attendance
     * can be entered for a date with no existing data.
     */
    if (mode === "create") {
      const employees = await pool.query(`
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

        WHERE status = 'ACTIVE'

        ORDER BY employee_number
      `);

      return NextResponse.json({
        success: true,
        hasAttendance: false,
        employees: employees.rows,
      });
    }

    /*
     * Normal mode:
     * Return only attendance actually saved for
     * the selected date.
     */
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
          ON e.id = a.employee_id

        WHERE a.attendance_date = $1

        ORDER BY e.employee_number
      `,
      [date],
    );

    return NextResponse.json({
      success: true,
      hasAttendance: result.rows.length > 0,
      employees: result.rows,
    });
  } catch (error) {
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
  const client = await pool.connect();

  try {
    const body = await request.json();

    const date = String(body.date || "").trim();

    const records = Array.isArray(body.records) ? body.records : [];

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          message: "Attendance date is required.",
        },
        { status: 400 },
      );
    }

    await client.query("BEGIN");

    for (const record of records) {
      const employeeId = Number(record.employeeId);

      const status = String(record.status || "PRESENT").toUpperCase();

      const allowedStatuses = ["PRESENT", "ABSENT", "LEAVE", "SICK", "HOLIDAY"];

      if (!Number.isInteger(employeeId) || !allowedStatuses.includes(status)) {
        continue;
      }

      const checkIn = record.checkIn || null;

      const checkOut = record.checkOut || null;

      const remarks = String(record.remarks || "").trim() || null;

      await client.query(
        `
          INSERT INTO employee_attendance (
            employee_id,
            attendance_date,
            status,
            check_in,
            check_out,
            remarks,
            updated_at
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, NOW()
          )

          ON CONFLICT (
            employee_id,
            attendance_date
          )

          DO UPDATE SET
            status = EXCLUDED.status,
            check_in = EXCLUDED.check_in,
            check_out = EXCLUDED.check_out,
            remarks = EXCLUDED.remarks,
            updated_at = NOW()
        `,
        [employeeId, date, status, checkIn, checkOut, remarks],
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Unable to save attendance:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to save attendance.",
      },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
