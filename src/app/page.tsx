import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    redirect("/ems/en");
  }

  return (
    <main className="ems-page ems-ltr" dir="ltr" lang="en">
      <section className="ems-section">
        <div className="ems-container">
          <div className="ems-title-row">
            <div>
              <p className="ems-eyebrow">CiteNest</p>
              <h1>Employee Management System</h1>
              <p className="ems-subtitle">
                Sign in through Authentik to access your organization&apos;s
                employee, attendance and payroll workspace.
              </p>
            </div>
          </div>

          <form
            action={async () => {
              "use server";
              await signIn("authentik", {
                redirectTo: "/ems/en",
              });
            }}
          >
            <button type="submit" className="primary-action">
              Sign in
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}