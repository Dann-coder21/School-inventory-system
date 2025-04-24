import React, { useState } from "react";
import "../Styles/Signup.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const SignupForm = () => {
  const [values, setValues] = useState({
    fullname: "",
    email: "",
    dob: "",
    phone: "",
    password: "",
  });
  const navigate = useNavigate();

  const handleChanges = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(values);
    try {
      const response = await axios.post(
        "http://localhost:3000/auth/signup",
        values
      );
      if (response.status === 201) {
        navigate("/login");
      }
    } catch (err) {
      console.log(err.message);
    }
  };

  return (
    <div className="signup-body">
      <div className="container">
        <div className="header">
          <h2>Sign Up</h2>
          <p>Create an account to get started.</p>
        </div>

        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fullname">Full Name</label>
            <input
              type="text"
              id="fullname"
              placeholder="Enter your full name"
              required
              name="fullname"
              onChange={handleChanges}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              required
              name="email"
              onChange={handleChanges}
            />
          </div>

          <div className="form-group">
            <label htmlFor="dob">Date of Birth</label>
            <input
              type="date"
              id="dob"
              required
              name="dob"
              onChange={handleChanges}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              placeholder="Enter your phone number"
              required
              name="phone"
              onChange={handleChanges}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Create a password"
              required
              name="password"
              onChange={handleChanges}
            />
          </div>

          <input type="submit" value="Sign Up" />

          <div className="switch-form">
            <p>
              Already have an account? <a href="/login">Login here</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupForm;
