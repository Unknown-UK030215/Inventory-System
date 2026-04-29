import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useInventory } from "../../context/InventoryContext";

export default function Dashboard() {
  const { assets, loading: assetsLoading } = useInventory();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  const myAssetsCount = assets.filter(a => 
    user && (a.assigned_to_name === user.email || a.assigned_to_name === user.user_metadata?.full_name)
  ).length;

  return (
    <div className="page-container">
      <h1 className="text-2xl font-bold mb-6">Staff Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <h2 className="text-gray-500 text-sm font-semibold uppercase">My Assets</h2>
          <p className="text-3xl font-bold">{loading || assetsLoading ? "..." : myAssetsCount}</p>
          <p className="text-xs text-green-600 mt-2">Assigned to you</p>
        </div>
        <div className="card">
          <h2 className="text-gray-500 text-sm font-semibold uppercase">Pending Reports</h2>
          <p className="text-3xl font-bold">0</p>
          <p className="text-xs text-yellow-600 mt-2">No active reports</p>
        </div>
        <div className="card">
          <h2 className="text-gray-500 text-sm font-semibold uppercase">Scans Today</h2>
          <p className="text-3xl font-bold">0</p>
          <p className="text-xs text-gray-400 mt-2">No recent scans</p>
        </div>
      </div>

      <div className="card bg-blue-50 border-blue-200">
        <h2 className="text-blue-800 font-bold mb-2">Welcome back, {user?.user_metadata?.full_name || user?.email || 'Staff'}!</h2>
        <p className="text-blue-600">You can manage your assigned equipment and report issues using the menu on the left.</p>
      </div>
    </div>
  );
}