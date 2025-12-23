import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  // (updated)
  const users = [
    { email: "adminnetra@zaminwale.in", password: "zamin@crm", role: "admin", name: "Admin" },
    { email: "superadmin@zaminwale.in", password: "zamin@supercrm", role: "superadmin", name: "Super Admin" },
    { email: "user@zaminwale.in", password: "zamin@usercrm", role: "employee", name: "Employee" },
    { email: "usershalakha2025@gmail.com", password: "ShalakhaCrm@2025", role: "employee", name: "Admin" } // New user
  ];
   const handleSubmit = (e) => {
    e.preventDefault();
    const found = users.find(u => u.email === email && u.password === password);
    if (found) {
      localStorage.setItem("user", JSON.stringify(found));
      setUser(found);
      navigate("/dashboard");
    } else {
      alert("❌ Invalid credentials. Please try again.");
    }
  };
  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo">
          <img src="/logo.png" alt="Zaminwale Logo" />
        </div>
        <h2>Zaminwale Pvt Ltd</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="login-btn">Login</button>
        </form>
        <footer className="login-footer">
          © {new Date().getFullYear()} Zaminwale Pvt Ltd. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
export default Login;
