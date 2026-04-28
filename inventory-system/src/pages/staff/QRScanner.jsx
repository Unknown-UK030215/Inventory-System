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
          qrbox: { width: 250, height: 250 },
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
    <div className="page-container">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">QR Scanner</h1>
        {!isScanning && !scannedAsset && (
          <button 
            onClick={startScanner}
            className="btn-primary flex items-center gap-2"
          >
            <span>📷</span> Start Camera Scanner
          </button>
        )}
        {isScanning && (
          <button 
            onClick={stopScanner}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Stop Scanner
          </button>
        )}
      </div>

      {cameraError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Camera Error</p>
          <p>{cameraError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Section */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Scan QR Code</h2>
          
          {!scannedAsset ? (
            <div className="flex flex-col items-center">
              <div 
                id="qr-reader" 
                className="w-full max-w-sm mx-auto"
                style={{ minHeight: "300px" }}
              ></div>
              
              {!isScanning && (
                <button 
                  onClick={goToCamera}
                  className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <span className="text-xl">📷</span>
                  <span className="font-semibold">Open Camera Scanner</span>
                </button>
              )}
              
              <p className="text-gray-500 text-sm mt-4 text-center">
                Point your camera at the QR code sticker on the equipment or furniture
              </p>
            </div>
          ) : (
            <div className="text-center">
              <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-4">
                <p className="font-bold text-lg">✓ QR Code Scanned Successfully!</p>
                <p className="text-sm">Serial: {scannedAsset.serial}</p>
              </div>
              <button 
                onClick={() => {
                  setScannedAsset(null);
                  setReports([]);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Scan Another
              </button>
            </div>
          )}
        </div>

        {/* Asset Information Section */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Asset Information</h2>
          
          {scannedAsset ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{scannedAsset.name}</h3>
                    <p className="text-sm text-gray-500">S/N: <span className="font-mono">{scannedAsset.serial}</span></p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    scannedAsset.status === 'Active' ? 'bg-green-100 text-green-700' :
                    scannedAsset.status === 'Disposed' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {scannedAsset.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Category</p>
                    <p className="font-semibold">{scannedAsset.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Assigned To</p>
                    <p className="font-semibold">{scannedAsset.assignedTo}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Date Received</p>
                    <p className="font-semibold">{scannedAsset.dateReceived}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Location</p>
                    <p className="font-semibold">{scannedAsset.location}</p>
                  </div>
                </div>
              </div>

              {/* Problems/Issues History */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-gray-700">Problems & Issues History</h4>
                  <button
                    onClick={() => setShowReportForm(!showReportForm)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    {showReportForm ? 'Cancel' : '+ Report Issue'}
                  </button>
                </div>

                {showReportForm && (
                  <form onSubmit={handleReportSubmit} className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="mb-3">
                      <label className="block text-sm font-semibold mb-2">Report Type</label>
                      <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="w-full p-2 border rounded"
                      >
                        <option value="problem">Problem</option>
                        <option value="issue">Issue</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-semibold mb-2">Description</label>
                      <textarea
                        value={reportText}
                        onChange={(e) => setReportText(e.target.value)}
                        className="w-full p-2 border rounded"
                        rows="3"
                        placeholder="Describe the problem or issue..."
                        required
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full"
                    >
                      Submit Report
                    </button>
                  </form>
                )}

                {reports.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {reports.map((report, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${
                        report.type === 'problem' ? 'bg-red-50 border-red-200' :
                        report.type === 'issue' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            report.type === 'problem' ? 'bg-red-200 text-red-700' :
                            report.type === 'issue' ? 'bg-yellow-200 text-yellow-700' :
                            'bg-blue-200 text-blue-700'
                          }`}>
                            {report.type.toUpperCase()}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            report.status === 'Resolved' ? 'bg-green-200 text-green-700' :
                            report.status === 'Pending' ? 'bg-yellow-200 text-yellow-700' :
                            'bg-orange-200 text-orange-700'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">{report.description}</p>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Reported: {report.reportedAt}</span>
                          <span>By: {report.reportedBy}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-4xl mb-2">✓</p>
                    <p>No problems or issues reported</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-5xl mb-4">📷</p>
              <p className="text-lg">No asset scanned yet</p>
              <p className="text-sm mt-2">Scan a QR code to view asset information</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}