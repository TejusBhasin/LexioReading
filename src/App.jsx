import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/layout/AppShell';

// Pages
import DashboardPage from '@/pages/DashboardPage';
import DiscoverPage from '@/pages/DiscoverPage';
import LibraryPage from '@/pages/LibraryPage';
import ChatPage from '@/pages/ChatPage';
import ProfilePage from '@/pages/ProfilePage';
import BookDetailPage from '@/pages/BookDetailPage';
import OnboardingPage from '@/pages/OnboardingPage';
import ClubsPage from '@/pages/ClubsPage';
import ClubDetailPage from '@/pages/ClubDetailPage';
import ReviewsPage from '@/pages/ReviewsPage';
import ReadingLogPage from '@/pages/ReadingLogPage';
import VaultPage from '@/pages/VaultPage';
import WrappedPage from '@/pages/WrappedPage';
import TermsPrivacyPage from '@/pages/TermsPrivacyPage';
import SupportPage from '@/pages/SupportPage';
import UserPublicProfilePage from '@/pages/UserPublicProfilePage';
import EasterEggPage from '@/pages/EasterEggPage';
import HiddenAccessPage from '@/pages/HiddenAccessPage';
import ForumsPage from '@/pages/ForumsPage';
import SchoolAdminPage from '@/pages/SchoolAdminPage';
import ClassDetailPage from '@/pages/ClassDetailPage';
import TeacherClassesPage from '@/pages/TeacherClassesPage';
import ReadingGoalPage from '@/pages/ReadingGoalPage';
import ReadingStrengthPage from '@/pages/ReadingStrengthPage';
import BookQuotesPage from '@/pages/BookQuotesPage';
import ChallengesPage from '@/pages/ChallengesPage';
import ImportPage from '@/pages/ImportPage';
import AssignmentsPage from '@/pages/AssignmentsPage';
import BookCreatorPage from '@/pages/BookCreatorPage';
import MovieDetailPage from '@/pages/MovieDetailPage';
import PointNotificationContainer from '@/components/streak/PointNotification';

// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, user, isAuthenticated } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="flex flex-col items-center gap-4">
          <img
            src="https://media.base44.com/images/public/user_6a12376d0f4ca5762da03b88/1678f5c8f_Lexio.png"
            alt="Lexio"
            className="h-8 w-auto animate-pulse"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} />
        </div>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // Bad/expired token — clear and redirect to login
  if (authError?.type === 'auth_required') {
    return <Navigate to="/login" replace />;
  }

  // Redirect to login for pages that require it
  const loginElement = <Navigate to="/login" replace />;

  return (
    <>
      <PointNotificationContainer />
      <AppShell user={user}>
        <Routes>
          {/* ── PUBLIC routes — no login required ── */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/book/:id" element={<BookDetailPage />} />
          <Route path="/terms-privacy" element={<TermsPrivacyPage />} />
          <Route path="/terms" element={<TermsPrivacyPage />} />
          <Route path="/privacy" element={<TermsPrivacyPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/u/:username" element={<UserPublicProfilePage />} />
          <Route path="/forums" element={<ForumsPage />} />
          <Route path="/clubs" element={<ClubsPage />} />
          <Route path="/club/:id" element={<ClubDetailPage />} />
          <Route path="/secret" element={<EasterEggPage />} />
          <Route path="/access" element={<HiddenAccessPage />} />
          <Route path="/book-creator" element={<BookCreatorPage />} />
          <Route path="/movie/:id" element={<MovieDetailPage />} />

          {/* ── PROTECTED routes — require login ── */}
          <Route element={<ProtectedRoute unauthenticatedElement={loginElement} />}>
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/reading-log" element={<ReadingLogPage />} />
            <Route path="/vault" element={<VaultPage />} />
            <Route path="/wrapped" element={<WrappedPage />} />
            <Route path="/school-admin" element={<SchoolAdminPage />} />
            <Route path="/school/class/:id" element={<ClassDetailPage />} />
            <Route path="/my-classes" element={<TeacherClassesPage />} />
            <Route path="/goal" element={<ReadingGoalPage />} />
            <Route path="/strength" element={<ReadingStrengthPage />} />
            <Route path="/quotes" element={<BookQuotesPage />} />
            <Route path="/challenges" element={<ChallengesPage />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/assignments" element={<AssignmentsPage />} />
          </Route>

          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </AppShell>
    </>
  );
};

function App() {
  useEffect(() => {
    const prevent = (e) => {
      if (e.key === ' ' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) && !e.target.isContentEditable) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', prevent, { capture: true });
    document.addEventListener('keydown', prevent, { capture: true });
    return () => {
      window.removeEventListener('keydown', prevent, { capture: true });
      document.removeEventListener('keydown', prevent, { capture: true });
    };
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            {/* ── Auth pages — fullscreen, outside AppShell ── */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* ── Landing page — redirect to home (same not-logged-in view) ── */}
            <Route path="/landing" element={<Navigate to="/" replace />} />
            {/* ── Everything else goes through AuthenticatedApp ── */}
            <Route path="*" element={<AuthenticatedApp />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;