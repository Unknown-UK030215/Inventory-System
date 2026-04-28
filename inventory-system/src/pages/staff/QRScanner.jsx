import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from "react-router-dom";

export default function QRScanner() {
  const [scannedAsset, setScannedAsset] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [reportText, setReportText] = useState("");
  const [reportType, setReportType] = useState("problem");
  const [reports, setReports] = useState([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const scannerRef = useRef(null);
  const navigate = useNavigate();

  const mockAssets = [
    { 
      id: 1, 
      name: "Laptop Dell XPS", 
      category: "Electronics", 
      status: "Active", 
      serial: "DELL-1234", 
      assignedTo: "John Doe",
      dateReceived: "2024-01-15",
      location: "Building A, Room 101",
      problems: [
        { type: "problem", description: "Screen flickering occasionally", reportedAt: "2024-02-10 09:30 AM", reportedBy: "John Doe", status: "Resolved" },
        { type: "issue", description: "Charger not working properly", reportedAt: "2024-03-05 02:15 PM", reportedBy: "John Doe", status: "Pending" }
      ]
    },
    { 
      id: 2, 
      name: "Monitor HP 24\"", 
      category: "Electronics", 
      status: "Active", 
      serial: "HP-5678", 
      assignedTo: "Jane Smith",
      dateReceived: "2024-01-20",
      location: "Building A, Room 102",
      problems: []
    },
    { 
      id: 3, 
      name: "Office Chair", 
      category: "Furniture", 
      status: "Under Repair", 
      serial: "CHAIR-9012", 
      assignedTo: "None",
      dateReceived: "2023-06-10",
      location: "Storage Room",
      problems: [
        { type: "problem", description: "Wheel broken", reportedAt: "2024-03-01 10:00 AM", reportedBy: "Staff", status: "In Progress" }
      ]
    },
    { 
      id: 4, 
      name: "MacBook Pro", 
      category: "Electronics", 
      status: "Disposed", 
      serial: "MAC-4321", 
      assignedTo: "None",
      dateReceived: "2022-03-15",
      location: "Disposed Storage",
      problems: []
    },
  ];

  const startScanner = async () => {
    setCameraError(null);
    setIsScanning(true);

    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdge * 0.7);
            return {
              width: qrboxSize,
              height: qrboxSize
            };
          },
        },
        onScanSuccess,
        onScanFailure
      );
    } catch (err) {
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

  const onScanSuccess = (decodedText) => {
    const asset = mockAssets.find(a => a.serial === decodedText);
    if (asset) {
      setScannedAsset(asset);
      setReports(asset.problems || []);
      stopScanner();
    } else {
      alert("Asset not found! Serial: " + decodedText);
    }
  };

  const onScanFailure = (error) => {
    // Silent failure - continuously scanning
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!reportText.trim()) return;

    const newReport = {
      type: reportType,
      description: reportText,
      reportedAt: new Date().toLocaleString(),
      reportedBy: "Current Staff",
      status: "Pending"
    };

    setReports([...reports, newReport]);
    setReportText("");
    setShowReportForm(false);
    alert("Report submitted successfully!");
  };

  const goToCamera = () => {
    navigate("/staff/scan");
    setTimeout(() => startScanner(), 100);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (scannedAsset && !isScanning) {
      startScanner();
    }
  }, [scannedAsset]);

  return (
    <div className="page-container max-w-2xl mx-auto px-4 sm:px-6">
      <div className="mb-6 text-center sm:text-left">
        <h1 className="text-2xl font-bold text-gray-800">QR Asset Scanner</h1>
        <p className="text-gray-500 text-sm mt-1">Scan equipment QR stickers to view details or report issues</p>
      </div>

      {!scannedAsset ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div 
              id="qr-reader" 
              className={`overflow-hidden rounded-xl bg-gray-900 aspect-square sm:aspect-video ${!isScanning ? 'hidden' : 'block'}`}
            ></div>
            
            {!isScanning && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                  📷
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Ready to Scan</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">Point your camera at the asset's QR code sticker to automatically retrieve its information.</p>
                <button 
                  onClick={startScanner}
                  className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                >
                  Start Camera
                </button>
              </div>
            )}

            {isScanning && (
              <div className="mt-6 text-center">
                <button 
                  onClick={stopScanner}
                  className="w-full sm:w-auto bg-red-50 text-red-600 px-8 py-3 rounded-xl font-bold hover:bg-red-100 transition"
                >
                  Stop Scanning
                </button>
              </div>
            )}

            {cameraError && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                {cameraError}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Asset Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-blue-600 px-6 py-4 text-white flex justify-between items-center">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-80">Asset Details</p>
                <h2 className="text-xl font-bold">{scannedAsset.name}</h2>
              </div>
              <button 
                onClick={() => setScannedAsset(null)}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Serial Number</p>
                  <p className="font-mono font-bold text-gray-800">{scannedAsset.serial}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Status</p>
                  <span className={`badge ${
                    scannedAsset.status === 'Active' ? 'badge-active' : 
                    scannedAsset.status === 'Disposed' ? 'badge-danger' : 'badge-pending'
                  }`}>
                    {scannedAsset.status}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Date Received</p>
                  <p className="font-semibold text-gray-700">{scannedAsset.dateReceived}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Location</p>
                  <p className="font-semibold text-gray-700">{scannedAsset.location}</p>
                </div>
              </div>

              {/* Problem History */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center text-[10px]">📜</span>
                  Issue History
                </h3>
                {reports.length > 0 ? (
                  <div className="space-y-3">
                    {reports.map((report, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            report.type === 'problem' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                          }`}>
                            {report.type}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">{report.reportedAt}</span>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed">{report.description}</p>
                        <div className="mt-2 text-[10px] font-bold text-blue-600 uppercase">Status: {report.status}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100">
                    <p className="text-xs text-gray-400">No issues reported for this asset.</p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                {!showReportForm ? (
                  <>
                    <button 
                      onClick={() => setShowReportForm(true)}
                      className="flex-1 bg-red-600 text-white py-3 px-6 rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-100 flex items-center justify-center gap-2"
                    >
                      <span>⚠️</span> Report an Issue
                    </button>
                    <button 
                      onClick={() => {
                        setScannedAsset(null);
                        setReports([]);
                      }}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-bold hover:bg-gray-200 transition"
                    >
                      Scan Another
                    </button>
                  </>
                ) : (
                  <div className="w-full animate-in slide-in-from-top-2 duration-200">
                    <form onSubmit={handleReportSubmit}>
                      <div className="mb-4">
                        <label className="block text-[10px] text-gray-400 uppercase font-bold mb-2">Issue Type</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            type="button"
                            onClick={() => setReportType('problem')}
                            className={`py-2 rounded-lg text-xs font-bold transition-all ${
                              reportType === 'problem' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            Problem
                          </button>
                          <button 
                            type="button"
                            onClick={() => setReportType('issue')}
                            className={`py-2 rounded-lg text-xs font-bold transition-all ${
                              reportType === 'issue' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            Minor Issue
                          </button>
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-[10px] text-gray-400 uppercase font-bold mb-2">Description</label>
                        <textarea 
                          className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                          placeholder="Please describe the issue in detail..."
                          rows="4"
                          value={reportText}
                          onChange={(e) => setReportText(e.target.value)}
                          required
                        ></textarea>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                          type="submit"
                          className="flex-1 bg-red-600 text-white py-3 px-6 rounded-xl font-bold hover:bg-red-700 transition"
                        >
                          Submit Report
                        </button>
                        <button 
                          type="button"
                          onClick={() => setShowReportForm(false)}
                          className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-bold hover:bg-gray-200 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}