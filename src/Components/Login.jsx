import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/Login.css";
import axios from "axios";

const Login = ({ setIsLoggedIn }) => {
  const [values, setValues] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChanges = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:3000/auth/login",
        values
      );
    
      if (response.status === 201) {
        localStorage.setItem('token',response.data.token)
        localStorage.setItem('isLoggedIn',true)
        
        navigate("/dashboard");
      }
    } catch (err) {
      console.log(err.message);
    }
  };

  return (
    <div className="Login-body">
      <div className="container">
        <div className="header">
          <h2>Welcome Back!</h2>
          <p>Please log in to continue.</p>
        </div>

        <div className="form-container">
          {/* Login Form - class name preserved */}
          <form action="#" className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={values.email}
                onChange={handleChanges}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
                value={values.password}
                onChange={handleChanges}
                required
              />
            </div>
            <input type="submit" value="Login" />
            <div className="switch-form">
              <p>
                Don't have an account?
                <a href="/signup">Sign up here</a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
