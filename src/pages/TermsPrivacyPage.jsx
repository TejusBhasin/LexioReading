import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsPrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <Link to="/profile" className="lx-btn-ghost text-sm mb-8 py-1.5 px-3 flex items-center gap-1 w-fit">
        <ArrowLeft size={14} /> Back to Profile
      </Link>

      <div className="space-y-12">
        {/* Terms and Conditions */}
        <section>
          <h1 className="font-display text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Terms and Conditions
          </h1>
          <div className="prose space-y-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              <strong style={{ color: 'var(--text-primary)' }}>Welcome to Lexio</strong>
            </p>
            <p>
              Lexio is a free reading companion app. By using Lexio, you agree to use it for personal, non-commercial reading purposes only.
            </p>

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>Content and Conduct</h3>
            <p>
              You are responsible for the content you post (reviews, discussions, notes). Hateful, illegal, abusive, or harassing content is prohibited and may result in account suspension or permanent termination.
            </p>

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>Book Data</h3>
            <p>
              Book information is sourced from third parties (Google Books API). Lexio is not responsible for inaccuracies in book metadata, pricing, or availability.
            </p>

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>Third-Party Links</h3>
            <p>
              Lexio contains links to external services (Amazon, Google Books, etc.). We are not responsible for the content, services, or policies of third-party websites.
            </p>

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>Modifications and Termination</h3>
            <p>
              Lexio reserves the right to modify, suspend, or discontinue the service at any time. We may terminate accounts that violate these terms.
            </p>

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>Disclaimer</h3>
            <p>
              Lexio is provided as-is without warranties of any kind. We are not liable for data loss, interruptions, or indirect damages.
            </p>

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>Free Service</h3>
            <p>
              Lexio is free forever for core features. If premium features are introduced in the future, they will be optional and transparent.
            </p>
          </div>
        </section>

        {/* Privacy Policy */}
        <section>
          <h1 className="font-display text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Privacy Policy
          </h1>
          <div className="prose space-y-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>
              <strong style={{ color: 'var(--text-primary)' }}>Your Privacy Matters</strong>
            </p>
            <p>Lexio collects only the data necessary to provide a personalized reading experience. We take your privacy seriously. Your data may be accessed for security or safety only.

            </p>

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>Data We Collect</h3>
            <ul style={{ paddingLeft: '1.5rem', listStyle: 'disc' }}>
              <li><strong>Account Information:</strong> Email, full name, username (you set)</li>
              <li><strong>Reading Data:</strong> Books you add, ratings, reviews, reading logs, notes</li>
              <li><strong>Preferences:</strong> Favorite genres, moods, blacklisted themes, theme settings</li>
              <li><strong>Social Data:</strong> Book clubs you join, messages you post, followers (optional)</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device info for security and analytics</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>How We Use Your Data</h3>
            <ul style={{ paddingLeft: '1.5rem', listStyle: 'disc' }}>
              <li>Personalize book recommendations via AI</li>
              <li>Improve app features and user experience</li>
              <li>Show your public profile (only if you enable it)</li>
              <li>Send reading reminders via Google Calendar (if you connect it)</li>
              <li>Detect and prevent abuse</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>Who We Share Data With</h3>
            <p>
              We do NOT sell your data. We share data only with:
            </p>
            <ul style={{ paddingLeft: '1.5rem', listStyle: 'disc' }}>
              <li><strong>Google Calendar:</strong> Only if you connect it for reading reminders (you control this)</li>
              <li><strong>Google Books API:</strong> To fetch book metadata (no personal info shared)</li>
              <li><strong>Other Lexio Users:</strong> Only content you publicly post (reviews, book clubs, public profile)</li>
              <li><strong>Legal Authorities:</strong> Only if required by law</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>Data Security</h3>
            <p>
              Your data is encrypted in transit (HTTPS) and at rest. We use industry-standard security practices. However, no system is 100% secure.
            </p>

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>Your Rights</h3>
            <p>
              You can:
            </p>
            <ul style={{ paddingLeft: '1.5rem', listStyle: 'disc' }}>
              <li>Update or correct your profile at any time</li>
              <li>Delete your account and all associated data</li>
              <li>Control visibility of your profile, library, and reviews</li>
              <li>Connect or disconnect Google Calendar</li>
              <li>Request a data export (contact support)</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>Cookies and Analytics</h3>
            <p>
              Lexio uses minimal cookies for authentication and session management. We use analytics to improve the app, but do not track you across other sites.
            </p>

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>Changes to This Policy</h3>
            <p>
              We may update this policy occasionally. Significant changes will be communicated to you. Continued use means acceptance of the updated policy.
            </p>

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>Contact</h3>
            <p>Questions about privacy? Contact support through the app or reach out to our team (TEJUSBHASIN17@GMAIL.COM). We are committed to transparency.

            </p>
          </div>
        </section>
      </div>
    </div>);

}