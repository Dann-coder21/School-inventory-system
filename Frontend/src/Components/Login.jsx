// --- IMPORTS ---
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// import axios from "axios"; // No longer needed for direct login post
import Swal from 'sweetalert2';
import bgImage from "../assets/school inventory image.png"; // Ensure this path is correct
import { Eye, EyeOff, LogIn, Mail, Lock } from "lucide-react";
import 'sweetalert2/dist/sweetalert2.min.css'; // Import SweetAlert2 CSS for proper styling
import { useAuth } from "../contexts/AuthContext"; // Import useAuth hook

// --- COMPONENT DEFINITION ---
// Remove setIsLoggedIn prop, AuthContext handles auth state
const Login = () => {
  // --- STATE HOOKS ---
  const [values, setValues] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  // const [isLoading, setIsLoading] = useState(false); // Remove local loading state
  const navigate = useNavigate();

  // Get login function and loading state from AuthContext
  const { login: authLogin, isLoadingAuth } = useAuth(); // Renamed to avoid conflict

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

    // Basic client-side validation
    if (!values.email || !values.password) {
        Swal.fire({
            title: 'Missing Fields',
            text: 'Please enter both email and password.',
            icon: 'warning',
            confirmButtonColor: '#f59e0b', // Amber color for warning
            customClass: { // Ensure visibility
                popup: 'z-50' // Or a higher z-index if needed
            }
        });
        return;
    }

    // setIsLoading(true); // Managed by AuthContext's isLoadingAuth
    try {
      console.log("Frontend: Attempting authLogin with values:", values);
      // CALL THE AUTH CONTEXT'S LOGIN FUNCTION
      await authLogin(values.email, values.password);
      console.log("Frontend: authLogin successful. Navigating now.");

      // After authLogin completes successfully (meaning AuthContext state is updated)
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
      // Error handling from AuthContext's login function
      const errorMsg = err.message || "An unknown error occurred during login.";
      let errorTitle = 'Login Failed';
      let errorIcon = 'error';
      let errorButtonColor = '#ef4444'; // Red for general error

      // Attempt to parse specific messages from the re-thrown error from AuthContext
      if (errorMsg.includes("Incorrect email or password")) {
          errorTitle = 'Authentication Failed';
          errorIcon = 'warning';
          errorButtonColor = '#f59e0b';
      } else if (errorMsg.includes("No account found")) {
          errorTitle = 'User Not Found';
          errorIcon = 'warning';
          errorButtonColor = '#f59e0b';
      } else if (errorMsg.includes("Network Error")) {
          errorTitle = 'Network Error';
          errorText = 'Could not connect to the server. Please check your internet connection.';
          errorIcon = 'error'; // Keep as error for network
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
      // setIsLoading(false); // Managed by AuthContext's isLoadingAuth
    }
  };

  // --- DERIVED STATE FOR UI ---
  const isEmailEmpty = values.email.trim() === "";
  const isPasswordEmpty = values.password.trim() === "";

  // Use isLoadingAuth from AuthContext for button disabled state
  const buttonDisabled = isLoadingAuth;

  // --- JSX RETURN ---
  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center px-4 py-8 selection:bg-indigo-500 selection:text-white"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-800/60 to-indigo-900/70 z-0"></div>
      
      <div className="relative z-10 bg-white/95 backdrop-blur-sm shadow-2xl rounded-xl md:rounded-2xl w-full max-w-md p-6 md:p-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Welcome Back!</h1>
          <p className="text-sm text-gray-600 mt-2">Please log in to access your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              {isEmailEmpty && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
              )}
              <input
                type="email"
                id="email"
                name="email"
                placeholder="you@example.com"
                value={values.email}
                onChange={handleChanges}
                className={`
                  ${isEmailEmpty ? 'pl-10' : 'pl-3'}
                  pr-3 py-2.5 block w-full rounded-lg border border-gray-300 shadow-sm 
                  placeholder:text-gray-400 
                  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 
                  transition-all duration-150 ease-in-out sm:text-sm 
                  disabled:opacity-70 disabled:bg-gray-100
                `}
                disabled={buttonDisabled} // Use context's loading state
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <a
                href="#"
                className="text-xs font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
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
              </a>
            </div>
            <div className="relative">
              {isPasswordEmpty && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
              )}
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="••••••••"
                value={values.password}
                onChange={handleChanges}
                className={`
                  ${isPasswordEmpty ? 'pl-10' : 'pl-3'}
                  pr-10 py-2.5 block w-full rounded-lg border border-gray-300 shadow-sm 
                  placeholder:text-gray-400
                  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 
                  transition-all duration-150 ease-in-out sm:text-sm 
                  disabled:opacity-70 disabled:bg-gray-100
                `}
                disabled={buttonDisabled} // Use context's loading state
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded-md disabled:opacity-50"
                disabled={buttonDisabled} // Use context's loading state
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={buttonDisabled} // Use context's loading state
            className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg py-2.5 px-4 font-semibold transition-all duration-150 ease-in-out 
                        hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
                        active:scale-[0.98]
                        disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {isLoadingAuth ? ( // Use context's loading state here
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Login
              </>
            )}
          </button>

          <div className="text-sm text-center text-gray-600 pt-2">
            Don’t have an account?{" "}
            <a
              href="/signup" // Consider using <Link to="/signup"> from react-router-dom for better SPA behavior
              className="text-indigo-600 font-medium hover:text-indigo-500 hover:underline"
            >
              Sign up here
            </a>
          </div>
        </form>
      </div>
      <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/70 z-10">
        © {new Date().getFullYear()} Your School Inventory. All rights reserved.
      </footer>
    </div>
  );
};

export default Login;