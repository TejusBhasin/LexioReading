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
              <strong className="font-brand" style={{ color: 'var(--text-primary)' }}>Welcome to Lexio</strong>
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

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>Data Security &amp; Breach Response</h3>
            <p>
              Lexio takes data security seriously and employs industry-standard practices to protect user data:
            </p>
            <ul style={{ paddingLeft: '1.5rem', listStyle: 'disc', marginTop: '0.5rem' }}>
              <li><strong>Encryption in transit:</strong> All data is transmitted over HTTPS (TLS 1.2+).</li>
              <li><strong>Encryption at rest:</strong> Database and file storage are encrypted at rest by our cloud infrastructure provider.</li>
              <li><strong>API key protection:</strong> API keys and secrets are stored securely in encrypted environment variables and are never exposed in client-side code or logs.</li>
              <li><strong>Access controls:</strong> Row-level security (RLS) ensures users can only access their own data. School admins can only access data for members of their own school.</li>
              <li><strong>Vault data:</strong> Library card information stored in the Vault is protected by an additional PIN layer and is never included in analytics, AI training, or shared with schools.</li>
            </ul>
            <p style={{ marginTop: '0.5rem' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Incident Response:</strong> In the event of a suspected data breach, Lexio will:
            </p>
            <ol style={{ paddingLeft: '1.5rem', listStyle: 'decimal', marginTop: '0.25rem' }}>
              <li>Immediately investigate and contain the incident</li>
              <li>Assess the scope of affected data and users</li>
              <li>Notify affected users and school administrators within 72 hours of confirmation</li>
              <li>Take corrective action to prevent recurrence</li>
              <li>Document the incident and response for transparency</li>
            </ol>
            <p style={{ marginTop: '0.5rem' }}>
              While Lexio implements robust security measures, no system can be guaranteed 100% secure. Lexio is not liable for damages arising from unauthorized access despite these precautions, but is committed to transparency and prompt notification if an incident occurs.
            </p>

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>Children's Online Privacy Protection (COPPA)</h3>
            <p>
              Lexio is designed for use by students, including those under 13, in school-supervised environments. In compliance with COPPA (Children's Online Privacy Protection Act):
            </p>
            <ul style={{ paddingLeft: '1.5rem', listStyle: 'disc', marginTop: '0.5rem' }}>
              <li><strong>School consent:</strong> For students under 13, the school (acting as the educational institution) provides consent for data collection on behalf of the student, as permitted under COPPA's school authorization exception.</li>
              <li><strong>Limited data collection:</strong> We collect only the minimal data needed to provide the reading experience — email, reading activity, and preferences. We do not collect excessive personal information.</li>
              <li><strong>No marketing to children:</strong> We do not use student data for targeted advertising or commercial purposes.</li>
              <li><strong>Data deletion:</strong> Schools can request deletion of a student's data at any time by offboarding the student and contacting support.</li>
              <li><strong>Parental rights:</strong> Parents may review, request deletion of, or opt out of their child's data collection by contacting the school administrator or Lexio support.</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>No Legal Action — Complete Immunity</h3>
            <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              BY USING LEXIO, YOU IRREVOCABLY AND UNCONDITIONALLY AGREE THAT LEXIO, ITS CREATORS, DEVELOPERS, ADMINISTRATORS, MODERATORS, AND ALL AFFILIATED INDIVIDUALS AND ENTITIES ARE COMPLETELY IMMUNE FROM AND MAY NOT BE SUED BY YOU OR ANY PARTY ACTING ON YOUR BEHALF.
            </p>
            <p>
              YOU WAIVE ALL RIGHTS TO BRING ANY LEGAL ACTION, LAWSUIT, CLAIM, ARBITRATION, OR DEMAND OF ANY KIND AGAINST LEXIO OR ANY PERSON INVOLVED IN ITS CREATION OR OPERATION, IN ANY COURT, TRIBUNAL, OR FORUM — WHETHER CIVIL, CRIMINAL, ADMINISTRATIVE, OR OTHERWISE. THIS WAIVER IS ABSOLUTE, IRREVOCABLE, AND SURVIVES TERMINATION OF YOUR ACCOUNT. IF ANY PORTION OF THIS CLAUSE IS FOUND UNENFORCEABLE, THE REMAINDER SHALL CONTINUE IN FULL FORCE AND EFFECT.
            </p>

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>Entire Agreement</h3>
            <p>
              These Terms constitute the entire agreement between you and Lexio with respect to your use of the platform. No prior agreements, representations, or understandings — written or verbal — supersede these Terms. If any provision is found unenforceable, the remaining provisions remain in full force.
            </p>

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>Free Service</h3>
            <p>
              Lexio is free forever for core features. If premium features are introduced in the future, they will be optional and transparent.
            </p>
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
              You are welcome to use other reading platforms and services. You agree not to create, develop, or build any new reading-related application or platform that competes with Lexio.
            </p>

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>Custom Book Creator — Ownership &amp; Rights</h3>
            <p>
              All books generated using Lexio's Custom Book Creator feature are the exclusive property of Lexio. Lexio retains all rights, title, and interest in and to all generated books, including but not limited to copyright and all other intellectual property rights. Users may NOT publicly distribute, sell, publish, or commercially exploit any book generated through the Custom Book Creator.
            </p>
            <p>
              Generated books are provided for personal, private use only. By generating a book on Lexio, you irrevocably assign all rights, title, and interest in the generated content to Lexio. Lexio reserves the right to modify, remove, or restrict access to any generated book at any time, at its sole discretion.
            </p>

            <p style={{ marginTop: '2rem', fontWeight: 700, color: 'var(--text-primary)', borderTop: '1px solid var(--lx-border)', paddingTop: '1rem' }}>
              Copyright, And All Rights Reserved {new Date().getFullYear()} Tejus Bhasin and Jyotsna Anand Bhasin And Gagan Bhasin. Sole Proprietorship.
            </p>
          </div>
        </section>

        {/* Privacy Policy */}
        <section id="privacy-policy">
          <h1 className="font-display text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Privacy Policy
          </h1>
          <div className="prose space-y-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <p><em style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Terms version: v6, July 2026. All users must re-accept when terms are updated. Acceptance is permanently logged.</em></p>
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

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>Data Security &amp; Storage</h3>
            <p>
              <strong>Where your data is stored:</strong> User data is stored in secure cloud databases managed by Base44's infrastructure (AWS-based). All data is encrypted in transit (HTTPS/TLS) and at rest. Database backups are encrypted and maintained by the infrastructure provider.
            </p>
            <ul style={{ paddingLeft: '1.5rem', listStyle: 'disc', marginTop: '0.5rem' }}>
              <li><strong>Database:</strong> Encrypted at rest; row-level security ensures users only see their own data</li>
              <li><strong>API keys &amp; secrets:</strong> Stored in encrypted environment variables, never exposed client-side</li>
              <li><strong>Vault (library cards):</strong> Protected by an additional PIN layer; not included in analytics or AI</li>
              <li><strong>School data isolation:</strong> When enabled, school members only see content from their own school</li>
              <li><strong>AI data:</strong> Reading data is used to personalize recommendations; it is not sold or used for model training</li>
            </ul>

            <h3 style={{ color: 'var(--text-primary)', marginTop: '1.5rem', fontWeight: 'bold' }}>School Data &amp; FERPA Awareness</h3>
            <p>
              For school environments, Lexio is designed with FERPA (Family Educational Rights and Privacy Act) principles in mind:
            </p>
            <ul style={{ paddingLeft: '1.5rem', listStyle: 'disc', marginTop: '0.5rem' }}>
              <li>School admins control what student data types they can access (reading logs, library, reviews, etc.)</li>
              <li>Students can be offboarded at any time — school access is revoked while personal reading data is preserved</li>
              <li>School admins can export a student's reading data before offboarding</li>
              <li>Content isolation can be enabled so students only see content from their own school</li>
              <li>School reading data is not shared with other schools or third parties</li>
            </ul>

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

        {/* Lexio Guarantee */}
        <section id="lexio-guarantee" className="rounded-xl p-6" style={{ background: 'linear-gradient(135deg, rgba(245,214,35,0.08), rgba(245,166,35,0.04))', border: '1px solid var(--lx-accent)' }}>
          <h1 className="font-display text-2xl font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--lx-accent)' }}>
            🛡️ The Lexio Guarantee
          </h1>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
            Our binding pledge to you — the reader. This is not just a policy. It is a promise.
          </p>
          <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>Lexio pledges, on behalf of itself and all current and future team members, that:</p>
            <div className="space-y-2.5">
              {[
                'We will NEVER sell your personal data to any third party — not now, not ever.',
                'We will NEVER share your personal data with any third party for advertising, marketing, or commercial purposes.',
                'We will NEVER use your reading data, preferences, or personal information as a product to be monetized.',
                'Your data is yours. We collect only what is needed to provide you a great reading experience.',
                'If this pledge is ever willfully violated, Lexio forfeits the right to operate as a platform.',
              ].map((pledge, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="flex-shrink-0 mt-0.5" style={{ color: 'var(--lx-accent)' }}>✦</span>
                  <span>{pledge}</span>
                </div>
              ))}
            </div>
            <p className="pt-2 font-medium" style={{ color: 'var(--text-primary)' }}>
              This is the Lexio Guarantee — our binding commitment to you, the reader. It supersedes any future corporate decision, acquisition, or change in leadership.
            </p>
          </div>
        </section>
      </div>
    </div>);

}