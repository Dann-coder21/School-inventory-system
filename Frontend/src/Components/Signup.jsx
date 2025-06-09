// src/Components/Signup.jsx

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from 'sweetalert2';
import axios from "axios"; // Ensure axios is imported
import bgImage from "../assets/school inventory image.png";
import { User, Mail, Lock, Eye, EyeOff, UserPlus, Building2 } from "lucide-react"; // Building2 for department icon

// Define the API_BASE_URL using Vite's environment variable syntax.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// Simplified input fields array (no DOB/Phone)
const formFieldsConfig = [
  { label: "Full Name", type: "text", name: "fullname", placeholder: "Enter your full name", icon: User },
  { label: "Email Address", type: "email", name: "email", placeholder: "you@example.com", icon: Mail },
];

const SignupForm = () => {
  const [values, setValues] = useState({
    fullname: "",
    email: "",
    password: "",
    role: "Staff", // Default role
    department_id: "", // Manual input
    phone: "", // Re-added to state as it might be used in backend, even if not on frontend form
    dob: "", // Re-added to state as it might be used in backend, even if not on frontend form
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For form submission
  const navigate = useNavigate();

  const handleChanges = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation for required fields
    const requiredFields = ['fullname', 'email', 'password'];
    // Department ID is conditionally required based on role
    if (['Staff', 'DepartmentHead'].includes(values.role)) {
      requiredFields.push('department_id');
    }

    for (const fieldName of requiredFields) {
      // Trim values before checking for emptiness
      if (!values[fieldName] || String(values[fieldName]).trim() === "") {
        Swal.fire({
          title: 'Missing Information',
          text: `Please provide your ${fieldName.replace(/([A-Z])/g, ' $1').toLowerCase()}.`,
          icon: 'warning',
          confirmButtonColor: '#f59e0b',
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      // --- CRITICAL: Set status to 'pending' here ---
      const userPayload = {
        ...values,
        status: 'pending', // This is what signals that admin approval is needed
        // dob and phone are still included in the payload, but can be null if not collected by form
        dob: values.dob || null, 
        phone: values.phone || null,
      };

      const response = await axios.post(
        `${API_BASE_URL}/auth/signup`,
        userPayload
      );

      if (response.status === 201) {
        await Swal.fire({
          title: 'Account Created!',
          text: 'Your account has been successfully created and is awaiting admin approval. You will be able to log in once it\'s approved.',
          icon: 'success',
          confirmButtonColor: '#4f46e5',
          confirmButtonText: 'OK',
        });
        navigate("/login"); // Redirect to login
      }
    } catch (err) {
      console.error("Signup error:", err.response ? err.response.data : err.message);
      let title = 'Signup Failed';
      let text = 'An unexpected error occurred. Please try again.';
      if (err.response) {
        if (err.response.status === 409) {
            text = err.response.data.message || 'An account with this email already exists.';
        } else if (err.response.data?.message) {
            text = err.response.data.message;
        } else if (err.response.data?.error) {
            text = err.response.data.error;
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
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center px-4 py-8 overflow-hidden"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/90 via-blue-900/80 to-indigo-950/90 backdrop-blur z-0"></div>

      {/* Signup Card */}
      <div className="relative z-10 bg-white/10 backdrop-blur-xl shadow-2xl rounded-xl
                      w-full max-w-md p-8 md:p-10 border border-white/20">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mb-4" /> {/* Placeholder logo/icon */}
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-gray-200 mt-2">Join us and manage your inventory effectively.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {formFieldsConfig.map(({ label, type, name, placeholder, icon: IconComponent }) => {
            return (
              <div key={name}>
                <label htmlFor={name} className="block text-sm font-medium text-gray-100 mb-1">
                  {label}
                </label>
                <div className="relative">
                  {/* Icon on left */}
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IconComponent size={18} className="text-gray-300" />
                  </div>
                  <input
                    type={type}
                    id={name}
                    name={name}
                    placeholder={placeholder}
                    value={values[name]}
                    onChange={handleChanges}
                    className={`
                      pl-10 pr-3 py-2.5 w-full rounded-lg bg-white/5 border border-white/30 text-white
                      placeholder:text-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50
                      transition-all duration-200 sm:text-sm disabled:opacity-70
                    `}
                    disabled={isLoading}
                    required // All fields in formFieldsConfig are required
                  />
                </div>
              </div>
            );
          })}

          {/* Role Selection */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-100 mb-1">
              Requested Role
            </label>
            <select
              id="role"
              name="role"
              value={values.role}
              onChange={handleChanges}
              className={`
                pl-3 pr-3 py-2.5 w-full rounded-lg bg-white/5 border border-white/30 text-white
                focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50
                transition-all duration-200 sm:text-sm disabled:opacity-70
              `}
              disabled={isLoading}
            >
              {/* Only allow Staff and DepartmentHead roles for self-signup */}
              <option value="Staff">Staff</option>
              <option value="DepartmentHead">Department Head</option>
            </select>
            <p className="mt-1 text-xs text-gray-400">Your role will be confirmed by an administrator.</p>
          </div>

          {/* Department ID Input Field (Manual) */}
          <div>
            <label htmlFor="department_id" className="block text-sm font-medium text-gray-100 mb-1">
              Department ID <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 size={18} className="text-gray-300" />
              </div>
              <input
                type="text"
                id="department_id"
                name="department_id"
                placeholder="Enter Department ID (e.g., IT, HR, MATH)"
                value={values.department_id}
                onChange={handleChanges}
                className={`
                  pl-10 pr-3 py-2.5 w-full rounded-lg bg-white/5 border border-white/30 text-white
                  placeholder:text-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50
                  transition-all duration-200 sm:text-sm disabled:opacity-70
                `}
                disabled={isLoading}
                required={['Staff', 'DepartmentHead'].includes(values.role)} // Conditionally required
              />
              {['Staff', 'DepartmentHead'].includes(values.role) && (
                  <p className="mt-1 text-xs text-gray-400">
                      Department is required for Staff & Department Head roles.
                  </p>
              )}
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-100 mb-1">
              Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-300" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Create a strong password"
                value={values.password}
                onChange={handleChanges}
                className={`
                  pl-10 pr-10 py-2.5 w-full rounded-lg bg-white/5 border border-white/30 text-white
                  placeholder:text-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50
                  transition-all duration-200 sm:text-sm disabled:opacity-70
                `}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-300 hover:text-blue-300"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-800
                        text-white rounded-lg py-3 px-4 font-medium shadow-md transition-all duration-200
                        hover:from-blue-700 hover:to-blue-900 hover:shadow-lg disabled:opacity-60`}
          >
            {isLoading ? (
              <>
                <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus size={20} />
                Sign Up
              </>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 text-center text-gray-200">
          <p className="text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-300 font-medium hover:text-blue-200 transition-colors">
              Login here
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

export default SignupForm;