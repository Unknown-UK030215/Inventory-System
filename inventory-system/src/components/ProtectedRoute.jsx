import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute({ allowedRole }) {
  const userRole = localStorage.getItem('user'); // 'admin' or 'staff'
  const adminUser = localStorage.getItem('admin_user');
  const staffUser = localStorage.getItem('staff_user');

  // Check if user is logged in
  const isLoggedIn = userRole && (adminUser || staffUser);

  if (!isLoggedIn) {
    // Not logged in, redirect to login page
    return <Navigate to="/" replace />;
  }

  if (allowedRole && userRole !== allowedRole) {
    // Logged in but wrong role, redirect to their respective dashboard
    return <Navigate to={userRole === 'admin' ? '/admin/dashboard' : '/staff/dashboard'} replace />;
  }

  // Authorized, render the child routes
  return <Outlet />;
}
