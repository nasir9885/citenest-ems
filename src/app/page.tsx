import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <header className="site-header">
        <div className="container nav">
          <Link href="/" className="brand">
            CiteNest
          </Link>

          <nav aria-label="Main navigation">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <Link href="/enquiry" className="nav-action">
              Enquire
            </Link>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-content">
          <p className="eyebrow">Private AI knowledge assistant</p>

          <h1>
            Answers grounded
            <br />
            in your documents.
          </h1>

          <p className="hero-copy">
            CiteNest helps organizations turn policies, manuals,
            procedures and internal documents into reliable,
            searchable knowledge.
          </p>

          <div className="hero-actions">
            <Link href="/enquiry" className="primary-action">
              Request a demo
            </Link>

            <a href="#how-it-works" className="secondary-action">
              See how it works
            </a>
          </div>

          <div className="trust-row">
            <span>Secure</span>
            <span>Self-hosted</span>
            <span>Document-grounded</span>
          </div>
        </div>
      </section>

      <section id="features" className="section">
        <div className="container">
          <p className="eyebrow">Capabilities</p>
          <h2>Turn organizational knowledge into useful answers.</h2>

          <div className="feature-grid">
            <article className="feature-card">
              <span className="feature-number">01</span>
              <h3>Centralized knowledge</h3>
              <p>
                Bring policies, manuals, procedures and other important
                documents into one controlled knowledge repository.
              </p>
            </article>

            <article className="feature-card">
              <span className="feature-number">02</span>
              <h3>Grounded AI answers</h3>
              <p>
                Ask questions naturally and receive answers based on the
                documents your organization has approved.
              </p>
            </article>

            <article className="feature-card">
              <span className="feature-number">03</span>
              <h3>Traceable sources</h3>
              <p>
                Keep answers connected to their source documents so users
                can understand where information came from.
              </p>
            </article>

            <article className="feature-card">
              <span className="feature-number">04</span>
              <h3>Controlled access</h3>
              <p>
                Build role-aware access around sensitive organizational
                information and document collections.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section workflow-section">
        <div className="container">
          <p className="eyebrow">How it works</p>
          <h2>A simple path from documents to answers.</h2>

          <div className="workflow">
            <div>
              <strong>Upload</strong>
              <span>Documents enter your controlled repository.</span>
            </div>

            <div>
              <strong>Process</strong>
              <span>CiteNest prepares the content for retrieval.</span>
            </div>

            <div>
              <strong>Ask</strong>
              <span>Users ask questions in natural language.</span>
            </div>

            <div>
              <strong>Answer</strong>
              <span>Relevant information is returned with grounding.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container cta-card">
          <div>
            <p className="eyebrow">Talk to us</p>
            <h2>Interested in CiteNest?</h2>
            <p>
              Tell us about your organization and how you want to use
              document-grounded AI.
            </p>
          </div>

          <Link href="/enquiry" className="primary-action">
            Send an enquiry
          </Link>
        </div>
      </section>

      <footer>
        <div className="container footer-content">
          <strong>CiteNest</strong>
          <span>Answers grounded in your documents.</span>
        </div>
      </footer>
    </main>
  );
}
