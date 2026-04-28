import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  
  const stats = [
    { label: "Total Assets", value: "128", color: "text-blue-600", bg: "bg-blue-50", icon: "📦" },
    { label: "Assigned", value: "95", color: "text-green-600", bg: "bg-green-50", icon: "👤" },
    { label: "In Maintenance", value: "12", color: "text-yellow-600", bg: "bg-yellow-50", icon: "🛠️" },
    { label: "Disposed", value: "21", color: "text-red-600", bg: "bg-red-50", icon: "🗑️" },
  ];

  const shortcuts = [
    { title: "Add Asset", icon: "➕", path: "/admin/assets" },
    { title: "Create Staff", icon: "👤", path: "/admin/users" },
    { title: "View Reports", icon: "📊", path: "/admin/reports" },
    { title: "Generate QR", icon: "📱", path: "/admin/assets" },
  ];

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500">Welcome back, Administrator</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 uppercase font-bold tracking-wider">{stat.label}</p>
                <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={`${stat.bg} p-3 rounded-full text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="card h-full">
            <h2 className="text-lg font-bold mb-4 text-gray-700">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              {shortcuts.map((shortcut, i) => (
                <button
                  key={i}
                  onClick={() => navigate(shortcut.path)}
                  className="flex flex-col items-center justify-center p-4 rounded-lg border hover:bg-gray-50 transition border-gray-100"
                >
                  <span className="text-2xl mb-2">{shortcut.icon}</span>
                  <span className="text-sm font-medium text-gray-600">{shortcut.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="card h-full">
            <h2 className="text-lg font-bold mb-4 text-gray-700">Recent Activity</h2>
            <div className="space-y-4">
              {[
                { user: "Admin", action: "Created staff account for", target: "Jane Smith", time: "2 hours ago" },
                { user: "Admin", action: "Added new asset", target: "Monitor Dell 27\"", time: "5 hours ago" },
                { user: "Staff (John)", action: "Reported issue for", target: "Laptop-01", time: "1 day ago" },
                { user: "Admin", action: "Disposed asset", target: "Old Printer-02", time: "2 days ago" },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-3 border-b border-gray-50 pb-3 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-800">
                      <span className="font-bold">{activity.user}</span> {activity.action} <span className="font-semibold">{activity.target}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 text-blue-600 text-sm font-semibold hover:underline">
              View All Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}