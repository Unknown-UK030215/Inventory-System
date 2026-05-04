import { useState } from "react";
import { supabase } from "../../lib/supabase"; 
import { useInventory } from "../../context/InventoryContext";


export default function MyReports() {
  const { report, loading } = useInventory();
  const [isProcessing, setIsProcessing] = userState(false);
  

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My Reports</h1>
      <p>View your submitted reports here.</p>
    </div>
  );
}
