import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  return (
    <div className="page-container px-4 sm:px-6">
      <div className="mb-6 text-center sm:text-left">
        <h1 className="text-2xl font-bold text-gray-800">Staff Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your assigned equipment and reports</p>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
        <div className="bg-white p-4 lg:p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-gray-400 text-[10px] lg:text-xs font-bold uppercase tracking-wider">My Assets</h2>
          <p className="text-2xl lg:text-3xl font-bold text-gray-800 mt-1">3</p>
          <div className="flex items-center gap-1 text-[10px] lg:text-xs text-green-600 mt-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            All items active
          </div>
        </div>
        <div className="bg-white p-4 lg:p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-gray-400 text-[10px] lg:text-xs font-bold uppercase tracking-wider">Pending Reports</h2>
          <p className="text-2xl lg:text-3xl font-bold text-gray-800 mt-1">1</p>
          <div className="flex items-center gap-1 text-[10px] lg:text-xs text-yellow-600 mt-2 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
            1 item needs attention
          </div>
        </div>
        <div className="bg-white p-4 lg:p-6 rounded-xl border border-gray-100 shadow-sm col-span-2 lg:col-span-1">
          <h2 className="text-gray-400 text-[10px] lg:text-xs font-bold uppercase tracking-wider">Scans Today</h2>
          <p className="text-2xl lg:text-3xl font-bold text-gray-800 mt-1">0</p>
          <p className="text-[10px] lg:text-xs text-gray-400 mt-2 font-medium italic">No recent scans</p>
        </div>
      </div>

      <div className="bg-blue-600 p-6 lg:p-8 rounded-2xl text-white shadow-lg shadow-blue-100 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-2">Welcome back! 👋</h2>
          <p className="text-blue-50 text-sm leading-relaxed max-w-md">
            Use the Quick Scan button or the side menu to manage your assigned equipment and report any issues instantly.
          </p>
          <button 
            onClick={() => navigate('/staff/scan')}
            className="mt-6 bg-white text-blue-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-sm"
          >
            Start QR Scan
          </button>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 text-[120px] leading-none select-none pointer-events-none transform translate-y-1/4 translate-x-1/4">
          📦
        </div>
      </div>
    </div>
  );
}