import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import pool from "@/lib/db";
import { requireAdmin, requireTenantContext, TenantAccessError } from "@/lib/tenant-context";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };
const uploadRoot = path.resolve(process.env.EMS_UPLOAD_DIR || ".data/uploads");
type RouteProps = { params: Promise<{ id: string }> };

function accessError(error: TenantAccessError) {
  return NextResponse.json({ success: false, message: error.message }, { status: error.status });
}

function storagePath(key: string) {
  const resolved = path.resolve(uploadRoot, key);
  if (!resolved.startsWith(`${uploadRoot}${path.sep}`)) throw new Error("Invalid photo key");
  return resolved;
}

export async function GET(_request: Request, { params }: RouteProps) {
  try {
    const context = await requireTenantContext();
    const { id } = await params;
    if (!/^[1-9]\d*$/.test(id)) return new Response(null, { status: 404 });
    const result = await pool.query<{ photo_storage_key: string; photo_content_type: string; photo_file_name: string | null }>(
      `SELECT photo_storage_key, photo_content_type, photo_file_name FROM employees
       WHERE tenant_id = $1 AND id = $2 AND photo_storage_key IS NOT NULL`,
      [context.tenantId, id],
    );
    const photo = result.rows[0];
    if (!photo) return new Response(null, { status: 404 });
    return new Response(await readFile(storagePath(photo.photo_storage_key)), {
      headers: { "Cache-Control": "private, max-age=300", "Content-Type": photo.photo_content_type,
        "Content-Disposition": `inline; filename="${(photo.photo_file_name || "employee-photo").replace(/["\\]/g, "")}"`,
        "X-Content-Type-Options": "nosniff" },
    });
  } catch (error: unknown) {
    if (error instanceof TenantAccessError) return accessError(error);
    return new Response(null, { status: 404 });
  }
}

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const context = await requireTenantContext();
    requireAdmin(context);
    const { id } = await params;
    if (!/^[1-9]\d*$/.test(id)) return NextResponse.json({ success: false, message: "Employee ID is invalid." }, { status: 400 });
    const photo = (await request.formData()).get("photo");
    if (!(photo instanceof File) || photo.size === 0 || photo.size > MAX_BYTES || !EXTENSIONS[photo.type]) {
      return NextResponse.json({ success: false, message: "Use a JPEG, PNG, or WebP photo up to 5 MB." }, { status: 400 });
    }
    const existing = await pool.query<{ photo_storage_key: string | null }>(
      `SELECT photo_storage_key FROM employees WHERE tenant_id = $1 AND id = $2`, [context.tenantId, id]);
    if (!existing.rows[0]) return NextResponse.json({ success: false, message: "Employee not found." }, { status: 404 });
    const key = path.join(context.tenantId, id, `${randomUUID()}${EXTENSIONS[photo.type]}`);
    const target = storagePath(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, Buffer.from(await photo.arrayBuffer()), { flag: "wx" });
    await pool.query(
      `UPDATE employees SET photo_storage_key = $1, photo_file_name = $2, photo_content_type = $3
       WHERE tenant_id = $4 AND id = $5`,
      [key, path.basename(photo.name), photo.type, context.tenantId, id],
    );
    const previous = existing.rows[0].photo_storage_key;
    if (previous) await unlink(storagePath(previous)).catch(() => undefined);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof TenantAccessError) return accessError(error);
    console.error("Unable to save employee photo:", error);
    return NextResponse.json({ success: false, message: "Unable to save employee photo." }, { status: 500 });
  }
}
