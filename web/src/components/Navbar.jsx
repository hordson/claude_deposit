import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  if (!user) return null;

  return (
    <nav className="bg-brand-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="text-xl font-bold tracking-wide">💃 Dance Studio</Link>
        <div className="flex items-center gap-6 text-sm font-medium">
          {user.role === 'admin' ? (
            <>
              <Link to="/admin" className="hover:text-brand-100">Dashboard</Link>
              <Link to="/admin/students" className="hover:text-brand-100">Students</Link>
              <Link to="/admin/classes" className="hover:text-brand-100">Classes</Link>
              <Link to="/admin/bookings" className="hover:text-brand-100">Bookings</Link>
            </>
          ) : (
            <>
              <Link to="/calendar" className="hover:text-brand-100">Calendar</Link>
              <Link to="/my-bookings" className="hover:text-brand-100">My Bookings</Link>
              <Link to="/profile" className="hover:text-brand-100">Profile</Link>
            </>
          )}
          <button onClick={handleLogout} className="bg-white text-brand-700 px-3 py-1 rounded-full text-xs font-semibold hover:bg-brand-50">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
