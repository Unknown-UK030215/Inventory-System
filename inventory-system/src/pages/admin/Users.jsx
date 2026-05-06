import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useInventory } from "../../context/InventoryContext";

export default function Users() {
  const { users, loading, error, refreshData } = useInventory();
  
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "staff"
  });

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        username: user.username || "",
        email: user.email,
        password: user.password || "",
        role: user.role || "staff"
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: "",
        username: "",
        email: "",
        password: "",
        role: "staff"
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!supabase) throw new Error("Database not connected.");

      const targetTable = formData.role === 'admin' ? 'admin_credentials' : 'users';

      if (editingUser) {
        // If role changed, we need to move the user between tables
        if (editingUser.role !== formData.role) {
          // 1. Delete from old table
          const oldTable = editingUser.role === 'admin' ? 'admin_credentials' : 'users';
          const { error: deleteError } = await supabase
            .from(oldTable)
            .delete()
            .eq('id', editingUser.id);
          
          if (deleteError) throw deleteError;

          // 2. Insert into new table
          const { error: insertError } = await supabase
            .from(targetTable)
            .insert([{
              id: editingUser.id,
              name: formData.name,
              username: formData.username,
              email: formData.email,
              password: formData.password
            }]);
          
          if (insertError) throw insertError;
        } else {
          // Just update in the same table
          const { error: updateError } = await supabase
            .from(targetTable)
            .update({
              name: formData.name,
              username: formData.username,
              password: formData.password
            })
            .eq('id', editingUser.id);

          if (updateError) throw updateError;
        }
      } else {
        // 1. Create the user in Supabase Auth first
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              role: formData.role
            }
          }
        });

        if (authError) throw authError;

        // 2. Create the user in the target table
        const { error: insertError } = await supabase
          .from(targetTable)
          .insert([{
            id: authData.user.id,
            name: formData.name,
            username: formData.username,
            email: formData.email,
            password: formData.password
          }]);

        if (insertError) throw insertError;
      }
      
      handleCloseModal();
    } catch (err) {
      alert("Error saving user: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserStatus = async (user) => {
    const currentStatus = user.is_active !== false;
    const newStatus = !currentStatus;
    const action = newStatus ? "activate" : "deactivate";
    
    if (window.confirm(`Are you sure you want to ${action} the account for ${user.name}?`)) {
      try {
        if (!supabase) throw new Error("Database not connected.");
        
        const table = user.role === 'admin' ? 'admin_credentials' : 'users';
        
        const { error: updateError } = await supabase
          .from(table)
          .update({ is_active: newStatus })
          .eq('id', user.id);

        if (updateError) {
          if (updateError.message.includes('is_active') || updateError.message.includes('column')) {
            throw new Error("Please run the SQL script first to add the 'is_active' column to your database!");
          }
          throw updateError;
        }
        refreshData();
      } catch (err) {
        alert("Error updating user status: " + err.message);
      }
    }
  };

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-500">Create and manage staff accounts</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2"
        >
          <span>+</span> Create New Account
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
          <p className="font-bold">Error loading users:</p>
          <p className="text-sm">{error}</p>
          <button 
            onClick={() => refreshData()} 
            className="mt-2 text-xs bg-red-700 text-white px-2 py-1 rounded hover:bg-red-800"
          >
            Retry
          </button>
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500 font-medium">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500 font-medium">No users found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td className="font-medium">{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${user.role === 'admin' ? 'badge-active' : 'badge-pending'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${user.is_active === false ? 'badge-danger' : 'badge-active'}`}>
                        {user.is_active === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button 
                        onClick={() => toggleUserStatus(user)}
                        className={`${user.is_active === false ? 'text-green-600 hover:text-green-800' : 'text-orange-600 hover:text-orange-800'} text-sm font-medium`}
                      >
                        {user.is_active === false ? 'Activate' : 'Deactivate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingUser ? "Edit User Account" : "Create New User Account"}</h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>

            {error && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 text-sm rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Username</label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  placeholder="johndoe123"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Password</label>
                <input
                  type="password"
                  required
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-gray-700">Role</label>
                <select
                  required
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : (editingUser ? "Update Account" : "Create Account")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
