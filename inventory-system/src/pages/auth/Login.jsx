import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import psuLogo from "../../assets/Psu_Library.png";
import psuBg from "../../assets/PSU-new.jpg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("staff"); // 'staff' or 'admin'
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resetStep, setResetStep] = useState(1); // 1: Email, 2: OTP/NewPassword
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const navigate = useNavigate();

  // Handle cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!supabase) {
      setError("Supabase is not configured. Please check your .env file.");
      return;
    }

    setLoading(true);
    setError(null);

    // Handle Admin login using admin_credentials table (Same as Staff logic)
    if (role === "admin") {
      try {
        const { data: adminData, error: adminError } = await supabase
          .from('admin_credentials')
          .select('*')
          .or(`email.eq.${email},username.eq.${email}`)
          .eq('password', password)
          .single();

        if (adminError || !adminData) {
          throw new Error("Invalid admin username/email or password.");
        }

        // Successfully logged in as admin
        localStorage.setItem("user", "admin");
        localStorage.setItem("admin_user", JSON.stringify({
          id: adminData.id,
          username: adminData.username,
          name: adminData.name,
          email: adminData.email
        }));
        
        navigate("/admin/dashboard");
        return;
      } catch (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
    }

    // Handle Staff login using users table (Support Username or Email)
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq.${email},username.eq.${email}`)
        .eq('password', password)
        .single();

      if (userError || !userData) {
        throw new Error("Invalid staff username/email or password.");
      }

      // Successfully logged in as staff
      localStorage.setItem("user", role);
      localStorage.setItem("staff_user", JSON.stringify({
        id: userData.id,
        username: userData.username,
        name: userData.name,
        email: userData.email
      }));

      navigate("/staff/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!supabase) return;

    setLoading(true);
    setError(null);

    try {
      if (resetStep === 1) {
        // Step 1: Send OTP to email based on role
        const table = role === 'admin' ? 'admin_credentials' : 'users';
        const { data: userData, error: checkError } = await supabase
          .from(table)
          .select('email')
          .eq('email', email)
          .single();

        if (checkError || !userData) {
          throw new Error(`${role.charAt(0).toUpperCase() + role.slice(1)} email not found.`);
        }

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/login'
        });
        
        if (resetError) {
          if (resetError.message.includes("rate limit")) {
            throw new Error("Too many requests. Please check your email or wait a few minutes.");
          }
          throw resetError;
        }

        setResetStep(2);
        setCooldown(60); // Start 60 second cooldown
        console.log("OTP requested for:", email);
      } else {
        // Step 2: Verify OTP and Update Password
        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'recovery'
        });

        if (verifyError) {
          console.error("Verification error:", verifyError);
          throw new Error("Invalid or expired authentication code. Please try again.");
        }

        // 3. Update the password in Supabase Auth (since verifyOtp only signs you in)
        const { error: authUpdateError } = await supabase.auth.updateUser({ password: newPassword });
        if (authUpdateError) throw authUpdateError;

        // 4. Update the password in the correct table (admin_credentials or users)
        const table = role === 'admin' ? 'admin_credentials' : 'users';
        const { error: updateError } = await supabase
          .from(table)
          .update({ password: newPassword })
          .eq('email', email);

        if (updateError) throw updateError;

        setResetSent(true);
        // Also sign out from the temporary recovery session to be safe
        await supabase.auth.signOut();
        setTimeout(() => {
          setIsForgotPassword(false);
          setResetStep(1);
          setResetSent(false);
          setOtp("");
          setNewPassword("");
        }, 3000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isForgotPassword) {
    return (
      <div 
        className="login-page-container" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${psuBg})`
        }}
      >
        <form
          onSubmit={handleResetPassword}
          className="login-card"
        >
          <div className="login-form-content">
            <div className="flex justify-center mb-4">
              <img src={psuLogo} alt="PSU Logo" className="login-logo" />
            </div>
            <h2 className="text-2xl mb-2 font-bold text-center">Reset {role.charAt(0).toUpperCase() + role.slice(1)} Password</h2>
            <p className="text-gray-500 text-center mb-6">
              {resetSent 
                ? "Password updated successfully!" 
                : resetStep === 1 
                  ? `Enter your ${role} email to receive an authentication code.`
                  : "Enter the code sent to your email and your new password."}
            </p>

          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 text-sm rounded text-center">
              {error}
            </div>
          )}

          {!resetSent ? (
            <>
              {resetStep === 1 ? (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-semibold mb-1">{role.charAt(0).toUpperCase() + role.slice(1)} Email</label>
                    <input
                      type="email"
                      className="login-input"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button 
                    disabled={loading || cooldown > 0}
                    className="w-full p-2 rounded font-bold text-white mb-4 disabled:opacity-50 login-button"
                  >
                    {loading 
                      ? "Processing..." 
                      : cooldown > 0 
                        ? `Wait ${cooldown}s` 
                        : "Send Code"}
                  </button>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-1">Authentication Code</label>
                    <input
                      type="text"
                      className="login-input"
                      placeholder="6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-semibold mb-1">New Password</label>
                    <input
                      type="password"
                      className="login-input"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <button 
                      type="submit"
                      disabled={loading || !otp || !newPassword}
                      className="w-full p-2 rounded font-bold text-white mb-2 disabled:opacity-50 login-button"
                    >
                      {loading ? "Verifying..." : "Verify and Reset Password"}
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setResetStep(1);
                        setCooldown(0);
                      }}
                      className="text-xs text-blue-600 hover:underline mb-4"
                    >
                      Didn't get the code? Try again
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 text-green-700 p-3 rounded-full">
                ✓
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setIsForgotPassword(false);
              setResetStep(1);
            }}
            className="w-full text-sm text-gray-500 hover:text-gray-700 font-medium"
          >
            ← Back to Login
          </button>
        </div>
      </form>
      </div>
    );
  }

  return (
    <div 
      className="login-page-container" 
      style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${psuBg})`
      }}
    >
      <form
        onSubmit={handleLogin}
        className="login-card"
      >
        <div className="login-form-content">
          <div className="flex justify-center mb-4">
            <img src={psuLogo} alt="PSU Logo" className="login-logo" />
          </div>

          <h2 className="text-2xl mb-2 font-bold text-center">Welcome Back</h2>
          <p className="text-gray-500 text-center mb-6">Inventory Management System</p>


        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 text-sm rounded text-center">
            {error}
          </div>
        )}

        <div className="role-toggle">
          <button
            type="button"
            className={role === 'staff' ? 'active' : ''}
            onClick={() => setRole('staff')}
          >
            Staff
          </button>
          <button
            type="button"
            className={role === 'admin' ? 'active' : ''}
            onClick={() => setRole('admin')}
          >
            Admin
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1">
            Username or Email
          </label>
          <input
            type="text"
            className="login-input"
            placeholder="Enter username or email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-semibold">Password</label>
            <button 
              type="button"
              onClick={() => setIsForgotPassword(true)}
              className="text-xs text-blue-600 hover:underline border-none bg-transparent cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
          <input
            type="password"
            className="login-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          disabled={loading}
          className="w-full p-2 rounded font-bold text-white transition-all disabled:opacity-50 login-button"
        >
          {loading ? "Logging in..." : `Login as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
        </button>
      </div>
    </form>

    </div>
  );
}