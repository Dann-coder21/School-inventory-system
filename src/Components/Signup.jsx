import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import "../Styles/Signup.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import bgImage from "../assets/school inventory image.png"; 


const SignupForm = () => {
  const [values, setValues] = useState({
    fullname: "",
    email: "",
    dob: "",
    phone: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
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
    <div
      className="signup-body"
      style={{
        minHeight: "100vh",
        backgroundImage: `url(${bgImage})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
      }}
    >
      <div
        className="container"
        style={{
          maxWidth: "450px",
          width: "100%",
          background: "#fff",
          padding: "2rem",
          borderRadius: "1rem",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div className="header" style={{ marginBottom: "1.5rem", textAlign: "center" }}>
          <h2 style={{ marginBottom: "0.5rem", color: "#333" }}>Sign Up</h2>
          <p style={{ color: "#666" }}>Create an account to get started.</p>
        </div>

        <form className="signup-form" onSubmit={handleSubmit}>
          {[
            { label: "Full Name", type: "text", name: "fullname", placeholder: "Enter your full name" },
            { label: "Email", type: "email", name: "email", placeholder: "Enter your email" },
            { label: "Date of Birth", type: "date", name: "dob", placeholder: "" },
            { label: "Phone Number", type: "tel", name: "phone", placeholder: "Enter your phone number" },
          ].map(({ label, type, name, placeholder }) => (
            <div className="form-group" style={{ marginBottom: "1rem" }} key={name}>
              <label htmlFor={name} style={{ display: "block", marginBottom: "0.5rem", color: "#444" }}>
                {label}
              </label>
              <input
                type={type}
                id={name}
                name={name}
                placeholder={placeholder}
                required
                onChange={handleChanges}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #ccc",
                }}
              />
            </div>
          ))}

          <div className="form-group" style={{ marginBottom: "1rem" }}>
  <label htmlFor="password" style={{ display: "block", marginBottom: "0.5rem", color: "#444" }}>
    Password
  </label>

  <div
    style={{
      position: "relative",
      display: "flex",
      alignItems: "center",
    }}
  >
    <input
      type={showPassword ? "text" : "password"}
      id="password"
      name="password"
      placeholder="Create a password"
      required
      onChange={handleChanges}
      style={{
        width: "100%",
        padding: "0.75rem 2.75rem 0.75rem 0.75rem", // right padding increased
        borderRadius: "0.5rem",
        border: "1px solid #ccc",
        fontSize: "1rem",
      }}
    />
    <span
      onClick={() => setShowPassword(!showPassword)}
      style={{
        position: "absolute",
        right: "0.75rem",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        height: "100%",
        color: "#666",
      }}
    >
      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
    </span>
  </div>
</div>


          <input
            type="submit"
            value="Sign Up"
            style={{
              width: "100%",
              background: "#4f46e5",
              color: "#fff",
              border: "none",
              padding: "0.75rem",
              borderRadius: "999px",
              cursor: "pointer",
              fontWeight: "bold",
              transition: "background 0.3s",
            }}
            onMouseOver={(e) => (e.target.style.background = "#4338ca")}
            onMouseOut={(e) => (e.target.style.background = "#4f46e5")}
          />

          <div className="switch-form" style={{ marginTop: "1rem", textAlign: "center" }}>
            <p style={{ color: "#555" }}>
              Already have an account? <a href="/login" style={{ color: "#4f46e5" }}>Login here</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupForm;
