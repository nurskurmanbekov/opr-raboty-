import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import WorkSessions from './pages/WorkSessions';
import Analytics from './pages/Analytics';
import Users from './pages/Users';
import Geofences from './pages/Geofences';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import MRUManagement from './pages/MRUManagement';
import DistrictManagement from './pages/DistrictManagement';
import Approvals from './pages/Approvals';
import StatisticsDashboard from './pages/StatisticsDashboard';
import EnhancedDashboard from './pages/EnhancedDashboard';
import AuditLog from './pages/AuditLog';
import StatisticsHub from './pages/StatisticsHub';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <ProtectedRoute>
            <Clients />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients/:id"
        element={
          <ProtectedRoute>
            <ClientDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sessions"
        element={
          <ProtectedRoute>
            <WorkSessions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        }
      />
      <Route
        path="/geofences"
        element={
          <ProtectedRoute>
            <Geofences />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mru"
        element={
          <ProtectedRoute>
            <MRUManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/districts"
        element={
          <ProtectedRoute>
            <DistrictManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/approvals"
        element={
          <ProtectedRoute>
            <Approvals />
          </ProtectedRoute>
        }
      />
      <Route
        path="/statistics"
        element={
          <ProtectedRoute>
            <StatisticsDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/enhanced-dashboard"
        element={
          <ProtectedRoute>
            <EnhancedDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-log"
        element={
          <ProtectedRoute>
            <AuditLog />
          </ProtectedRoute>
        }
      />
      <Route
        path="/statistics-hub"
        element={
          <ProtectedRoute>
            <StatisticsHub />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

// Toaster wrapper that uses theme
function ThemedToaster() {
  const { theme, isDark } = useTheme();

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: isDark ? '#1e1e1e' : '#363636',
          color: isDark ? 'rgba(255, 255, 255, 0.87)' : '#fff',
          borderRadius: '10px',
          padding: '16px',
          fontSize: '14px',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#10b981',
            secondary: isDark ? '#1e1e1e' : '#fff',
          },
        },
        error: {
          duration: 4000,
          iconTheme: {
            primary: '#ef4444',
            secondary: isDark ? '#1e1e1e' : '#fff',
          },
        },
      }}
    />
  );
}

function AppWithToaster() {
  return (
    <>
      <AppContent />
      <ThemedToaster />
    </>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppWithToaster />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;