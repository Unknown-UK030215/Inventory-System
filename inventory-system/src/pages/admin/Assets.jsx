import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabase";
import { useInventory } from "../../context/InventoryContext";
import { usePageTitle } from "../../layouts/AdminLayout";

export default function Assets() {
  const { assets, categories, locations, loading, error, refreshData } = useInventory();
  const { setPageTitle } = usePageTitle();
  
  useEffect(() => {
    setPageTitle("Assets Inventory");
  }, [setPageTitle]);

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportSuccess, setShowImportSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [assetFormData, setAssetFormData] = useState({
    name: "",
    category_id: "",
    location_id: "",
    status: "Active",
    serial: "",
    ref_id: "",
    assigned_to_name: "None",
    purchase_date: "",
    uacs_code: "",
    unit_cost: "",
    qty: 1,
    total_amount: "",
    remarks: ""
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
        ref_id: asset.ref_id || "",
        assigned_to_name: asset.assigned_to_name || "None",
        purchase_date: asset.purchase_date || "",
        uacs_code: asset.uacs_code || "",
        unit_cost: asset.unit_cost || "",
        qty: asset.qty || 1,
        total_amount: asset.total_amount || "",
        remarks: asset.remarks || ""
      });
    } else {
      setEditingAsset(null);
      setAssetFormData({
        name: "",
        category_id: "",
        location_id: "",
        status: "Active",
        serial: `SN-${Math.floor(1000 + Math.random() * 9000)}`,
        ref_id: "",
        assigned_to_name: "None",
        purchase_date: "",
        uacs_code: "",
        unit_cost: "",
        qty: 1,
        total_amount: "",
        remarks: ""
      });
    }
    setShowAssetModal(true);
  };

  const handleOpenViewModal = (asset) => {
    setSelectedAsset(asset);
    setShowViewModal(true);
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

  const exportToExcel = () => {
    const exportData = filteredAssets.map((asset, index) => ({
      "No.": index + 1,
      "Date Acquired": asset.purchase_date || "",
      "ICS NUMBER": asset.ref_id || "",
      "UACS CODE": asset.uacs_code || "",
      "DESCRIPTION": asset.name,
      "Unit Cost": asset.unit_cost || "",
      "QTY": asset.qty || 1,
      "PROPERTY NUMBER": asset.serial,
      "PERSON ACCOUNTABLE": asset.assigned_to_name || "",
      "Total Amount": asset.total_amount || (asset.unit_cost && asset.qty ? Number(asset.unit_cost) * (asset.qty || 1) : ""),
      "LOCATION": asset.locations?.name || "",
      "Remarks": asset.remarks || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Assets");
    
    XLSX.writeFile(workbook, `PSU-Inventory-Assets-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImporting(true);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        const importedAssets = [];
        const usedSerials = new Set();
        
        for (let i = 4; i < jsonData.length; i++) {
          const row = jsonData[i];
          const description = row[4];
          
          if (!description || !String(description).trim()) continue;
          
          let qty = row[6] ? parseInt(row[6], 10) : 1;
          if (isNaN(qty) || qty < 1) qty = 1;
          
          let categoryName = "Uncategorized";
          const descLower = String(description).toLowerCase();
          if (descLower.includes('laptop') || descLower.includes('computer')) {
            categoryName = "Laptop";
          } else if (descLower.includes('furniture') || descLower.includes('table') || descLower.includes('chair')) {
            categoryName = "Furniture";
          } else if (descLower.includes('aircon') || descLower.includes('conditioner') || descLower.includes('electronics')) {
            categoryName = "Electronics";
          }
          
          const category = categories.find(c => c.name === categoryName);
          
          let locationName = null;
          const locationValue = row[10];
          if (locationValue) {
            locationName = String(locationValue).trim();
          }
          
          let status = "Active";
          const remarks = row[11];
          if (remarks) {
            const remarksLower = String(remarks).toLowerCase();
            if (remarksLower.includes('unserviceable') || remarksLower.includes('disposed')) {
              status = "Disposed";
            } else if (remarksLower.includes('repair')) {
              status = "Under Repair";
            }
          }
          
          let purchaseDate = null;
          const dateAcquired = row[1];
          if (dateAcquired) {
            if (typeof dateAcquired === 'number') {
              purchaseDate = XLSX.SSF.parse_date_code(dateAcquired);
              if (purchaseDate) {
                purchaseDate = new Date(purchaseDate.y, purchaseDate.m - 1, purchaseDate.d).toISOString().split('T')[0];
              }
            } else if (typeof dateAcquired === 'string') {
              const parsed = new Date(dateAcquired);
              if (!isNaN(parsed.getTime())) {
                purchaseDate = parsed.toISOString().split('T')[0];
              }
            }
          }
          
          const baseSerial = row[7] || row[2];
          const uacsCode = row[3];
          let unitCost = row[5];
          let totalAmount = row[9];
          
          if (unitCost !== null && unitCost !== undefined) {
            const cleaned = String(unitCost).trim().replace(/[^0-9.-]/g, '');
            unitCost = cleaned ? parseFloat(cleaned) : null;
          } else {
            unitCost = null;
          }
          
          if (totalAmount !== null && totalAmount !== undefined) {
            const cleaned = String(totalAmount).trim().replace(/[^0-9.-]/g, '');
            totalAmount = cleaned ? parseFloat(cleaned) : null;
          } else {
            totalAmount = null;
          }
          
          const assetBase = {
            name: String(description).trim(),
            category_id: category?.id || null,
            ref_id: row[2] ? String(row[2]).trim() : null,
            status: status,
            assigned_to_name: row[8] ? String(row[8]).trim() : "None",
            purchase_date: purchaseDate,
            qty: qty,
            uacs_code: uacsCode ? String(uacsCode).trim() : null,
            unit_cost: unitCost,
            total_amount: totalAmount,
            remarks: remarks ? String(remarks).trim() : null
          };
          
          importedAssets.push({
            ...assetBase,
            locationName: locationName,
            serial: baseSerial ? String(baseSerial).trim() : null
          });
        }

        const locationNameToIdMap = new Map();
        locations.forEach(loc => locationNameToIdMap.set(loc.name, loc.id));

        const uniqueNewLocationNames = [...new Set(
          importedAssets.filter(a => a.locationName && !locationNameToIdMap.has(a.locationName)).map(a => a.locationName)
        )];

        if (uniqueNewLocationNames.length > 0) {
          const { data: insertedLocs, error: locInsertErr } = await supabase
            .from('locations')
            .insert(uniqueNewLocationNames.map(name => ({ name })))
            .select();
          if (!locInsertErr && insertedLocs) {
            insertedLocs.forEach(loc => {
              locationNameToIdMap.set(loc.name, loc.id);
            });
          }
        }

        const finalAssets = [];
        for (const asset of importedAssets) {
          const { locationName, serial, ...base } = asset;
          
          for (let j = 0; j < base.qty; j++) {
            let finalSerial = serial;
            if (!finalSerial) {
              finalSerial = `SN-${Math.floor(1000 + Math.random() * 9000)}`;
            } else if (base.qty > 1) {
              finalSerial = `${String(serial).trim()}-${j + 1}`;
            }
            
            let uniqueSerial = finalSerial;
            let counter = 1;
            while (usedSerials.has(uniqueSerial)) {
              uniqueSerial = `${finalSerial}-${counter}`;
              counter++;
            }
            usedSerials.add(uniqueSerial);
            
            finalAssets.push({
              ...base,
              serial: uniqueSerial,
              location_id: locationName ? locationNameToIdMap.get(locationName) : null
            });
          }
        }

        if (finalAssets.length > 0) {
          const { error } = await supabase.from('assets').insert(finalAssets);
          if (error) throw error;
          setImportedCount(finalAssets.length);
          setShowImportSuccess(true);
          refreshData();
        } else {
          alert("No valid assets found to import.");
        }
      } catch (err) {
        console.error("Import error details:", err);
        alert("Error importing Excel file: " + err.message);
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = !searchTerm || 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.categories?.name && asset.categories.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (asset.locations?.name && asset.locations.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (asset.assigned_to_name && asset.assigned_to_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  return (
    <div className="page-container">
      <div className="mb-4">
        <p className="text-gray-500 text-lg">Manage equipment and generate QR stickers</p>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search assets..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="w-full sm:w-auto bg-[#FF5F1F] text-white px-4 py-2 rounded-lg hover:opacity-90 transition shadow-sm font-semibold cursor-pointer text-center">
              {isImporting ? 'Importing...' : '📥 Import Excel'}
              <input 
                type="file" 
                accept=".xlsx,.xls" 
                onChange={handleImportExcel} 
                disabled={isImporting}
                className="hidden"
              />
            </label>
            <button 
              onClick={exportToExcel}
              className="w-full sm:w-auto bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition shadow-sm font-semibold"
            >
              📤 Export Excel
            </button>
            <button 
              onClick={() => handleOpenAssetModal()}
              className="w-full sm:w-auto bg-[#FF5F1F] text-white px-4 py-2 rounded-lg hover:opacity-90 transition shadow-sm font-semibold"
            >
              + Add New Asset
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
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
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="table-container">
          <table className="data-table w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">No.</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date Acquired</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ICS Number</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">UACS Code</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Unit Cost</th>
                <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">QTY</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Property Number</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Person Accountable</th>
                <th className="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total Amount</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Remarks</th>
                <th className="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
            {loading && assets.length === 0 ? (
              <tr>
                <td colSpan="14" className="text-center py-8 text-gray-500 font-medium">Loading assets...</td>
              </tr>
            ) : filteredAssets.length === 0 ? (
              <tr>
                <td colSpan="14" className="text-center py-8 text-gray-500 font-medium">
                  {searchTerm || statusFilter !== "All" ? "No assets match your search/filter." : "No assets found."}
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset, index) => (
                <tr key={asset.id} className="hover:bg-blue-50 transition-colors">
                  <td className="px-3 py-3 text-center text-gray-500 font-medium">{index + 1}</td>
                  <td className="px-3 py-3 text-sm text-gray-600">
                    {asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-3 py-3 text-gray-600 font-mono">
                    <div className="text-truncate" title={asset.ref_id || 'N/A'}>{asset.ref_id || 'N/A'}</div>
                  </td>
                  <td className="px-3 py-3 text-gray-600 font-mono">
                    <div className="text-truncate" title={asset.uacs_code || 'N/A'}>{asset.uacs_code || 'N/A'}</div>
                  </td>
                  <td className="px-3 py-3 font-medium text-gray-800">
                    <div className="text-truncate" title={asset.name}>{asset.name}</div>
                  </td>
                  <td className="px-3 py-3 text-right text-gray-600">
                    {asset.unit_cost ? `₱${Number(asset.unit_cost).toLocaleString()}` : 'N/A'}
                  </td>
                  <td className="px-3 py-3 text-center text-gray-600 font-medium">{asset.qty || 1}</td>
                  <td className="px-3 py-3 text-gray-600 font-mono">
                    <div className="text-truncate" title={asset.serial}>{asset.serial}</div>
                  </td>
                  <td className="px-3 py-3 text-gray-600">
                    <div className="text-truncate" title={asset.assigned_to_name || 'Unassigned'}>{asset.assigned_to_name || 'Unassigned'}</div>
                  </td>
                  <td className="px-3 py-3 text-right text-gray-600">
                    {asset.total_amount ? `₱${Number(asset.total_amount).toLocaleString()}` : (asset.unit_cost && asset.qty ? `₱${(Number(asset.unit_cost) * (asset.qty || 1)).toLocaleString()}` : 'N/A')}
                  </td>
                  <td className="px-3 py-3 text-gray-600">
                    <div className="text-truncate" title={asset.locations?.name || 'No Location'}>{asset.locations?.name || 'No Location'}</div>
                  </td>
                  <td className="px-3 py-3 text-gray-600">
                    <div className="text-truncate" title={asset.remarks || 'N/A'}>{asset.remarks || 'N/A'}</div>
                  </td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenViewModal(asset)}
                        className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-semibold transition"
                        title="View Asset"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => openQRModal(asset)}
                        className="px-3 py-1 bg-[#FF5F1F] text-white rounded-lg text-xs font-semibold transition hover:opacity-90"
                        title="Generate QR Code"
                      >
                        QR
                      </button>
                      <button 
                        onClick={() => handleOpenAssetModal(asset)}
                        className="px-3 py-1 text-[#FF5F1F] hover:bg-orange-50 rounded-lg text-xs font-semibold transition"
                        title="Edit Asset"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteAsset(asset.id)}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition"
                        title="Delete Asset"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>

      {showViewModal && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Asset Details</h2>
              <button 
                onClick={() => setShowViewModal(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Date Acquired</h3>
                  <p className="text-gray-700">{selectedAsset.purchase_date ? new Date(selectedAsset.purchase_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">ICS Number</h3>
                  <p className="text-gray-700 font-mono">{selectedAsset.ref_id || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">UACS Code</h3>
                  <p className="text-gray-700 font-mono">{selectedAsset.uacs_code || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</h3>
                  <p className="text-lg font-medium text-gray-800">{selectedAsset.name}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Unit Cost</h3>
                  <p className="text-gray-700">{selectedAsset.unit_cost ? `₱${Number(selectedAsset.unit_cost).toLocaleString()}` : 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">QTY</h3>
                  <p className="text-gray-700 font-medium">{selectedAsset.qty || 1}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Property Number</h3>
                  <p className="text-gray-700 font-mono">{selectedAsset.serial}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Person Accountable</h3>
                  <p className="text-gray-700">{selectedAsset.assigned_to_name || 'Unassigned'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Amount</h3>
                  <p className="text-gray-700 font-medium">
                    {selectedAsset.total_amount 
                      ? `₱${Number(selectedAsset.total_amount).toLocaleString()}` 
                      : (selectedAsset.unit_cost && selectedAsset.qty 
                          ? `₱${(Number(selectedAsset.unit_cost) * (selectedAsset.qty || 1)).toLocaleString()}` 
                          : 'N/A')}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Location</h3>
                  <p className="text-gray-700">{selectedAsset.locations?.name || 'No Location'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Category</h3>
                  <p className="text-gray-700">{selectedAsset.categories?.name || 'Uncategorized'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</h3>
                  <span className={`badge ${
                    selectedAsset.status === 'Active' ? 'badge-active' : 
                    selectedAsset.status === 'Disposed' ? 'badge-danger' : 'badge-pending'
                  }`}>
                    {selectedAsset.status}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Remarks</h3>
                  <p className="text-gray-700">{selectedAsset.remarks || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3 justify-end">
              <button 
                onClick={() => setShowViewModal(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  setShowViewModal(false);
                  handleOpenAssetModal(selectedAsset);
                }}
                className="px-6 py-2 bg-[#FF5F1F] text-white rounded-lg hover:opacity-90 transition font-semibold"
              >
                Edit Asset
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
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
                <label className="block text-sm font-semibold mb-1 text-gray-700">Description (Asset Name)</label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
                  value={assetFormData.name}
                  onChange={(e) => setAssetFormData({...assetFormData, name: e.target.value})}
                  placeholder='e.g. 2.5HP split type inverter airconditioning'
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Category</label>
                  <select
                    required
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
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
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
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
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Date Acquired</label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
                    value={assetFormData.purchase_date}
                    onChange={(e) => setAssetFormData({...assetFormData, purchase_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Status</label>
                  <select
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
                    value={assetFormData.status}
                    onChange={(e) => setAssetFormData({...assetFormData, status: e.target.value})}
                  >
                    <option value="Active">Active</option>
                    <option value="Under Repair">Under Repair</option>
                    <option value="Disposed">Disposed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">ICS Number</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
                    value={assetFormData.ref_id}
                    onChange={(e) => setAssetFormData({...assetFormData, ref_id: e.target.value})}
                    placeholder="e.g. ICT 21-004"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">UACS Code</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
                    value={assetFormData.uacs_code}
                    onChange={(e) => setAssetFormData({...assetFormData, uacs_code: e.target.value})}
                    placeholder="e.g. 10605020"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Property Number</label>
                  <input
                    type="text"
                    required
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none bg-gray-50"
                    value={assetFormData.serial}
                    onChange={(e) => setAssetFormData({...assetFormData, serial: e.target.value})}
                    placeholder="e.g. PSU ICT 164 21-167"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Person Accountable</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
                    value={assetFormData.assigned_to_name}
                    onChange={(e) => setAssetFormData({...assetFormData, assigned_to_name: e.target.value})}
                    placeholder="e.g. Banzuelo, Joyce M."
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Unit Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
                    value={assetFormData.unit_cost}
                    onChange={(e) => setAssetFormData({...assetFormData, unit_cost: e.target.value})}
                    placeholder="e.g. 74500.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">QTY</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
                    value={assetFormData.qty}
                    onChange={(e) => setAssetFormData({...assetFormData, qty: parseInt(e.target.value) || 1})}
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Total Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
                    value={assetFormData.total_amount}
                    onChange={(e) => setAssetFormData({...assetFormData, total_amount: e.target.value})}
                    placeholder="Leave blank to auto-calculate"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Remarks</label>
                <textarea
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
                  rows="2"
                  value={assetFormData.remarks}
                  onChange={(e) => setAssetFormData({...assetFormData, remarks: e.target.value})}
                  placeholder="e.g. Serviceable, Unserviceable, etc."
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
                  className="flex-1 bg-[#FF5F1F] text-white py-2 rounded hover:opacity-90 transition disabled:opacity-50"
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
                className="flex-1 bg-[#FF5F1F] text-white py-2 px-4 rounded hover:opacity-90 transition"
              >
                Print Sticker
              </button>
              <button 
                onClick={downloadQRCode}
                className="flex-1 bg-gray-700 text-white py-2 px-4 rounded hover:bg-gray-800 transition"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-5xl">✅</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Import Successful!</h2>
              <p className="text-gray-500 mb-6">
                Successfully imported <span className="font-bold text-blue-600 text-xl">{importedCount}</span> {importedCount === 1 ? 'asset' : 'assets'} into the inventory.
              </p>
              <button 
                onClick={() => setShowImportSuccess(false)}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition font-semibold text-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
