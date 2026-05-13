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
      
      let reportsRes;
      try {
        reportsRes = await supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(5000);
        if (reportsRes.error) throw reportsRes.error;
      } catch (err) {
        reportsRes = await supabase.from('reports').select('*').order('reported_at', { ascending: false }).limit(5000);
      }

      const [assetsRes, disposedRes, catsRes, locsRes, usersRes, adminsRes, notificationsRes, deletedRes] = await Promise.all([
        supabase.from('assets').select('*, categories(name), locations(name)').order('created_at', { ascending: false }).limit(5000),
        supabase.from('disposed').select('*, categories(name), locations(name)').order('disposal_date', { ascending: false }).limit(5000),
        supabase.from('categories').select('*').order('name').limit(5000),
        supabase.from('locations').select('*').order('name').limit(5000),
        supabase.from('users').select('*').order('name').limit(5000),
        supabase.from('admin_credentials').select('*').order('name').limit(5000),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('deleted_assets').select('*').order('deleted_at', { ascending: false }).limit(500)
      ]);

      if (assetsRes.error) throw new Error(`Assets: ${assetsRes.error.message}`);
      if (catsRes.error) throw new Error(`Categories: ${catsRes.error.message}`);
      if (locsRes.error) throw new Error(`Locations: ${locsRes.error.message}`);
      if (reportsRes.error) throw new Error(`Reports: ${reportsRes.error.message}`);
      if (usersRes.error) throw new Error(`Users: ${usersRes.error.message}`);
      if (adminsRes.error) throw new Error(`Admins: ${adminsRes.error.message}`);
      if (notificationsRes.error) throw new Error(`Notifications: ${notificationsRes.error.message}`);
      if (deletedRes.error) throw new Error(`Recycle Bin: ${deletedRes.error.message}`);

      setAssets(assetsRes.data || []);
      setDisposed(disposedRes.data || []);
      setCategories(catsRes.data || []);
      setLocations(locsRes.data || []);
      setReports(reportsRes.data || []);
      setNotifications(notificationsRes.data || []);
      setDeletedAssets(deletedRes.data || []);
      
      // Combine users and admins, adding role to each
      const staffList = (usersRes.data || []).map(u => ({ ...u, role: 'staff' }));
      const adminList = (adminsRes.data || []).map(a => ({ ...a, role: 'admin' }));
      setUsers([...adminList, ...staffList]);
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
