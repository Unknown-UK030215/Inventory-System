import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useInventory } from "../../context/InventoryContext";
import { usePageTitle } from "../../layouts/AdminLayout";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const { supabase, assets, loading, reports, disposed, notifications, refreshData } = useInventory();
  const { setPageTitle } = usePageTitle();
  
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  useEffect(() => {
    setPageTitle("Admin Dashboard");
  }, [setPageTitle]);
  
  const [stats, setStats] = useState([
    { label: "Total Assets", value: "0", color: "text-blue-600", bg: "bg-blue-50", icon: "📦" },
    { label: "Active", value: "0", color: "text-green-600", bg: "bg-green-50", icon: "✅" },
    { label: "Issues/Repair", value: "0", color: "text-yellow-600", bg: "bg-yellow-50", icon: "🛠️" },
    { label: "Expiring Warranty", value: "0", color: "text-red-600", bg: "bg-red-50", icon: "⚠️" },
    { label: "Disposed", value: "0", color: "text-gray-600", bg: "bg-gray-50", icon: "🗑️" },
  ]);
  const [healthData, setHealthData] = useState([
    { status: 'Active', count: 0, color: '#10B981' },
    { status: 'Issues/Repair', count: 0, color: '#F59E0B' },
    { status: 'Disposed', count: 0, color: '#EF4444' },
  ]);

  useEffect(() => {
    if (assets) {
      console.log("=== DASHBOARD ASSETS DATA ===");
      console.log("All assets:", assets);
      console.log("Asset statuses:", assets.map(a => ({ id: a.id, name: a.name, status: a.status })));
      
      const total = assets.length;
      
      // Active assets: ONLY assets with status exactly 'Active'
      const activeAssets = assets.filter(a => a.status?.toLowerCase() === 'active');
      const active = activeAssets.length;
      
      console.log("Active assets:", activeAssets.map(a => ({ name: a.name, status: a.status })));
      
      // Issues/Repair assets: ALL non-active, non-disposed assets
      const repairAssets = assets.filter(a => {
        const status = a.status?.toLowerCase() || '';
        const isActive = status === 'active';
        const isIssueRepair = status.includes('repair') || 
                              status.includes('under') || 
                              status.includes('issue') || 
                              status.includes('problem') ||
                              status === 'in progress' ||
                              status === 'pending';
        return !isActive && isIssueRepair;
      });
      const repair = repairAssets.length;
      
      console.log("Issues/Repair assets:", repairAssets.map(a => ({ name: a.name, status: a.status })));
      
      // Disposed assets are in the disposed table
      const disposedCount = disposed.length;
      
      // Analytics: Expiring Warranty (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const expiringWarranty = assets.filter(a => {
        if (!a.warranty_expiry) return false;
        const expiry = new Date(a.warranty_expiry);
        return expiry > new Date() && expiry <= thirtyDaysFromNow;
      }).length;

      setStats([
        { label: "Total Assets", value: total.toString(), color: "text-blue-600", bg: "bg-blue-50", icon: "📦" },
        { label: "Active", value: active.toString(), color: "text-green-600", bg: "bg-green-50", icon: "✅" },
        { label: "Issues/Repair", value: repair.toString(), color: "text-yellow-600", bg: "bg-yellow-50", icon: "🛠️" },
        { label: "Expiring Warranty", value: expiringWarranty.toString(), color: "text-red-600", bg: "bg-red-50", icon: "⚠️" },
        { label: "Disposed", value: disposedCount.toString(), color: "text-gray-600", bg: "bg-gray-50", icon: "🗑️" },
      ]);

      setHealthData([
        { status: 'Active', count: active, color: '#10B981' },
        { status: 'Issues/Repair', count: repair, color: '#F59E0B' },
        { status: 'Disposed', count: disposedCount, color: '#EF4444' },
      ]);
    }
  }, [assets, disposed]);

  const shortcuts = [
    { title: "Add Asset", icon: "➕", path: "/admin/assets" },
    { title: "Create Staff", icon: "👤", path: "/admin/users" },
    { title: "View Reports", icon: "📊", path: "/admin/reports" },
    { title: "Generate QR", icon: "📱", path: "/admin/assets" },
  ];

  return (
    <div className="page-container">
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p className="text-gray-500 text-lg">Welcome back, Administrator</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Last updated: {new Date().toLocaleTimeString()}</span>
          <button 
            onClick={() => refreshData()}
            className="p-1.5 hover:bg-gray-100 rounded-full transition"
            title="Refresh Data"
          >
            🔄
          </button>
        </div>
      </div>

      {/* URGENT NOTIFICATIONS */}
      {notifications.filter(n => !n.is_read).length > 0 && (
        <div className="mb-8 space-y-3">
          {notifications.filter(n => !n.is_read).slice(0, 2).map(n => (
            <div key={n.id} className={`p-4 rounded-lg border-l-4 shadow-sm flex items-center justify-between ${
              n.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' :
              n.type === 'warning' ? 'bg-orange-50 border-orange-500 text-orange-800' :
              n.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
              'bg-blue-50 border-blue-500 text-blue-800'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {n.type === 'success' ? '✅' : n.type === 'warning' ? '⚠️' : n.type === 'error' ? '🚫' : 'ℹ️'}
                </span>
                <div>
                  <h3 className="font-bold text-sm">{n.title}</h3>
                  <p className="text-xs opacity-80">{n.message}</p>
                </div>
              </div>
              <button 
                onClick={async () => {
                  await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
                  refreshData();
                }}
                className="text-xs font-bold hover:underline"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="card hover:shadow-md transition-shadow group p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs lg:text-sm text-gray-500 uppercase font-bold tracking-wider group-hover:text-orange-600 truncate">{stat.label}</p>
                <p className="text-2xl lg:text-3xl font-bold mt-1 group-hover:text-orange-600">{stat.value}</p>
              </div>
              <div className="p-2 lg:p-3 rounded-full text-xl lg:text-2xl bg-orange-50 text-orange-600 group-hover:bg-orange-100 flex-shrink-0">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Asset Health Graph */}
      <div className="card mb-8">
        <h2 className="text-lg font-bold mb-6 text-gray-700">Asset Condition Overview</h2>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={healthData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="status" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6B7280', fontSize: 12 }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#6B7280', fontSize: 12 }} 
              />
              <Tooltip 
                cursor={{ fill: '#f9fafb' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={60}>
                {healthData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Maintenance Alerts */}
        <div className="lg:col-span-1">
          <div className="card h-full p-4 lg:p-6 bg-red-50 border border-red-100">
            <h2 className="text-lg font-bold mb-4 text-red-800 flex items-center gap-2">
              <span>🔧</span> Maintenance Alerts
            </h2>
            <div className="space-y-3">
              {assets.filter(a => a.next_maintenance && new Date(a.next_maintenance) <= new Date()).length === 0 ? (
                <div className="text-center py-6">
                  <span className="text-3xl mb-2 block">✅</span>
                  <p className="text-sm text-green-700 font-medium">All equipment up to date</p>
                </div>
              ) : (
                assets.filter(a => a.next_maintenance && new Date(a.next_maintenance) <= new Date()).slice(0, 3).map((a, i) => (
                  <div key={i} className="p-3 bg-white rounded-lg border border-red-200 shadow-sm">
                    <p className="text-sm font-bold text-gray-800 truncate">{a.name}</p>
                    <p className="text-xs text-red-600 font-semibold mt-1">Maintenance Due: {new Date(a.next_maintenance).toLocaleDateString()}</p>
                    <button 
                      onClick={() => navigate('/admin/assets')}
                      className="mt-2 text-xs text-blue-600 font-bold hover:underline"
                    >
                      Update Status →
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="card h-full p-4 lg:p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-700">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 lg:gap-4">
              {shortcuts.map((shortcut, i) => (
                <button
                  key={i}
                  onClick={() => navigate(shortcut.path)}
                  className="flex flex-col items-center justify-center p-3 lg:p-4 rounded-lg border transition border-gray-100 hover:bg-orange-50 hover:border-orange-200"
                >
                  <span className="text-xl lg:text-2xl mb-1 lg:mb-2">{shortcut.icon}</span>
                  <span className="text-xs lg:text-sm font-medium text-gray-600 text-center">{shortcut.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="lg:col-span-1">
          <div className="card h-full">
            <h2 className="text-lg font-bold mb-4 text-gray-700">Notification History</h2>
            <div className="space-y-4">
              {notifications.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No recent notifications found.</p>
              ) : (
                notifications.slice(0, 5).map((n, i) => (
                  <div key={i} className="flex items-start gap-3 border-b border-gray-50 pb-3 last:border-0">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      n.type === 'success' ? 'bg-green-500' : 
                      n.type === 'warning' ? 'bg-orange-500' : 
                      n.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{n.title}</p>
                      <p className="text-xs text-gray-600 line-clamp-1">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button 
              onClick={() => refreshData()}
              className="w-full mt-6 text-blue-600 text-sm font-semibold hover:underline"
            >
              Refresh Feed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}