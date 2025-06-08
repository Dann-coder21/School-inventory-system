// --- IMPORTS ---
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from 'sweetalert2';
import bgImage from "../assets/school inventory image.png";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import 'sweetalert2/dist/sweetalert2.min.css';
import { useAuth } from "../contexts/AuthContext";

// --- COMPONENT DEFINITION ---
const Login = () => {
  // --- STATE HOOKS ---
  const [credentials, setCredentials] = useState({ 
    email: "", 
    password: "" 
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin, isLoadingAuth } = useAuth();

  // --- EVENT HANDLERS ---
  const handleInputChange = (e) => {
    setCredentials({ 
      ...credentials, 
      [e.target.name]: e.target.value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!credentials.email || !credentials.password) {
      showAlert({
        title: "Required Information Missing",
        text: "Please provide both your email and password to proceed.",
        icon: "warning",
      });
      return;
    }

    try {
      await authLogin(credentials.email, credentials.password);
      
      // Success modal
      await Swal.fire({
        title: "Login Successful",
        text: "You are now being redirected to your dashboard",
        icon: "success",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        customClass: { 
          popup: "z-50 rounded-xl",
          title: "text-xl font-semibold"
        },
        willClose: () => navigate("/dashboard")
      });
    } catch (err) {
      handleLoginError(err);
    }
  };

  // --- HELPER FUNCTIONS ---
  const showAlert = ({ title, text, icon }) => {
    Swal.fire({
      title,
      text,
      icon,
      confirmButtonColor: "#3b82f6",
      customClass: { 
        popup: "z-50 rounded-xl",
        title: "text-xl font-semibold",
        confirmButton: "px-4 py-2 rounded-lg"
      }
    });
  };

  const handleLoginError = (error) => {
    let alertConfig = {
      title: "Login Failed",
      text: error.message || "An unexpected error occurred. Please try again.",
      icon: "error",
    };

    if (error.message.includes("Incorrect email or password") || 
        error.message.includes("No account found")) {
      alertConfig = {
        title: "Authentication Failed",
        text: "The credentials you entered are invalid. Please verify and try again.",
        icon: "warning",
      };
    } else if (error.message.includes("Network Error")) {
      alertConfig = {
        title: "Connection Error",
        text: "Unable to connect to the server. Please check your network connection.",
        icon: "error",
      };
    }

    showAlert(alertConfig);
  };

  const handlePasswordRecovery = (e) => {
    e.preventDefault();
    showAlert({
      title: "Password Recovery",
      text: "Please contact your system administrator to reset your password.",
      icon: "info",
    });
  };

  // --- JSX RETURN ---
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-cover bg-center px-4 py-8 overflow-hidden" 
         style={{ backgroundImage: `url(${bgImage})` }}>
      
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/90 via-blue-900/80 to-indigo-950/90 backdrop-blur z-0"></div>
      
      {/* Login Card */}
      <div className="relative z-10 bg-white/10 backdrop-blur-xl shadow-2xl rounded-xl 
                      w-full max-w-md p-8 md:p-10 border border-white/20">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mb-4" />
          <h1 className="text-3xl font-bold text-white">School Inventory System</h1>
          <p className="text-gray-200 mt-2">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-100 mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <Mail size={18} className="text-gray-300" />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="john.doe@example.com"
                value={credentials.email}
                onChange={handleInputChange}
                className="pl-10 pr-3 py-2.5 w-full rounded-lg bg-white/5 border border-white/30 text-white
                          placeholder:text-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50
                          transition-all duration-200 sm:text-sm disabled:opacity-70"
                disabled={isLoadingAuth}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-100">
                Password
              </label>
              <button
                type="button"
                className="text-sm text-blue-300 hover:text-blue-200 transition-colors"
                onClick={handlePasswordRecovery}
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <Lock size={18} className="text-gray-300" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="••••••••"
                value={credentials.password}
                onChange={handleInputChange}
                className="pl-10 pr-10 py-2.5 w-full rounded-lg bg-white/5 border border-white/30 text-white
                          placeholder:text-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50
                          transition-all duration-200 sm:text-sm disabled:opacity-70"
                disabled={isLoadingAuth}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-300 hover:text-blue-300"
                disabled={isLoadingAuth}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoadingAuth}
            className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-800 
                      text-white rounded-lg py-3 px-4 font-medium shadow-md transition-all duration-200
                      hover:from-blue-700 hover:to-blue-900 hover:shadow-lg disabled:opacity-60"
          >
            {isLoadingAuth ? (
              <>
                <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Authenticating...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 text-center text-gray-200">
          <p className="text-sm">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-300 font-medium hover:text-blue-200 transition-colors">
              Request access
            </Link>
          </p>
          <p className="text-xs mt-4 opacity-75">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>

      {/* Global Footer */}
      <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/80 z-10">
        © {new Date().getFullYear()} School Inventory Management System
      </footer>
    </div>
  );
};

export default Login;