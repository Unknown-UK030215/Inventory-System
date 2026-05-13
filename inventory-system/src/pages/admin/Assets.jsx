import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabase";
import { useInventory } from "../../context/InventoryContext";
import { usePageTitle } from "../../layouts/AdminLayout";

export default function Assets() {
  const { assets, categories, locations, deletedAssets, loading, error, refreshData } = useInventory();
  const { setPageTitle } = usePageTitle();
  
  useEffect(() => {
    setPageTitle("Assets Inventory");
  }, [setPageTitle]);

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportSuccess, setShowImportSuccess] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [useDateRangeExport, setUseDateRangeExport] = useState(false);
  const [addMode, setAddMode] = useState("manual"); // "manual" or "smart"
  const [smartSerial, setSmartSerial] = useState("");
  const [isSmartLoading, setIsSmartLoading] = useState(false);

  const handleSmartSearch = () => {
    if (!smartSerial) return;
    setIsSmartLoading(true);
    
    // Simulate lookup/logic
    setTimeout(() => {
      const { 
        name: guessedName, 
        categoryName: guessedCategoryName,
        uacsCode: guessedUacsCode
      } = guessAssetInfoFromSerial(smartSerial);

      const category = categories.find(c => c.name === guessedCategoryName);
      const defaultLocation = locations.length > 0 ? locations[0].id : null;

      setAssetFormData({
        name: guessedName,
        category_id: category?.id || null,
        location_id: defaultLocation,
        status: "Active",
        serial: smartSerial,
        ref_id: "",
        assigned_to_name: "None",
        purchase_date: "",
        uacs_code: guessedUacsCode || "10605020",
        unit_cost: "",
        qty: 1,
        total_amount: "",
        remarks: "",
        warranty_expiry: "",
        last_maintenance: "",
        next_maintenance: "",
        brand: "",
        model_number: ""
      });
      
      setAddMode("manual");
      setIsSmartLoading(false);
    }, 800);
  };

  const sendNotification = async (title, message, type = 'info') => {
    try {
      await supabase.from('notifications').insert({
        title,
        message,
        type,
        target_role: 'admin'
      });
    } catch (err) {
      console.error("Notification failed:", err);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAssets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAssets.map(a => a.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Update status to "${newStatus}" for ${selectedIds.length} assets?`)) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('assets')
        .update({ status: newStatus })
        .in('id', selectedIds);

      if (error) throw error;
      
      await sendNotification(
        'Bulk Status Update', 
        `${selectedIds.length} assets updated to ${newStatus}.`, 
        'success'
      );

      setSelectedIds([]);
      refreshData();
    } catch (err) {
      alert("Error updating assets: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
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
    remarks: "",
    warranty_expiry: "",
    last_maintenance: "",
    next_maintenance: "",
    brand: "",
    model_number: ""
  });

  const guessAssetInfoFromSerial = (serial) => {
    let guessedName = "General Equipment";
    let guessedCategoryName = "Electronics";
    let guessedLocation = "";
    let guessedStatus = "Active";
    let guessedUacsCode = "10605020";
    
    if (!serial) return { 
      name: guessedName, 
      categoryName: guessedCategoryName,
      location: guessedLocation,
      status: guessedStatus,
      uacsCode: guessedUacsCode
    };

    const serialUpper = serial.toUpperCase();

    // First check for brand keywords (Acer, Dell, HP, etc.)
    if (serialUpper.includes('ACER') || serialUpper.includes('NXK')) {
      guessedName = "Acer Laptop";
      guessedCategoryName = "Electronics";
      guessedUacsCode = "10605020";
    } else if (serialUpper.includes('DELL')) {
      guessedName = "Dell Laptop";
      guessedCategoryName = "Electronics";
      guessedUacsCode = "10605020";
    } else if (serialUpper.includes('HP') || serialUpper.includes('HEWLETT')) {
      guessedName = "HP Laptop";
      guessedCategoryName = "Electronics";
      guessedUacsCode = "10605020";
    } else if (serialUpper.includes('LENOVO')) {
      guessedName = "Lenovo Laptop";
      guessedCategoryName = "Electronics";
      guessedUacsCode = "10605020";
    } else if (serialUpper.includes('ASUS')) {
      guessedName = "ASUS Laptop";
      guessedCategoryName = "Electronics";
      guessedUacsCode = "10605020";
    } else if (serialUpper.includes('MAC') || serialUpper.includes('APPLE')) {
      guessedName = "MacBook Pro";
      guessedCategoryName = "Electronics";
      guessedUacsCode = "10605020";
    } else {
      // Prefix-based guessing
      const prefixMap = {
        'DSK': { name: 'Desktop Computer', category: 'Electronics', uacs: '10605020' },
        'LAP': { name: 'Laptop', category: 'Electronics', uacs: '10605020' },
        'MON': { name: 'Monitor', category: 'Electronics', uacs: '10605020' },
        'CHR': { name: 'Office Chair', category: 'Furniture', uacs: '10605010' },
        'TAB': { name: 'Tablet', category: 'Electronics', uacs: '10605020' },
        'PHN': { name: 'Smartphone', category: 'Electronics', uacs: '10605020' },
        'PRN': { name: 'Printer', category: 'Electronics', uacs: '10605020' },
        'CAM': { name: 'Camera', category: 'Electronics', uacs: '10605020' },
        'PROJ': { name: 'Projector', category: 'Electronics', uacs: '10605020' },
        'AIR': { name: 'Air Conditioning Unit', category: 'Electronics', uacs: '10605030' },
        'AC': { name: 'Air Conditioner', category: 'Electronics', uacs: '10605030' },
        'ICT': { name: 'ICT Equipment', category: 'Electronics', uacs: '10605020' },
        'TBL': { name: 'Office Table', category: 'Furniture', uacs: '10605010' },
        'TABLE': { name: 'Office Table', category: 'Furniture', uacs: '10605010' },
        'FURN': { name: 'Office Furniture', category: 'Furniture', uacs: '10605010' },
        'NX': { name: 'Acer Laptop', category: 'Electronics', uacs: '10605020' },
        'NXK': { name: 'Acer Laptop', category: 'Electronics', uacs: '10605020' },
        'NXKS': { name: 'Acer Laptop', category: 'Electronics', uacs: '10605020' },
        'SP': { name: 'Special Equipment', category: 'Electronics', uacs: '10605020' }
      };
      
      for (const [prefix, info] of Object.entries(prefixMap)) {
        if (serialUpper.startsWith(prefix) || serialUpper.includes(prefix)) {
          guessedName = info.name;
          guessedCategoryName = info.category;
          guessedUacsCode = info.uacs;
          break;
        }
      }
    }

    return { 
      name: guessedName, 
      categoryName: guessedCategoryName,
      location: guessedLocation,
      status: guessedStatus,
      uacsCode: guessedUacsCode
    };
  };

  const handleSerialChange = async (e) => {
    const newSerial = e.target.value;
    setAssetFormData(prev => ({ ...prev, serial: newSerial }));

    if (editingAsset) return;

    const existingAsset = assets.find(a => a.serial === newSerial);
    if (existingAsset) {
      console.log("Found existing asset, auto-filling all fields");
      setAssetFormData({
        name: existingAsset.name,
        category_id: existingAsset.category_id || null,
        location_id: existingAsset.location_id || null,
        status: existingAsset.status,
        serial: existingAsset.serial,
        ref_id: existingAsset.ref_id || null,
        assigned_to_name: existingAsset.assigned_to_name || "None",
        purchase_date: existingAsset.purchase_date || null,
        uacs_code: existingAsset.uacs_code || null,
        unit_cost: existingAsset.unit_cost || null,
        qty: existingAsset.qty || 1,
        total_amount: existingAsset.total_amount || null,
        remarks: existingAsset.remarks || null
      });
      return;
    }

    const { 
      name: guessedName, 
      categoryName: guessedCategoryName,
      uacsCode: guessedUacsCode
    } = guessAssetInfoFromSerial(newSerial);
    const category = categories.find(c => c.name === guessedCategoryName);
    const defaultLocation = locations.length > 0 ? locations[0].id : null;
    
    setAssetFormData(prev => ({
      ...prev,
      name: guessedName,
      category_id: category?.id || null,
      location_id: defaultLocation,
      uacs_code: guessedUacsCode || null,
      status: "Active",
      qty: 1,
      assigned_to_name: "None"
    }));
  };

  const handleOpenAssetModal = (asset = null) => {
    setAddMode("manual");
    setSmartSerial("");
    if (asset) {
      setEditingAsset(asset);
      setAssetFormData({
        name: asset.name,
        category_id: asset.category_id || null,
        location_id: asset.location_id || null,
        status: asset.status,
        serial: asset.serial,
        ref_id: asset.ref_id || null,
        assigned_to_name: asset.assigned_to_name || "None",
        purchase_date: asset.purchase_date || null,
        uacs_code: asset.uacs_code || null,
        unit_cost: asset.unit_cost || null,
        qty: asset.qty || 1,
        total_amount: asset.total_amount || null,
        remarks: asset.remarks || null,
        warranty_expiry: asset.warranty_expiry || null,
        last_maintenance: asset.last_maintenance || null,
        next_maintenance: asset.next_maintenance || null,
        brand: asset.brand || "",
        model_number: asset.model_number || ""
      });
    } else {
      setEditingAsset(null);
      setAssetFormData({
        name: "",
        category_id: null,
        location_id: null,
        status: "Active",
        serial: `SN-${Math.floor(1000 + Math.random() * 9000)}`,
        ref_id: null,
        assigned_to_name: "None",
        purchase_date: null,
        uacs_code: null,
        unit_cost: null,
        qty: 1,
        total_amount: null,
        remarks: null,
        warranty_expiry: null,
        last_maintenance: null,
        next_maintenance: null,
        brand: "",
        model_number: ""
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

      // Helper function to convert empty strings to null
      const sanitizeField = (value) => {
        if (value === "" || value === undefined) return null;
        return value;
      };

      // If it's a new asset, auto-fill all missing details!
      let finalAssetData = { ...assetFormData };
      
      if (!editingAsset) {
        // First, check if serial already exists to auto-fill
        const existingAsset = assets.find(a => a.serial === finalAssetData.serial);
        if (existingAsset) {
          finalAssetData = {
            ...finalAssetData,
            name: existingAsset.name || finalAssetData.name || "General Equipment",
            category_id: existingAsset.category_id || finalAssetData.category_id || (categories.length > 0 ? categories[0].id : null),
            location_id: existingAsset.location_id || finalAssetData.location_id || (locations.length > 0 ? locations[0].id : null),
            status: existingAsset.status || "Active",
            ref_id: existingAsset.ref_id || finalAssetData.ref_id || null,
            assigned_to_name: existingAsset.assigned_to_name || finalAssetData.assigned_to_name || "None",
            purchase_date: existingAsset.purchase_date || finalAssetData.purchase_date || null,
            uacs_code: existingAsset.uacs_code || finalAssetData.uacs_code || "10605020",
            unit_cost: existingAsset.unit_cost || finalAssetData.unit_cost || null,
            qty: existingAsset.qty || finalAssetData.qty || 1,
            total_amount: existingAsset.total_amount || finalAssetData.total_amount || null,
            remarks: existingAsset.remarks || finalAssetData.remarks || null
          };
        } else {
          // If no existing asset, guess from serial prefix!
          const { 
            name: guessedName, 
            categoryName: guessedCategoryName, 
            uacsCode: guessedUacsCode 
          } = guessAssetInfoFromSerial(finalAssetData.serial);
          
          let category = categories.find(c => c.name === guessedCategoryName);
          if (!category && categories.length > 0) {
            category = categories[0];
          }
          
          const defaultLocation = locations.length > 0 ? locations[0].id : null;
          
          finalAssetData = {
            ...finalAssetData,
            name: finalAssetData.name || guessedName || "General Equipment",
            category_id: finalAssetData.category_id || category?.id || (categories.length > 0 ? categories[0].id : null),
            location_id: finalAssetData.location_id || defaultLocation,
            status: finalAssetData.status || "Active",
            assigned_to_name: finalAssetData.assigned_to_name || "None",
            qty: finalAssetData.qty || 1,
            uacs_code: finalAssetData.uacs_code || guessedUacsCode || "10605020",
            ref_id: finalAssetData.ref_id || null,
            purchase_date: finalAssetData.purchase_date || null,
            unit_cost: finalAssetData.unit_cost || null,
            total_amount: finalAssetData.total_amount || null,
            remarks: finalAssetData.remarks || null
          };
        }
      } else {
        // For editing, also ensure all fields are filled
        finalAssetData = {
          ...finalAssetData,
          name: finalAssetData.name || "General Equipment",
          category_id: finalAssetData.category_id || (categories.length > 0 ? categories[0].id : null),
          location_id: finalAssetData.location_id || (locations.length > 0 ? locations[0].id : null),
          status: finalAssetData.status || "Active",
          assigned_to_name: finalAssetData.assigned_to_name || "None",
          qty: finalAssetData.qty || 1,
          uacs_code: finalAssetData.uacs_code || "10605020",
          ref_id: sanitizeField(finalAssetData.ref_id),
          purchase_date: sanitizeField(finalAssetData.purchase_date),
          unit_cost: sanitizeField(finalAssetData.unit_cost),
          total_amount: sanitizeField(finalAssetData.total_amount),
          remarks: sanitizeField(finalAssetData.remarks),
          warranty_expiry: sanitizeField(assetFormData.warranty_expiry),
          last_maintenance: sanitizeField(assetFormData.last_maintenance),
          next_maintenance: sanitizeField(assetFormData.next_maintenance),
          brand: sanitizeField(assetFormData.brand),
          model_number: sanitizeField(assetFormData.model_number)
        };
      }

      console.log("Final asset data to save:", finalAssetData);

      if (editingAsset) {
        const { error: updateError } = await supabase
          .from('assets')
          .update(finalAssetData)
          .eq('id', editingAsset.id);

        if (updateError) throw updateError;
        await sendNotification('Asset Updated', `Asset "${finalAssetData.name}" was modified.`, 'info');
      } else {
        const { data: insertedData, error: insertError } = await supabase
          .from('assets')
          .insert([finalAssetData])
          .select()
          .single();

        if (insertError) throw insertError;
        if (insertedData) await sendNotification('New Asset Created', `Asset "${finalAssetData.name}" added to inventory.`, 'success');
      }
      
      setShowAssetModal(false);
      refreshData();
    } catch (err) {
      console.error("Error saving asset details:", err);
      alert("Error saving asset: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAsset = async (id) => {
    const assetToDelete = assets.find(a => a.id === id);
    if (!assetToDelete) return;

    if (window.confirm(`Are you sure you want to delete "${assetToDelete.name}"? It will be moved to the Recycle Bin.`)) {
      try {
        if (!supabase) throw new Error("Database not connected.");
        
        const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');

        // 1. Move to deleted_assets
        const { error: moveError } = await supabase
          .from('deleted_assets')
          .insert([{
            original_id: assetToDelete.id,
            name: assetToDelete.name,
            serial: assetToDelete.serial,
            category_id: assetToDelete.category_id,
            location_id: assetToDelete.location_id,
            asset_data: assetToDelete,
            deleted_by: adminUser.name || 'Admin'
          }]);

        if (moveError) throw moveError;

        // 2. Delete from assets
        const { error: deleteError } = await supabase
          .from('assets')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;
        
        await sendNotification('Asset Deleted', `Asset "${assetToDelete.name}" was moved to Recycle Bin.`, 'warning');
        
        refreshData();
      } catch (err) {
        alert("Error moving to Recycle Bin: " + err.message);
      }
    }
  };

  const handleRestoreAsset = async (deletedAsset) => {
    if (window.confirm(`Restore "${deletedAsset.name}" to inventory?`)) {
      try {
        // 1. Restore to assets
        const { error: restoreError } = await supabase
          .from('assets')
          .insert([deletedAsset.asset_data]);

        if (restoreError) throw restoreError;

        // 2. Remove from deleted_assets
        const { error: removeError } = await supabase
          .from('deleted_assets')
          .delete()
          .eq('id', deletedAsset.id);

        if (removeError) throw removeError;
        
        await sendNotification('Asset Restored', `Asset "${deletedAsset.name}" was restored to inventory.`, 'success');
        
        refreshData();
      } catch (err) {
        alert("Error restoring asset: " + err.message);
      }
    }
  };

  const handlePermanentDelete = async (id, name) => {
    if (window.confirm(`PERMANENTLY DELETE "${name}"? This action CANNOT be undone.`)) {
      try {
        const { error } = await supabase
          .from('deleted_assets')
          .delete()
          .eq('id', id);

        if (error) throw error;
        refreshData();
      } catch (err) {
        alert("Error deleting permanently: " + err.message);
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

  const getAssetsForExport = () => {
    if (!useDateRangeExport || (!exportStartDate && !exportEndDate)) {
      return filteredAssets;
    }
    
    return filteredAssets.filter(asset => {
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

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = !searchTerm || 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.categories?.name && asset.categories.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (asset.locations?.name && asset.locations.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (asset.assigned_to_name && asset.assigned_to_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchesDate = true;
    if (startDate && asset.purchase_date) {
      matchesDate = matchesDate && new Date(asset.purchase_date) >= new Date(startDate);
    }
    if (endDate && asset.purchase_date) {
      matchesDate = matchesDate && new Date(asset.purchase_date) <= new Date(endDate);
    }
    
    return matchesSearch && matchesDate;
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
            <button 
              onClick={() => setShowRecycleBin(true)}
              className="w-full sm:w-auto bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition shadow-sm font-semibold flex items-center justify-center gap-2"
              title="Recycle Bin"
            >
              🗑️ Recycle Bin
              {deletedAssets.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {deletedAssets.length}
                </span>
              )}
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

      {selectedIds.length > 0 && (
        <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2">
            <span className="bg-[#FF5F1F] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
              {selectedIds.length}
            </span>
            <p className="text-sm font-semibold text-gray-700">Assets Selected</p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <button 
              onClick={() => handleBulkStatusUpdate('Active')}
              className="px-3 py-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition text-sm font-bold"
            >
              Set Active
            </button>
            <button 
              onClick={() => handleBulkStatusUpdate('Under Repair')}
              className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition text-sm font-bold"
            >
              Set Under Repair
            </button>
            <button 
              onClick={() => handleBulkStatusUpdate('Disposed')}
              className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition text-sm font-bold"
            >
              Set Disposed
            </button>
            <button 
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition text-sm font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="table-container">
          <table className="data-table w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-3 py-3 text-center">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === filteredAssets.length && filteredAssets.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded text-[#FF5F1F] focus:ring-[#FF5F1F]"
                  />
                </th>
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
                  {searchTerm || startDate || endDate ? "No assets match your search/filter." : "No assets found."}
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset, index) => (
                <tr key={asset.id} className={`hover:bg-blue-50 transition-colors ${selectedIds.includes(asset.id) ? 'bg-orange-50' : ''}`}>
                  <td className="px-3 py-3 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(asset.id)}
                      onChange={() => toggleSelect(asset.id)}
                      className="w-4 h-4 rounded text-[#FF5F1F] focus:ring-[#FF5F1F]"
                    />
                  </td>
                  <td className="px-3 py-3 text-center text-gray-500 font-medium">{index + 1}</td>
                  <td className="px-3 py-3 text-sm text-gray-600">
                    {asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : ''}
                  </td>
                  <td className="px-3 py-3 text-gray-600 font-mono">
                    <div className="text-truncate" title={asset.ref_id || ''}>{asset.ref_id || ''}</div>
                  </td>
                  <td className="px-3 py-3 text-gray-600 font-mono">
                    <div className="text-truncate" title={asset.uacs_code || '10605020'}>{asset.uacs_code || '10605020'}</div>
                  </td>
                  <td className="px-3 py-3 font-medium text-gray-800">
                    <div className="text-truncate" title={asset.name}>{asset.name}</div>
                  </td>
                  <td className="px-3 py-3 text-right text-gray-600">
                    {asset.unit_cost ? `₱${Number(asset.unit_cost).toLocaleString()}` : ''}
                  </td>
                  <td className="px-3 py-3 text-center text-gray-600 font-medium">{asset.qty || 1}</td>
                  <td className="px-3 py-3 text-gray-600 font-mono">
                    <div className="text-truncate" title={asset.serial}>{asset.serial}</div>
                  </td>
                  <td className="px-3 py-3 text-gray-600">
                    <div className="text-truncate" title={asset.assigned_to_name || 'None'}>{asset.assigned_to_name || 'None'}</div>
                  </td>
                  <td className="px-3 py-3 text-right text-gray-600">
                    {asset.total_amount ? `₱${Number(asset.total_amount).toLocaleString()}` : (asset.unit_cost && asset.qty ? `₱${(Number(asset.unit_cost) * (asset.qty || 1)).toLocaleString()}` : '')}
                  </td>
                  <td className="px-3 py-3 text-gray-600">
                    <div className="text-truncate" title={asset.locations?.name || (locations.length > 0 ? locations[0].name : '')}>{asset.locations?.name || (locations.length > 0 ? locations[0].name : '')}</div>
                  </td>
                  <td className="px-3 py-3 text-gray-600">
                    <div className="text-truncate" title={asset.remarks || ''}>{asset.remarks || ''}</div>
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
                  <p className="text-gray-700">{selectedAsset.purchase_date ? new Date(selectedAsset.purchase_date).toLocaleDateString() : ''}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">ICS Number</h3>
                  <p className="text-gray-700 font-mono">{selectedAsset.ref_id || ''}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">UACS Code</h3>
                  <p className="text-gray-700 font-mono">{selectedAsset.uacs_code || '10605020'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</h3>
                  <p className="text-lg font-medium text-gray-800">{selectedAsset.name}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Unit Cost</h3>
                  <p className="text-gray-700">{selectedAsset.unit_cost ? `₱${Number(selectedAsset.unit_cost).toLocaleString()}` : ''}</p>
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
                  <p className="text-gray-700">{selectedAsset.assigned_to_name || 'None'}</p>
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
                          : '')}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Location</h3>
                  <p className="text-gray-700">{selectedAsset.locations?.name || (locations.length > 0 ? locations[0].name : '')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Category</h3>
                  <p className="text-gray-700">{selectedAsset.categories?.name || (categories.length > 0 ? categories[0].name : 'Electronics')}</p>
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
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Brand/Model</h3>
                  <p className="text-gray-700">{selectedAsset.brand || ''} {selectedAsset.model_number ? `(${selectedAsset.model_number})` : ''}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Warranty Expiry</h3>
                  <p className="text-gray-700">{selectedAsset.warranty_expiry ? new Date(selectedAsset.warranty_expiry).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Maintenance</h3>
                  <p className="text-xs text-gray-500">Last: {selectedAsset.last_maintenance ? new Date(selectedAsset.last_maintenance).toLocaleDateString() : 'N/A'}</p>
                  <p className="text-xs text-gray-500">Next: {selectedAsset.next_maintenance ? new Date(selectedAsset.next_maintenance).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Remarks</h3>
                  <p className="text-gray-700">{selectedAsset.remarks || ''}</p>
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

            {!editingAsset && (
              <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                <button 
                  onClick={() => setAddMode("manual")}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition ${addMode === 'manual' ? 'bg-white text-[#FF5F1F] shadow-sm' : 'text-gray-500'}`}
                >
                  📝 Manual Entry
                </button>
                <button 
                  onClick={() => setAddMode("smart")}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition ${addMode === 'smart' ? 'bg-white text-[#FF5F1F] shadow-sm' : 'text-gray-500'}`}
                >
                  🚀 Smart Serial Entry
                </button>
              </div>
            )}

            {addMode === "smart" && !editingAsset ? (
              <div className="space-y-6 py-4">
                <div className="text-center">
                  <span className="text-4xl mb-2 block">🔍</span>
                  <h3 className="font-bold text-gray-800">Smart Asset Lookup</h3>
                  <p className="text-sm text-gray-500">Enter a serial number and we'll fill the details for you.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Serial / Property Number</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-[#FF5F1F] outline-none font-mono"
                      placeholder="e.g. SN-9482 or ACER-LAP-001"
                      value={smartSerial}
                      onChange={(e) => setSmartSerial(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSmartSearch()}
                    />
                    <button 
                      onClick={handleSmartSearch}
                      disabled={isSmartLoading || !smartSerial}
                      className="bg-[#FF5F1F] text-white px-6 rounded-lg font-bold hover:opacity-90 disabled:opacity-50 transition"
                    >
                      {isSmartLoading ? "..." : "Find"}
                    </button>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-700 leading-relaxed">
                    <b>How it works:</b> Our system recognizes patterns for common equipment like Laptops, Furniture, and Air Conditioners based on their serial prefixes.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAssetSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Description (Asset Name)</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
                  value={assetFormData.name || ""}
                  onChange={(e) => setAssetFormData({...assetFormData, name: e.target.value})}
                  placeholder='e.g. 2.5HP split type inverter airconditioning'
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Category</label>
                  <select
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
                    value={assetFormData.category_id || ""}
                    onChange={(e) => setAssetFormData({...assetFormData, category_id: e.target.value || null})}
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
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
                    value={assetFormData.location_id || ""}
                    onChange={(e) => setAssetFormData({...assetFormData, location_id: e.target.value || null})}
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
                    value={assetFormData.purchase_date || ""}
                    onChange={(e) => setAssetFormData({...assetFormData, purchase_date: e.target.value || null})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Status</label>
                  <select
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
                    value={assetFormData.status || "Active"}
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
                    value={assetFormData.ref_id || ""}
                    onChange={(e) => setAssetFormData({...assetFormData, ref_id: e.target.value || null})}
                    placeholder="e.g. ICT 21-004"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">UACS Code</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
                    value={assetFormData.uacs_code || ""}
                    onChange={(e) => setAssetFormData({...assetFormData, uacs_code: e.target.value || null})}
                    placeholder="e.g. 10605020"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Property Number</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
                    value={assetFormData.serial || ""}
                    onChange={handleSerialChange}
                    placeholder="Enter serial number to auto-fill info"
                  />
                  {!editingAsset && (
                    <p className="text-xs text-gray-500 mt-1">
                      Tip: Enter an existing serial to auto-fill, or a new serial to guess info from prefix!
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Person Accountable</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
                    value={assetFormData.assigned_to_name || "None"}
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
                  value={assetFormData.unit_cost || ""}
                  onChange={(e) => setAssetFormData({...assetFormData, unit_cost: e.target.value || null})}
                  placeholder="e.g. 74500.00"
                />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">QTY</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
                    value={assetFormData.qty || 1}
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
                    value={assetFormData.total_amount || ""}
                    onChange={(e) => setAssetFormData({...assetFormData, total_amount: e.target.value || null})}
                    placeholder="Leave blank to auto-calculate"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Brand</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
                    value={assetFormData.brand || ""}
                    onChange={(e) => setAssetFormData({...assetFormData, brand: e.target.value})}
                    placeholder="e.g. Acer, Dell"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Model Number</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
                    value={assetFormData.model_number || ""}
                    onChange={(e) => setAssetFormData({...assetFormData, model_number: e.target.value})}
                    placeholder="e.g. Nitro 5, XPS 13"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Warranty Expiry</label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
                    value={assetFormData.warranty_expiry || ""}
                    onChange={(e) => setAssetFormData({...assetFormData, warranty_expiry: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Last Maintenance</label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
                    value={assetFormData.last_maintenance || ""}
                    onChange={(e) => setAssetFormData({...assetFormData, last_maintenance: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-gray-700">Next Maintenance</label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-[#FF5F1F] focus:border-[#FF5F1F] outline-none"
                    value={assetFormData.next_maintenance || ""}
                    onChange={(e) => setAssetFormData({...assetFormData, next_maintenance: e.target.value})}
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
            )}
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

      {/* RECYCLE BIN MODAL */}
      {showRecycleBin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <span>🗑️</span> Recycle Bin
                </h2>
                <p className="text-sm text-gray-500">Restore items you accidentally deleted</p>
              </div>
              <button 
                onClick={() => setShowRecycleBin(false)}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {deletedAssets.length === 0 ? (
                <div className="text-center py-20">
                  <span className="text-6xl mb-4 block">♻️</span>
                  <p className="text-gray-500 text-lg">Your Recycle Bin is empty.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3">Asset Name</th>
                        <th className="px-4 py-3">Serial Number</th>
                        <th className="px-4 py-3">Deleted By</th>
                        <th className="px-4 py-3">Deleted At</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deletedAssets.map((asset) => (
                        <tr key={asset.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{asset.name}</td>
                          <td className="px-4 py-3 font-mono text-xs">{asset.serial}</td>
                          <td className="px-4 py-3 text-sm">{asset.deleted_by}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {new Date(asset.deleted_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleRestoreAsset(asset)}
                                className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-bold hover:bg-green-200"
                                title="Restore"
                              >
                                ⏪ Restore
                              </button>
                              <button 
                                onClick={() => handlePermanentDelete(asset.id, asset.name)}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-bold hover:bg-red-200"
                                title="Delete Permanently"
                              >
                                ❌ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setShowRecycleBin(false)}
                className="px-6 py-2 bg-gray-700 text-white rounded-lg font-bold hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
