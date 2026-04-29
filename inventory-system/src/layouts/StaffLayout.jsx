import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function StaffLayout() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("supabase_session");
    navigate("/");
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex h-screen overflow-hidden">

      {/* SIDEBAR - Desktop */}
      <aside className="hidden lg:flex sidebar staff-sidebar w-64 flex-col">
        <h1 className="text-xl font-bold mb-6">Staff Panel</h1>

        <nav className="flex flex-col gap-3">
          <NavLink to="/staff/dashboard" className="nav-link">Dashboard</NavLink>
          <NavLink to="/staff/my-assets" className="nav-link">My Assets</NavLink>
          <NavLink to="/staff/scan" className="nav-link">Scan QR</NavLink>
          <NavLink to="/staff/reports" className="nav-link">Reports</NavLink>
        </nav>
      </aside>

      {/* MOBILE SIDEBAR OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMobileMenu}
        >
          <aside 
            className="w-64 h-full staff-sidebar p-6 shadow-xl" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8 text-white">
              <h1 className="text-xl font-bold">Staff Panel</h1>
              <button onClick={closeMobileMenu} className="text-2xl">&times;</button>
            </div>
            <nav className="flex flex-col gap-4 text-white">
              <NavLink to="/staff/dashboard" className="nav-link" onClick={closeMobileMenu}>Dashboard</NavLink>
              <NavLink to="/staff/my-assets" className="nav-link" onClick={closeMobileMenu}>My Assets</NavLink>
              <NavLink to="/staff/scan" className="nav-link" onClick={closeMobileMenu}>Scan QR</NavLink>
              <NavLink to="/staff/reports" className="nav-link" onClick={closeMobileMenu}>Reports</NavLink>
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
            <h2 className="text-lg font-semibold text-gray-800 truncate">Staff Dashboard</h2>
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