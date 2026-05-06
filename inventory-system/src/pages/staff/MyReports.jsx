import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase"; 
import { useInventory } from "../../context/InventoryContext";


export default function MyReports() {
  const { reports, assets, loading } = useInventory();
  const [user, setUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => setUser(data.user));
    }
  }, []);

  const myReports = reports.filter(r => 
    user && (r.reported_by === user.email || r.reported_by === user.user_metadata?.full_name)
  );

  const getAssetInfo = (report) => {
    let name = report.asset_name || "Unknown Asset";
    let serial = report.serial || "N/A";
    
    // Try from joined assets first
    if (report.assets?.name) {
      name = report.assets.name;
    }
    if (report.assets?.serial) {
      serial = report.assets.serial;
    }
    
    // Fallback to assets array from context
    if (name === "Unknown Asset" && assets.length > 0 && serial !== "N/A") {
      const foundAsset = assets.find(a => a.serial === serial);
      if (foundAsset) {
        name = foundAsset.name;
      }
    }
    
    return { name, serial };
  };

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Reports</h1>
        <p className="text-gray-500">View all reports you have submitted</p>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th>Asset / Serial</th>
              <th>Type</th>
              <th>Description</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && myReports.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-500">Loading reports...</td>
              </tr>
            ) : myReports.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-500">No reports submitted yet.</td>
              </tr>
            ) : (
              myReports.map((report) => {
                const assetInfo = getAssetInfo(report);
                return (
                  <tr key={report.id}>
                    <td>
                      <div className="font-medium text-gray-900">{assetInfo.name}</div>
                      <div className="text-xs text-gray-500 font-mono">{assetInfo.serial}</div>
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
                    <td className="text-sm text-gray-500">{new Date(report.reported_at).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${
                        report.status === 'Pending' ? 'badge-pending' :
                        report.status === 'In Progress' || report.status === 'Under Repair' ? 'bg-orange-100 text-orange-700' :
                        report.status === 'Resolved' ? 'badge-active' : 'badge-danger'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
