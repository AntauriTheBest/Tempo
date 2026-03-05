import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { MainLayout } from './components/layout/MainLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AdminRoute } from './components/common/AdminRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { SetPasswordPage } from './pages/SetPasswordPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { TasksPage } from './pages/TasksPage';
import { ListDetailPage } from './pages/ListDetailPage';
import { ClientTasksPage } from './pages/ClientTasksPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminClientsPage } from './pages/admin/AdminClientsPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminWhatsAppPage } from './pages/admin/AdminWhatsAppPage';
import { MonthlyTrackingPage } from './pages/admin/MonthlyTrackingPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { ReportsPage } from './pages/ReportsPage';
import { CalendarPage } from './pages/CalendarPage';
import { OrgSettingsPage } from './pages/OrgSettingsPage';
import { BillingPage } from './pages/BillingPage';
import { useAuth } from './hooks/useAuth';

function HomeRedirect() {
  const { isAdmin } = useAuth();
  return <Navigate to={isAdmin ? '/dashboard' : '/my-tasks'} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/invite" element={<SetPasswordPage />} />
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<HomeRedirect />} />
          <Route
            path="/my-tasks"
            element={<TasksPage listFilter="my-tasks" />}
          />
          <Route
            path="/assigned"
            element={<TasksPage listFilter="assigned" />}
          />
          <Route path="/lists/:id" element={<ListDetailPage />} />
          <Route path="/clients/:id" element={<ClientTasksPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/org/settings" element={<OrgSettingsPage />} />
          <Route path="/billing" element={<BillingPage />} />

          {/* Admin top-level routes with sidebar visible */}
          <Route
            path="/dashboard"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/monthly"
            element={
              <AdminRoute>
                <MonthlyTrackingPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <AdminRoute>
                <AdminReportsPage />
              </AdminRoute>
            }
          />

          {/* Admin management routes (users, clients, categories) */}
          <Route
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/clients" element={<AdminClientsPage />} />
            <Route path="/admin/categories" element={<AdminCategoriesPage />} />
            <Route path="/admin/whatsapp" element={<AdminWhatsAppPage />} />
          </Route>
        </Route>
      </Routes>
      <Toaster position="bottom-right" />
    </BrowserRouter>
  );
}

export default App;
