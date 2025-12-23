import React, { useContext, useMemo, useState } from "react";
import { CustomerContext } from "../context/CustomerContext.js";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "../styles/InstallmentCollection.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Title
);

const PAGE_SIZE = 10;

const InstallmentCollection = () => {
  const { customers, setCustomers } = useContext(CustomerContext);

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [page, setPage] = useState(1);

  // Add Installment Modal
  const [openModal, setOpenModal] = useState(false);
  const [searchId, setSearchId] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newInstall, setNewInstall] = useState({
    amount: "",
    date: "",
    nextDue: "",
  });

  // ----- Helper functions -----
  const parseDate = (d) => {
    if (!d) return null;
    if (d instanceof Date) return d;

    let date = new Date(d);
    if (!isNaN(date)) return date;

    const parts = d.split("/");
    if (parts.length === 3) {
      let day = parseInt(parts[0], 10);
      let month = parseInt(parts[1], 10) - 1;
      let year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;
      date = new Date(year, month, day);
      if (!isNaN(date)) return date;
    }

    return null;
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = parseDate(date);
    if (!d) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getLast30DaysRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  // ----- All installments -----
  const allInstallments = useMemo(() => {
    const data = [];
    customers.forEach((c) => {
      c.installments?.forEach((i, idx) => {
        data.push({
          cid: c.customerId,
          name: c.name,
          village: c.village || "-",
          no: i.installmentNo || idx + 1,
          amount: Number(i.receivedAmount || 0),
          date: parseDate(i.installmentDate),
          nextDue: parseDate(i.nextDueDate || i.dueDate),
        });
      });
    });
    return data;
  }, [customers]);

  // ----- Filtered Installments -----
  const filtered = useMemo(() => {
    let s, e;
    if (start || end) {
      s = start ? new Date(start) : null;
      e = end ? new Date(end) : null;
    } else {
      const last30 = getLast30DaysRange();
      s = last30.start;
      e = last30.end;
    }

    return allInstallments.filter((i) => {
      if (!i.date) return false;
      if (s && i.date < s) return false;
      if (e && i.date > e) return false;
      return true;
    });
  }, [allInstallments, start, end]);

  // ----- Filtered Customers -----
  const filteredCustomers = useMemo(() => {
    let s, e;
    if (start || end) {
      s = start ? new Date(start) : null;
      e = end ? new Date(end) : null;
    } else {
      const last30 = getLast30DaysRange();
      s = last30.start;
      e = last30.end;
    }

    return customers.filter((c) =>
      c.installments?.some((i) => {
        const d = parseDate(i.installmentDate);
        if (!d) return false;
        if (s && d < s) return false;
        if (e && d > e) return false;
        return true;
      })
    );
  }, [customers, start, end]);

  // ----- Filtered counts -----
  const filteredCustomerCount = filteredCustomers.length;
  const filteredInstallmentCount = filtered.reduce((sum) => sum + 1, 0);

  const totalPages = Math.ceil(filteredCustomers.length / PAGE_SIZE);
  const paginated = filteredCustomers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const rangeTotal = filtered.reduce((a, b) => a + b.amount, 0);
  const todayStr = new Date().toLocaleDateString();
  const todayTotal = filtered
    .filter((i) => i.date?.toLocaleDateString() === todayStr)
    .reduce((a, b) => a + b.amount, 0);

  // ----- Chart Data -----
  const dailyData = useMemo(() => {
    const map = {};
    filtered.forEach((i) => {
      const d = formatDate(i.date);
      map[d] = (map[d] || 0) + i.amount;
    });
    return { labels: Object.keys(map), values: Object.values(map) };
  }, [filtered]);

  const monthlyData = useMemo(() => {
    const arr = Array(12).fill(0);
    filtered.forEach((i) => {
      if (i.date instanceof Date) arr[i.date.getMonth()] += i.amount;
    });
    return arr;
  }, [filtered]);

  const upcoming = useMemo(() => {
    return allInstallments
      .filter((i) => i.nextDue && i.nextDue > new Date())
      .sort((a, b) => a.nextDue - b.nextDue)
      .slice(0, 5);
  }, [allInstallments]);

  // ----- Excel Export -----
  const exportExcel = () => {
    if (!filtered.length) {
      alert("No data to export!");
      return;
    }

    const sheetData = filtered.map((i) => ({
      CustomerID: i.cid,
      Name: i.name,
      Village: i.village,
      InstallmentNo: i.no,
      Date: formatDate(i.date),
      Amount: i.amount,
      NextDue: i.nextDue ? formatDate(i.nextDue) : "-",
    }));

    sheetData.push({});
    sheetData.push({ Name: "TOTAL", Amount: rangeTotal });

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Installments");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const file = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(file, "Installment_Report.xlsx");
  };

  const printPage = () => window.print();

  // ----- Add Installment -----
  const findCustomer = () => {
    const cust = customers.find((c) => c.customerId === searchId);
    if (!cust) return alert("Customer not found");
    setSelectedCustomer(cust);
  };

  const saveInstallment = async () => {
    if (!selectedCustomer) return;

    try {
      const response = await axios.post(
        `http://localhost:5001/api/customers/add-installment/${selectedCustomer.customerId}`,
        {
          amount: newInstall.amount,
          date: newInstall.date,
          nextDue: newInstall.nextDue,
          user: "Admin",
        }
      );

      const updatedCustomer = response.data.customer;
      const updatedCustomers = customers.map((c) =>
        c.customerId === updatedCustomer.customerId ? updatedCustomer : c
      );
      setCustomers(updatedCustomers);

      alert("Installment Added Successfully ✅");
      setOpenModal(false);
      setSelectedCustomer(null);
      setSearchId("");
      setNewInstall({ amount: "", date: "", nextDue: "" });
    } catch (err) {
      console.error("Error adding installment:", err);
      alert("Failed to add installment. Please try again!");
    }
  };

  return (
    <div className="installment-collection-body">
      <h1>Installment Collection Dashboard</h1>

      {/* ADD INSTALLMENT BUTTON */}
      <button className="add-installment-btn" onClick={() => setOpenModal(true)}>
        + Add Installment
      </button>

      {/* FILTER */}
      <div className="filter-row">
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        <button onClick={exportExcel}>Export Excel</button>
        <button onClick={printPage}>Print</button>
      </div>

      {/* RANGE DISPLAY */}
      <div className="date-info-box">
        {start || end
          ? <>Showing data from <b>{formatDate(start)}</b> to <b>{formatDate(end)}</b></>
          : <>Showing last <b>30 days</b> data</>}
      </div>

      {/* SUMMARY */}
      <div className="collection-summary">
        <div className="summary-card blue">
          <h4>Today's Collection</h4>
          <p>₹{todayTotal.toLocaleString()}</p>
        </div>
        <div className="summary-card green">
          <h4>Date Range Total</h4>
          <p>₹{rangeTotal.toLocaleString()}</p>
        </div>
        <div className="summary-card orange">
          <h4>Upcoming Due</h4>
          <ul>
            {upcoming.map((u, i) => (
              <li key={i}>
                {u.name} – {formatDate(u.nextDue)} – ₹{u.amount}
              </li>
            ))}
            {!upcoming.length && <li>No Dues</li>}
          </ul>
        </div>
      </div>

      {/* CHARTS */}
      <div className="chart-grid">
        <div className="chart-box">
          <h3>Daily Line Chart</h3>
          <Line data={{ labels: dailyData.labels, datasets: [{ label: "₹ Collection", data: dailyData.values }] }} />
        </div>
        <div className="chart-box">
          <h3>Monthly Bar Chart</h3>
          <Bar data={{
            labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
            datasets: [{ label: "₹ Collection", data: monthlyData }]
          }} />
        </div>
      </div>

      {/* CUSTOMER TABLE */}
      <div className="customers-table-section">
        <h2>Customer Records</h2>

        {/* Filtered counts */}
        <div className="filtered-counts">
          <p><strong>Customers:</strong> {filteredCustomerCount}</p>
          <p><strong>Installments:</strong> {filteredInstallmentCount}</p>
        </div>

        <table className="customers-table">
          <thead>
            <tr>
              <th>Sr No</th>
              <th>Date</th>
              <th>PLT No</th>
              <th>Name</th>
              <th>Village</th>
              <th>No of Installments</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((item, index) => (
              <CustomerRow
                key={index}
                item={item}
                index={(page - 1) * PAGE_SIZE + index}
                formatDate={formatDate}
              />
            ))}
            {!paginated.length && (
              <tr><td colSpan="7" align="center">No Data Found</td></tr>
            )}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span>{page} / {totalPages || 1}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </div>

      {/* ADD INSTALLMENT MODAL */}
      {openModal && (
        <div className="installment-modal">
          <div className="installment-box">
            <h2>Add Installment</h2>

            {!selectedCustomer && (
              <>
                <input
                  placeholder="Enter Customer ID"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                />
                <button onClick={findCustomer}>Find</button>
              </>
            )}

            {selectedCustomer && (
              <>
                <p><strong>Name:</strong> {selectedCustomer.name}</p>
                <p><strong>Total Installments:</strong> {selectedCustomer.installments.length}</p>
                <p><strong>Received Total:</strong> ₹
                  {selectedCustomer.installments.reduce(
                    (a, b) => a + Number(b.receivedAmount || 0), 0
                  )}
                </p>
                <p><strong>Balance:</strong> ₹
                  {(Number(selectedCustomer.totalAmount || 0) -
                    selectedCustomer.installments.reduce(
                      (a, b) => a + Number(b.receivedAmount || 0), 0
                    )).toLocaleString()}
                </p>

                <input
                  type="number"
                  placeholder="Received Amount"
                  value={newInstall.amount}
                  onChange={(e) => setNewInstall({ ...newInstall, amount: e.target.value })}
                />
                <input
                  type="date"
                  value={newInstall.date}
                  onChange={(e) => setNewInstall({ ...newInstall, date: e.target.value })}
                />
                <input
                  type="date"
                  value={newInstall.nextDue}
                  onChange={(e) => setNewInstall({ ...newInstall, nextDue: e.target.value })}
                />

                <button onClick={saveInstallment}>Save Installment</button>
              </>
            )}

            <button className="close-btn" onClick={() => setOpenModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallmentCollection;

// -------------------- CUSTOMER ROW --------------------
const CustomerRow = ({ item, index, formatDate }) => {
  const [show, setShow] = useState(false);

  return (
    <>
      <tr>
        <td>{index + 1}</td>
        <td>{formatDate(item.installments?.[0]?.installmentDate)}</td>
        <td>{item.customerId}</td>
        <td>{item.name}</td>
        <td>{item.village || "-"}</td>
        <td>{item.installments?.length || 0}</td>
        <td>
          <button className="toggle-btn" onClick={() => setShow(!show)}>
            {show ? "Hide" : "Show"}
          </button>
        </td>
      </tr>

      {show && (
        <tr>
          <td colSpan="7">
            <table className="inner-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Next Due</th>
                </tr>
              </thead>
              <tbody>
                {item.installments.map((ins, i) => (
                  <tr key={i}>
                    <td>{ins.installmentNo || i + 1}</td>
                    <td>{formatDate(ins.installmentDate)}</td>
                    <td>₹{Number(ins.receivedAmount || 0).toLocaleString()}</td>
                    <td>{formatDate(ins.nextDueDate || ins.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
};
