import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import TicketDetailPage from './pages/TicketDetailPage';
import IntakePage from './pages/IntakePage';
import CallLogsPage from './pages/CallLogsPage';
import SettingsPage from './pages/SettingsPage';
import EstimatePage from './pages/EstimatePage';
import ClaimPage from './pages/ClaimPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        {/* Public patient-facing pages — no login required */}
        <Route path="/estimate/:token" element={<EstimatePage />} />
        <Route path="/claim/:token" element={<ClaimPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tickets/:id" element={<TicketDetailPage />} />
            <Route path="/intake" element={<IntakePage />} />
            <Route path="/call-logs" element={<CallLogsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
