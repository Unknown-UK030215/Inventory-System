import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useInventory } from "../../context/InventoryContext";

export default function MyAssets() {
  const { assets, loading, error } = useInventory();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => setUser(data.user));
    }
  }, []);

  const myAssets = assets.filter(a => 
    user && (a.assigned_to_name === user.email || a.assigned_to_name === user.user_metadata?.full_name)
  );

  return (
    <div className="page-container">
      <h1 className="text-2xl font-bold mb-6">My Assigned Assets</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th>Asset Name</th>
              <th>Category</th>
              <th>Serial Number</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && myAssets.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-8 text-gray-500">Loading assets...</td>
              </tr>
            ) : myAssets.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-8 text-gray-500">No assets assigned to you.</td>
              </tr>
            ) : (
              myAssets.map((asset) => (
                <tr key={asset.id}>
                  <td>{asset.name}</td>
                  <td>{asset.categories?.name || 'Uncategorized'}</td>
                  <td className="text-sm text-gray-500">{asset.serial}</td>
                  <td>
                    <span className={`badge ${
                      asset.status === 'Active' ? 'badge-active' : 'badge-pending'
                    }`}>
                      {asset.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}