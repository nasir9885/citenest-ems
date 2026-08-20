"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Enquiry = {
  id: number;
  name: string;
  email: string;
  mobile: string;
  organization: string | null;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEnquiries() {
      try {
        const response = await fetch("/api/enquiries", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          setError(result.message || "Unable to load enquiries.");
          return;
        }

        setEnquiries(result.enquiries);
      } catch (err) {
        console.error(err);
        setError("Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    }

    loadEnquiries();
  }, []);

  return (
    <main className="admin-page">
      <header className="site-header">
        <div className="container nav">
          <Link href="/" className="brand">
            CiteNest
          </Link>

          <nav>
            <Link href="/">Website</Link>
            <Link href="/admin/enquiries" className="nav-action">
              Enquiries
            </Link>
          </nav>
        </div>
      </header>

      <section className="admin-section">
        <div className="container">
          <div className="admin-heading">
            <div>
              <p className="eyebrow">Administration</p>
              <h1>Enquiries</h1>
              <p>
                Review enquiry submissions received through the CiteNest
                website.
              </p>
            </div>

            <div className="admin-count">
              <strong>{enquiries.length}</strong>
              <span>Total enquiries</span>
            </div>
          </div>

          {loading && (
            <div className="admin-message">
              Loading enquiries...
            </div>
          )}

          {error && (
            <div className="admin-error">
              {error}
            </div>
          )}

          {!loading && !error && enquiries.length === 0 && (
            <div className="admin-message">
              No enquiries have been submitted yet.
            </div>
          )}

          {!loading && !error && enquiries.length > 0 && (
            <div className="table-wrapper">
              <table className="enquiry-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Contact</th>
                    <th>Organization</th>
                    <th>Enquiry</th>
                    <th>Status</th>
                    <th>Received</th>
                  </tr>
                </thead>

                <tbody>
                  {enquiries.map((enquiry) => (
                    <tr key={enquiry.id}>
                      <td>#{enquiry.id}</td>

                      <td>
                        <strong>{enquiry.name}</strong>
                        <span>{enquiry.email}</span>
                        <span>{enquiry.mobile}</span>
                      </td>

                      <td>
                        {enquiry.organization || "—"}
                      </td>

                      <td className="message-cell">
                        {enquiry.message}
                      </td>

                      <td>
                        <span
                          className={`status-badge status-${enquiry.status.toLowerCase()}`}
                        >
                          {enquiry.status}
                        </span>
                      </td>

                      <td>
                        {new Date(
                          enquiry.created_at
                        ).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
