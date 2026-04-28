import { useState } from "react";

export default function Assets() {
  const [assets] = useState([
    { id: 1, name: "Laptop Dell XPS", category: "Electronics", status: "Active", serial: "DELL-1234", assignedTo: "John Doe" },
    { id: 2, name: "Monitor HP 24\"", category: "Electronics", status: "Active", serial: "HP-5678", assignedTo: "Jane Smith" },
    { id: 3, name: "Office Chair", category: "Furniture", status: "Under Repair", serial: "CHAIR-9012", assignedTo: "None" },
    { id: 4, name: "MacBook Pro", category: "Electronics", status: "Disposed", serial: "MAC-4321", assignedTo: "None" },
  ]);

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Assets</h1>
        <button className="btn-primary">
          + Add New Asset
        </button>
      </div>
      
      <div className="card overflow-hidden p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th>Asset Name</th>
              <th>Category</th>
              <th>Serial</th>
              <th>Assigned To</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id}>
                <td className="font-medium">{asset.name}</td>
                <td>{asset.category}</td>
                <td className="text-sm text-gray-500">{asset.serial}</td>
                <td>{asset.assignedTo}</td>
                <td>
                  <span className={`badge ${
                    asset.status === 'Active' ? 'badge-active' : 
                    asset.status === 'Disposed' ? 'badge-danger' : 'badge-pending'
                  }`}>
                    {asset.status}
                  </span>
                </td>
                <td>
                  <button className="text-blue-600 hover:underline mr-3 text-sm">Edit</button>
                  <button className="text-red-600 hover:underline text-sm">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}