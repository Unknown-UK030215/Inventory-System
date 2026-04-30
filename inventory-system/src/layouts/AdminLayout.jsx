import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import psuLibraryLogo from "../assets/Psu_Library.png";

export default function AdminLayout() {
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
      <aside className="hidden lg:flex sidebar admin-sidebar w-64 flex-col">
        <div className="flex items-center gap-3 mb-8 px-2">
          <img src={psuLibraryLogo} alt="PSU Library Logo" className="sidebar-logo-small" />
          <h1 className="text-lg font-bold">Admin Panel</h1>
        </div>
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
            <div className="flex items-center gap-3 mb-8 relative">
              <button onClick={closeMobileMenu} className="absolute -right-2 -top-2 text-2xl text-gray-500">&times;</button>
              <img src={psuLibraryLogo} alt="PSU Library Logo" className="sidebar-logo-small" />
              <h1 className="text-lg font-bold text-gray-800">Admin Panel</h1>
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
          </div>

          <div className="flex items-center gap-3">
            <NavLink 
              to="/admin/profile" 
              className="group"
              title="Profile Settings"
            >
              <div className="sidebar-profile-circle border-gray-200 group-hover:ring-2 group-hover:ring-[var(--psu-orange)] transition-all">
                <img src={`https://ui-avatars.com/api/?name=Admin&background=FF5F1F&color=fff`} alt="Admin Profile" className="profile-img" />
              </div>
            </NavLink>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-auto p-4 lg:p-8 bg-white">
          <div className="max-w-7xl mx-auto relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}