import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from 'sweetalert2'; // For notifications
import bgImage from "../assets/school inventory image.png"; // Ensure this path is correct
import { Eye, EyeOff, User, Mail, CalendarDays, Phone, LogIn, UserPlus, Lock } from "lucide-react"; // Added more icons

// Define the API_BASE_URL using Vite's environment variable syntax.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// It's good practice to define input fields array outside the component
// if it doesn't depend on component's state or props that change frequently.
const formFieldsConfig = [
  { label: "Full Name", type: "text", name: "fullname", placeholder: "Enter your full name", icon: User },
  { label: "Email Address", type: "email", name: "email", placeholder: "you@example.com", icon: Mail },
  { label: "Date of Birth", type: "date", name: "dob", placeholder: "", icon: CalendarDays }, // Placeholder for date is often ignored by browser
  { label: "Phone Number", type: "tel", name: "phone", placeholder: "Enter your phone number", icon: Phone },
];

const SignupForm = () => {
  const [values, setValues] = useState({
    fullname: "",
    email: "",
    dob: "",
    phone: "",
    password: "",
    // --- RECTIFIED: Add the 'role' field with a default value ---
    // Choose a default role that makes sense for new users
    // e.g., 'Staff', 'User', 'Viewer'.
    // If 'Viewer' is too restrictive, 'Staff' might be a common default.
    role: "Staff", // <-- ADDED THIS LINE with your desired default role
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChanges = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Basic validation (can be expanded)
    for (const key in values) {
      // Exclude 'role' from this specific empty field check if it's always default
      // Or ensure 'role' is always set and doesn't trigger this warning
      if (key !== 'role' && values[key].trim() === "") { // <-- MODIFIED this line
        Swal.fire({
          title: 'Missing Information',
          text: `Please fill in the ${key.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`,
          icon: 'warning',
          confirmButtonColor: '#f59e0b',
        });
        return;
      }
    }
    // Optional: Add more specific validation like email format, password strength, phone number format

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/signup`,
        values // `values` now includes the 'role' field
      );
      if (response.status === 201) {
        await Swal.fire({
          title: 'Account Created!',
          text: 'Your account has been successfully created. Please login to continue.',
          icon: 'success',
          confirmButtonColor: '#4f46e5',
          confirmButtonText: 'Go to Login',
        });
        navigate("/login");
      }
    } catch (err) {
      console.error("Signup error:", err.response ? err.response.data : err.message);
      let title = 'Signup Failed';
      let text = 'An unexpected error occurred. Please try again.';
      if (err.response) {
        // Customize message based on backend error
        if (err.response.status === 409) { // Example: Conflict, user already exists
            text = err.response.data.error || 'An account with this email or phone already exists.';
        } else {
            text = err.response.data.message || err.response.data.error || text; // Prioritize `message` if backend sends it
        }
      }
      Swal.fire({
        title,
        text,
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center px-4 py-8 selection:bg-indigo-500 selection:text-white"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-800/60 to-indigo-900/70 z-0"></div>

      <div className="relative z-10 bg-white/95 backdrop-blur-sm shadow-2xl rounded-xl md:rounded-2xl w-full max-w-md p-6 md:p-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Create Account</h1>
          <p className="text-sm text-gray-600 mt-2">Join us and manage your inventory effectively.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {formFieldsConfig.map(({ label, type, name, placeholder, icon: IconComponent }) => {
            const isEmpty = values[name]?.trim() === "";
            return (
              <div key={name}>
                <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                  {label}
                </label>
                <div className="relative">
                  {IconComponent && isEmpty && ( // Show icon only if field is empty
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IconComponent size={18} className="text-gray-400" />
                    </div>
                  )}
                  <input
                    type={type}
                    id={name}
                    name={name}
                    placeholder={type === 'date' ? '' : placeholder}
                    value={values[name]}
                    onChange={handleChanges}
                    className={`
                      ${IconComponent && isEmpty ? 'pl-10' : 'pl-3'}
                      pr-3 py-2.5 block w-full rounded-lg border border-gray-300 shadow-sm
                      focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50
                      transition-all duration-150 ease-in-out sm:text-sm
                      disabled:opacity-70 disabled:bg-gray-100
                      ${type === 'date' && !values[name] ? 'text-gray-400' : ''}
                    `}
                    disabled={isLoading}
                    onFocus={(e) => { if (type === 'date') e.target.type = 'date'; }}
                    onBlur={(e) => { if (type === 'date' && !e.target.value) e.target.type = 'text'; }}
                    {...(type === 'date' && !values[name] && {type: 'text', placeholder: "Select Date of Birth"})}
                  />
                </div>
              </div>
            );
          })}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              {values.password.trim() === "" && ( // Show lock icon if password field is empty
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
              )}
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Create a strong password"
                value={values.password}
                onChange={handleChanges}
                className={`
                  ${values.password.trim() === "" ? 'pl-10' : 'pl-3'}
                  pr-10 py-2.5 block w-full rounded-lg border border-gray-300 shadow-sm
                  focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50
                  transition-all duration-150 ease-in-out sm:text-sm
                  disabled:opacity-70 disabled:bg-gray-100
                `}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded-md disabled:opacity-50"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg py-2.5 px-4 font-semibold transition-all duration-150 ease-in-out
                        hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                        active:scale-[0.98]
                        disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Sign Up
              </>
            )}
          </button>

          <div className="text-sm text-center text-gray-600 pt-2">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-indigo-600 font-medium hover:text-indigo-500 hover:underline"
            >
              Login here
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

export default SignupForm;