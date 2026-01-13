import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

function Login({ setUser }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ✅ Users (Your CRM)
  const users = [
    { email: "zaminwale@zaminwale.com", password: "Zaminwale@123", role: "admin", name: "Zaminwale" },
    { email: "netra@zaminwale.com", password: "NetraZamin@123", role: "admin", name: "Netra" },
    { email: "puja@zaminwale.com", password: "PujaZamin@123", role: "admin", name: "Puja" },
    { email: "siddhi@zaminwale.com", password: "SiddhiZaminwale@123", role: "admin", name: "Siddhi" },
    { email: "rani@zaminwale.com", password: "RaniZamin@123", role: "admin", name: "Rani" },
    { email: "superadmin@zaminwale.in", password: "zamin@supercrm", role: "superadmin", name: "Super Admin" },
    { email: "user@zaminwale.in", password: "zamin@usercrm", role: "user", name: "user" },
    { email: "usershalakha2025@gmail.com", password: "ShalakhaCrm@2025", role: "user", name: "Shalakha" },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = users.find(u => u.email === email && u.password === password);
    if (found) {
      localStorage.setItem("user", JSON.stringify(found));
      if (setUser) setUser(found);
      navigate("/dashboard");
    } else {
      alert("❌ Invalid credentials. Please Try Again.");
    }
  };

  const handleDemoLogin = () => {
    const demoUser = users.find(u => u.role === "user");
    if (demoUser) {
      localStorage.setItem("user", JSON.stringify(demoUser));
      if (setUser) setUser(demoUser);
      navigate("/dashboard");
    }
  };

  return (
    <div className="login-screen">
      {/* Floating background elements */}
      <div className="floating-element"></div>
      <div className="floating-element"></div>
      <div className="floating-element"></div>

      <div className="login-form-container">
      {/* Logo */}
              <div className="login-logo">
                <img src="/logo.png" alt="Zaminwale Logo" />
              </div>


        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="login-btn">Login</button>
        </form>

        <button
          onClick={() => {
            alert("❌ Staff login disabled. Kindly login with admin account.");
          }}
          className="login-btn login-btn--ghost mt-3"
        >
          Staff Login
        </button>

      </div>
    </div>
  );
}
export default Login;
