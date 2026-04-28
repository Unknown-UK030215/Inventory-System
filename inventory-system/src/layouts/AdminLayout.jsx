import { Outlet, NavLink, useNavigate } from "react-router-dom";

export default function AdminLayout() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="flex h-screen">

      {/* SIDEBAR */}
      <aside className="sidebar admin-sidebar">
        <h1 className="text-xl font-bold mb-6">Admin Panel</h1>

        <nav className="flex flex-col gap-3">
          <NavLink to="/admin/dashboard" className="nav-link">Dashboard</NavLink>
          <NavLink to="/admin/assets" className="nav-link">Assets</NavLink>
          <NavLink to="/admin/users" className="nav-link">Users</NavLink>
          <NavLink to="/admin/reports" className="nav-link">Staff Reports</NavLink>
          <NavLink to="/admin/disposed" className="nav-link">Disposed</NavLink>
        </nav>
      </aside>

      {/* MAIN */}
      <div className="main-content">

        {/* TOPBAR */}
        <header className="topbar">
          <h2 className="text-lg font-semibold">Admin Dashboard</h2>

          <button
            onClick={logout}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Logout
          </button>
        </header>

        {/* CONTENT */}
        <main className="flex-1 p-4 bg-gray-100 overflow-auto">
          <Outlet />
        </main>

      </div>
    </div>
  );
}