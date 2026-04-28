import { Routes, Route } from "react-router-dom";

import Login from "./pages/auth/Login";

import AdminLayout from "./layouts/AdminLayout";
import StaffLayout from "./layouts/StaffLayout";

// Admin pages (placeholders for now)
import Dashboard from "./pages/admin/Dashboard";
import Assets from "./pages/admin/Assets";
import Users from "./pages/admin/Users";
import DisposedAssets from "./pages/admin/DisposedAssets";

// Staff pages (placeholders for now)
import StaffDashboard from "./pages/staff/Dashboard";
import MyAssets from "./pages/staff/MyAssets";
import QRScanner from "./pages/staff/QRScanner";
import MyReports from "./pages/staff/MyReports";

export default function App() {
  return (
    <Routes>

      {/* AUTH */}
      <Route path="/" element={<Login />} />

      {/* ADMIN */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="assets" element={<Assets />} />
        <Route path="users" element={<Users />} />
        <Route path="disposed" element={<DisposedAssets />} />
      </Route>

      {/* STAFF */}
      <Route path="/staff" element={<StaffLayout />}>
        <Route path="dashboard" element={<StaffDashboard />} />
        <Route path="my-assets" element={<MyAssets />} />
        <Route path="scan" element={<QRScanner />} />
        <Route path="reports" element={<MyReports />} />
      </Route>

    </Routes>
  );
}