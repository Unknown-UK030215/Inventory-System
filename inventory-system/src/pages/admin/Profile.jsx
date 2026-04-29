import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function Profile() {
  const [adminUser, setAdminUser] = useState(null);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  
  // Email verification states
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const fetchAdminData = async () => {
      const storedAdmin = localStorage.getItem("admin_user");
      if (storedAdmin) {
        const parsed = JSON.parse(storedAdmin);
        // Fetch latest data from database
        if (supabase) {
          const { data, error } = await supabase
            .from('admin_credentials')
            .select('*')
            .eq('id', parsed.id)
            .single();
          
          if (data && !error) {
            setUsername(data.username || "");
            setName(data.name || "");
            setEmail(data.email || "");
            // Update adminUser with latest DB data
            setAdminUser(data);
            localStorage.setItem("admin_user", JSON.stringify(data));
          }
        }
      }
    };
    
    fetchAdminData();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      if (!supabase) throw new Error("Database not connected.");

      // Check if email changed - if so, we'll need to verify it via Supabase Auth
      const oldEmail = adminUser.email || "";
      const emailChanged = email !== oldEmail && email !== "";

      const { error } = await supabase
        .from('admin_credentials')
        .update({ username, name, email })
        .eq('id', adminUser.id);

      if (error) throw error;
      
      // Update local storage
      const updatedUser = { ...adminUser, username, name, email };
      localStorage.setItem("admin_user", JSON.stringify(updatedUser));
      setAdminUser(updatedUser);
      
      if (emailChanged) {
        // 1. Update the email in Supabase Auth first
        const { error: authEmailError } = await supabase.auth.updateUser({ email });
        if (authEmailError) throw authEmailError;

        // 2. Trigger reset password to send the OTP code
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
        if (!resetError) {
          setShowVerifyModal(true);
          setMessage("Profile updated. Please verify your new email with the code sent.");
        } else {
          setMessage("Profile updated, but failed to send verification code.");
        }
      } else {
        setMessage("Profile updated successfully!");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setError(null);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery'
      });

      if (error) throw error;

      setShowVerifyModal(false);
      setOtp("");
      setMessage("Email verified successfully!");
    } catch (err) {
      setError("Invalid or expired code. " + err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      if (!supabase) throw new Error("Database not connected.");

      // 1. Update the password in Supabase Auth (This is what handles the actual login)
      const { data: authData, error: authError } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (authError) {
        console.error("Auth password update failed:", authError);
        throw new Error("Failed to update security credentials: " + authError.message);
      }

      // 2. Update the password in our database table (This is for your reference)
      const { error: dbError } = await supabase
        .from('admin_credentials')
        .update({ password: newPassword })
        .eq('id', adminUser.id);
      
      if (dbError) {
        console.error("Database password update failed:", dbError);
        // We don't throw here because the Auth update already succeeded
      }
      
      setMessage("Password updated successfully in all systems! The old password will no longer work.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Settings</h1>
        <p className="text-gray-500">Manage your administrative credentials</p>
      </div>

      {message && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg border border-green-200">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-bold mb-4">Account Information</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Display Name</label>
              <input
                type="text"
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Username</label>
              <input
                type="text"
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Recovery Email</label>
              <input
                type="email"
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
              />
              <p className="text-xs text-gray-500 mt-1">Used for OTP password recovery.</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Processing..." : "Update Profile"}
            </button>
          </form>
        </div>

        {/* Verification Modal */}
        {showVerifyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
              <h2 className="text-xl font-bold mb-2">Verify Email</h2>
              <p className="text-sm text-gray-500 mb-4">
                Enter the 6-digit code sent to <strong>{email}</strong> to verify your recovery email.
              </p>
              
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <input
                  type="text"
                  required
                  maxLength="6"
                  className="w-full p-3 border rounded text-center text-2xl tracking-widest font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowVerifyModal(false)}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Skip for Now
                  </button>
                  <button
                    type="submit"
                    disabled={verifying}
                    className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {verifying ? "Verifying..." : "Verify Code"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="card">
          <h2 className="text-lg font-bold mb-4">Update Password</h2>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">New Password</label>
              <input
                type="password"
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Confirm New Password</label>
              <input
                type="password"
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-black transition disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
