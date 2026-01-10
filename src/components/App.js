import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar.js";
import Dashboard from "./Dashboard.js";
import CustomerList from "./CustomerList.js";
import CustomerDetails from "./CustomerDetails.js";
import CustomerInstallmentsPage from "./CustomerInstallmentsPage.js";
import AddCustomer from "./AddCustomer.js";
import Reports from "./Reports.js";
import Projects from "./Projects.js";
import Installments from "./Installments.js";
import Login from "./Login.js";
import CustomerPreview from "./CustomerPreview.js";
import ProjectCustomersPage from "./ProjectCustomersPage.js";
import ProjectLocation from "./ProjectLocation.js";
import InstallmentCollection from "./InstallmentCollection.js";
import ActivityLogPage from "./ActivityLogPage.js";
import EditReport from "./EditReport.js";
import ActiveCustomers from "./ActiveCustomers.js";
import InactiveCustomers from "./InactiveCustomers.js";
import CustomerAnalytics from "./CustomerAnalytics.js";
import TotalReceived from "./TotalReceived.js";
import Profile from "./Profile.js";
import TotalCollection from "./TotalCollection.js";
import Villa99Revenue from "./Villa99Revenue.js";

/* Context */
import { CustomerProvider } from "../context/CustomerContext.js";
import { NotificationProvider } from "../context/NotificationContext.js";

/* 🎨 Theme CSS */
import "../styles/newYearTheme.css"; // optional: remove if you want totally normal theme

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  /* 🔹 Load user from localStorage */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  /* 🔹 Save last visited page */
  useEffect(() => {
    if (user && location.pathname !== "/login") {
      localStorage.setItem("lastPage", location.pathname);
    }
  }, [location.pathname, user]);

  /* 🔹 Logout */
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("lastPage");
    setUser(null);
    navigate("/login");
  };

  return (
    <CustomerProvider>
      <NotificationProvider>
        <div
          className="app-container"
          style={{ display: "flex", minHeight: "100vh" }}
        >
          {/* Sidebar */}
          {user && <Sidebar user={user} />}

          {/* Main Content */}
          <div
            className="dashboard-container"
            style={{ flex: 1, padding: "20px", background: "#f5f5f5" }}
          >
            {user ? (
              <Routes>
                {/* Dashboard */}
                <Route
                  path="/dashboard"
                  element={<Dashboard user={user} handleLogout={handleLogout} />}
                />

                {/* 99Villa Revenue */}
                <Route
                  path="/dashboard/99villa"
                  element={<Villa99Revenue />}
                />

                {/* Profile */}
                <Route path="/profile" element={<Profile user={user} />} />

                {/* Customers */}
                <Route path="/customers" element={<CustomerList user={user} />} />
                <Route path="/customers/active" element={<ActiveCustomers />} />
                <Route path="/customers/inactive" element={<InactiveCustomers />} />
                <Route path="/customers/analytics" element={<CustomerAnalytics />} />
                <Route path="/customers/:customerId" element={<CustomerDetails />} />
                <Route
                  path="/customers/:customerId/installments"
                  element={<CustomerInstallmentsPage />}
                />

                {/* Installments */}
                <Route path="/installments" element={<Installments />} />
                <Route
                  path="/installment-collection"
                  element={<InstallmentCollection />}
                />

                {/* Preview */}
                <Route path="/customer-preview/:id" element={<CustomerPreview />} />

                {/* Projects */}
                <Route
                  path="/project/:projectName"
                  element={<ProjectCustomersPage />}
                />
                <Route path="/project-location" element={<ProjectLocation />} />

                {/* Logs & Reports */}
                <Route path="/activity-log" element={<ActivityLogPage />} />
                <Route path="/total-received" element={<TotalReceived />} />
                <Route path="/total-collection" element={<TotalCollection />} />

                {/* Admin Only */}
                {user.role === "admin" && (
                  <>
                    <Route path="/add-customer" element={<AddCustomer />} />
                    <Route path="/reports" element={<Reports user={user} />} />
                    <Route path="/edit-report/:id" element={<EditReport />} />
                    <Route path="/projects" element={<Projects user={user} />} />
                  </>
                )}

                {/* Default */}
                <Route
                  path="*"
                  element={
                    <Navigate
                      to={localStorage.getItem("lastPage") || "/dashboard"}
                      replace
                    />
                  }
                />
              </Routes>
            ) : (
              <Routes>
                <Route path="/login" element={<Login setUser={setUser} />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            )}
          </div>
        </div>
      </NotificationProvider>
    </CustomerProvider>
  );
}

export default App;
