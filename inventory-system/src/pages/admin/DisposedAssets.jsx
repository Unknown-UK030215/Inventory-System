import { useInventory } from "../../context/InventoryContext";

export default function DisposedAssets() {
  const { assets, loading, error } = useInventory();
  const disposedAssets = assets.filter(a => a.status === 'Disposed');

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Disposed Assets</h1>
        <p className="text-gray-500">History of retired or disposed equipment</p>
      </div>

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
              <th>Serial</th>
              <th>Disposal Date</th>
              <th>Reason</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && disposedAssets.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500">Loading disposed assets...</td>
              </tr>
            ) : disposedAssets.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-500">No disposed assets found in the records.</td>
              </tr>
            ) : (
              disposedAssets.map((asset) => (
                <tr key={asset.id}>
                  <td className="font-medium">{asset.name}</td>
                  <td>{asset.categories?.name || 'Uncategorized'}</td>
                  <td className="text-sm text-gray-500 font-mono">{asset.serial}</td>
                  <td>{asset.disposal_date || asset.disposalDate || "N/A"}</td>
                  <td>{asset.disposal_reason || asset.reason || "N/A"}</td>
                  <td>
                    <span className="badge badge-danger">
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