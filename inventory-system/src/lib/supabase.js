import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing in .env file!');
} else {
  console.log('Supabase initialized with URL:', supabaseUrl.substring(0, 20) + '...');
}

// Only initialize if we have a valid URL to prevent crash
export const supabase = supabaseUrl 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// =========================================
// DATA FETCHING FUNCTIONS
// =========================================

export const fetchCategories = async () => {
  if (!supabase) return { data: null, error: 'Supabase not configured' };
  const { data, error } = await supabase.from('categories').select('*');
  return { data, error };
};

export const fetchLocations = async () => {
  if (!supabase) return { data: null, error: 'Supabase not configured' };
  const { data, error } = await supabase.from('locations').select('*');
  return { data, error };
};

export const fetchAssets = async () => {
  if (!supabase) return { data: null, error: 'Supabase not configured' };
  const { data, error } = await supabase
    .from('assets')
    .select(`
      *,
      categories (id, name),
      locations (id, name, building, floor)
    `);
  return { data, error };
};

export const fetchReports = async () => {
  if (!supabase) return { data: null, error: 'Supabase not configured' };
  const { data, error } = await supabase.from('reports').select('*');
  return { data, error };
};

export const fetchUsers = async () => {
  if (!supabase) return { data: null, error: 'Supabase not configured' };
  const { data, error } = await supabase.from('users').select('*');
  return { data, error };
};

export const fetchAdminCredentials = async () => {
  if (!supabase) return { data: null, error: 'Supabase not configured' };
  const { data, error } = await supabase.from('admin_credentials').select('*');
  return { data, error };
};
