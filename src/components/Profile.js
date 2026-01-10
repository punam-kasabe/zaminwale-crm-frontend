
// src/pages/Profile.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: "", email: "", role: "" });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "" });

  // Load user from localStorage
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      const parsed = JSON.parse(raw);
      setUser(parsed);
      setForm({
        name: parsed.name || "",
        email: parsed.email || ""
      });
    }
  }, []);

  // Logout
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Save changes
  const handleSave = (e) => {
    e.preventDefault();
    const updated = { ...user, ...form };

    setUser(updated);
    localStorage.setItem("user", JSON.stringify(updated));

    setEditing(false);
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        {/* Header */}
        <div className="profile-header">
          <div className="avatar">
            {(user.name || "A").charAt(0).toUpperCase()}
          </div>
          <div>
            <h2>{user.name || "Admin"}</h2>
            <p className="muted">
              {user.role ? user.role.toUpperCase() : "ADMIN"}
            </p>
          </div>
        </div>

        {/* VIEW MODE */}
        {!editing ? (
          <div className="profile-body">
            <div className="field">
              <label>Name</label>
              <div className="value">{user.name || "—"}</div>
            </div>

            <div className="field">
              <label>Email</label>
              <div className="value">{user.email || "—"}</div>
            </div>

            <div className="field">
              <label>Role</label>
              <div className="value">{user.role || "—"}</div>
            </div>

            <div className="profile-actions">
              <button className="btn outline" onClick={() => setEditing(true)}>
                Edit Profile
              </button>
              <button className="btn danger" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        ) : (
          // EDIT MODE
          <form className="profile-body" onSubmit={handleSave}>
            <div className="field">
              <label>Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
            </div>

            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                required
              />
            </div>

            <div className="profile-actions">
              <button className="btn" type="submit">
                Save
              </button>
              <button
                className="btn outline"
                type="button"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
