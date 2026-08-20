import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const mobile = String(body.mobile || "").trim();
    const organization = String(body.organization || "").trim();
    const message = String(body.message || "").trim();

    if (!name || !email || !mobile || !message) {
      return NextResponse.json(
        {
          success: false,
          message: "Please complete all required fields.",
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        INSERT INTO enquiries
          (name, email, mobile, organization, message)
        VALUES
          ($1, $2, $3, $4, $5)
        RETURNING id, created_at
      `,
      [name, email, mobile, organization || null, message]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Thank you. Your enquiry has been submitted successfully.",
        enquiry: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unable to save enquiry:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to submit your enquiry. Please try again.",
      },
      { status: 500 }
    );
  }
}
export async function GET() {
  try {
    const result = await pool.query(
      `
        SELECT
          id,
          name,
          email,
          mobile,
          organization,
          message,
          status,
          created_at,
          updated_at
        FROM enquiries
        ORDER BY created_at DESC
      `
    );

    return NextResponse.json({
      success: true,
      enquiries: result.rows,
    });
  } catch (error) {
    console.error("Unable to load enquiries:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load enquiries.",
      },
      { status: 500 }
    );
  }
}
