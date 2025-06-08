// --- IMPORTS ---
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from 'sweetalert2';
import bgImage from "../assets/school inventory image.png"; // Ensure this path is correct
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react"; // lucide-react for icons
import 'sweetalert2/dist/sweetalert2.min.css';
import { useAuth } from "../contexts/AuthContext";

// --- COMPONENT DEFINITION ---
const Login = () => {
  // --- STATE HOOKS ---
  const [values, setValues] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { login: authLogin, isLoadingAuth } = useAuth();

  // --- EVENT HANDLERS ---
  const handleChanges = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("--- Frontend: handleSubmit initiated ---");

    if (!values.email || !values.password) {
        Swal.fire({
            title: 'Missing Fields',
            text: 'Please enter both email and password.',
            icon: 'warning',
            confirmButtonColor: '#f59e0b', // Keep this yellow for warning
            customClass: { popup: 'z-50' }
        });
        return;
    }

    try {
      console.log("Frontend: Attempting authLogin with values:", values);
      await authLogin(values.email, values.password);
      console.log("Frontend: authLogin successful. Navigating now.");

      await Swal.fire({
          title: 'Login Successful!',
          text: 'Welcome back! Redirecting you to the dashboard...',
          icon: 'success',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          customClass: { popup: 'z-50' },
          willClose: () => {
            console.log("Frontend: Swal success closed. Navigating to /dashboard...");
            navigate("/dashboard");
          }
      });
    } catch (err) {
      console.error("--- Frontend: Login CATCH block ---");
      const errorMsg = err.message || "An unknown error occurred during login.";
      let errorTitle = 'Login Failed';
      let errorIcon = 'error';
      let errorButtonColor = '#ef4444'; // Keep this red for error

      if (errorMsg.includes("Incorrect email or password") || errorMsg.includes("No account found")) {
          errorTitle = 'Authentication Failed';
          errorIcon = 'warning';
          errorButtonColor = '#f59e0b'; // Yellow for warning
      } else if (errorMsg.includes("Network Error")) {
          errorTitle = 'Network Error';
          const errorText = 'Could not connect to the server. Please check your internet connection.';
          errorIcon = 'error';
      }

      Swal.fire({
        title: errorTitle,
        text: errorMsg,
        icon: errorIcon,
        confirmButtonColor: errorButtonColor,
        customClass: { popup: 'z-50' }
      });
    } finally {
      console.log("--- Frontend: handleSubmit finally block ---");
    }
  };

  // --- JSX RETURN ---
  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center px-4 py-8 
                 selection:bg-blue-600 selection:text-white overflow-hidden" // Blue selection
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Background Overlay: Now with blue tones for the blur effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/80 via-blue-900/70 to-indigo-950/80 backdrop-blur-sm z-0"></div>
      
      {/* Login Card: Glassmorphism Effect */}
      <div className="relative z-10 bg-white/10 backdrop-blur-xl shadow-2xl rounded-xl 
                      w-full max-w-md p-8 md:p-10 transform transition-all duration-300 ease-in-out
                      hover:scale-[1.01] hover:shadow-3xl border border-white/20"> {/* Semi-transparent white background, strong blur, subtle white border */}
        
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Welcome Back!</h1> {/* White heading */}
          <p className="text-base text-gray-200 mt-2">Please log in to access your account.</p> {/* Light gray text */}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-100 mb-1"> {/* Lighter gray label */}
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-300" /> {/* Slightly lighter gray icon */}
              </div>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="john.doe@example.com"
                value={values.email}
                onChange={handleChanges}
                className={`
                  pl-10 pr-3 py-2.5 block w-full rounded-lg bg-white/5 border border-white/30 text-white shadow-sm {/* Translucent input, lighter white border, white text */}
                  placeholder:text-gray-300 {/* Lighter placeholder */}
                  focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 {/* Blue focus */}
                  transition-all duration-200 ease-in-out sm:text-sm 
                  disabled:opacity-70 disabled:bg-white/5 disabled:text-gray-400 disabled:cursor-not-allowed
                `}
                disabled={isLoadingAuth}
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-100"> {/* Lighter gray label */}
                Password
              </label>
              <button
                type="button"
                className="text-sm font-medium text-blue-300 hover:text-blue-200 hover:underline {/* Blue link */}
                           transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600/50 rounded"
                onClick={(e) => {
                    e.preventDefault();
                    Swal.fire({
                        title:'Forgot Password?', 
                        text:'Password recovery feature is coming soon!', 
                        icon:'info',
                        customClass: { popup: 'z-50' }
                    });
                }}
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-300" /> {/* Slightly lighter gray icon */}
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="••••••••"
                value={values.password}
                onChange={handleChanges}
                className={`
                  pl-10 pr-10 py-2.5 block w-full rounded-lg bg-white/5 border border-white/30 text-white shadow-sm {/* Translucent input, lighter white border, white text */}
                  placeholder:text-gray-300
                  focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 {/* Blue focus */}
                  transition-all duration-200 ease-in-out sm:text-sm 
                  disabled:opacity-70 disabled:bg-white/5 disabled:text-gray-400 disabled:cursor-not-allowed
                `}
                disabled={isLoadingAuth}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-300 hover:text-blue-300 {/* Blue hover */}
                           focus:outline-none focus:ring-2 focus:ring-blue-600/50 rounded-md 
                           transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoadingAuth}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoadingAuth}
            className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-lg py-3 px-4 font-semibold text-lg {/* Blue to Purple gradient */}
                        shadow-md transition-all duration-200 ease-in-out 
                        hover:from-blue-700 hover:to-purple-800 hover:shadow-lg {/* Darker gradient on hover */}
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 {/* Blue focus */}
                        active:scale-[0.98]
                        disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {isLoadingAuth ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Login
              </>
            )}
          </button>

          <div className="text-base text-center text-gray-200 pt-2"> {/* Light gray text */}
            Don’t have an account?{" "}
            <Link
              to="/signup"
              className="text-blue-300 font-semibold hover:text-blue-200 hover:underline {/* Blue link */}
                         transition-colors duration-200"
            >
              Sign up here
            </Link>
          </div>
        </form>
      </div>
      <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/80 z-10">
        © {new Date().getFullYear()} Your School IMS. All rights reserved.
      </footer>
    </div>
  );
};

export default Login;