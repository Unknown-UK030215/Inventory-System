import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabase";
import { useInventory } from "../../context/InventoryContext";

export default function AdminReports() {
  const { reports, loading, assets, refreshData } = useInventory();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const filteredReports = useMemo(() => {
    return reports
      .filter(report => {
        const matchesStatus = statusFilter === "All" || report.status === statusFilter;
        const matchesType = typeFilter === "All" || report.type === typeFilter;
        return matchesStatus && matchesType;
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at || a.reported_at || 0);
        const dateB = new Date(b.created_at || b.reported_at || 0);
        return dateB - dateA; // Newest first
      });
  }, [reports, statusFilter, typeFilter]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(reports.map(r => r.status));
    // Always include all possible statuses
    const allStatuses = ["Pending", "Under Repair", "Resolved", "Disposed"];
    allStatuses.forEach(status => statuses.add(status));
    return ["All", ...Array.from(statuses)];
  }, [reports]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(reports.map(r => r.type));
    // Always include these common types
    const commonTypes = ["problem", "issue", "maintenance", "repair"];
    commonTypes.forEach(type => types.add(type));
    return ["All", ...Array.from(types)];
  }, [reports]);

  const exportToExcel = () => {
    const exportData = filteredReports.map((report, index) => ({
      "No.": index + 1,
      "Asset Name": report.assets_name || report.name || report.asset_name || "Unknown Asset",
      "Serial Number": report.serial || "N/A",
      "Type": report.type,
      "Description": report.description || "N/A",
      "Reported By": report.reported_by || "N/A",
      "Date Reported": report.created_at || report.reported_at 
        ? new Date(report.created_at || report.reported_at).toLocaleString() 
        : "N/A",
      "Status": report.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 30 },
      { wch: 20 },
      { wch: 15 },
      { wch: 40 },
      { wch: 20 },
      { wch: 25 },
      { wch: 15 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");
    
    let filename = `PSU-Inventory-Reports-${new Date().toISOString().split('T')[0]}`;
    if (statusFilter !== "All") {
      filename += `-${statusFilter}`;
    }
    if (typeFilter !== "All") {
      filename += `-${typeFilter}`;
    }
    
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const handleAction = async (reportId, newReportStatus, assetSerial) => {
    try {
      if (!supabase) throw new Error("Database not connected.");
      setIsProcessing(true);
      
      // First, find the asset
      const asset = assets.find(a => a.serial === assetSerial);
      
      // Update report status FIRST (no more check constraints!)
      console.log("Updating report status to:", newReportStatus);
      try {
        const { error: reportError } = await supabase
          .from('reports')
          .update({ status: newReportStatus })
          .eq('id', reportId);
        
        if (reportError) {
          console.error("Report status update error:", reportError);
          // If report fails, still try to update asset
        }
      } catch (e) {
        console.error("Report status update exception:", e);
      }
      
      // Then update asset status or dispose asset
      if (newReportStatus === "Resolved" && assetSerial) {
        // Mark asset as Active
        const { error: assetError } = await supabase
          .from('assets')
          .update({ status: "Active" })
          .eq('serial', assetSerial);
        
        if (assetError) console.error("Asset status update error:", assetError);

        // LOG HISTORY
        if (asset) {
          await supabase.from('asset_history').insert({
            asset_id: asset.id,
            action: 'STATUS_CHANGE',
            changes: { status: { from: asset.status, to: 'Active' }, report_id: reportId },
            performed_by: 'Admin',
            performed_by_role: 'admin'
          });
        }
      } else if (newReportStatus === "Under Repair" && assetSerial) {
        // Mark asset as Under Repair
        const { error: assetError } = await supabase
          .from('assets')
          .update({ status: "Under Repair" })
          .eq('serial', assetSerial);
        
        if (assetError) console.error("Asset status update error:", assetError);

        // LOG HISTORY
        if (asset) {
          await supabase.from('asset_history').insert({
            asset_id: asset.id,
            action: 'STATUS_CHANGE',
            changes: { status: { from: asset.status, to: 'Under Repair' }, report_id: reportId },
            performed_by: 'Admin',
            performed_by_role: 'admin'
          });
        }
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

        // LOG HISTORY before deletion
        await supabase.from('asset_history').insert({
          asset_id: asset.id,
          action: 'DISPOSED',
          changes: { status: { from: asset.status, to: 'Disposed' }, report_id: reportId },
          performed_by: 'Admin',
          performed_by_role: 'admin'
        });
        
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
      
      // Refresh all data to update dashboard and assets list
      refreshData();
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
          <div className="ml-auto flex gap-2 items-center">
            <button 
              onClick={exportToExcel}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition shadow-sm font-semibold"
            >
              📤 Export Excel
            </button>
            <div className="text-sm text-gray-500">
              Showing {filteredReports.length} of {reports.length} reports
            </div>
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
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      report.status === 'Resolved' ? 'bg-green-100 text-green-700' : 
                      report.status === 'Under Repair' ? 'bg-yellow-100 text-yellow-700' : 
                      report.status === 'Disposed' ? 'bg-red-100 text-red-700' : 
                      'bg-orange-100 text-orange-700'
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
