import { useEffect } from "react";
import { useInventory } from "../../context/InventoryContext";
import { usePageTitle } from "../../layouts/AdminLayout";

export default function DisposedAssets() {
  const { disposed, loading, error } = useInventory();
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle("Disposed Assets");
  }, [setPageTitle]);

  return (
    <div className="page-container">
      <div className="mb-4">
        <p className="text-gray-500 text-lg">History of retired or disposed equipment</p>
      </div>
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="table-container">
          <table className="data-table w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Asset Name</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Serial</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Disposal Date</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading && disposed.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500 font-medium">Loading disposed assets...</td>
                </tr>
              ) : disposed.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500 font-medium">No disposed assets found in the records.</td>
                </tr>
              ) : (
                disposed.map((asset) => (
                  <tr key={asset.id} className="hover:bg-blue-50 transition-colors">
                    <td className="font-medium text-gray-800">
                      <div className="text-truncate" title={asset.name}>{asset.name}</div>
                    </td>
                    <td className="text-gray-600">
                      <div className="text-truncate" title={asset.categories?.name || 'Uncategorized'}>{asset.categories?.name || 'Uncategorized'}</div>
                    </td>
                    <td className="text-gray-600 font-mono">
                      <div className="text-truncate" title={asset.serial}>{asset.serial}</div>
                    </td>
                    <td className="text-sm text-gray-500">
                      {asset.disposal_date ? new Date(asset.disposal_date).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="text-gray-600">
                      <div className="text-truncate" title={asset.disposal_reason || "N/A"}>{asset.disposal_reason || "N/A"}</div>
                    </td>
                    <td>
                      <span className="badge badge-danger">
                        Disposed
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