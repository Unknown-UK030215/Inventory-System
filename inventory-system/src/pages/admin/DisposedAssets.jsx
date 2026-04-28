import { useState } from "react";

export default function DisposedAssets() {
  const [disposedAssets] = useState([
    { id: 4, name: "MacBook Pro", category: "Electronics", status: "Disposed", serial: "MAC-4321", disposalDate: "2024-03-15", reason: "Hardware Failure" },
    { id: 10, name: "Office Desk", category: "Furniture", status: "Disposed", serial: "DESK-002", disposalDate: "2024-02-20", reason: "Damaged" },
    { id: 15, name: "Projector Epson", category: "Electronics", status: "Disposed", serial: "EPS-991", disposalDate: "2024-01-10", reason: "Obsolete" },
  ]);

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Disposed Assets</h1>
        <p className="text-gray-500 text-sm">History of retired or disposed equipment</p>
      </div>

      <div className="card overflow-hidden p-0 border-0 shadow-sm rounded-xl">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Asset Name</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Serial</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Disposal Date</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {disposedAssets.map((asset) => (
                <tr key={asset.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{asset.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{asset.category}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">{asset.serial}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{asset.disposalDate}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{asset.reason}</td>
                  <td className="px-4 py-3">
                    <span className="badge badge-danger">
                      {asset.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {disposedAssets.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed mt-6">
          <p className="text-gray-500">No disposed assets found in the records.</p>
        </div>
      )}
    </div>
  );
}