import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function Profile() {
  const navigate = useNavigate();
  const [staffUser, setStaffUser] = useState(null);
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
    const fetchStaffData = async () => {
      const storedStaff = localStorage.getItem("staff_user");
      if (storedStaff) {
        const parsed = JSON.parse(storedStaff);
        // Fetch latest data from database
        if (supabase) {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', parsed.id)
            .single();
          
          if (data && !error) {
            setUsername(data.username || "");
            setName(data.name || "");
            setEmail(data.email || "");
            setStaffUser(data);
            localStorage.setItem("staff_user", JSON.stringify(data));
          }
        }
      }
    };
    
    fetchStaffData();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("supabase_session");
    localStorage.removeItem("staff_user");
    navigate("/");
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      if (!supabase) throw new Error("Database not connected.");

      const oldEmail = staffUser.email || "";
      const emailChanged = email !== oldEmail && email !== "";

      const { error } = await supabase
        .from('users')
        .update({ username, name, email })
        .eq('id', staffUser.id);

      if (error) throw error;
      
      const updatedUser = { ...staffUser, username, name, email };
      localStorage.setItem("staff_user", JSON.stringify(updatedUser));
      setStaffUser(updatedUser);
      
      if (emailChanged) {
        const { error: authEmailError } = await supabase.auth.updateUser({ email });
        if (authEmailError) throw authEmailError;

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

      const { error: authError } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (authError) throw authError;

      const { error: dbError } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('id', staffUser.id);
      
      if (dbError) console.error("Database password update failed:", dbError);
      
      setMessage("Password updated successfully!");
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
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="text-gray-500">Manage your staff account information</p>
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
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Username</label>
              <input
                type="text"
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Recovery Email</label>
              <input
                type="email"
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-50 font-bold"
            >
              {loading ? "Processing..." : "Update Profile"}
            </button>
          </form>
        </div>

        {showVerifyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
              <h2 className="text-xl font-bold mb-2">Verify Email</h2>
              <p className="text-sm text-gray-500 mb-4">
                Enter the code sent to <strong>{email}</strong>.
              </p>
              
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <input
                  type="text"
                  required
                  maxLength="6"
                  className="w-full p-3 border rounded text-center text-2xl tracking-widest font-bold focus:ring-2 focus:ring-green-500 outline-none"
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
                    Skip
                  </button>
                  <button
                    type="submit"
                    disabled={verifying}
                    className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {verifying ? "Verifying..." : "Verify"}
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
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Confirm Password</label>
              <input
                type="password"
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-black transition disabled:opacity-50 font-bold"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

        <div className="pt-6 border-t border-gray-200 mt-8">
          <button
            onClick={logout}
            className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-md flex items-center justify-center gap-2"
          >
            <span>Logout from Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
