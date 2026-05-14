import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AdminClasses from './pages/admin/Classes';
import AdminBookings from './pages/admin/Bookings';
import Calendar from './pages/student/Calendar';
import MyBookings from './pages/student/MyBookings';
import Profile from './pages/student/Profile';

function RequireAuth({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-center py-20 text-gray-400">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/calendar'} replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/calendar'} /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/calendar" /> : <Register />} />

          {/* Admin routes */}
          <Route path="/admin" element={<RequireAuth role="admin"><AdminDashboard /></RequireAuth>} />
          <Route path="/admin/students" element={<RequireAuth role="admin"><AdminStudents /></RequireAuth>} />
          <Route path="/admin/classes" element={<RequireAuth role="admin"><AdminClasses /></RequireAuth>} />
          <Route path="/admin/bookings" element={<RequireAuth role="admin"><AdminBookings /></RequireAuth>} />

          {/* Student routes */}
          <Route path="/calendar" element={<RequireAuth role="student"><Calendar /></RequireAuth>} />
          <Route path="/my-bookings" element={<RequireAuth role="student"><MyBookings /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth role="student"><Profile /></RequireAuth>} />

          <Route path="*" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/calendar') : '/login'} replace />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
