import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("staff"); // 'staff' or 'admin'
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    localStorage.setItem("user", role);
    if (role === "admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/staff/dashboard");
    }
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    // Simulate sending reset email
    setResetSent(true);
    setTimeout(() => {
      setResetSent(false);
      setIsForgotPassword(false);
    }, 3000);
  };

  if (isForgotPassword) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <form
          onSubmit={handleResetPassword}
          className="login-card"
        >
          <h2 className="text-2xl mb-2 font-bold text-center">Reset Password</h2>
          <p className="text-gray-500 text-center mb-6">
            {resetSent 
              ? "We've sent reset instructions to your email." 
              : "Enter your email to receive a password reset link."}
          </p>

          {!resetSent ? (
            <>
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  className="login-input"
                  placeholder="name@company.com"
                  required
                />
              </div>
              <button className="w-full p-2 rounded font-bold text-white bg-blue-600 hover:bg-blue-700 mb-4">
                Send Reset Link
              </button>
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
            onClick={() => setIsForgotPassword(false)}
            className="w-full text-sm text-gray-500 hover:text-gray-700 font-medium"
          >
            ← Back to Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">

      <form
        onSubmit={handleLogin}
        className="login-card"
      >

        <h2 className="text-2xl mb-2 font-bold text-center">Welcome Back</h2>
        <p className="text-gray-500 text-center mb-6">Please login to your account</p>

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
          <label className="block text-sm font-semibold mb-1">Email Address</label>
          <input
            type="text"
            className="login-input"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-semibold">Password</label>
            {role === 'staff' && (
              <button 
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="text-xs text-blue-600 hover:underline border-none bg-transparent cursor-pointer"
              >
                Forgot password?
              </button>
            )}
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
          className={`w-full p-2 rounded font-bold text-white transition-colors ${
            role === 'admin' ? 'bg-gray-900 hover:bg-black' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          Login as {role.charAt(0).toUpperCase() + role.slice(1)}
        </button>

      </form>

    </div>
  );
}