import { useState } from "react";

export default function MyAssets() {
  const [assets] = useState([
    { id: 1, name: "Laptop Dell XPS", category: "Electronics", status: "Active", serial: "DELL-1234" },
    { id: 2, name: "Monitor HP 24\"", category: "Electronics", status: "Active", serial: "HP-5678" },
    { id: 3, name: "Office Chair", category: "Furniture", status: "Under Repair", serial: "CHAIR-9012" },
  ]);

  return (
    <div className="page-container px-4 sm:px-6">
      <div className="mb-6 text-center sm:text-left">
        <h1 className="text-2xl font-bold text-gray-800">My Assigned Assets</h1>
        <p className="text-gray-500 text-sm mt-1">Inventory of equipment currently assigned to you</p>
      </div>
      
      <div className="card overflow-hidden p-0 border-0 shadow-sm rounded-xl">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Asset Name</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Serial Number</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{asset.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{asset.category}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">{asset.serial}</td>
                  <td className="px-4 py-3">
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
    </div>
  );
}