import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function Assets() {
  const [assets, setAssets] = useState([
    { id: 1, name: "MacBook Pro 16", category: "Laptop", status: "Active", serial: "MAC-7890", assignedTo: "John Doe" },
    { id: 2, name: "Dell Latitude 5420", category: "Laptop", status: "Active", serial: "DELL-4432", assignedTo: "Jane Smith" },
    { id: 3, name: "Industrial Floor Fan", category: "Fan", status: "Active", serial: "FAN-1122", assignedTo: "Room 101" },
    { id: 4, name: "Ergonomic Office Chair", category: "Chair", status: "Under Repair", serial: "CHR-5566", assignedTo: "Unassigned" },
    { id: 5, name: "Epson Projector X41", category: "Projector", status: "Active", serial: "EPS-9911", assignedTo: "Conference Room" },
    { id: 6, name: "Steel Filing Cabinet", category: "Furniture", status: "Active", serial: "CAB-3344", assignedTo: "Accounting" },
    { id: 7, name: "Standing Desk", category: "Furniture", status: "Active", serial: "DSK-2233", assignedTo: "John Doe" },
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Assets Inventory</h1>
          <p className="text-gray-500 text-sm">Manage equipment and generate QR stickers</p>
        </div>
        <button 
          onClick={() => handleOpenAssetModal()}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm font-semibold"
        >
          + Add New Asset
        </button>
      </div>
      
      <div className="card overflow-hidden p-0 border-0 shadow-sm rounded-xl">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Asset Name</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Serial</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
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
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button 
                    onClick={() => openQRModal(asset)}
                    className="text-green-600 hover:text-green-800 mr-3 text-sm font-medium"
                  >
                    QR Code
                  </button>
                  <button 
                    onClick={() => handleOpenAssetModal(asset)}
                    className="text-blue-600 hover:text-blue-800 mr-3 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteAsset(asset.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

      {showAssetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">{editingAsset ? "Edit Asset" : "Add New Asset"}</h2>
              <button onClick={() => setShowAssetModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl transition-colors">×</button>
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
                    <option value="Laptop">Laptop</option>
                    <option value="Fan">Fan</option>
                    <option value="Chair">Chair</option>
                    <option value="Projector">Projector</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Other">Other</option>
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

      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">QR Sticker</h2>
                <button onClick={closeQRModal} className="text-gray-400 hover:text-gray-600 text-2xl transition-colors">×</button>
              </div>
              
              <div className="flex flex-col items-center bg-gray-50 p-8 rounded-xl border-2 border-dashed border-gray-200 mb-6">
                <QRCodeCanvas 
                  id="qr-code-canvas"
                  value={selectedAsset?.serial} 
                  size={180}
                  level="H"
                  includeMargin={true}
                />
                <div className="mt-4 text-center">
                  <p className="font-bold text-gray-900 text-lg uppercase tracking-widest">{selectedAsset?.serial}</p>
                  <p className="text-xs text-gray-500 font-medium uppercase mt-1 tracking-tighter">{selectedAsset?.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={printQRCode}
                  className="bg-blue-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <span>🖨️</span> Print
                </button>
                <button 
                  onClick={downloadQRCode}
                  className="bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  <span>💾</span> Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}