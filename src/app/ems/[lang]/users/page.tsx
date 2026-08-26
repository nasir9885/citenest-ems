"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type TenantUser = {
  id: number;
  username: string;
  name: string;
  email: string;
  isActive: boolean;
  role: "admin" | "user";
  lastLogin: string | null;
};

export default function UsersPage() {
  const params = useParams();
  const lang = typeof params.lang === "string" ? params.lang : "en";
  const isArabic = lang === "ar";
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/ems/users", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Unable to load users.");
    setUsers(result.users);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => void load().catch((e: Error) => setError(e.message)), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const response = await fetch("/api/ems/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: data.get("username"),
        name: data.get("name"),
        email: data.get("email"),
        role: data.get("role"),
        temporaryPassword: data.get("temporaryPassword"),
      }),
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) return setError(result.message || "Unable to create user.");
    form.reset();
    setNotice("User created. Share the temporary password securely and ask the user to change it.");
    await load();
  }

  async function updateUser(user: TenantUser, changes: Partial<TenantUser>) {
    setBusy(true);
    setError("");
    setNotice("");
    const response = await fetch(`/api/ems/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...user, ...changes }),
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) return setError(result.message || "Unable to update user.");
    setNotice("User access updated.");
    await load();
  }

  async function resetPassword(user: TenantUser) {
    const temporaryPassword = window.prompt("Enter a new temporary password (at least 12 characters):");
    if (!temporaryPassword) return;
    if (temporaryPassword.length < 12) return setError("Temporary password must contain at least 12 characters.");
    setBusy(true);
    setError("");
    const response = await fetch(`/api/ems/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...user, temporaryPassword }),
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) return setError(result.message || "Unable to reset password.");
    setNotice("Temporary password updated. Share it securely with the user.");
  }

  return (
    <main className={`ems-page ${isArabic ? "ems-rtl" : "ems-ltr"}`} dir={isArabic ? "rtl" : "ltr"}>
      <section className="ems-section"><div className="ems-container">
        <div className="ems-page-toolbar"><div>
          <Link href={`/ems/${lang}`} className="ems-back-link">← {isArabic ? "العودة إلى لوحة التحكم" : "Back to Dashboard"}</Link>
          <h1>{isArabic ? "إدارة المستخدمين" : "User Management"}</h1>
          <p className="ems-subtitle">{isArabic ? "إنشاء وإدارة حسابات هذه المؤسسة فقط." : "Create and manage sign-in accounts for this organization only."}</p>
        </div></div>

        {error && <div className="ems-error">{error}</div>}
        {notice && <div className="ems-success">{notice}</div>}

        <form className="ems-user-create-card" onSubmit={createUser}>
          <div className="ems-card-heading">
            <div><span className="ems-eyebrow">IDENTITY</span><h2>{isArabic ? "مستخدم جديد" : "Create user"}</h2></div>
            <p>{isArabic ? "يتم تعيين المؤسسة تلقائياً." : "Tenant access is assigned automatically."}</p>
          </div>
          <div className="ems-user-create-grid">
            <label>Username<input name="username" minLength={3} required autoComplete="off" /></label>
            <label>Display name<input name="name" required /></label>
            <label>Email<input name="email" type="email" required /></label>
            <label>Role<select name="role" defaultValue="user"><option value="user">User</option><option value="admin">Administrator</option></select></label>
            <label>Temporary password<input name="temporaryPassword" type="password" minLength={12} required autoComplete="new-password" /></label>
            <button className="primary-action" type="submit" disabled={busy}>{busy ? "Saving…" : "Create user"}</button>
          </div>
        </form>

        <div className="ems-table-wrapper"><table className="ems-table"><thead><tr>
          <th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Last sign-in</th><th>Actions</th>
        </tr></thead><tbody>
          {users.length === 0 ? <tr><td colSpan={6}>No tenant users found.</td></tr> : users.map((user) => (
            <tr key={user.id}>
              <td><strong>{user.name}</strong><small className="ems-table-subtext">@{user.username}</small></td>
              <td>{user.email || "—"}</td>
              <td><select className="ems-table-select" value={user.role} disabled={busy} onChange={(event) => void updateUser(user, { role: event.target.value as "admin" | "user" })}><option value="user">User</option><option value="admin">Administrator</option></select></td>
              <td><span className={`ems-status-pill ${user.isActive ? "is-active" : "is-inactive"}`}>{user.isActive ? "Active" : "Inactive"}</span></td>
              <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"}</td>
              <td><div className="ems-row-actions">
                <button type="button" disabled={busy} onClick={() => void updateUser(user, { isActive: !user.isActive })}>{user.isActive ? "Deactivate" : "Activate"}</button>
                <button type="button" disabled={busy} onClick={() => void resetPassword(user)}>Reset password</button>
              </div></td>
            </tr>
          ))}
        </tbody></table></div>
      </div></section>
    </main>
  );
}
