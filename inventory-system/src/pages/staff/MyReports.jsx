import { useState } from "react";
import { useInventory } from "../../context/InventoryContext";

export default function MyReports() {
  const { reports, loading } = useInventory();
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReports = reports.filter(report => {
    const matchesStatus = statusFilter === "All" || report.status === statusFilter;
    const matchesSearch = !searchTerm || 
      (report.name && report.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.serial && report.serial.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.description && report.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (report.type && report.type.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Reports</h1>
        <p className="text-gray-500">View your submitted reports here.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search reports..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="w-full lg:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="table-container">
          <table className="data-table w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Asset / Serial</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading && reports.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500 font-medium">Loading reports...</td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500 font-medium">No reports found.</td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-3 py-3">
                      <div className="font-medium text-gray-900">{report.name || "Unknown Asset"}</div>
                      <div className="text-xs text-gray-500 font-mono">{report.serial || "N/A"}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        report.type?.toLowerCase() === 'problem' ? 'bg-red-100 text-red-700' :
                        report.type?.toLowerCase() === 'issue' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {report.type}
                      </span>
                    </td>
                    <td className="px-3 py-3 max-w-xs truncate text-sm text-gray-600" title={report.description}>
                      {report.description}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500">
                      {new Date(report.created_at || report.reported_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`badge ${
                        report.status === 'Pending' ? 'badge-pending' :
                        report.status === 'In Progress' ? 'bg-orange-100 text-orange-700' :
                        report.status === 'Resolved' ? 'badge-active' : 'badge-danger'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
