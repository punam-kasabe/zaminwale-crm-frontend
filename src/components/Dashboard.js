import React, { useContext, useMemo, useState } from "react";
import { CustomerContext } from "../context/CustomerContext.js";
import "../styles/Dashboard.css";
import { Link } from "react-router-dom";
import StatusPieChart from "../components/StatusPieChart.js";
import ProgressCircle from "../components/ProgressCircle.js";
import AdminDropdown from "../components/AdminDropdown.js";
import ThemeToggle from "../components/ThemeToggle.js";
import NotificationBell from "../components/NotificationBell.js";
import StatusMonthGraphSpark from "../components/StatusMonthGraphSpark.js";

// ---------------- HELPERS ----------------
const normalize = (v) =>
  v?.toString().toLowerCase().replace(/\s+/g, "").trim();

export const isActiveCustomer = (status) => {
  const s = normalize(status);
  return s === "activecustomer" || s === "active";
};

const parseDate = (raw) => {
  if (!raw) return null;
  if (typeof raw === "string" && raw.includes(".")) {
    const [dd, mm, yyyy] = raw.split(".");
    return new Date(yyyy, mm - 1, dd);
  }
  const d = new Date(raw);
  return isNaN(d) ? null : d;
};

const dayStart = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
// -----------------------------------------

