import { useState } from "react";

export default function AdminReports() {
  const [reports, setReports] = useState([
    { 
      id: 101, 
      assetName: "Laptop Dell XPS", 
      serial: "DELL-1234", 
      type: "Problem", 
      description: "Screen flickering occasionally", 
      reportedBy: "John Doe", 
      reportedAt: "2024-04-25 09:30 AM",
      status: "Pending" 
    },
    { 
      id: 102, 
      assetName: "Office Chair", 
      serial: "CHAIR-9012", 
      type: "Issue", 
      description: "Wheel broken", 
      reportedBy: "Staff Member", 
      reportedAt: "2024-04-27 02:15 PM",
      status: "Pending" 
    },
    { 
      id: 103, 
      assetName: "Projector Epson", 
      serial: "EPS-991", 
      type: "Maintenance", 
      description: "Filter needs cleaning", 
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
        <p className="text-gray-500">Review and act on issues reported by staff via QR scan</p>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th>Asset / Serial</th>
              <th>Type</th>
              <th>Description</th>
              <th>Reported By</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td>
                  <div className="font-medium text-gray-900">{report.assetName}</div>
                  <div className="text-xs text-gray-500 font-mono">{report.serial}</div>
                </td>
                <td>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    report.type === 'Problem' ? 'bg-red-100 text-red-700' :
                    report.type === 'Issue' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {report.type}
                  </span>
                </td>
                <td className="max-w-xs truncate text-sm" title={report.description}>
                  {report.description}
                </td>
                <td className="text-sm">{report.reportedBy}</td>
                <td className="text-sm text-gray-500">{report.reportedAt}</td>
                <td>
                  <span className={`badge ${
                    report.status === 'Pending' ? 'badge-pending' :
                    report.status === 'In Progress' ? 'bg-orange-100 text-orange-700' :
                    report.status === 'Resolved' ? 'badge-active' : 'badge-danger'
                  }`}>
                    {report.status}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAction(report.id, "Under Repair")}
                      className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                    >
                      Repair
                    </button>
                    <button 
                      onClick={() => handleAction(report.id, "Disposed")}
                      className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                    >
                      Dispose
                    </button>
                    <button 
                      onClick={() => handleAction(report.id, "Resolved")}
                      className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                    >
                      Done
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reports.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed mt-6">
          <p className="text-gray-500 text-lg">No pending reports from staff. Everything is in order! ✨</p>
        </div>
      )}
    </div>
  );
}