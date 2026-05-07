import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "../../lib/supabase";

export default function QRScanner() {
  const [scannedAsset, setScannedAsset] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [lastScannedText, setLastScannedText] = useState(null);
  const [reportText, setReportText] = useState("");
  const [reportType, setReportType] = useState("problem");
  const [reports, setReports] = useState([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scannerRef = useRef(null);

  const startScanner = async () => {
    setCameraError(null);
    setLastScannedText(null);
    setIsScanning(true);
    setScannedAsset(null);

    try {
      setTimeout(async () => {
        const html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 20,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              return { width: Math.floor(minEdge * 0.75), height: Math.floor(minEdge * 0.75) };
            },
            aspectRatio: 1.0,
            disableFlip: true,
          },
          onScanSuccess,
          onScanFailure
        );
      }, 100);
    } catch {
      setCameraError("Unable to access camera. Please ensure camera permissions are granted.");
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.log("Scanner stop error:", err);
      }
    }
    setIsScanning(false);
  };

  const onScanSuccess = async (decodedText) => {
    console.log("Scanned text:", decodedText);
    setLastScannedText(decodedText);
    
    try {
      if (!supabase) throw new Error("Database not connected.");

      const { data: foundAsset, error } = await supabase
        .from('assets')
        .select('*, categories(name), locations(name)')
        .eq('serial', decodedText)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (foundAsset) {
        setScannedAsset({
          ...foundAsset,
          problems: []
        });
        
        // Fetch existing reports for this asset
        const { data: existingReports } = await supabase
          .from('reports')
          .select('*')
          .eq('serial', foundAsset.serial)
          .order('reported_at', { ascending: false });

        setReports(existingReports || []);
        setCameraError(null);
        stopScanner();
      } else {
        // Create a "Dynamic Asset" for unknown codes
        let guessedName = "General Asset";
        let guessedCategory = "General Inventory";
        
        if (decodedText.includes("-")) {
          const prefix = decodedText.split("-")[0].toUpperCase();
          const prefixMap = {
            'DSK': 'Desktop Computer',
            'MAC': 'MacBook Pro',
            'DELL': 'Dell Laptop',
            'LAP': 'Laptop',
            'MON': 'Monitor',
            'CHR': 'Office Chair',
            'TAB': 'Tablet',
            'PHN': 'Smartphone',
            'PRN': 'Printer',
            'CAM': 'Camera',
            'PROJ': 'Projector'
          };
          
          if (prefixMap[prefix]) {
            guessedName = prefixMap[prefix];
            guessedCategory = (prefix === 'CHR') ? 'Furniture' : 'Electronics';
          } else {
            guessedName = prefix.charAt(0) + prefix.slice(1).toLowerCase() + " Asset";
          }
        } else {
          guessedName = `Asset ${decodedText}`;
        }

        setScannedAsset({
          id: null,
          name: guessedName,
          category: guessedCategory,
          status: "Active",
          serial: decodedText,
          assigned_to: "Unassigned",
          date_received: new Date().toLocaleDateString(),
          location: "Needs Review",
          problems: [],
          isDynamic: true
        });
        setReports([]);
        setCameraError(null);
        stopScanner();
      }
    } catch (err) {
      console.error("Error fetching scanned asset:", err);
      setCameraError("Error fetching asset details from database.");
    }
  };

  const onScanFailure = () => {
    // Silent
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportText.trim() || !scannedAsset) return;

    if (!scannedAsset.id) {
      alert("This asset is not registered in the system. Please contact the administrator to register this asset before reporting issues.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (!supabase) throw new Error("Database not connected.");

      // Get user from localStorage instead of Supabase Auth
      const storedUser = localStorage.getItem("staff_user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const reporterName = user?.name || user?.username || user?.email || "Unknown Staff";
      
      const { error } = await supabase
        .from('reports')
        .insert([{
          asset_name: scannedAsset.name,
          serial: scannedAsset.serial,
          type: reportType,
          description: reportText,
          reported_by: reporterName,
          status: "Pending"
        }]);

      if (error) throw error;
      
      // Update local state to show the new report
      const newReport = {
        asset_name: scannedAsset.name,
        serial: scannedAsset.serial,
        type: reportType,
        description: reportText,
        reported_by: reporterName,
        reported_at: new Date().toISOString(),
        status: "Pending"
      };
      
      setReports([newReport, ...reports]);
      setReportText("");
      setShowReportForm(false);
      alert("Report submitted successfully!");
    } catch (err) {
      console.error("Error submitting report:", err);
      alert("Error submitting report: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* SCANNER CONTROL SECTION */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Asset Scanner</h2>
            <p className="text-gray-500">Scan QR codes to manage inventory items</p>
          </div>
          {!isScanning ? (
            <button
              onClick={startScanner}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200"
            >
              <span>📷</span> Start Scanning
            </button>
          ) : (
            <button
              onClick={stopScanner}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
            >
              <span>⏹</span> Stop Scanner
            </button>
          )}
        </div>

        {isScanning && (
          <div className="relative mx-auto max-w-sm overflow-hidden rounded-2xl border-4 border-blue-50 bg-black aspect-square shadow-inner">
            <div id="qr-reader" className="w-full h-full"></div>
            <div className="absolute inset-0 pointer-events-none border-2 border-blue-400 opacity-30 animate-pulse"></div>
            {lastScannedText && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-mono">
                Last read: {lastScannedText}
              </div>
            )}
          </div>
        )}

        {cameraError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-center">
            <p className="font-bold mb-1 text-lg">Camera Access Error</p>
            <p className="text-sm opacity-90">{cameraError}</p>
          </div>
        )}
      </div>

      {/* ASSET DETAILS & HISTORY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ASSET INFO CARD */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📦</span> Asset Details
          </h3>
          
          {scannedAsset ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-blue-900">{scannedAsset.name}</h4>
                    <p className="text-sm text-blue-700 font-mono mt-1">S/N: {scannedAsset.serial}</p>
                    {scannedAsset.isDynamic && (
                      <span className="inline-block mt-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                        New Scan Detected
                      </span>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    scannedAsset.status === 'Active' ? 'bg-green-100 text-green-700' :
                    scannedAsset.status === 'Under Repair' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {scannedAsset.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-blue-600/60 font-medium">Category</p>
                    <p className="font-bold text-blue-900">{scannedAsset.categories?.name || scannedAsset.category}</p>
                  </div>
                  <div>
                    <p className="text-blue-600/60 font-medium">Assigned To</p>
                    <p className="font-bold text-blue-900">{scannedAsset.assigned_to_name || scannedAsset.assignedTo || 'Unassigned'}</p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-blue-100">
                    <p className="text-blue-600/60 font-medium">Location</p>
                    <p className="font-bold text-blue-900">{scannedAsset.locations?.name || scannedAsset.location}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
              <p className="text-4xl mb-3">📸</p>
              <p className="text-gray-400 font-medium">Scan a QR code to see details</p>
            </div>
          )}
        </div>

        {/* ISSUES & REPORTS CARD */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span>📝</span> Issue Reports
            </h3>
            {scannedAsset && (
              <button
                onClick={() => setShowReportForm(!showReportForm)}
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg font-bold transition-colors"
              >
                {showReportForm ? 'Cancel' : '+ New Report'}
              </button>
            )}
          </div>

          {showReportForm && (
            <form onSubmit={handleReportSubmit} className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3 animate-in slide-in-from-top-2">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="problem">Problem</option>
                  <option value="issue">Minor Issue</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  rows="3"
                  placeholder="What's the issue?"
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          )}

          <div className="space-y-4">
            {reports.length > 0 ? (
              reports.map((report, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      report.type === 'problem' ? 'bg-red-100 text-red-600' : 
                      report.type === 'issue' ? 'bg-yellow-100 text-yellow-600' : 
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {report.type}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {new Date(report.reported_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{report.description}</p>
                  <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center">
                    <p className="text-[10px] text-gray-500">By: <span className="font-bold">{report.reported_by}</span></p>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{report.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-300">
                <p className="text-2xl mb-1">✨</p>
                <p className="text-sm font-medium">No reports for this item</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
