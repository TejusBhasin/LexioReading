import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppShell from '@/components/layout/AppShell';
import DashboardPage from '@/pages/DashboardPage';
import DiscoverPage from '@/pages/DiscoverPage';
import LibraryPage from '@/pages/LibraryPage';
import ChatPage from '@/pages/ChatPage';
import ProfilePage from '@/pages/ProfilePage';
import BookDetailPage from '@/pages/BookDetailPage';
import OnboardingPage from '@/pages/OnboardingPage';
import ClubsPage from '@/pages/ClubsPage';
import ReviewsPage from '@/pages/ReviewsPage';
import ReadingLogPage from '@/pages/ReadingLogPage';
import VaultPage from '@/pages/VaultPage';
import WrappedPage from '@/pages/WrappedPage';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user, isAuthenticated } = useAuth();

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

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <AppShell user={user}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/book/:id" element={<BookDetailPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/clubs" element={<ClubsPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/reading-log" element={<ReadingLogPage />} />
        <Route path="/vault" element={<VaultPage />} />
        <Route path="/wrapped" element={<WrappedPage />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </AppShell>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;