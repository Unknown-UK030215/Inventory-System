import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

import AdminLayout from "./layouts/AdminLayout";
import StaffLayout from "./layouts/StaffLayout";

// Auth
const Login = lazy(() => import("./pages/auth/Login"));

// Admin pages
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Assets = lazy(() => import("./pages/admin/Assets"));
const Users = lazy(() => import("./pages/admin/Users"));
const DisposedAssets = lazy(() => import("./pages/admin/DisposedAssets"));
const AdminReports = lazy(() => import("./pages/admin/Reports"));
const AdminProfile = lazy(() => import("./pages/admin/Profile"));

// Staff pages
const StaffDashboard = lazy(() => import("./pages/staff/Dashboard"));
const MyAssets = lazy(() => import("./pages/staff/MyAssets"));
const QRScanner = lazy(() => import("./pages/staff/QRScanner"));
const MyReports = lazy(() => import("./pages/staff/MyReports"));

// Simple loading fallback
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <div className="loader">Loading...</div>
  </div>
);

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* AUTH */}
        <Route path="/" element={<Login />} />

        {/* ADMIN */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="assets" element={<Assets />} />
          <Route path="users" element={<Users />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="disposed" element={<DisposedAssets />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>

        {/* STAFF */}
        <Route path="/staff" element={<StaffLayout />}>
          <Route path="dashboard" element={<StaffDashboard />} />
          <Route path="my-assets" element={<MyAssets />} />
          <Route path="scan" element={<QRScanner />} />
          <Route path="reports" element={<MyReports />} />
        </Route>

      </Routes>
    </Suspense>
  );
}