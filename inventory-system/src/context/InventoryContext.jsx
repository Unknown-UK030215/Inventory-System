import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const InventoryContext = createContext(null);

export function InventoryProvider({ children }) {
  const [assets, setAssets] = useState([]);
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

      const [assetsRes, catsRes, locsRes, reportsRes, usersRes, adminsRes] = await Promise.all([
        supabase.from('assets').select('*, categories(name), locations(name)'),
        supabase.from('categories').select('*').order('name'),
        supabase.from('locations').select('*').order('name'),
        supabase.from('reports').select('*').order('reported_at', { ascending: false }),
        supabase.from('users').select('*').order('name'),
        supabase.from('admin_credentials').select('*').order('name')
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

      setAssets(assetsRes.data || []);
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
    const assetsSubscription = supabase
      .channel('inventory-changes')
      .on('postgres_changes', { event: '*', table: 'assets' }, () => fetchData())
      .on('postgres_changes', { event: '*', table: 'reports' }, () => fetchData())
      .on('postgres_changes', { event: '*', table: 'categories' }, () => fetchData())
      .on('postgres_changes', { event: '*', table: 'locations' }, () => fetchData())
      .on('postgres_changes', { event: '*', table: 'users' }, () => fetchData())
      .on('postgres_changes', { event: '*', table: 'admin_credentials' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(assetsSubscription);
    };
  }, []);

  const value = {
    assets,
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
