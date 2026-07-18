import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ChevronDown, Send, Check, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const FAQS = [
  { q: 'How do I create an account?', a: 'Download Lexio from the App Store, tap "Create one" on the login screen, and follow the sign-up flow. You can register with email or sign in with Google, Apple, or Microsoft.' },
  { q: 'How do I reset my password?', a: 'On the login screen, tap "Forgot password?" and enter your email. You\'ll receive a reset link to create a new password.' },
  { q: 'Is Lexio free?', a: 'Yes! Lexio is free forever for all core features — adding books, tracking reading, writing reviews, joining clubs, and more.' },
  { q: 'How do I delete my account?', a: 'Go to Profile → Settings → Delete Account in the app. This permanently removes your account and all associated data.' },
  { q: 'How do I report inappropriate content?', a: 'Use the "Report" button on any post, review, or profile. Our moderation team reviews all reports promptly.' },
  { q: 'Can I make my profile private?', a: 'Yes. Go to Profile → Privacy Settings to control who can see your library, reviews, stats, and profile.' },
  { q: 'How do I add a book to my library?', a: 'Tap the + button on the Dashboard or Library page, search for a book by title or author, and tap "Add to Library." You can also add books from the Discover page.' },
  { q: 'Can I manually add a book that isn\'t in the search results?', a: 'Yes! If a book isn\'t found in search, you can manually enter the title, author, and cover image to add it to your library.' },
  { q: 'How do I track my reading progress?', a: 'Open any book in your library, tap "Update Progress," and enter the page or percentage you\'ve read. Your progress is saved automatically and reflected in your stats.' },
  { q: 'What is the Reading Log?', a: 'The Reading Log lets you record reading sessions — date, time spent, pages read, and notes. It powers your reading streaks, stats, and Wrapped summary.' },
  { q: 'How do reading streaks work?', a: 'A streak counts consecutive days you\'ve logged reading activity. Log at least one session per day to keep your streak alive. Miss a day and the streak resets.' },
  { q: 'What are reading points?', a: 'You earn points for reading sessions, writing reviews, participating in clubs, and other activities. Points contribute to your leaderboard ranking.' },
  { q: 'How do I set a reading goal?', a: 'Go to the Reading Goal page (Profile → Reading Goal) and set a yearly target for number of books or pages. Your progress is tracked automatically.' },
  { q: 'Can I change my reading goal mid-year?', a: 'Yes, you can update your target at any time. Your progress carries over — only the target number changes.' },
  { q: 'What is the Wrapped feature?', a: 'Wrapped is an annual summary of your reading habits — total books, pages, genres, time spent, top authors, and more. It\'s available at the end of each year.' },
  { q: 'How do I write a review?', a: 'Open any book in your library, tap "Write Review," rate it with stars, and share your thoughts. Reviews can be public or private.' },
  { q: 'Can I edit or delete my review?', a: 'Yes. Open the book, tap your review, and select "Edit" or "Delete." You can only edit or delete your own reviews.' },
  { q: 'How do star ratings work?', a: 'You rate books from 1 to 5 stars. Your ratings appear on your profile (if public) and contribute to the book\'s community average.' },
  { q: 'Can I see other users\' reviews?', a: 'Yes! On any book detail page, you can see reviews from all users. You can also filter reviews by rating.' },
  { q: 'How do I join a reading club?', a: 'Go to the Clubs page, browse visible clubs, and tap "Join." Some clubs require a join code from the club creator.' },
  { q: 'How do I create a reading club?', a: 'On the Clubs page, tap "Create Club," fill in the name, description, and genre, then invite members with the join code.' },
  { q: 'Can I set a current book for my club?', a: 'Yes. As a club creator, go to Club Settings and set or change the "Current Book." All members will see it in the club feed.' },
  { q: 'What are club types?', a: 'Clubs can be Discussion (talk about books), Collaborative (read together), Logging (track member reading data), or Administrative (managed by schools/organizations).' },
  { q: 'How do club posts work?', a: 'Inside a club, tap "Post" to share thoughts, images, or book recommendations. Members can like and reply to posts.' },
  { q: 'Can I leave a club?', a: 'Yes. Go to the club page, tap "Leave Club" in settings. If you\'re the creator, you\'ll need to transfer ownership or the club may be deleted.' },
  { q: 'How do I use the forums?', a: 'Go to the Forums page to browse and participate in community discussions. You can create posts, upvote/downvote, and comment on others\' posts.' },
  { q: 'Can I add images to forum posts?', a: 'Yes! When creating a post, tap the image icon to upload a photo from your device.' },
  { q: 'How does voting work on forum posts?', a: 'You can upvote or downvote posts and comments. Higher-voted content appears more prominently. You can change or remove your vote at any time.' },
  { q: 'Can I tag my forum posts?', a: 'Yes, add tags when creating a post to help others find it by topic (e.g., "fantasy," "recommendations," "discussion").' },
  { q: 'How do I follow another user?', a: 'Visit a user\'s public profile and tap "Follow." You\'ll see their activity in your feed. You can unfollow at any time.' },
  { q: 'How do I block a user?', a: 'Go to the user\'s profile, tap "Block." Blocked users cannot see your profile or interact with you. Manage blocks in Profile → Privacy Settings.' },
  { q: 'What happens when I report a user?', a: 'Our moderation team reviews the report. If the user violated our guidelines, appropriate action is taken (warning, ban, or content removal). You\'ll be notified of the outcome.' },
  { q: 'How do I change my username?', a: 'Go to Profile → Settings → Edit Profile. You can change your username, bio, and other profile details there.' },
  { q: 'Can I change my profile picture?', a: 'Profile pictures are based on your Google/Apple/Microsoft account avatar. If you registered with email, a default avatar is used.' },
  { q: 'How do I change the app theme?', a: 'Go to Profile → Settings → Appearance. You can choose from several color themes to customize the app\'s look.' },
  { q: 'What is the Vault?', a: 'The Vault is a private space for storing sensitive notes, journal entries, or personal reflections about your reading. Only you can see your Vault entries.' },
  { q: 'How do Book Quotes work?', a: 'Open any book and tap "Add Quote" to save memorable passages. You can mark quotes as favorites and organize them by book.' },
  { q: 'What is the Discover page?', a: 'Discover shows personalized book recommendations, trending titles, and curated rows by genre. It updates based on your reading history and preferences.' },
  { q: 'How are recommendations chosen?', a: 'Recommendations are AI-generated based on your reading history, ratings, genres, and preferences. The more you read and rate, the better they get.' },
  { q: 'What are Challenges?', a: 'Challenges are optional reading goals like "Read 5 fantasy books" or "Read 1000 pages this month." Complete them to earn bonus points.' },
  { q: 'How do I join a school on Lexio?', a: 'Get a join code from your school\'s Lexio admin, then go to Profile → School and enter the code. Your reading data may be visible to school admins.' },
  { q: 'What is Librarian Mode?', a: 'Librarian Mode is a kiosk-style mode for schools where students can quickly log reading sessions. It\'s protected by a PIN set by the school admin.' },
  { q: 'What is the App Lock feature?', a: 'App Lock adds a PIN screen when opening Lexio, adding extra privacy. Enable it in Profile → Settings → App Lock.' },
  { q: 'How do I export my reading data?', a: 'Go to Profile → Settings → Export Data to download your library, reading log, reviews, and stats as a file.' },
  { q: 'Can I import books from another app?', a: 'Yes! Go to Profile → Import and upload a CSV file of your books. The app will match them to our database and add them to your library.' },
  { q: 'What is age verification?', a: 'Some books contain mature content. Age verification confirms you\'re old enough to view them. Set your age filter in Profile → Privacy Settings.' },
  { q: 'How do content filters work?', a: 'In Privacy Settings, you can blacklist specific themes or genres. Books with those themes will be hidden from your Discover and search results.' },
  { q: 'What is the Reading Strength feature?', a: 'Reading Strength analyzes your reading habits — pace, consistency, genre diversity — and gives you a strength score with tips to improve.' },
  { q: 'How do I get notifications?', a: 'You\'ll receive in-app notifications for forum replies, club activity, and announcements. The notification bell in the header shows your unread count.' },
  { q: 'Can I turn off notifications?', a: 'Notifications for specific types (forum replies, club updates, broadcasts) can be managed in Profile → Settings.' },
  { q: 'What are broadcast messages?', a: 'Broadcasts are announcements from Lexio admins — new features, updates, or important notices. They appear in your notifications.' },
  { q: 'Is my reading data shared with other users?', a: 'Only what you choose to make public. By default, your library and stats are visible to followers, but you can hide them in Privacy Settings.' },
  { q: 'How do I log out?', a: 'Go to Profile → Settings → Log Out. You can log back in anytime with your email or social account.' },
  { q: 'What devices does Lexio support?', a: 'Lexio is available on iOS and Android via the App Store and Google Play. The web version works on any modern browser.' },
  { q: 'Does Lexio work offline?', a: 'You can view your library and previously loaded content offline. Reading log entries sync when you reconnect. Search and Discover require an internet connection.' },
  { q: 'How do I contact support directly?', a: 'Use the contact form above, or email us at Support@LexioReading.App. We respond within 24–48 hours.' },
  { q: 'How do I provide feedback or suggest a feature?', a: 'We\'d love to hear from you! Use the contact form above with "Feedback" as the subject, and we\'ll pass it along to our product team.' },
  { q: 'What if I find a bug?', a: 'Please report it using the contact form above with "Bug Report" as the subject. Include what you were doing when it happened and any error messages you saw.' },
];


