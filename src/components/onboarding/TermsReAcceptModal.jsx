import React, { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export const CURRENT_TERMS_VERSION = 'v6-2026-07';

function TermsText() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg mb-4 overflow-hidden text-left" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium"
        style={{ color: 'var(--text-secondary)' }}>
        <span>Read Terms &amp; Conditions</span>
        <ChevronDown size={15} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 text-xs space-y-2 max-h-64 overflow-y-auto" style={{ color: 'var(--text-muted)' }}>
          <p><strong style={{ color: 'var(--text-primary)' }}>Terms of Service &mdash; Lexio (v2, May 2026)</strong></p>
          <p>By using Lexio, you agree to use it for personal, non-commercial reading purposes only and to comply with all terms below.</p>
          <p><strong style={{ color: 'var(--text-primary)' }}>Content &amp; Conduct</strong><br />You are responsible for all content you post. Hateful, illegal, abusive, threatening, or harassing content is strictly prohibited and will result in account action.</p>
          <p><strong style={{ color: 'var(--text-primary)' }}>Moderation &amp; Banning &mdash; FINAL &amp; BINDING</strong><br />Lexio administrators reserve the right to ban, restrict, suspend, or permanently terminate any user account at any time, for any reason, at their sole discretion, without prior notice or explanation. By using Lexio, you acknowledge and agree that all moderation decisions are FINAL and BINDING. You waive any right to contest, dispute, appeal through legal channels, or claim damages in connection with any moderation action taken on your account. The only permitted appeal method is a courtesy email to Support@LexioReading.App, which administrators may respond to at their discretion.</p>
          <p><strong style={{ color: 'var(--text-primary)' }}>Limitation of Liability &mdash; FULL WAIVER</strong><br />To the fullest extent permitted by applicable law, Lexio, its creators, developers, administrators, moderators, and all affiliated individuals ARE NOT LIABLE for any direct, indirect, incidental, consequential, special, punitive, or exemplary damages arising from your use of or inability to use Lexio, including but not limited to: data loss, account termination, content removal, service interruptions, third-party actions, or any other matter related to the platform. YOU EXPRESSLY AGREE NOT TO BRING ANY LEGAL ACTION, LAWSUIT, CLAIM, OR DEMAND against any person involved in the creation, development, administration, or operation of Lexio. By using this service you irrevocably waive all such claims.</p>
          <p><strong style={{ color: 'var(--text-primary)' }}>Data Security &amp; Breach Response</strong><br />Lexio employs industry-standard security: encryption in transit (HTTPS/TLS) and at rest, encrypted API keys, row-level access controls, and PIN-protected vault data. No system is 100% secure. In the event of a confirmed data breach, Lexio will investigate and contain the incident, notify affected users and school administrators within 72 hours, and take corrective action. Lexio is not liable for damages from unauthorized access despite these precautions, but is committed to transparency and prompt notification.</p>
          <p><strong style={{ color: 'var(--text-primary)' }}>COPPA &amp; Student Privacy</strong><br />For students under 13, the school provides consent for data collection under COPPA's school authorization exception. We collect only minimal data needed for the reading experience, never use student data for advertising, and allow schools to request data deletion at any time. Parents may review or request deletion of their child's data through the school or Lexio support.</p>
          <p><strong style={{ color: 'var(--text-primary)' }}>Complete Immunity &mdash; No Right to Sue</strong><br />Lexio and all affiliated individuals are completely immune from legal action. You irrevocably waive all rights to bring any legal action, lawsuit, claim, arbitration, or demand against Lexio or any person involved in its creation or operation, in any court or forum. This waiver is absolute and survives account termination.</p>
          <p><strong style={{ color: 'var(--text-primary)' }}>No Warranty</strong><br />Lexio is provided as-is with no warranties of any kind, express or implied, including fitness for a particular purpose or uninterrupted availability.</p>
          <p><strong style={{ color: 'var(--text-primary)' }}>Modifications</strong><br />Lexio may modify or discontinue the service at any time without liability.</p>
          <p><strong style={{ color: 'var(--text-primary)' }}>Custom Book Creator &mdash; Ownership &amp; Rights</strong><br />All books generated using Lexio's Custom Book Creator feature are the exclusive property of Lexio. Lexio retains all rights, title, and interest in and to all generated books, including copyright and all other intellectual property rights. You may NOT publicly distribute, sell, publish, or commercially exploit any book generated through the Custom Book Creator. Generated books are provided for personal, private use only. By generating a book on Lexio, you irrevocably assign all rights in the generated content to Lexio.</p>
          <p><strong style={{ color: 'var(--text-primary)' }}>Privacy</strong><br />We collect only the data necessary to run the platform. We do not sell your data. Your data may be reviewed by administrators for safety and abuse prevention.</p>
          <p><strong style={{ color: '#f87171' }}>Loopholes — STRICTLY PROHIBITED &amp; LEGALLY ACTIONABLE</strong><br />The use of any loophole, exploit, technical workaround, or unintended mechanism is strictly prohibited. Any method that technically complies with these Terms while violating their spirit — as judged solely by Lexio — constitutes a violation. This includes ban evasion, fake engagement, automation, and manipulation of any platform feature. Violations may result in immediate permanent termination and civil legal action for damages. By accepting these Terms, you waive any defense that the conduct was not explicitly named.</p>
          <p style={{ color: 'var(--text-muted)' }}>You are welcome to use other reading platforms and services. You agree not to create, develop, or build any new reading-related application or platform that competes with Lexio.</p>
          <p style={{ color: 'var(--lx-accent)', fontWeight: 600 }}>By clicking "I Agree", you confirm you have read, understood, and agree to ALL of the above terms, including the loopholes clause.</p>
          <p style={{ fontWeight: 700, color: 'var(--text-primary)', borderTop: '1px solid var(--lx-border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>Copyright, And All Rights Reserved 2026 Tejus Bhasin and Jyotsna Anand Bhasin And Gagan Bhasin. Sole Proprietorship.</p>
        </div>
      )}
    </div>
  );
}

