import { useState } from "react";

export default function AdminReports() {
  const [reports, setReports] = useState([
    { 
      id: 101, 
      assetName: "MacBook Pro 16", 
      serial: "MAC-7890", 
      type: "Problem", 
      description: "Screen flickering occasionally", 
      reportedBy: "John Doe", 
      reportedAt: "2024-04-25 09:30 AM",
      status: "Pending" 
    },
    { 
      id: 102, 
      assetName: "Industrial Floor Fan", 
      serial: "FAN-1122", 
      type: "Issue", 
      description: "Making loud grinding noise", 
      reportedBy: "Staff Member", 
      reportedAt: "2024-04-27 02:15 PM",
      status: "Pending" 
    },
    { 
      id: 103, 
      assetName: "Ergonomic Office Chair", 
      serial: "CHR-5566", 
      type: "Maintenance", 
      description: "Hydraulic lift not working", 
      reportedBy: "Jane Smith", 
      reportedAt: "2024-04-28 10:00 AM",
      status: "In Progress" 
    },
  ]);

  const handleAction = (id, newStatus) => {
    setReports(reports.map(report => 
      report.id === id ? { ...report, status: newStatus } : report
    ));
    
    let message = "";
    if (newStatus === "Under Repair") message = "Asset marked for repair.";
    if (newStatus === "Disposed") message = "Asset marked for disposal and moved to records.";
    if (newStatus === "Resolved") message = "Issue marked as resolved.";
    
    alert(message);
  };

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Staff Reports</h1>
        <p className="text-gray-500 text-sm">Review and act on issues reported by staff via QR scan</p>
      </div>

      <div className="card overflow-hidden p-0 border-0 shadow-sm rounded-xl">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Asset / Serial</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Reported By</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {reports.map((report) => (
                <tr key={report.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{report.assetName}</div>
                    <div className="text-[10px] text-gray-400 font-mono">{report.serial}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      report.type === 'Problem' ? 'bg-red-100 text-red-700' :
                      report.type === 'Issue' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {report.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate text-sm text-gray-600" title={report.description}>
                    {report.description}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{report.reportedBy}</td>
                  <td className="px-4 py-3 text-[11px] text-gray-400 whitespace-nowrap">{report.reportedAt}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${
                      report.status === 'Pending' ? 'badge-pending' :
                      report.status === 'In Progress' ? 'bg-orange-100 text-orange-700' :
                      report.status === 'Resolved' ? 'badge-active' : 'badge-danger'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col sm:flex-row gap-2 justify-end">
                      <select 
                        onChange={(e) => handleAction(report.id, e.target.value)}
                        className="text-xs border rounded p-1 bg-white outline-none focus:ring-1 focus:ring-blue-500"
                        defaultValue=""
                      >
                        <option value="" disabled>Action</option>
                        <option value="Under Repair">Repair</option>
                        <option value="Resolved">Resolve</option>
                        <option value="Disposed">Dispose</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}