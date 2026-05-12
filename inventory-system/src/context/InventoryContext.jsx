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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (!supabase) {
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
        reportsRes = await supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(0);
        if (reportsRes.error) throw reportsRes.error;
      } catch (err) {
        reportsRes = await supabase.from('reports').select('*').order('reported_at', { ascending: false }).limit(0);
      }

      const [assetsRes, disposedRes, catsRes, locsRes, usersRes, adminsRes] = await Promise.all([
        supabase.from('assets').select('*, categories(name), locations(name)').limit(0),
        supabase.from('disposed').select('*, categories(name), locations(name)').limit(0),
        supabase.from('categories').select('*').order('name').limit(0),
        supabase.from('locations').select('*').order('name').limit(0),
        supabase.from('users').select('*').order('name').limit(0),
        supabase.from('admin_credentials').select('*').order('name').limit(0)
      ]);

      if (assetsRes.error) {
        console.error('Assets fetch error:', assetsRes.error);
        throw new Error(`Assets: ${assetsRes.error.message}`);
      }
      if (catsRes.error) {
        console.error('Categories fetch error:', catsRes.error);
        throw new Error(`Categories: ${catsRes.error.message}`);
      }
      if (locsRes.error) {
        console.error('Locations fetch error:', locsRes.error);
        throw new Error(`Locations: ${locsRes.error.message}`);
      }
      if (reportsRes.error) {
        console.error('Reports fetch error:', reportsRes.error);
        throw new Error(`Reports: ${reportsRes.error.message}`);
      }
      if (usersRes.error) {
        console.error('Users fetch error:', usersRes.error);
        throw new Error(`Users: ${usersRes.error.message}`);
      }
      if (adminsRes.error) {
        console.error('Admins fetch error:', adminsRes.error);
        throw new Error(`Admins: ${adminsRes.error.message}`);
      }

      console.log("=== DATA FETCH RESULTS ===");
      console.log("Assets fetched count:", assetsRes.data?.length || 0);
      console.log("Reports fetched count:", reportsRes.data?.length || 0);
      console.log("Disposed fetched count:", disposedRes.data?.length || 0);
      
      setAssets(assetsRes.data || []);
      setDisposed(disposedRes.data || []);
      setCategories(catsRes.data || []);
      setLocations(locsRes.data || []);
      setReports(reportsRes.data || []);
      
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
    assets,
    disposed,
    categories,
    locations,
    reports,
    users,
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
