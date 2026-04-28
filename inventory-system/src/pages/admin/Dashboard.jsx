export default function Dashboard() {
  const stats = [
    { label: "Total Assets", value: "128", color: "bg-blue-500" },
    { label: "Assigned", value: "95", color: "bg-green-500" },
    { label: "In Maintenance", value: "12", color: "bg-yellow-500" },
    { label: "Disposed", value: "21", color: "bg-red-500" },
  ];

  return (
    <div className="page-container">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="card flex flex-col justify-center border-l-4" style={{ borderLeftColor: stat.color.replace('bg-', '') }}>
            <p className="text-sm text-gray-500 uppercase font-semibold">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <p className="text-sm border-b pb-2 text-gray-700">User <b>John Doe</b> updated asset <b>Laptop-01</b></p>
          <p className="text-sm border-b pb-2 text-gray-700">New asset <b>Monitor-22</b> added to inventory</p>
          <p className="text-sm border-b pb-2 text-gray-700">Asset <b>Chair-05</b> marked as <b>Under Repair</b></p>
        </div>
      </div>
    </div>
  );
}