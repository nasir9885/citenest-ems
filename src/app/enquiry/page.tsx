"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function EnquiryPage() {
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  setSubmitted(false);

  const form = event.currentTarget;
  const formData = new FormData(form);

  const enquiry = {
    name: formData.get("name"),
    email: formData.get("email"),
    mobile: formData.get("mobile"),
    organization: formData.get("organization"),
    message: formData.get("message"),
  };

  try {
    const response = await fetch("/api/enquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(enquiry),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.message || "Unable to submit enquiry.");
      return;
    }

    setSubmitted(true);
    form.reset();
  } catch (error) {
    console.error(error);
    alert("Unable to submit enquiry. Please try again.");
  }
}

  return (
    <main className="enquiry-page">
      <header className="site-header">
        <div className="container nav">
          <Link href="/" className="brand">
            CiteNest
          </Link>

          <nav aria-label="Main navigation">
            <Link href="/">Home</Link>
            <Link href="/enquiry" className="nav-action">
              Enquire
            </Link>
          </nav>
        </div>
      </header>

      <section className="enquiry-section">
        <div className="container enquiry-layout">
          <div className="enquiry-intro">
            <p className="eyebrow">Get in touch</p>

            <h1>Tell us how CiteNest can help.</h1>

            <p>
              Share a few details about your organization and what you are
              looking to achieve. We&apos;ll use this information to understand
              your requirement and get back to you.
            </p>

            <div className="enquiry-benefits">
              <div>
                <strong>Document-grounded AI</strong>
                <span>
                  Ask questions and retrieve reliable answers from your own
                  organizational documents.
                </span>
              </div>

              <div>
                <strong>Private and controlled</strong>
                <span>
                  Designed for organizations that need control over their
                  documents and knowledge.
                </span>
              </div>

              <div>
                <strong>Self-hosting options</strong>
                <span>
                  Deploy CiteNest within infrastructure that fits your
                  organization.
                </span>
              </div>
            </div>
          </div>

          <div className="enquiry-card">
            <h2>Send an enquiry</h2>

            <p className="form-description">
              Fields marked with * are required.
            </p>

         {submitted && (
  <div className="form-success">
    Thank you. Your enquiry has been submitted successfully.
  </div>
)}
            <form onSubmit={handleSubmit}>
              <label>
                Name *
                <input
                  type="text"
                  name="name"
                  placeholder="Your name"
                  required
                />
              </label>

              <label>
                Email *
                <input
                  type="email"
                  name="email"
                  placeholder="you@company.com"
                  required
                />
              </label>

              <label>
                Mobile number *
                <input
                  type="tel"
                  name="mobile"
                  placeholder="+91 98765 43210"
                  required
                />
              </label>

              <label>
                Organization
                <input
                  type="text"
                  name="organization"
                  placeholder="Company or organization name"
                />
              </label>

              <label>
                Your enquiry *
                <textarea
                  name="message"
                  rows={6}
                  placeholder="Tell us about your requirement..."
                  required
                />
              </label>

              <button type="submit" className="primary-action">
  Submit enquiry
</button>
            </form>

            <p className="privacy-note">
              Your contact information will only be used to respond to your
              enquiry.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
