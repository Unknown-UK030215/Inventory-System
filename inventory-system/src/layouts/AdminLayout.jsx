import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* SIDEBAR - Desktop */}
      <aside className="hidden lg:flex sidebar admin-sidebar w-64 flex-col">
        <h1 className="text-xl font-bold mb-6">Admin Panel</h1>
        <nav className="flex flex-col gap-3">
          <NavLink to="/admin/dashboard" className="nav-link">Dashboard</NavLink>
          <NavLink to="/admin/assets" className="nav-link">Assets</NavLink>
          <NavLink to="/admin/users" className="nav-link">Users</NavLink>
          <NavLink to="/admin/reports" className="nav-link">Staff Reports</NavLink>
          <NavLink to="/admin/disposed" className="nav-link">Disposed</NavLink>
        </nav>
      </aside>

      {/* MOBILE SIDEBAR OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMobileMenu}
        >
          <aside className="w-64 h-full bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
              <button onClick={closeMobileMenu} className="text-2xl text-gray-500">&times;</button>
            </div>
            <nav className="flex flex-col gap-4">
              <NavLink to="/admin/dashboard" className="nav-link mobile" onClick={closeMobileMenu}>Dashboard</NavLink>
              <NavLink to="/admin/assets" className="nav-link mobile" onClick={closeMobileMenu}>Assets</NavLink>
              <NavLink to="/admin/users" className="nav-link mobile" onClick={closeMobileMenu}>Users</NavLink>
              <NavLink to="/admin/reports" className="nav-link mobile" onClick={closeMobileMenu}>Staff Reports</NavLink>
              <NavLink to="/admin/disposed" className="nav-link mobile" onClick={closeMobileMenu}>Disposed</NavLink>
            </nav>
          </aside>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOPBAR */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 lg:px-8 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              onClick={toggleMobileMenu}
            >
              <span className="text-2xl">☰</span>
            </button>
            <h2 className="text-lg font-semibold text-gray-800 truncate">Inventory System</h2>
          </div>

          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Logout
          </button>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-auto p-4 lg:p-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}