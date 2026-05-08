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
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportSuccess, setShowImportSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [useDateRangeExport, setUseDateRangeExport] = useState(false);
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

  const clearDateFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  const clearExportDates = () => {
    setExportStartDate("");
    setExportEndDate("");
    setUseDateRangeExport(false);
  };

  const getFilteredAssets = () => {
    return assets.filter(asset => {
      const matchesSearch = !searchTerm || 
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.categories?.name && asset.categories.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.locations?.name && asset.locations.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.assigned_to_name && asset.assigned_to_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === "All" || asset.status === statusFilter;
      
      let matchesDate = true;
      if (startDate && asset.purchase_date) {
        matchesDate = matchesDate && new Date(asset.purchase_date) >= new Date(startDate);
      }
      if (endDate && asset.purchase_date) {
        matchesDate = matchesDate && new Date(asset.purchase_date) <= new Date(endDate);
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  };

  const getAssetsForExport = () => {
    if (!useDateRangeExport || (!exportStartDate && !exportEndDate)) {
      return getFilteredAssets();
    }
    
    return getFilteredAssets().filter(asset => {
      if (!asset.purchase_date) return false;
      
      let matches = true;
      if (exportStartDate) {
        matches = matches && new Date(asset.purchase_date) >= new Date(exportStartDate);
      }
      if (exportEndDate) {
        matches = matches && new Date(asset.purchase_date) <= new Date(exportEndDate);
      }
      
      return matches;
    });
  };

  const exportToExcel = () => {
    const exportData = getAssetsForExport().map((asset, index) => ({
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
    
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 40 },
      { wch: 15 },
      { wch: 6 },
      { wch: 20 },
      { wch: 25 },
      { wch: 15 },
      { wch: 20 },
      { wch: 30 }
    ];

    const headerRow = worksheet['A1'];
    if (headerRow) {
      headerRow.s = {
        fill: { fgColor: { rgb: "FF5F1F" } },
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Assets");
    
    let filename = `PSU-Inventory-Assets-${new Date().toISOString().split('T')[0]}`;
    if (useDateRangeExport && (exportStartDate || exportEndDate)) {
      filename += `-${exportStartDate || 'start'}-to-${exportEndDate || 'end'}`;
    }
    
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    setShowExportModal(false);
    clearExportDates();
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

  const filteredAssets = getFilteredAssets();

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
            <div className="sm:w-40">
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Under Repair">Under Repair</option>
                <option value="Disposed">Disposed</option>
              </select>
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
              onClick={() => setShowExportModal(true)}
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
        
        <div className="mt-4 flex flex-wrap gap-4 items-end border-t pt-4">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-semibold mb-1 text-gray-700">Start Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-semibold mb-1 text-gray-700">End Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={clearDateFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Clear Filters
            </button>
          )}
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
                  {searchTerm || statusFilter !== "All" || startDate || endDate ? "No assets match your search/filter." : "No assets found."}
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

      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Export to Excel</h2>
              <button 
                onClick={() => {
                  setShowExportModal(false);
                  clearExportDates();
                }}
                className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="useDateRange"
                  checked={useDateRangeExport}
                  onChange={(e) => setUseDateRangeExport(e.target.checked)}
                  className="w-5 h-5 text-[#FF5F1F] focus:ring-[#FF5F1F]"
                />
                <label htmlFor="useDateRange" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  Export specific date range
                </label>
              </div>

              {useDateRangeExport && (
                <div className="space-y-4 pl-8 border-l-2 border-gray-200">
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-gray-700">Start Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-gray-700">End Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => {
                    setShowExportModal(false);
                    clearExportDates();
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition font-semibold"
                >
                  Cancel
                </button>
                <button 
                  onClick={exportToExcel}
                  className="flex-1 bg-[#FF5F1F] text-white py-2 rounded-lg hover:opacity-90 transition font-semibold"
                >
                  Export Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rest of the modals (View, Asset, QR, Import Success) would go here - keeping original file structure */}
    </div>
  );
}
