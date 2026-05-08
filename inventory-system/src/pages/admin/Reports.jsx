import { useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { useInventory } from "../../context/InventoryContext";

export default function AdminReports() {
  const { reports, loading, assets } = useInventory();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesStatus = statusFilter === "All" || report.status === statusFilter;
      const matchesType = typeFilter === "All" || report.type === typeFilter;
      return matchesStatus && matchesType;
    });
  }, [reports, statusFilter, typeFilter]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(reports.map(r => r.status));
    return ["All", ...statuses];
  }, [reports]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(reports.map(r => r.type));
    return ["All", ...types];
  }, [reports]);

  const handleAction = async (reportId, newReportStatus, assetSerial) => {
    try {
      if (!supabase) throw new Error("Database not connected.");
      setIsProcessing(true);
      
      // First, find the asset
      const asset = assets.find(a => a.serial === assetSerial);
      
      // Try to update report - if it fails due to status constraint, try simpler status
      let reportError;
      
      try {
        const result = await supabase
          .from('reports')
          .update({ status: newReportStatus })
          .eq('id', reportId);
        reportError = result.error;
      } catch (err) {
        reportError = err;
      }

      if (reportError) {
        // If specific status fails, try simpler statuses
        console.log("Status update failed, trying simpler status...");
        const fallbackStatus = newReportStatus === "Resolved" ? "Resolved" : 
                               newReportStatus === "Disposed" ? "Disposed" : "Pending";
        const { error: fallbackError } = await supabase
          .from('reports')
          .update({ status: fallbackStatus })
          .eq('id', reportId);
        
        if (fallbackError) throw fallbackError;
      }

      if (newReportStatus === "Resolved" && assetSerial) {
        // Just mark asset as Active
        const { error: assetError } = await supabase
          .from('assets')
          .update({ status: "Active" })
          .eq('serial', assetSerial);
        
        if (assetError) throw assetError;
      } else if (newReportStatus === "Under Repair" && assetSerial) {
        // Mark asset as Under Repair
        const { error: assetError } = await supabase
          .from('assets')
          .update({ status: "Under Repair" })
          .eq('serial', assetSerial);
        
        if (assetError) throw assetError;
      } else if (newReportStatus === "Disposed" && assetSerial && asset) {
        // Move asset to disposed table
        const { error: disposeError } = await supabase
          .from('disposed')
          .insert([{
            asset_id: asset.id,
            name: asset.name,
            serial: asset.serial,
            category_id: asset.category_id,
            location_id: asset.location_id,
            disposal_reason: reportId ? "Disposed via report" : "Disposed",
            disposed_by: "Admin",
            report_id: reportId
          }]);
        
        if (disposeError) throw disposeError;
        
        // Delete from assets table
        const { error: deleteError } = await supabase
          .from('assets')
          .delete()
          .eq('serial', assetSerial);
        
        if (deleteError) throw deleteError;
      }
      
      let message = "";
      if (newReportStatus === "Under Repair") message = "Asset marked for repair.";
      if (newReportStatus === "Disposed") message = "Asset disposed successfully!";
      if (newReportStatus === "Resolved") message = "Issue marked as resolved.";
      
      alert(message);
    } catch (err) {
      console.error("Action error:", err);
      alert("Error performing action: " + (err.message || JSON.stringify(err)));
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

      {/* Filters */}
      <div className="card mb-6 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="ml-auto text-sm text-gray-500">
            Showing {filteredReports.length} of {reports.length} reports
          </div>
        </div>
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
            ) : filteredReports.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-500">No reports found.</td>
              </tr>
            ) : (
              filteredReports.map((report) => (
                <tr key={report.id}>
                  <td>
                    <div className="font-medium text-gray-900">{report.assets_name || report.name || report.asset_name || "Unknown Asset"}</div>
                    <div className="text-xs text-gray-500 font-mono">{report.serial || "N/A"}</div>
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
                  <td className="text-sm">{report.reported_by}</td>
                  <td className="text-sm text-gray-500">{new Date(report.created_at || report.reported_at).toLocaleString()}</td>
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

      {filteredReports.length === 0 && reports.length > 0 && (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed mt-6">
          <p className="text-gray-500 text-lg">No reports match the current filters. Try adjusting them!</p>
        </div>
      )}
      
      {reports.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed mt-6">
          <p className="text-gray-500 text-lg">No pending reports from staff. Everything is in order! ✨</p>
        </div>
      )}
    </div>
  );
}