export default function TermsReAcceptModal({ user, onAccepted }) {
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAccept() {
    if (!agreed) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      // Cache acceptance immediately in localStorage so modal never re-shows
      localStorage.setItem('lexio_terms_version', CURRENT_TERMS_VERSION);
      await base44.entities.TermsAcceptanceLog.create({
        user_email: user.email,
        user_id: user.id,
        terms_version: CURRENT_TERMS_VERSION,
        accepted_at: now,
        user_agent: navigator.userAgent,
      });
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      const profile = profiles.find(p => p.username) || profiles[0];
      if (profile) {
        await base44.entities.UserProfile.update(profile.id, {
          tc_agreed: true,
          tc_agreed_date: now,
          tc_version: CURRENT_TERMS_VERSION,
        });
      } else {
        await base44.entities.UserProfile.create({
          user_email: user.email,
          tc_agreed: true,
          tc_agreed_date: now,
          tc_version: CURRENT_TERMS_VERSION,
          onboarding_complete: true,
        });
      }
      onAccepted();
    } catch (e) {}
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.92)' }}>
      <div className="w-full max-w-sm rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
        <div className="text-center mb-5">
          <div className="text-3xl mb-3">📋</div>
          <h2 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Updated Terms &amp; Conditions
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Lexio&apos;s Terms have been updated. Please read and agree to continue.
          </p>
        </div>

        <TermsText />

        <label className="flex items-start gap-3 cursor-pointer mb-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <button onClick={() => setAgreed(a => !a)}
            className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
            style={{ background: agreed ? 'var(--lx-accent)' : 'transparent', border: `2px solid ${agreed ? 'var(--lx-accent)' : 'var(--lx-border)'}` }}>
            {agreed && <Check size={12} style={{ color: 'var(--bg-primary)' }} />}
          </button>
          <span>I have read and agree to the Terms &amp; Conditions, including the moderation policy, liability waiver, data breach waiver, complete immunity/no-sue clause, and loopholes prohibition.</span>
        </label>

        <button onClick={handleAccept} disabled={!agreed || saving} className="lx-btn-primary w-full justify-center">
          {saving ? 'Saving...' : 'I Agree — Continue to Lexio'}
        </button>

        <p className="text-xs text-center mt-3" style={{ color: 'var(--text-muted)' }}>
          You must agree to use Lexio. Questions?{' '}
          <a href="mailto:Support@LexioReading.App" style={{ color: 'var(--lx-accent)' }}>Support@LexioReading.App</a>
        </p>
      </div>
    </div>
  );
}