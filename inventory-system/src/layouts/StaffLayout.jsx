import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import psuLibraryLogo from "../assets/Psu_Library.png";

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
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="sidebar-profile-circle border-gray-200">
            <img src={`https://ui-avatars.com/api/?name=Staff&background=FF5F1F&color=fff`} alt="Staff Profile" className="profile-img" />
          </div>
          <h1 className="text-lg font-bold text-gray-800">Staff Panel</h1>
        </div>

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
            <div className="flex items-center gap-3 mb-8 relative text-white">
              <button onClick={closeMobileMenu} className="absolute -right-2 -top-2 text-2xl">&times;</button>
              <div className="sidebar-profile-circle border-gray-200">
                <img src={`https://ui-avatars.com/api/?name=Staff&background=FF5F1F&color=fff`} alt="Staff Profile" className="profile-img" />
              </div>
              <h1 className="text-lg font-bold">Staff Panel</h1>
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
          </div>

          <div className="flex items-center gap-3">
            <NavLink 
              to="/staff/profile" 
              className="group"
              title="Profile Settings"
            >
              <div className="sidebar-profile-circle border-gray-200 group-hover:ring-2 group-hover:ring-[var(--psu-orange)] transition-all">
                <img src={`https://ui-avatars.com/api/?name=Staff&background=FF5F1F&color=fff`} alt="Staff Profile" className="profile-img" />
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