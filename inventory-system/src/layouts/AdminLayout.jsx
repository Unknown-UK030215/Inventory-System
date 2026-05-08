import { useState, createContext, useContext, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

const PageTitleContext = createContext();

export function usePageTitle() {
  return useContext(PageTitleContext);
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState("Admin Dashboard");

  const getAdminUser = () => {
    try {
      return JSON.parse(localStorage.getItem('admin_user') || '{}');
    } catch {
      return {};
    }
  };

  const getTitleFromPath = (path) => {
    switch (path) {
      case "/admin/dashboard":
        return "Dashboard";
      case "/admin/assets":
        return "Assets Inventory";
      case "/admin/users":
        return "User Management";
      case "/admin/reports":
        return "Staff Reports";
      case "/admin/disposed":
        return "Disposed Assets";
      case "/admin/profile":
        return "Profile Settings";
      default:
        return "Admin Dashboard";
    }
  };

  const logout = async () => {
    const adminUser = getAdminUser();
    if (adminUser.id) {
      await supabase
        .from('admin_credentials')
        .update({ 
          is_online: false, 
          last_active: new Date().toISOString() 
        })
        .eq('id', adminUser.id);
    }
    
    await supabase.auth.signOut();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("admin_user");
    localStorage.removeItem("supabase_session");
    navigate("/");
  };

  // Update last active every 30 seconds while logged in
  useEffect(() => {
    const adminUser = getAdminUser();
    if (!adminUser.id) return;

    const updateLastActive = async () => {
      try {
        await supabase
          .from('admin_credentials')
          .update({ 
            is_online: true,
            last_active: new Date().toISOString() 
          })
          .eq('id', adminUser.id);
      } catch (err) {
        console.error('Failed to update last active:', err);
      }
    };

    const markOffline = async () => {
      try {
        await supabase
          .from('admin_credentials')
          .update({ 
            is_online: false,
            last_active: new Date().toISOString() 
          })
          .eq('id', adminUser.id);
      } catch (err) {
        console.error('Failed to mark as offline:', err);
      }
    };

    // Run immediately and then every 30 seconds
    updateLastActive();
    const interval = setInterval(updateLastActive, 30000);
    
    // Mark as offline when page is closed
    window.addEventListener('beforeunload', markOffline);
    window.addEventListener('unload', markOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', markOffline);
      window.removeEventListener('unload', markOffline);
      markOffline();
    };
  }, []);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <PageTitleContext.Provider value={{ pageTitle, setPageTitle }}>
      <div className="flex h-screen overflow-hidden">
        {/* SIDEBAR - Desktop */}
        <aside className="hidden lg:flex sidebar admin-sidebar w-64 flex-col">
          <div className="flex items-center gap-3 mb-8 px-2">
            <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
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
            <aside className="w-64 h-full admin-sidebar p-6 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
                <button onClick={closeMobileMenu} className="text-2xl text-gray-600">&times;</button>
              </div>
              <nav className="flex flex-col gap-4">
                <NavLink to="/admin/dashboard" className="nav-link" onClick={closeMobileMenu}>Dashboard</NavLink>
                <NavLink to="/admin/assets" className="nav-link" onClick={closeMobileMenu}>Assets</NavLink>
                <NavLink to="/admin/users" className="nav-link" onClick={closeMobileMenu}>Users</NavLink>
                <NavLink to="/admin/reports" className="nav-link" onClick={closeMobileMenu}>Staff Reports</NavLink>
                <NavLink to="/admin/disposed" className="nav-link" onClick={closeMobileMenu}>Disposed</NavLink>
              </nav>
            </aside>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* TOPBAR */}
          <header className="h-16 bg-white border-b flex items-center justify-between px-4 lg:px-6 z-30">
            <div className="flex items-center gap-4">
              <button 
                className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                onClick={toggleMobileMenu}
              >
                <span className="text-2xl">☰</span>
              </button>
              <h2 className="text-xl font-bold text-gray-800">{pageTitle || getTitleFromPath(location.pathname)}</h2>
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
          <main className="flex-1 overflow-auto p-3 lg:p-4 bg-gray-50">
            <div className="max-w-full mx-auto relative z-10">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </PageTitleContext.Provider>
  );
}