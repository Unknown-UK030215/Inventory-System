import { Outlet, NavLink, useNavigate } from "react-router-dom";

export default function StaffLayout() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="flex h-screen">

      {/* SIDEBAR */}
      <aside className="sidebar staff-sidebar">
        <h1 className="text-xl font-bold mb-6">Staff Panel</h1>

        <nav className="flex flex-col gap-3">
          <NavLink to="/staff/dashboard" className="nav-link">Dashboard</NavLink>
          <NavLink to="/staff/my-assets" className="nav-link">My Assets</NavLink>
          <NavLink to="/staff/scan" className="nav-link">Scan QR</NavLink>
          <NavLink to="/staff/reports" className="nav-link">Reports</NavLink>
        </nav>
      </aside>

      {/* MAIN */}
      <div className="main-content">

        {/* TOPBAR */}
        <header className="topbar">
          <h2 className="text-lg font-semibold">Staff Dashboard</h2>

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