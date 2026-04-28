import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function Assets() {
  const [assets, setAssets] = useState([
    { id: 1, name: "Laptop Dell XPS", category: "Electronics", status: "Active", serial: "DELL-1234", assignedTo: "John Doe" },
    { id: 2, name: "Monitor HP 24\"", category: "Electronics", status: "Active", serial: "HP-5678", assignedTo: "Jane Smith" },
    { id: 3, name: "Office Chair", category: "Furniture", status: "Under Repair", serial: "CHAIR-9012", assignedTo: "None" },
    { id: 4, name: "MacBook Pro", category: "Electronics", status: "Disposed", serial: "MAC-4321", assignedTo: "None" },
  ]);

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [assetFormData, setAssetFormData] = useState({
    name: "",
    category: "",
    status: "Active",
    serial: "",
    assignedTo: "None"
  });

  const handleOpenAssetModal = (asset = null) => {
    if (asset) {
      setEditingAsset(asset);
      setAssetFormData({
        name: asset.name,
        category: asset.category,
        status: asset.status,
        serial: asset.serial,
        assignedTo: asset.assignedTo
      });
    } else {
      setEditingAsset(null);
      setAssetFormData({
        name: "",
        category: "",
        status: "Active",
        serial: `SN-${Math.floor(1000 + Math.random() * 9000)}`,
        assignedTo: "None"
      });
    }
    setShowAssetModal(true);
  };

  const handleAssetSubmit = (e) => {
    e.preventDefault();
    if (editingAsset) {
      setAssets(assets.map(a => a.id === editingAsset.id ? { ...a, ...assetFormData } : a));
    } else {
      const newAsset = {
        id: assets.length + 1,
        ...assetFormData
      };
      setAssets([...assets, newAsset]);
    }
    setShowAssetModal(false);
  };

  const handleDeleteAsset = (id) => {
    if (window.confirm("Are you sure you want to delete this asset?")) {
      setAssets(assets.filter(a => a.id !== id));
    }
  };

  const openQRModal = (asset) => {
    setSelectedAsset(asset);
    setShowQRModal(true);
  };

  const closeQRModal = () => {
    setShowQRModal(false);
    setSelectedAsset(null);
  };

  const printQRCode = () => {
    const printWindow = window.open("", "_blank");
    const qrImage = document.getElementById("qr-code-canvas").toDataURL("image/png");
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${selectedAsset.serial}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .sticker {
              border: 2px dashed #ccc;
              padding: 20px;
              text-align: center;
              width: 250px;
            }
            .sticker h3 {
              margin: 10px 0 5px 0;
              font-size: 14px;
            }
            .sticker p {
              margin: 0;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="sticker">
            <img src="${qrImage}" width="150" height="150" alt="QR Code" />
            <h3>${selectedAsset.name}</h3>
            <p>S/N: ${selectedAsset.serial}</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById("qr-code-canvas");
    const link = document.createElement("a");
    link.download = `QR-${selectedAsset.serial}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Assets</h1>
        <button 
          onClick={() => handleOpenAssetModal()}
          className="btn-primary"
        >
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
                  <button 
                    onClick={() => openQRModal(asset)}
                    className="text-green-600 hover:underline mr-3 text-sm"
                  >
                    QR Code
                  </button>
                  <button 
                    onClick={() => handleOpenAssetModal(asset)}
                    className="text-blue-600 hover:underline mr-3 text-sm"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteAsset(asset.id)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAssetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingAsset ? "Edit Asset" : "Add New Asset"}</h2>
              <button onClick={() => setShowAssetModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>

            <form onSubmit={handleAssetSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Asset Name</label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={assetFormData.name}
                  onChange={(e) => setAssetFormData({...assetFormData, name: e.target.value})}
                  placeholder='e.g. MacBook Pro 16"'
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Category</label>
                  <select
                    required
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={assetFormData.category}
                    onChange={(e) => setAssetFormData({...assetFormData, category: e.target.value})}
                  >
                    <option value="">Select</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Office Supplies">Office Supplies</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Status</label>
                  <select
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={assetFormData.status}
                    onChange={(e) => setAssetFormData({...assetFormData, status: e.target.value})}
                  >
                    <option value="Active">Active</option>
                    <option value="Under Repair">Under Repair</option>
                    <option value="Disposed">Disposed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Serial Number</label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                  value={assetFormData.serial}
                  onChange={(e) => setAssetFormData({...assetFormData, serial: e.target.value})}
                  placeholder="S/N-12345"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Assigned To</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={assetFormData.assignedTo}
                  onChange={(e) => setAssetFormData({...assetFormData, assignedTo: e.target.value})}
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAssetModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                >
                  {editingAsset ? "Update Asset" : "Save Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQRModal && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">QR Code for {selectedAsset.name}</h2>
              <button 
                onClick={closeQRModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="flex flex-col items-center mb-6">
              <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg">
                <QRCodeCanvas 
                  id="qr-code-canvas"
                  value={selectedAsset.serial}
                  size={180}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="mt-3 text-sm text-gray-600">
                Serial Number: <span className="font-mono font-semibold">{selectedAsset.serial}</span>
              </p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={printQRCode}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
              >
                Print Sticker
              </button>
              <button 
                onClick={downloadQRCode}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}