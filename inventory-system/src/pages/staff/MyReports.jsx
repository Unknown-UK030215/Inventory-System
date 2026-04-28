import { useState } from "react";

export default function MyReports() {
  const [reports] = useState([
    { id: 101, assetName: "MacBook Pro 16", serial: "MAC-7890", type: "Problem", description: "Screen flickering occasionally", date: "2024-04-25", status: "Pending" },
    { id: 102, assetName: "Industrial Floor Fan", serial: "FAN-1122", type: "Issue", description: "Making loud grinding noise", date: "2024-04-27", status: "Resolved" },
  ]);

  return (
    <div className="page-container px-4 sm:px-6">
      <div className="mb-6 text-center sm:text-left">
        <h1 className="text-2xl font-bold text-gray-800">My Reports</h1>
        <p className="text-gray-500 text-sm mt-1">Track the status of issues you've reported</p>
      </div>

      <div className="card overflow-hidden p-0 border-0 shadow-sm rounded-xl">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Asset / Serial</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
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
                      report.type === 'Problem' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {report.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate text-sm text-gray-600" title={report.description}>
                    {report.description}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{report.date}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${
                      report.status === 'Pending' ? 'badge-pending' : 'badge-active'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {reports.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-100 mt-6">
          <p className="text-gray-400 text-sm italic">You haven't submitted any reports yet.</p>
        </div>
      )}
    </div>
  );
}
