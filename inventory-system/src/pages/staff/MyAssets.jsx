import { useState } from "react";

export default function MyAssets() {
  const [assets] = useState([
    { id: 1, name: "Laptop Dell XPS", category: "Electronics", status: "Active", serial: "DELL-1234" },
    { id: 2, name: "Monitor HP 24\"", category: "Electronics", status: "Active", serial: "HP-5678" },
    { id: 3, name: "Office Chair", category: "Furniture", status: "Under Repair", serial: "CHAIR-9012" },
  ]);

  return (
    <div className="page-container">
      <h1 className="text-2xl font-bold mb-6">My Assigned Assets</h1>
      
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
            {assets.map((asset) => (
              <tr key={asset.id}>
                <td>{asset.name}</td>
                <td>{asset.category}</td>
                <td className="text-sm text-gray-500">{asset.serial}</td>
                <td>
                  <span className={`badge ${
                    asset.status === 'Active' ? 'badge-active' : 'badge-pending'
                  }`}>
                    {asset.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}