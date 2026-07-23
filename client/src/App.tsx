import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './lib/queryClient';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RecipesPage from './pages/RecipesPage';
import PantryPage from './pages/PantryPage';
import MealPlanPage from './pages/MealPlanPage';
import GroceryPage from './pages/GroceryPage';
import PricesPage from './pages/PricesPage';
import ProfilePage from './pages/ProfilePage';

// ─── Auth Guard ──────────────────────────────────────────────────
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: 'linear-gradient(135deg, var(--accent), #e07a1f)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'pulse 1.5s ease-in-out infinite',
          fontSize: 24,
        }}>
          🍽️
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Ini-load ang Hapag...</div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(0.95)} }`}</style>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  return (
    <div style={{ display: 'flex', minHeight: '100dvh' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected */}
            <Route path="/" element={
              <AuthGuard><DashboardPage /></AuthGuard>
            } />
            <Route path="/recipes" element={
              <AuthGuard><RecipesPage /></AuthGuard>
            } />
            <Route path="/pantry" element={
              <AuthGuard><PantryPage /></AuthGuard>
            } />
            <Route path="/meal-plan" element={
              <AuthGuard><MealPlanPage /></AuthGuard>
            } />
            <Route path="/grocery" element={
              <AuthGuard><GroceryPage /></AuthGuard>
            } />
            <Route path="/prices" element={
              <AuthGuard><PricesPage /></AuthGuard>
            } />
            <Route path="/profile" element={
              <AuthGuard><ProfilePage /></AuthGuard>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--surface)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                fontFamily: 'var(--font)',
                fontSize: 13,
                borderRadius: 10,
              },
              success: {
                iconTheme: { primary: 'var(--success)', secondary: 'var(--bg)' },
              },
              error: {
                iconTheme: { primary: 'var(--error)', secondary: 'var(--bg)' },
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
