import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CustomerDashboard from './pages/CustomerDashboard';
import BookService from './pages/BookService';
import Orders from './pages/Orders';
import NewOrder from './pages/NewOrder';
import OrderDetail from './pages/OrderDetail';
import Payments from './pages/Payments';
import Notifications from './pages/Notifications';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminOrders from './pages/AdminOrders';
import AdminBookings from './pages/AdminBookings';
import AdminAssign from './pages/AdminAssign';
import AdminReports from './pages/AdminReports';
import AdminServices from './pages/AdminServices';
import AdminPlans from './pages/AdminPlans';
import AdminCategories from './pages/AdminCategories';
import AdminProfile from './pages/AdminProfile';
import StaffDashboard from './pages/StaffDashboard';
import StaffOrders from './pages/StaffOrders';
import StaffBookings from './pages/StaffBookings';
import StaffDeliveries from './pages/StaffDeliveries';
import { Spinner } from './components/ui';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { profile, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!profile) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(profile.role)) return <Navigate to="/app" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  if (loading) return <Spinner />;
  if (profile) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function DashboardRouter() {
  const { profile } = useAuth();
  if (!profile) return null;
  switch (profile.role) {
    case 'admin': return <AdminDashboard />;
    case 'customer': return <CustomerDashboard />;
    default: return <StaffDashboard />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

          <Route path="/app" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />

          {/* Customer routes */}
          <Route path="/app/book" element={<ProtectedRoute roles={['customer']}><BookService /></ProtectedRoute>} />
          <Route path="/app/orders" element={<ProtectedRoute roles={['customer']}><Orders /></ProtectedRoute>} />
          <Route path="/app/orders/new" element={<ProtectedRoute roles={['customer']}><NewOrder /></ProtectedRoute>} />
          <Route path="/app/orders/:id" element={<ProtectedRoute roles={['customer']}><OrderDetail /></ProtectedRoute>} />
          <Route path="/app/payments" element={<ProtectedRoute roles={['customer']}><Payments /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/app/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/app/admin/orders" element={<ProtectedRoute roles={['admin']}><AdminOrders /></ProtectedRoute>} />
          <Route path="/app/admin/bookings" element={<ProtectedRoute roles={['admin']}><AdminBookings /></ProtectedRoute>} />
          <Route path="/app/admin/assign" element={<ProtectedRoute roles={['admin']}><AdminAssign /></ProtectedRoute>} />
          <Route path="/app/admin/reports" element={<ProtectedRoute roles={['admin']}><AdminReports /></ProtectedRoute>} />
          <Route path="/app/admin/services" element={<ProtectedRoute roles={['admin']}><AdminServices /></ProtectedRoute>} />
          <Route path="/app/admin/plans" element={<ProtectedRoute roles={['admin']}><AdminPlans /></ProtectedRoute>} />
          <Route path="/app/admin/categories" element={<ProtectedRoute roles={['admin']}><AdminCategories /></ProtectedRoute>} />
          <Route path="/app/admin/profile" element={<ProtectedRoute roles={['admin']}><AdminProfile /></ProtectedRoute>} />

          {/* Staff routes */}
          <Route path="/app/staff/orders" element={<ProtectedRoute roles={['designer']}><StaffOrders /></ProtectedRoute>} />
          <Route path="/app/staff/bookings" element={<ProtectedRoute roles={['photographer']}><StaffBookings /></ProtectedRoute>} />
          <Route path="/app/staff/deliveries" element={<ProtectedRoute roles={['delivery']}><StaffDeliveries /></ProtectedRoute>} />

          {/* Shared */}
          <Route path="/app/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
