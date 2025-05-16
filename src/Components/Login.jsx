import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from 'sweetalert2';
import bgImage from "../assets/school inventory image.png"; 
import { Eye, EyeOff } from "lucide-react"; // Make sure to install `lucide-react` or use your preferred icon lib

const Login = ({ setIsLoggedIn }) => {
  const [values, setValues] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChanges = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await axios.post("http://localhost:3000/auth/login", values);
    if (response.status === 201) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("isLoggedIn", true);

      // Show welcome modal
      await Swal.fire({
        title: 'Welcome Back!',
        text: 'You have successfully logged in.',
        icon: 'success',
        confirmButtonColor: '#4f46e5',
        confirmButtonText: 'Continue to Dashboard',
      });

      // Navigate after user clicks confirm
      navigate("/dashboard");
    }
  } catch (err) {
  console.error("Login error:", err.message);
  const status = err.response?.status;

  // Customize error based on status code
  if (status === 401) {
    Swal.fire({
      title: 'Unknown User',
      text: 'The email or password you entered does not match our records.',
      icon: 'warning',
      confirmButtonColor: '#f59e0b', // amber
    });
  } else {
    Swal.fire({
      title: 'Login Failed',
      text: err.response?.data?.error || 'Invalid Credentials.',
      icon: 'error',
      confirmButtonColor: '#ef4444',
    });
  }
}

};

  return (
    <div
  className="relative min-h-screen flex items-center justify-center bg-cover bg-center px-4"
  style={{ backgroundImage: `url(${bgImage})` }}
>
  <div className="absolute inset-0 bg-black/40 z-0"></div>
  <div className="relative z-10 bg-white bg-opacity-90 shadow-2xl rounded-3xl w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold text-gray-800">Welcome Back!</h2>
          <p className="text-sm text-gray-600">Please log in to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={values.email}
              onChange={handleChanges}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter your password"
                value={values.password}
                onChange={handleChanges}
                required
                className="block w-full rounded-md border border-gray-300 shadow-sm p-2 pr-10 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-indigo-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white rounded-full py-2 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            Login
          </button>
          <div className="text-sm text-center text-gray-600">
            Don’t have an account?{" "}
            <a href="/signup" className="text-indigo-600 font-medium hover:underline">
              Sign up here
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
