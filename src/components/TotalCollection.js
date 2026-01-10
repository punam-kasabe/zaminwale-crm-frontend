import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import "../styles/TotalCollection.css";

/* ================= DATE FORMATTER ================= */
const formatDateDMY = (dateValue) => {
  if (!dateValue) return "-";
  const d = new Date(dateValue);
  if (isNaN(d)) return "-";
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
};

/* ================= STATUS MATCH ================= */
const matchStatus = (status, filter) => {
  if (filter === "all") return true;
  if (!status) return false;

  const normalizedStatus = status.trim().toLowerCase();
  const normalizedFilter = filter.trim().toLowerCase();

  if (
    normalizedStatus === "saledeed done" ||
    normalizedStatus === "sale deed done" ||
    normalizedStatus === "sale-deed done"
  ) {
    return normalizedFilter === "saledeed done";
  }
  if (normalizedStatus === "active customer") {
    return normalizedFilter === "active customer";
  }

  return normalizedStatus === normalizedFilter;
};

const MonthlyRevenue = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [monthStatusFilter, setMonthStatusFilter] = useState("all");
  const [monthTypeFilter, setMonthTypeFilter] = useState("all"); // "all", "booking", "installment"
  const [villageFilter, setVillageFilter] = useState("all");

  /* SORTING STATE */
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });

  /* PAGINATION */
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  /* ================= FETCH ================= */
  useEffect(() => {
    axios
      .get("http://192.168.29.50:5001/api/customers")
      .then((res) => setCustomers(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => setCurrentPage(1), [selectedMonth, monthStatusFilter, monthTypeFilter, villageFilter]);

  /* ================= UNIQUE VILLAGES FOR DROPDOWN ================= */
  const villages = useMemo(() => {
    const setVillages = new Set(customers.map((c) => c.village).filter(Boolean));
    return ["all", ...Array.from(setVillages)];
  }, [customers]);

  /* ================= TABLE ROWS (Monthly Bookings + Installments) ================= */
  const tableRows = useMemo(() => {
    const rows = [];

    customers.forEach((c) => {
      // Village filter
      if (villageFilter !== "all" && c.village !== villageFilter) return;

      // Booking rows
      if ((monthTypeFilter === "all" || monthTypeFilter === "booking") && c.bookingAmount > 0) {
        const bookingDate = new Date(c.date);
        if (
          bookingDate.getMonth() === selectedMonth.getMonth() &&
          bookingDate.getFullYear() === selectedMonth.getFullYear() &&
          (monthStatusFilter === "all" || matchStatus(c.status, monthStatusFilter))
        ) {
          rows.push({
            date: c.date,
            customerId: c.customerId,
            name: c.name,
            type: "Booking",
            totalAmount: Number(c.totalAmount || 0),
            received: Number(c.receivedAmount),
            balance: Number(c.balanceAmount),
            status: c.status,
            location: c.location || "-",
            village: c.village || "-",
          });
        }
      }

      // Installment rows
      if ((monthTypeFilter === "all" || monthTypeFilter === "installment") && c.installments?.length > 0) {
        c.installments.forEach((i) => {
          const instDate = new Date(i.installmentDate);
          if (
            Number(i.receivedAmount) > 0 &&
            instDate.getMonth() === selectedMonth.getMonth() &&
            instDate.getFullYear() === selectedMonth.getFullYear() &&
            (monthStatusFilter === "all" || matchStatus(c.status, monthStatusFilter))
          ) {
            rows.push({
              date: i.installmentDate,
              customerId: c.customerId,
              name: c.name,
              type: "Installment",
              totalAmount: Number(c.totalAmount || 0),
              received: Number(i.receivedAmount),
              balance: Number(c.balanceAmount),
              status: c.status,
              location: c.location || "-",
              village: c.village || "-",
            });
          }
        });
      }
    });

    return rows;
  }, [customers, selectedMonth, monthStatusFilter, monthTypeFilter, villageFilter]);

  /* ================= SORTED ROWS ================= */
  const sortedRows = useMemo(() => {
    const sortableRows = [...tableRows];
    if (sortConfig) {
      sortableRows.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === "date") {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }

        if (sortConfig.key === "customerId") {
          aVal = aVal?.toString() || "";
          bVal = bVal?.toString() || "";
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableRows;
  }, [tableRows, sortConfig]);

  /* ================= MONTH STATS ================= */
  const monthStats = useMemo(() => {
    let revenue = 0,
      received = 0,
      balance = 0,
      saledeed = 0,
      bookingCount = 0,
      installmentCount = 0;

    tableRows.forEach((r) => {
      if (r.type === "Booking") {
        revenue += Number(r.totalAmount || 0);
        bookingCount += 1;
        received += Number(r.received || 0);
      } else if (r.type === "Installment") {
        received += Number(r.received || 0);
        installmentCount += 1;
      }

      balance += Number(r.balance || 0);
      if (matchStatus(r.status, "saledeed done")) saledeed += 1;
    });
    return { revenue, received, balance, saledeed, bookingCount, installmentCount };
  }, [tableRows]);

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(sortedRows.length / rowsPerPage);
  const paginatedRows = sortedRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  /* ================= EXCEL EXPORT ================= */
  const exportMonthlyExcel = () => {
    if (tableRows.length === 0) {
      alert("No data to export");
      return;
    }

    const excelData = tableRows.map((r, index) => ({
      "Sr No": index + 1,
      Date: formatDateDMY(r.date),
      "Customer ID": r.customerId,
      Name: r.name,
      Type: r.type,
      "Total Amount": r.totalAmount,
      Received: r.received,
      Balance: r.balance,
      Status: r.status,
      Location: r.location,
      Village: r.village,
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Customers");
    const monthLabel = selectedMonth.toLocaleString("default", { month: "long", year: "numeric" });
    XLSX.writeFile(
      wb,
      `Monthly_Customers_${monthLabel}_${monthStatusFilter}_${monthTypeFilter}_${villageFilter}.xlsx`
    );
  };

  /* ================= JSX ================= */
  return (
    <div className="fy-revenue-container">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {/* MONTH PICKER + FILTERS */}
          <div className="summary-header">
            <label>Select Month: </label>
            <input
              type="month"
              value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, "0")}`}
              onChange={(e) => setSelectedMonth(new Date(e.target.value))}
            />

            <select value={monthStatusFilter} onChange={(e) => setMonthStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active customer">Sales Booked</option>
              <option value="saledeed done">SaleDeed Done</option>
            </select>

            <select value={monthTypeFilter} onChange={(e) => setMonthTypeFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="booking">Booking</option>
              <option value="installment">Installment</option>
            </select>

            <select value={villageFilter} onChange={(e) => setVillageFilter(e.target.value)}>
              {villages.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>

            <button className="export-btn" onClick={exportMonthlyExcel}>
              Export Excel
            </button>
          </div>

          {/* MONTH CARDS */}
          <div className="cards">
            <div className="card blue">
              <h4>Sales Booked</h4>
              <p>₹{monthStats.revenue.toLocaleString()}</p>
            </div>
            <div className="card green">
              <h4>Month Received</h4>
              <p>₹{monthStats.received.toLocaleString()}</p>
            </div>
            <div className="card orange">
              <h4>SaleDeed Done</h4>
              <p>{monthStats.saledeed}</p>
            </div>
            <div className="card teal">
              <h4>Booking Count</h4>
              <p>{monthStats.bookingCount}</p>
            </div>
            <div className="card pink">
              <h4>Installment Count</h4>
              <p>{monthStats.installmentCount}</p>
            </div>
          </div>

          {/* TABLE */}
          <table className="revenue-table">
            <thead>
              <tr>
                <th>Sr No</th>
                <th
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setSortConfig({
                      key: "date",
                      direction: sortConfig.key === "date" && sortConfig.direction === "asc" ? "desc" : "asc",
                    })
                  }
                >
                  Date {sortConfig.key === "date" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
                </th>
                <th
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    setSortConfig({
                      key: "customerId",
                      direction: sortConfig.key === "customerId" && sortConfig.direction === "asc" ? "desc" : "asc",
                    })
                  }
                >
                  ID {sortConfig.key === "customerId" ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
                </th>
                <th>Name</th>
                <th>Type</th>
                <th>Total Amount</th>
                <th>Received</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Location</th>
                <th>Village</th>
              </tr>
            </thead>

            <tbody>
              {paginatedRows.map((r, index) => (
                <tr key={r.customerId + r.date}>
                  <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
                  <td>{formatDateDMY(r.date)}</td>
                  <td>{r.customerId}</td>
                  <td>{r.name}</td>
                  <td>{r.type}</td>
                  <td>₹{r.totalAmount.toLocaleString()}</td>
                  <td>₹{r.received.toLocaleString()}</td>
                  <td>₹{r.balance.toLocaleString()}</td>
                  <td>{r.status}</td>
                  <td>{r.location}</td>
                  <td>{r.village}</td>
                </tr>
              ))}
            </tbody>

            {/* TOTAL ROW */}
            <tfoot>
              <tr style={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}>
                <td colSpan={5}>Total</td>
                <td>₹{paginatedRows.reduce((sum, r) => sum + Number(r.totalAmount || 0), 0).toLocaleString()}</td>
                <td>₹{paginatedRows.reduce((sum, r) => sum + Number(r.received || 0), 0).toLocaleString()}</td>
                <td>₹{paginatedRows.reduce((sum, r) => sum + Number(r.balance || 0), 0).toLocaleString()}</td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MonthlyRevenue;
