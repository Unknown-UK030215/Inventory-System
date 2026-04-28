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
        <h1 className="text-2xl font-bold">Disposed Assets</h1>
        <p className="text-gray-500">History of retired or disposed equipment</p>
      </div>

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
            {disposedAssets.map((asset) => (
              <tr key={asset.id}>
                <td className="font-medium">{asset.name}</td>
                <td>{asset.category}</td>
                <td className="text-sm text-gray-500 font-mono">{asset.serial}</td>
                <td>{asset.disposalDate}</td>
                <td>{asset.reason}</td>
                <td>
                  <span className="badge badge-danger">
                    {asset.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {disposedAssets.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed mt-6">
          <p className="text-gray-500">No disposed assets found in the records.</p>
        </div>
      )}
    </div>
  );
}