export default function SupportPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      const res = await base44.functions.invoke('sendSupportEmail', form);
      if (res.data?.error) throw new Error(res.data.error);
      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSent(false), 5000);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please email us directly at Support@LexioReading.App');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          



          
          
          <span className="font-brand text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Lexio Support
          </span>
        </div>

        {/* Contact Info Cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <a
            href="mailto:Support@LexioReading.App"
            className="lx-card p-5 flex items-center gap-4 no-underline">
            
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(245,214,35,0.12)' }}>
              
              <Mail size={20} style={{ color: 'var(--lx-accent)' }} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Email Us</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Support@LexioReading.App</p>
            </div>
          </a>

          <Link to="/terms-privacy" className="lx-card p-5 flex items-center gap-4 no-underline">
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(245,214,35,0.12)' }}>
              
              <Shield size={20} style={{ color: 'var(--lx-accent)' }} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Terms & Privacy</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>View our policies</p>
            </div>
          </Link>
        </div>

        {/* Contact Form */}
        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Send Us a Message
          </h2>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
            Have a question or need help? Fill out the form below and we'll get back to you.
          </p>

          {sent ?
          <div
            className="lx-card p-6 flex items-center gap-3"
            style={{ borderColor: 'rgba(16,185,129,0.4)' }}>
            
              <Check size={20} style={{ color: '#10b981' }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  Message sent!
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  We'll respond to your email within 24–48 hours.
                </p>
              </div>
            </div> :

          <form onSubmit={submit} className="lx-card p-5 space-y-4">
              {error &&
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
            }
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                    Name <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
                  </label>
                  <input
                  className="lx-input text-sm"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                    Email *
                  </label>
                  <input
                  type="email"
                  className="lx-input text-sm"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required />
                
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                  Subject *
                </label>
                <input
                className="lx-input text-sm"
                placeholder="What's this about?"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                required />
              
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
                  Message *
                </label>
                <textarea
                className="lx-input text-sm resize-none"
                rows={5}
                placeholder="How can we help?"
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                required />
              
              </div>
              <button
              type="submit"
              disabled={sending || !form.email || !form.subject || !form.message}
              className="lx-btn-primary text-sm w-full sm:w-auto">
              
                {sending ? 'Sending...' : <><Send size={14} /> Send Message</>}
              </button>
            </form>
          }
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold mb-5" style={{ color: 'var(--text-primary)' }}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) =>
            <div key={i} className="lx-card overflow-hidden">
                <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left">
                
                  <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    {faq.q}
                  </span>
                  <ChevronDown
                  size={16}
                  style={{
                    color: 'var(--text-muted)',
                    transition: 'transform 0.2s',
                    transform: openFaq === i ? 'rotate(180deg)' : 'none'
                  }} />
                
                </button>
                {openFaq === i &&
              <div
                className="px-4 pb-4 text-sm"
                style={{ color: 'var(--text-secondary)' }}>
                
                    {faq.a}
                  </div>
              }
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <div
          className="text-center text-xs pt-8 border-t"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
          
          <p className="font-brand">Lexio — Your Reading Companion</p>
          <p className="mt-1">
            <Link to="/terms-privacy" style={{ color: 'var(--text-secondary)' }}>Terms</Link>
            {' · '}
            <Link to="/privacy" style={{ color: 'var(--text-secondary)' }}>Privacy</Link>
            {' · '}
            <a href="mailto:Support@LexioReading.App" style={{ color: 'var(--text-secondary)' }}>Support</a>
          </p>
        </div>
      </div>
    </div>);

}