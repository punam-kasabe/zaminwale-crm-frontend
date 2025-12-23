import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { Navigate } from "react-router-dom";
import "../styles/ActiveCustomers.css";

// ACTIVE CHECK FUNCTION
const isActiveCustomer = (status = "") => {
  const s = status.toLowerCase();
  return (
    s === "active customer" ||
    s.includes("active customer") ||
    s === "active"
  );
};

// 🔥 YOUR LAN IP (WORKS ON ALL PCs IN SAME WIFI)
const BASE_URL = "http://192.168.29.50:5001";

const STATUS_VALUES = [
  "Active Customer",
  "SALEDEED DONE",
  "Cheque Bounce",
  "REFUND DONE",
  "BOOKING CANCELLED",
];

export default function ActiveCustomers() {
  const [allCustomers, setAllCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Pagination / Sorting
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  const user = useMemo(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchActiveCustomers();
  }, [user]);

  // 🔥 UPDATED → LAN compatible
  const fetchActiveCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/customers/active`);
      setAllCustomers(res.data);
    } catch (err) {
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
      setPage(1);
    }
  };

  if (!user) return <Navigate to="/login" replace />;

  const villageList = useMemo(() => {
    const setV = new Set();
    allCustomers.forEach((c) => {
      if (c.village?.trim() !== "") setV.add(c.village);
    });
    return [...setV].sort();
  }, [allCustomers]);

  // ------------------ FILTER LIST ------------------
  const filtered = useMemo(() => {
    const s = searchTerm.toLowerCase().trim();
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    if (from) from.setHours(0, 0, 0, 0);
    if (to) to.setHours(23, 59, 59, 999);

    return allCustomers
      .filter((c) => {
        const id = String(c.customerId || "").toLowerCase();
        const name = String(c.name || "").toLowerCase();
        const village = String(c.village || "").toLowerCase();
        const location = String(c.location || "").toLowerCase();

        const entryDate = c.date ? new Date(c.date) : null;
        if (entryDate) entryDate.setHours(0, 0, 0, 0);

        return (
          (!s ||
            id.includes(s) ||
            name.includes(s) ||
            village.includes(s) ||
            location.includes(s)) &&
          (!selectedVillage || c.village === selectedVillage) &&
          (!statusFilter || c.status === statusFilter) &&
          (!from || (entryDate && entryDate >= from)) &&
          (!to || (entryDate && entryDate <= to))
        );
      })
      .sort((a, b) => {
        if (!sortConfig.key) return 0;
        let A = a[sortConfig.key];
        let B = b[sortConfig.key];

        if (sortConfig.key === "date") {
          A = A ? new Date(A) : new Date(0);
          B = B ? new Date(B) : new Date(0);
        }

        if (A < B) return sortConfig.direction === "asc" ? -1 : 1;
        if (A > B) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
  }, [allCustomers, searchTerm, selectedVillage, statusFilter, fromDate, toDate, sortConfig]);

  // ------------------ SUMMARY ------------------
  const summary = useMemo(() => {
    const filteredActive = filtered.filter((c) => isActiveCustomer(c.status));

    const totalReceived = filteredActive.reduce(
      (sum, c) => sum + Number(c.receivedAmount || 0),
      0
    );
    const totalBalance = filteredActive.reduce(
      (sum, c) => sum + Number(c.balanceAmount || 0),
      0
    );

    return {
      totalCustomers: filteredActive.length,
      totalReceived,
      totalBalance,
      totalBooking: filteredActive.reduce(
        (sum, c) => sum + Number(c.totalAmount || 0),
        0
      ),
    };
  }, [filtered]);

  // ------------------ PAGINATION ------------------
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedVillage("");
    setStatusFilter("");
    setFromDate("");
    setToDate("");
    setSortConfig({ key: "date", direction: "desc" });
    setPage(1);
  };

  const exportToExcel = () => {
    const data = filtered.map((c, idx) => ({
      "Sr No": idx + 1,
      Date: c.date ? new Date(c.date).toLocaleDateString("en-GB") : "",
      "Customer ID": c.customerId || "",
      Name: c.name || "",
      Village: c.village || "",
      Status: c.status || "",
      Booking: c.totalAmount || 0,
      Received: c.receivedAmount || 0,
      Balance: c.balanceAmount || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Active Customers");
    XLSX.writeFile(wb, "Active_Customers.xlsx");
  };

  const statusClass = (status = "") =>
    status.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="ac-page">
      <h2 className="ac-title">Active Customers</h2>

      {/* FILTERS */}
      <div className="ac-filters">
        <input
          className="ac-search"
          placeholder="Search ID / Name / Village / Location"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
        />

        <div className="ac-daterange">
          <input
            type="date"
            className="ac-date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
          />
          <input
            type="date"
            className="ac-date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="ac-dropdown"
          value={selectedVillage}
          onChange={(e) => {
            setSelectedVillage(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Select Village</option>
          {villageList.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <select
          className="ac-dropdown"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Status</option>
          {STATUS_VALUES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button className="ac-btn export" onClick={exportToExcel}>
          Export Excel
        </button>
        <button className="ac-btn reset" onClick={resetFilters}>
          Reset
        </button>
      </div>

      {/* SUMMARY */}
      <div className="ac-summary">
        <div className="card">
          <div className="card-title">Active Customers</div>
          <div className="card-value">
            {summary.totalCustomers.toLocaleString()}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Total Received</div>
          <div className="card-value">
            ₹{summary.totalReceived.toLocaleString()}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Total Balance</div>
          <div className="card-value">
            ₹{summary.totalBalance.toLocaleString()}
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="ac-table-wrap">
        <table className="ac-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("date")}>Date</th>
              <th onClick={() => handleSort("customerId")}>
                Customer ID
              </th>
              <th onClick={() => handleSort("name")}>Name</th>
              <th>Village</th>
              <th>Status</th>
              <th onClick={() => handleSort("totalAmount")}>Booking</th>
              <th onClick={() => handleSort("receivedAmount")}>
                Received
              </th>
              <th onClick={() => handleSort("balanceAmount")}>
                Balance
              </th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((c) => (
              <tr key={c._id || c.customerId}>
                <td>
                  {c.date
                    ? new Date(c.date).toLocaleDateString("en-GB")
                    : "-"}
                </td>
                <td>{c.customerId || "-"}</td>
                <td>{c.name || "-"}</td>
                <td>{c.village || "-"}</td>
                <td>
                  <span className={`status-badge ${statusClass(c.status)}`}>
                    {c.status}
                  </span>
                </td>
                <td>₹{Number(c.totalAmount || 0).toLocaleString()}</td>
                <td style={{ color: "green" }}>
                  ₹{Number(c.receivedAmount || 0).toLocaleString()}
                </td>
                <td style={{ color: "red" }}>
                  ₹{Number(c.balanceAmount || 0).toLocaleString()}
                </td>
              </tr>
            ))}

            {paginated.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: "center" }}>
                  No records
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="ac-pagination">
        <div className="rows-per">
          Rows:
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="page-controls">
          <button onClick={() => setPage(1)} disabled={page === 1}>
            ⏮
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ◀ Prev
          </button>

          <span>
            Page {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next ▶
          </button>

          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
          >
            ⏭
          </button>
        </div>
      </div>
    </div>
  );
}
