import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "../styles/TotalReceived.css";

// BASE URL
const BASE_URL = "http://192.168.29.50:5001";

// Convert dd.mm.yyyy → Date object
const parseDate = (raw) => {
  if (!raw) return null;
  if (typeof raw === "string" && raw.includes(".")) {
    const [dd, mm, yyyy] = raw.split(".");
    return new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
  }
  const d = new Date(raw);
  return isNaN(d) ? null : d;
};

// Format date dd.mm.yyyy
const formatDate = (d) => {
  if (!d) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}.${mm}.${yy}`;
};

// Set time to start of day
const dayStart = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export default function TotalReceived() {
  const [customers, setCustomers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");

  // Fetch all customers
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/customers`);
        setCustomers(res.data || []);
      } catch (err) {
        console.log("Fetch Error:", err);
        alert("Server connection failed!");
      }
    };
    fetchAll();
    const interval = setInterval(fetchAll, 10000); // Auto refresh every 10 sec
    return () => clearInterval(interval);
  }, []);

  // Unique villages for dropdown
  const villages = useMemo(() => {
    const setVillages = new Set(customers.map(c => c.village).filter(Boolean));
    return Array.from(setVillages).sort();
  }, [customers]);

  // GET TODAY’S COLLECTION
  const todaysRows = useMemo(() => {
    let rows = [];

    customers.forEach((c) => {
      const bookingDate = parseDate(c.date);
      // Booking
      if (bookingDate && c.bookingAmount) {
        const amount = Number(c.bookingAmount) || 0;
        rows.push({
          date: bookingDate,
          customerId: c.customerId,
          name: c.name,
          village: c.village,
          status: c.status,
          amount,
          type: "Booking",
        });
      }

      // Installments
      if (Array.isArray(c.installments)) {
        c.installments.forEach((inst) => {
          const instDate = parseDate(inst.installmentDate || inst.date || inst.paymentDate);
          const amt = Number(inst.receivedAmount || inst.installmentAmount || inst.amount || 0);
          if (instDate && amt > 0) {
            rows.push({
              date: instDate,
              customerId: c.customerId,
              name: c.name,
              village: c.village,
              status: c.status,
              amount: amt,
              type: "Installment",
            });
          }
        });
      }
    });

    return rows;
  }, [customers]);

  const todaysCollection = todaysRows
    .filter((r) => dayStart(r.date).getTime() === dayStart(new Date()).getTime())
    .reduce((sum, r) => sum + r.amount, 0);

  // Helper for status badge class
  const getStatusClass = (status) => {
    const s = status?.toLowerCase();
    if (s?.includes("active")) return "active-customer";
    if (s?.includes("cancel")) return "cancelled";
    return "sale-deed";
  };

  // Filter rows based on search and village
  const filteredRows = useMemo(() => {
    return todaysRows
      .filter(r => dayStart(r.date).getTime() === dayStart(new Date()).getTime())
      .filter(r =>
        r.customerId.toLowerCase().includes(searchText.toLowerCase()) ||
        r.name.toLowerCase().includes(searchText.toLowerCase())
      )
      .filter(r => !selectedVillage || r.village === selectedVillage)
      .sort((a, b) => b.date - a.date);
  }, [todaysRows, searchText, selectedVillage]);

  // Excel Export
  const exportToExcel = () => {
    const wsData = filteredRows.map(r => ({
      Date: formatDate(r.date),
      "Customer ID": r.customerId,
      Name: r.name,
      Village: r.village,
      Status: r.status,
      Type: r.type,
      Amount: r.amount
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Today's Collection");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), "TodaysCollection.xlsx");
  };

  return (
    <div className="total-received-container">
      <h2>Today's Collection</h2>

      <div className="total-box">
        <h3>Total Collected Today</h3>
        <p className="total-amount">₹{todaysCollection.toLocaleString()}</p>
      </div>

      {/* Search & Filter */}
      <div className="filter-container">
        <input
          type="text"
          placeholder="Search by Customer ID or Name"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <select value={selectedVillage} onChange={(e) => setSelectedVillage(e.target.value)}>
          <option value="">All Villages</option>
          {villages.map((v, i) => (
            <option key={i} value={v}>{v}</option>
          ))}
        </select>
        <button onClick={exportToExcel} className="export-btn">Export Excel</button>
      </div>

      <table className="report-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Customer ID</th>
            <th>Name</th>
            <th>Village</th>
            <th>Status</th>
            <th>Type</th>
            <th>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {filteredRows.length ? (
            filteredRows.map((r, i) => (
              <tr key={i}>
                <td>{formatDate(r.date)}</td>
                <td>{r.customerId}</td>
                <td>{r.name}</td>
                <td>{r.village}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(r.status)}`}>
                    {r.status.toUpperCase()}
                  </span>
                </td>
                <td>
                  <span className={`type-badge ${r.type === "Booking" ? "badge-booking" : "badge-install"}`}>
                    {r.type}
                  </span>
                </td>
                <td className="right">₹{r.amount.toLocaleString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" align="center">No Collection Today</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
