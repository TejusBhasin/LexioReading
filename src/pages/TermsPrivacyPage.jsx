import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsPrivacyPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-scroll to the relevant section based on the URL path
  React.useEffect(() => {
    if (location.pathname === '/privacy') {
      const el = document.getElementById('privacy-policy');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.pathname]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <Link to="/profile" className="lx-btn-ghost text-sm mb-8 py-1.5 px-3 flex items-center gap-1 w-fit">
        <ArrowLeft size={14} /> Back to Profile
      </Link>

      <div className="space-y-12">
        {/* Terms and Conditions */}
        <section id="terms-of-service">
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

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>Content Standards — Posts, Forums, and Clubs</h3>
            <p>
              All content posted on Lexio — including reviews, forum posts, discussions, and reading clubs — must be genuine, meaningful, and reading-related. The following are strictly prohibited and will result in immediate content removal and potential account suspension:
            </p>
            <ul style={{ paddingLeft: '1.5rem', listStyle: 'disc', marginTop: '0.5rem' }}>
              <li><strong>Fake content:</strong> Fabricated reviews, false reading logs, made-up book clubs, or any other dishonest content.</li>
              <li><strong>Nondescript content:</strong> Posts, clubs, or reviews that lack meaningful substance (e.g., single-character titles, gibberish descriptions, placeholder text).</li>
              <li><strong>Joke or spam content:</strong> Forum posts, club names, or reviews created purely for humor, trolling, or flooding — with no legitimate reading purpose.</li>
              <li><strong>Impersonation:</strong> Creating clubs or profiles designed to impersonate real people, authors, or organizations.</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>Admin Access, Safety, and Banning</h3>
            <p>
              Lexio administrators reserve the right to ban, suspend, or restrict any user account at any time, with or without prior notice, for any violation of these Terms — or at their sole discretion in the interest of community safety. This includes, but is not limited to:
            </p>
            <ul style={{ paddingLeft: '1.5rem', listStyle: 'disc', marginTop: '0.5rem' }}>
              <li>Posting hateful, abusive, illegal, or harassing content</li>
              <li>Creating fake, nondescript, or spam posts, forums, reviews, or clubs</li>
              <li>Evading a previous ban or suspension</li>
              <li>Harassing or threatening other users</li>
              <li>Any behavior deemed harmful to the Lexio community</li>
            </ul>
            <p style={{ marginTop: '0.5rem' }}>
              Bans may be temporary or permanent. Administrators may also restrict access to specific features (forums, clubs, chat) rather than issuing a full ban. All moderation decisions are final. If you believe a ban was issued in error, you may contact support to appeal.
            </p>

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>Modifications and Termination</h3>
            <p>
              Lexio reserves the right to modify, suspend, or discontinue the service at any time. We may terminate accounts that violate these terms.
            </p>

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>Limitation of Liability — Full Waiver</h3>
            <p>
              To the fullest extent permitted by applicable law, <strong style={{ color: 'var(--text-primary)' }}>Lexio, its creators, developers, administrators, moderators, and all affiliated individuals are not liable</strong> for any direct, indirect, incidental, consequential, special, punitive, or exemplary damages of any kind arising from or related to: your use of or inability to use the platform; account suspension or termination; content removal; service interruptions or downtime; third-party content or links; data loss; or any other matter related to Lexio.
            </p>
            <p style={{ marginTop: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              BY USING LEXIO, YOU EXPRESSLY AGREE NOT TO BRING ANY LEGAL ACTION, LAWSUIT, ARBITRATION CLAIM, OR DEMAND of any kind against any person involved in the creation, development, administration, moderation, or operation of Lexio. This waiver is irrevocable and applies regardless of the nature of the claim or the alleged harm.
            </p>
            <p style={{ marginTop: '0.5rem' }}>
              Lexio is provided as-is without warranties of any kind, express or implied, including warranties of fitness for a particular purpose, merchantability, or uninterrupted availability.
            </p>

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>Loopholes — Strictly Prohibited</h3>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              THE USE OF ANY LOOPHOLE, EXPLOIT, TECHNICAL WORKAROUND, OR UNINTENDED MECHANISM WITHIN LEXIO IS STRICTLY AND EXPRESSLY PROHIBITED.
            </p>
            <p>
              A "loophole" is defined as any method, action, or omission that technically complies with the literal wording of these Terms while violating their intent or spirit, as determined solely by Lexio at its absolute discretion. This includes, but is not limited to:
            </p>
            <ul style={{ paddingLeft: '1.5rem', listStyle: 'disc', marginTop: '0.5rem' }}>
              <li>Exploiting ambiguities in these Terms to engage in conduct that Lexio would otherwise prohibit</li>
              <li>Using technical exploits, automation, scripts, bots, or any non-human methods to interact with the platform</li>
              <li>Creating multiple accounts to circumvent a ban, suspension, or feature restriction</li>
              <li>Manipulating platform features (ratings, trending, recommendations, points, streaks) in any artificial or inauthentic way</li>
              <li>Attempting to reverse-engineer, scrape, or extract platform data or AI outputs at scale</li>
              <li>Any action that Lexio determines, in its sole judgment, to undermine the integrity or fairness of the platform</li>
            </ul>
            <p style={{ marginTop: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              CONSEQUENCE: Use of any loophole as defined above — whether or not it is explicitly named in these Terms — may result in immediate permanent account termination and, where Lexio determines the conduct to be sufficiently harmful, may result in civil legal action for damages. By using Lexio, you expressly agree that Lexio has the right to pursue such legal action and that you waive any defense based on the argument that the conduct was not explicitly prohibited in writing.
            </p>
            <p style={{ marginTop: '0.5rem' }}>
              Lexio reserves the right to update its definition of "loophole" at any time. Users are responsible for staying informed of these Terms. Ignorance of this clause is not a valid defense.
            </p>

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>Entire Agreement</h3>
            <p>
              These Terms constitute the entire agreement between you and Lexio with respect to your use of the platform. No prior agreements, representations, or understandings — written or verbal — supersede these Terms. If any provision is found unenforceable, the remaining provisions remain in full force.
            </p>

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>Free Service</h3>
            <p>
              Lexio is free forever for core features. If premium features are introduced in the future, they will be optional and transparent.
            </p>
          </div>
        </section>

        {/* Privacy Policy */}
        <section id="privacy-policy">
          <h1 className="font-display text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Privacy Policy
          </h1>
          <div className="prose space-y-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <p><em style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Terms version: v2, May 2026. All users must re-accept when terms are updated. Acceptance is permanently logged.</em></p>
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
              <li><strong>Lexio Administrators:</strong> For safety, abuse prevention, and community protection purposes</li>
              <li><button onClick={() => navigate('/secret')} style={{ color: 'var(--lx-accent)', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Legal Authorities:</button> Only if required by law</li>
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
            <p>Questions about privacy? Contact support through the app or reach out to our team (Support@LexioReading.App). We are committed to transparency.

            </p>
          </div>
        </section>
      </div>
    </div>);

}