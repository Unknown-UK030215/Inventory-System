import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useInventory } from "../../context/InventoryContext";

export default function AdminReports() {
  const { reports, loading } = useInventory();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (reportId, newStatus, assetSerial) => {
    try {
      if (!supabase) throw new Error("Database not connected.");
      setIsProcessing(true);
      
      // Update report status
      const { error: reportError } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', reportId);

      if (reportError) throw reportError;

      // Also update asset status if needed
      if (newStatus === "Under Repair" || newStatus === "Disposed") {
        const { error: assetError } = await supabase
          .from('assets')
          .update({ status: newStatus })
          .eq('serial', assetSerial);
        
        if (assetError) throw assetError;
      }
      
      let message = "";
      if (newStatus === "Under Repair") message = "Asset marked for repair.";
      if (newStatus === "Disposed") message = "Asset marked for disposal.";
      if (newStatus === "Resolved") message = "Issue marked as resolved.";
      
      alert(message);
    } catch (err) {
      alert("Error performing action: " + err.message);
    } finally {
      setIsProcessing(false);
    }
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
            {loading && reports.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">Loading reports...</td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">No reports found.</td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id}>
                  <td>
                    <div className="font-medium text-gray-900">{report.asset_name || report.assetName || "Unknown Asset"}</div>
                    <div className="text-xs text-gray-500 font-mono">{report.serial}</div>
                  </td>
                  <td>
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      report.type?.toLowerCase() === 'problem' ? 'bg-red-100 text-red-700' :
                      report.type?.toLowerCase() === 'issue' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {report.type}
                    </span>
                  </td>
                  <td className="max-w-xs truncate text-sm" title={report.description}>
                    {report.description}
                  </td>
                  <td className="text-sm">{report.reported_by || report.reportedBy}</td>
                  <td className="text-sm text-gray-500">{new Date(report.created_at || report.reportedAt).toLocaleString()}</td>
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
                        disabled={isProcessing}
                        onClick={() => handleAction(report.id, "Under Repair", report.serial)}
                        className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 disabled:opacity-50"
                      >
                        Repair
                      </button>
                      <button 
                        disabled={isProcessing}
                        onClick={() => handleAction(report.id, "Disposed", report.serial)}
                        className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        Dispose
                      </button>
                      <button 
                        disabled={isProcessing}
                        onClick={() => handleAction(report.id, "Resolved", report.serial)}
                        className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        Done
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
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