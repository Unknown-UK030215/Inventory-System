import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "../../lib/supabase";
import { useInventory } from "../../context/InventoryContext";

export default function Assets() {
  const { assets, categories, locations, loading, error, refreshData } = useInventory();
  
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assetFormData, setAssetFormData] = useState({
    name: "",
    category_id: "",
    location_id: "",
    status: "Active",
    serial: "",
    assigned_to_name: "None"
  });

  const handleOpenAssetModal = (asset = null) => {
    if (asset) {
      setEditingAsset(asset);
      setAssetFormData({
        name: asset.name,
        category_id: asset.category_id,
        location_id: asset.location_id,
        status: asset.status,
        serial: asset.serial,
        assigned_to_name: asset.assigned_to_name || "None"
      });
    } else {
      setEditingAsset(null);
      setAssetFormData({
        name: "",
        category_id: "",
        location_id: "",
        status: "Active",
        serial: `SN-${Math.floor(1000 + Math.random() * 9000)}`,
        assigned_to_name: "None"
      });
    }
    setShowAssetModal(true);
  };

  const handleAssetSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!supabase) throw new Error("Database not connected.");

      if (editingAsset) {
        const { error: updateError } = await supabase
          .from('assets')
          .update(assetFormData)
          .eq('id', editingAsset.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('assets')
          .insert([assetFormData]);

        if (insertError) throw insertError;
      }
      
      // Data will be updated automatically via RLS/Subscription in Context
      setShowAssetModal(false);
    } catch (err) {
      alert("Error saving asset: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAsset = async (id) => {
    if (window.confirm("Are you sure you want to delete this asset?")) {
      try {
        if (!supabase) throw new Error("Database not connected.");
        const { error: deleteError } = await supabase
          .from('assets')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;
      } catch (err) {
        alert("Error deleting asset: " + err.message);
      }
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
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
          <p className="font-bold">Error loading data:</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => refreshData()} 
            className="mt-2 text-xs bg-red-700 text-white px-2 py-1 rounded hover:bg-red-800"
          >
            Retry
          </button>
        </div>
      )}
      
      <div className="card overflow-hidden p-0 border-0 shadow-sm rounded-xl">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Asset Name</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Serial</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
            {loading && assets.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-8 text-gray-500 font-medium">Loading assets...</td>
              </tr>
            ) : assets.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-8 text-gray-500 font-medium">No assets found.</td>
              </tr>
            ) : (
              assets.map((asset) => (
                <tr key={asset.id}>
                  <td className="font-medium">{asset.name}</td>
                  <td>{asset.categories?.name || 'Uncategorized'}</td>
                  <td>{asset.locations?.name || 'No Location'}</td>
                  <td className="text-sm text-gray-500">{asset.serial}</td>
                  <td>{asset.assigned_to_name || 'Unassigned'}</td>
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>

      {showAssetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingAsset ? "Edit Asset" : "Add New Asset"}</h2>
              <button onClick={() => setShowAssetModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>

            {error && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 text-sm rounded">
                {error}
              </div>
            )}

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
                    value={assetFormData.category_id}
                    onChange={(e) => setAssetFormData({...assetFormData, category_id: e.target.value})}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Location</label>
                  <select
                    required
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={assetFormData.location_id}
                    onChange={(e) => setAssetFormData({...assetFormData, location_id: e.target.value})}
                  >
                    <option value="">Select Location</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <label className="block text-sm font-semibold mb-1 text-gray-700">Assigned To</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={assetFormData.assigned_to_name}
                  onChange={(e) => setAssetFormData({...assetFormData, assigned_to_name: e.target.value})}
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
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : (editingAsset ? "Update Asset" : "Save Asset")}
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