const Dashboard = ({ handleLogout }) => {
  const { customers } = useContext(CustomerContext);
  const [searchTerm, setSearchTerm] = useState("");

  // 🔍 SEARCH FILTER
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    const term = searchTerm.toLowerCase();
    return customers.filter(
      (c) =>
        c.customerId?.toLowerCase().includes(term) ||
        c.name?.toLowerCase().includes(term) ||
        c.village?.toLowerCase().includes(term)
    );
  }, [customers, searchTerm]);

  // ✅ ACTIVE CUSTOMERS COUNT
  const activeCustomers = useMemo(
    () => filteredCustomers.filter((c) => isActiveCustomer(c.status)).length,
    [filteredCustomers]
  );

  // ✅ TOTAL INSTALLMENTS (ALL TIME)
  const totalInstallments = useMemo(() => {
    return filteredCustomers.reduce((sum, c) => {
      return (
        sum +
        (c.installments?.reduce(
          (i, r) =>
            i + (r.receivedAmount || r.installmentAmount || r.amount || 0),
          0
        ) || 0)
      );
    }, 0);
  }, [filteredCustomers]);

  // 🔥 TODAY’S COLLECTION (FIXED – SAME AS TotalReceived PAGE)
  const todaysCollection = useMemo(() => {
    const today = dayStart(new Date()).getTime();
    let total = 0;

    filteredCustomers.forEach((c) => {
      // ✅ Booking (only if today)
      const bookingDate = parseDate(c.date);
      if (
        bookingDate &&
        dayStart(bookingDate).getTime() === today &&
        c.bookingAmount
      ) {
        total += Number(c.bookingAmount) || 0;
      }

      // ✅ Installments (only received today)
      if (Array.isArray(c.installments)) {
        c.installments.forEach((inst) => {
          const instDate = parseDate(
            inst.installmentDate || inst.date || inst.paymentDate
          );
          if (instDate && dayStart(instDate).getTime() === today) {
            total +=
              Number(
                inst.receivedAmount ||
                  inst.installmentAmount ||
                  inst.amount ||
                  0
              ) || 0;
          }
        });
      }
    });

    return total;
  }, [filteredCustomers]);

  // ✅ TOTAL COLLECTION (ALL TIME)
  const totalCollection = useMemo(() => {
    return filteredCustomers.reduce((sum, c) => {
      let total = sum;
      if (c.bookingAmount) total += Number(c.bookingAmount) || 0;
      if (Array.isArray(c.installments)) {
        total += c.installments.reduce(
          (i, r) =>
            i + (r.receivedAmount || r.installmentAmount || r.amount || 0),
          0
        );
      }
      return total;
    }, 0);
  }, [filteredCustomers]);

  // ✅ UNIQUE VILLAGES
  const totalVillages = useMemo(() => {
    const villages = filteredCustomers
      .map((c) => c.village?.trim())
      .filter(Boolean);
    return new Set(villages).size;
  }, [filteredCustomers]);

  // ✅ NEXT DUE PAYMENTS
  const nextDuePayments = useMemo(() => {
    return filteredCustomers
      .map((c) => {
        const nextDue = c.installments?.find(
          (inst) => inst.date && new Date(inst.date) > new Date()
        );
        return nextDue
          ? {
              customerId: c.customerId || "-",
              name: c.name || "-",
              date: nextDue.date,
              amount: nextDue.amount || 0,
            }
          : null;
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 10);
  }, [filteredCustomers]);

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <div className="dashboard-header">
        <div className="searchbar-wrapper">
          <div className="searchbar">
            <i className="fa fa-search search-icon"></i>
            <input
              type="text"
              placeholder="Search by Customer ID, Name, Village..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="header-right">
          <NotificationBell />
          <ThemeToggle />
          <AdminDropdown adminName="Admin" handleLogout={handleLogout} />
        </div>
      </div>

      {/* DASHBOARD CARDS */}
      <div className="dashboard-cards">
        <Link to="/total-received" style={{ textDecoration: "none" }}>
          <div className="dashboard-card card-blue">
            <ProgressCircle value={todaysCollection} max={todaysCollection || 1} showPercentage={false} />
            <p>Today's Collection</p>
            <h3>₹{todaysCollection.toLocaleString()}</h3>
          </div>
        </Link>

        <Link to="/installment-collection" style={{ textDecoration: "none" }}>
          <div className="dashboard-card card-green">
            <ProgressCircle value={totalInstallments} max={totalInstallments || 1} />
            <p>Installment Collection(Under Maintanance)</p>
            <h3>₹{totalInstallments.toLocaleString()}</h3>
          </div>
        </Link>

        <Link to="/total-collection" style={{ textDecoration: "none" }}>
          <div className="dashboard-card card-red">
            <ProgressCircle value={totalCollection} max={totalCollection || 1} />
            <p>Total Collection(Under Maintanance)</p>
            <h3>₹{totalCollection.toLocaleString()}</h3>
          </div>
        </Link>

        <Link to="/active-customers" style={{ textDecoration: "none" }}>
          <div className="dashboard-card card-orange">
            <ProgressCircle
              value={activeCustomers}
              max={filteredCustomers.length || 1}
              showPercentage={false}
            />
            <p>Active Customers</p>
          </div>
        </Link>

        <Link to="/project-location" style={{ textDecoration: "none" }}>
          <div className="dashboard-card card-purple">
            <ProgressCircle value={4} max={4} />
            <p>Projects</p>
            <h3>4</h3>
          </div>
        </Link>

      </div>

      {/* CHARTS */}
      <div className="charts-row">
        <div className="chart-card">
          <h3>Customer Status Overview</h3>
          <StatusPieChart data={filteredCustomers} />
        </div>
        <div className="chart-card">
          <h3>Year-wise Active / SaleDeed</h3>
          <StatusMonthGraphSpark />
        </div>
      </div>

      {/* TABLES */}
      <div className="tables-row">
        <div className="table-card">
          <h3>Recent Customers</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer ID</th>
                <th>Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.slice(0, 10).map((c) => (
                <tr key={c._id}>
                  <td>{c.date ? new Date(c.date).toLocaleDateString() : "-"}</td>
                  <td>{c.customerId || "-"}</td>
                  <td>{c.name || "-"}</td>
                  <td>{c.status || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-card">
          <h3>Next Due Payments</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {nextDuePayments.map((p, i) => {
                const due = new Date(p.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isOverdue = due < today;
                const isToday = due.getTime() === today.getTime();

                return (
                  <tr key={i}>
                    <td>{p.customerId}</td>
                    <td>{p.name}</td>
                    <td>{due.toLocaleDateString()}</td>
                    <td>₹{p.amount.toLocaleString()}</td>
                    <td>{isOverdue ? "Overdue" : isToday ? "Today" : "Upcoming"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
