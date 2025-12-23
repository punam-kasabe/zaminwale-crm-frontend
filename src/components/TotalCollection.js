import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/TotalCollection.css";

const TotalCollection = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axios.get("http://192.168.29.50:5001/api/customers/active");
        setCustomers(res.data);
      } catch (err) {
        console.error("Error fetching collection data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  if (loading) return <p className="loading-text">Loading...</p>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let todaysCollection = 0;
  const tableRows = [];

  customers.forEach((c) => {
    const bookingDate = c.date ? new Date(c.date) : null;
    // Booking - first time
    if (bookingDate && c.bookingAmount) {
      const amount = Number(c.bookingAmount) || 0;
      tableRows.push({
        customerId: c.customerId || "-",
        name: c.name || "-",
        village: c.village || "-",
        status: c.status || "-",
        type: "Booking",
        date: bookingDate,
        amount,
      });
      if (bookingDate.getTime() === today.getTime()) todaysCollection += amount;
    }

    // Installments
    if (Array.isArray(c.installments)) {
      c.installments.forEach((inst) => {
        const instDate = new Date(inst.installmentDate || inst.date || inst.paymentDate);
        const amount = Number(inst.receivedAmount || inst.installmentAmount || inst.amount || 0);
        tableRows.push({
          customerId: c.customerId || "-",
          name: c.name || "-",
          village: c.village || "-",
          status: c.status || "-",
          type: "Installment",
          date: instDate,
          amount,
        });
        const instDay = new Date(instDate);
        instDay.setHours(0, 0, 0, 0);
        if (instDay.getTime() === today.getTime()) todaysCollection += amount;
      });
    }
  });

  const totalReceived = tableRows.reduce((sum, r) => sum + r.amount, 0);
  const totalBalance = customers.reduce((sum, c) => sum + (c.balanceAmount || 0), 0);
  const totalAmount = customers.reduce((sum, c) => sum + (c.totalAmount || 0), 0);

  // Village-wise summary
  const villageSummary = {};
  tableRows.forEach((r) => {
    if (!villageSummary[r.village]) {
      villageSummary[r.village] = { customers: 0, received: 0, balance: 0, total: 0 };
    }
    villageSummary[r.village].customers += 1;
    villageSummary[r.village].received += r.amount || 0;
  });
  customers.forEach((c) => {
    if (villageSummary[c.village]) {
      villageSummary[c.village].balance += c.balanceAmount || 0;
      villageSummary[c.village].total += c.totalAmount || 0;
    }
  });

  // Helper for status badge class
  const getStatusClass = (status) => {
    const s = status?.toLowerCase();
    if (s?.includes("active")) return "badge-active";
    if (s?.includes("cancel")) return "badge-cancelled";
    return "badge-sale";
  };

  // Helper for type badge class
  const getTypeClass = (type) => (type === "Booking" ? "badge-booking" : "badge-install");

  return (
    <div className="total-collection-container">
      <h2 className="page-title">Total Collection Report</h2>

      <div className="summary-cards">
        <div className="card blue">
          <h4>Total Customers</h4>
          <p>{customers.length}</p>
        </div>
        <div className="card green">
          <h4>Total Received</h4>
          <p>₹{totalReceived.toLocaleString()}</p>
        </div>
        <div className="card red">
          <h4>Total Balance</h4>
          <p>₹{totalBalance.toLocaleString()}</p>
        </div>
        <div className="card purple">
          <h4>Total Amount</h4>
          <p>₹{totalAmount.toLocaleString()}</p>
        </div>
        <div className="card orange">
          <h4>Today's Collection</h4>
          <p>₹{todaysCollection.toLocaleString()}</p>
        </div>
      </div>

      <h3 className="section-title">Collection Details</h3>
      <table className="collection-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Customer ID</th>
            <th>Name</th>
            <th>Village</th>
            <th>Status</th>
            <th>Type</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {tableRows
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map((r, i) => (
              <tr key={i}>
                <td>{r.date ? new Date(r.date).toLocaleDateString() : "-"}</td>
                <td>{r.customerId}</td>
                <td>{r.name}</td>
                <td>{r.village}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(r.status)}`}>
                    {r.status.toUpperCase()}
                  </span>
                </td>
                <td>
                  <span className={`type-badge ${getTypeClass(r.type)}`}>{r.type}</span>
                </td>
                <td>₹{r.amount.toLocaleString()}</td>
              </tr>
            ))}
        </tbody>
      </table>

      <h3 className="section-title">Village-wise Collection</h3>
      <table className="collection-table">
        <thead>
          <tr>
            <th>Village</th>
            <th>Customers</th>
            <th>Received</th>
            <th>Pending</th>
            <th>Total Amount</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(villageSummary).map(([village, data]) => (
            <tr key={village}>
              <td>{village}</td>
              <td>{data.customers}</td>
              <td>₹{data.received.toLocaleString()}</td>
              <td>₹{data.balance.toLocaleString()}</td>
              <td>₹{data.total.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TotalCollection;
