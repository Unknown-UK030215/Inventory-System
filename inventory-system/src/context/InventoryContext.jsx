import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const InventoryContext = createContext(null);

export function InventoryProvider({ children }) {
  const [assets, setAssets] = useState([]);
  const [disposed, setDisposed] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [deletedAssets, setDeletedAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (!supabase) {
      setError("Supabase is not configured. Please check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First, get the exact counts from Supabase
      const [assetsCountRes, reportsCountRes] = await Promise.all([
        supabase.from('assets').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true })
      ]);
      
      console.log("=== SUPABASE EXACT COUNTS ===");
      console.log("Total assets in DB:", assetsCountRes.count);
      console.log("Total reports in DB:", reportsCountRes.count);
      
      const fetchTable = async (table, query, orderCol = null) => {
        try {
          let q = supabase.from(table).select(query);
          // Only order if requested, but don't fail if column is missing
          if (orderCol) {
            const res = await q.order(orderCol, { ascending: false }).limit(5000);
            if (!res.error) return res.data || [];
          }
          
          // Fallback: simple fetch without ordering
          const resFallback = await supabase.from(table).select(query).limit(5000);
          if (resFallback.error) {
            console.warn(`⚠️ Error fetching ${table}:`, resFallback.error.message);
            return [];
          }
          return resFallback.data || [];
        } catch (e) {
          return [];
        }
      };

      const [
        assetsData, 
        disposedData, 
        catsData, 
        locsData, 
        usersData, 
        adminsData, 
        notificationsData, 
        deletedData,
        reportsData
      ] = await Promise.all([
        fetchTable('assets', '*'),
        fetchTable('disposed', '*'),
        fetchTable('categories', '*'),
        fetchTable('locations', '*'),
        fetchTable('users', '*'),
        fetchTable('admin_credentials', '*'),
        fetchTable('notifications', '*'),
        fetchTable('deleted_assets', '*'),
        (async () => {
          try {
            const res = await supabase.from('reports').select('*').limit(5000);
            return res.data || [];
          } catch (e) { return []; }
        })()
      ]);

      console.log("=== DATA LOADED ===");
      console.log("Assets:", assetsData.length);
      
      // Manual mapping is SAFER than complex joins for production
      const finalAssets = assetsData.map(asset => {
        const cat = catsData.find(c => c.id === asset.category_id);
        const loc = locsData.find(l => l.id === asset.location_id);
        return {
          ...asset,
          categories: cat ? { name: cat.name } : { name: "Uncategorized" },
          locations: loc ? { name: loc.name } : { name: "Unknown" }
        };
      });

      setAssets(finalAssets);
      setDisposed(disposedData);
      setCategories(catsData);
      setLocations(locsData);
      setReports(reportsData);
      setNotifications(notificationsData);
      setDeletedAssets(deletedData);
      
      const staffList = usersData.map(u => ({ ...u, role: 'staff' }));
      const adminList = adminsData.map(a => ({ ...a, role: 'admin' }));
      setUsers([...adminList, ...staffList]);

      // If critical data is missing, show an error
      if (assetsData.length === 0 && catsData.length === 0) {
        console.error("Critical tables (assets/categories) appear to be empty or missing.");
      }
    } catch (err) {
      console.error('Error fetching inventory data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (!supabase) return;

    // Set up real-time subscriptions
    const channel = supabase
      .channel('inventory-realtime')
      // Real-time for assets
      .on('postgres_changes', { event: '*', table: 'assets' }, (payload) => {
        console.log('Real-time assets update:', payload);
        if (payload.eventType === 'INSERT') {
          setAssets(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setAssets(prev => prev.map(asset => 
            asset.id === payload.new.id ? payload.new : asset
          ));
        } else if (payload.eventType === 'DELETE') {
          setAssets(prev => prev.filter(asset => asset.id !== payload.old.id));
        }
      })
      // Real-time for reports
      .on('postgres_changes', { event: '*', table: 'reports' }, (payload) => {
        console.log('Real-time reports update:', payload);
        if (payload.eventType === 'INSERT') {
          setReports(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setReports(prev => prev.map(report => 
            report.id === payload.new.id ? payload.new : report
          ));
        } else if (payload.eventType === 'DELETE') {
          setReports(prev => prev.filter(report => report.id !== payload.old.id));
        }
      })
      // Real-time for disposed
      .on('postgres_changes', { event: '*', table: 'disposed' }, (payload) => {
        console.log('Real-time disposed update:', payload);
        if (payload.eventType === 'INSERT') {
          setDisposed(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setDisposed(prev => prev.map(item => 
            item.id === payload.new.id ? payload.new : item
          ));
        } else if (payload.eventType === 'DELETE') {
          setDisposed(prev => prev.filter(item => item.id !== payload.old.id));
        }
      })
      // Real-time for notifications
      .on('postgres_changes', { event: '*', table: 'notifications' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setNotifications(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
        }
      })
      // Real-time for deleted_assets
      .on('postgres_changes', { event: '*', table: 'deleted_assets' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setDeletedAssets(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'DELETE') {
          setDeletedAssets(prev => prev.filter(item => item.id !== payload.old.id));
        }
      })
      // Real-time for categories, locations, users (fallback to full fetch)
      .on('postgres_changes', { event: '*', table: 'categories' }, () => fetchData())
      .on('postgres_changes', { event: '*', table: 'locations' }, () => fetchData())
      .on('postgres_changes', { event: '*', table: 'users' }, () => fetchData())
      .on('postgres_changes', { event: '*', table: 'admin_credentials' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const value = {
    supabase,
    assets,
    disposed,
    categories,
    locations,
    reports,
    users,
    notifications,
    deletedAssets,
    loading,
    error,
    refreshData: fetchData
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === null) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
