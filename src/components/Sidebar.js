
import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import LiquidBackground from "https://cdn.jsdelivr.net/npm/threejs-components@0.0.27/build/backgrounds/liquid1.min.js";
import {
  FaHome,
  FaUsers,
  FaMoneyCheckAlt,
  FaHistory,
  FaUserPlus,
  FaChartBar,
  FaProjectDiagram,
  FaChevronDown,
  FaChevronUp,
  FaSignOutAlt,
} from "react-icons/fa";

export default function Sidebar({ user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState({});
  const canvasRef = useRef(null);

  if (!user) return null;

  /* ================= LIQUID BACKGROUND ================= */
  useEffect(() => {
    if (!canvasRef.current) return;

    const app = LiquidBackground(canvasRef.current);

    app.loadImage(
      "https://images.unsplash.com/photo-1562016600-ece13e8ba570?auto=format&fit=crop&w=1200&q=80"
    );

    app.liquidPlane.material.metalness = 0.85;
    app.liquidPlane.material.roughness = 0.25;
    app.liquidPlane.uniforms.displacementScale.value = 3;
    app.setRain(false);

    const resize = () => {
      canvasRef.current.width = 250;
      canvasRef.current.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      app?.dispose?.();
    };
  }, []);

  const toggleMenu = (menuName) => {
    setOpenMenus((prev) => ({ ...prev, [menuName]: !prev[menuName] }));
  };

  const isSubmenuActive = (submenu, mainPath) => {
    if (!submenu) return false;
    return (
      location.pathname === mainPath ||
      submenu.some((item) => item.path === location.pathname)
    );
  };

  /* ================= LINKS ================= */
  const baseLinks = [
    { name: "Dashboard", path: "/dashboard", icon: <FaHome /> },
    {
      name: "Customers",
      path: "/customers",
      icon: <FaUsers />,
      submenu: [
        { name: "All Customers", path: "/customers" },
        { name: "Active Customers", path: "/customers/active" },
        { name: "Inactive Customers", path: "/customers/inactive" },
        { name: "Customer Analytics", path: "/customers/analytics" },
      ],
    },
    { name: "Installments", path: "/installments", icon: <FaMoneyCheckAlt /> },
    { name: "Activity Log", path: "/activity-log", icon: <FaHistory /> },
  ];

  const adminLinks = [
    { name: "Add Customer", path: "/add-customer", icon: <FaUserPlus /> },
    { name: "Reports", path: "/reports", icon: <FaChartBar /> },
    { name: "Projects", path: "/projects", icon: <FaProjectDiagram /> },
  ];

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (!confirmed) return;

    // Clear auth data
    localStorage.clear();
    sessionStorage.clear();

    // Force full app reset
    window.location.replace("/login");
  };



  return (
    <div className="elastic-sidebar" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* 🔥 LIQUID CANVAS */}
      <canvas ref={canvasRef} className="sidebar-liquid-canvas" />

      {/* Logo */}
      <div className="sidebar-logo">
        <img src="/favicon.png" alt="logo" />
        <h1>Zamin Pvt Ltd</h1>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <ul style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, margin: 0 }}>
          {baseLinks.map((link) => (
            <li key={link.name}>
              {link.submenu ? (
                <>
                  <div
                    className={`elastic-link submenu-toggle ${isSubmenuActive(link.submenu, link.path) ? "active" : ""}`}
                    onClick={() => toggleMenu(link.name)}
                  >
                    <span className="icon">{link.icon}</span>
                    {link.name}
                    <span className="submenu-icon">
                      {openMenus[link.name] || isSubmenuActive(link.submenu, link.path) ? <FaChevronUp /> : <FaChevronDown />}
                    </span>
                  </div>

                  {(openMenus[link.name] || isSubmenuActive(link.submenu, link.path)) && (
                    <ul className="submenu">
                      {link.submenu.map((sub) => (
                        <li key={sub.path}>
                          <NavLink
                            to={sub.path}
                            className={({ isActive }) => `elastic-link ${isActive ? "active" : ""}`}
                          >
                            {sub.name}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <NavLink
                  to={link.path}
                  className={({ isActive }) => `elastic-link ${isActive ? "active" : ""}`}
                >
                  <span className="icon">{link.icon}</span>
                  {link.name}
                </NavLink>
              )}
            </li>
          ))}

          {user.role === "admin" &&
            adminLinks.map((link) => (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  className={({ isActive }) => `elastic-link ${isActive ? "active" : ""}`}
                >
                  <span className="icon">{link.icon}</span>
                  {link.name}
                </NavLink>
              </li>
            ))}

          {/* LOGOUT BUTTON */}
          <li style={{ marginTop: "auto" }}>
            <div
              className="elastic-link logout-link"
              onClick={handleLogout}
              style={{
                color: "#ff4d4f",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 15px",
              }}
            >
              <FaSignOutAlt />
              Logout
            </div>
          </li>

        </ul>
      </nav>
    </div>
  );
}
