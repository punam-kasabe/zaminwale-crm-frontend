import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaMoneyCheckAlt,
  FaHistory,
  FaUserPlus,
  FaChartBar,
  FaProjectDiagram,
  FaCog,
} from "react-icons/fa";

export default function Sidebar({ user }) {
  if (!user) return null;

  const baseLinks = [
    { name: "Dashboard", path: "/dashboard", icon: <FaHome /> },
    { name: "Customers", path: "/customers", icon: <FaUsers /> },
    { name: "Installments", path: "/installments", icon: <FaMoneyCheckAlt /> },
    { name: "Activity Log", path: "/activity-log", icon: <FaHistory /> },
  ];

  const adminLinks = [
    { name: "Add Customer", path: "/add-customer", icon: <FaUserPlus /> },
    { name: "Reports", path: "/reports", icon: <FaChartBar /> },
    { name: "Projects", path: "/projects", icon: <FaProjectDiagram /> },
  ];

  return (
    <div className="elastic-sidebar">

      {/* Logo */}
      <div className="sidebar-logo">
        <img src="/favicon.png" alt="logo" />
        <h1>Zamin Pvt Ltd</h1>
      </div>

      {/* Navigation */}
      <nav>
        <ul>
          {baseLinks.map((link) => (
            <li key={link.path}>
              <NavLink
                to={link.path}
                className={({ isActive }) =>
                  `elastic-link ${isActive ? "active" : ""}`
                }
              >
                <span className="icon">{link.icon}</span>
                {link.name}
              </NavLink>
            </li>
          ))}

          {user.role === "admin" &&
            adminLinks.map((link) => (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  className={({ isActive }) =>
                    `elastic-link ${isActive ? "active" : ""}`
                  }
                >
                  <span className="icon">{link.icon}</span>
                  {link.name}
                </NavLink>
              </li>
            ))}
        </ul>
      </nav>

      {/* Footer Settings */}

    </div>
  );
}
