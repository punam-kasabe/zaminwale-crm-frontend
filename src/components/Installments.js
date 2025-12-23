import React, { useState, useEffect } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import "../styles/Installments.css";

// ---------------- Dynamic Pagination Component ----------------
function Pagination({ totalPages, currentPage, onPageChange }) {
  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const getVisiblePages = () => {
    let start = Math.max(1, currentPage - 3);
    let end = Math.min(totalPages, currentPage + 3);
    let pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="pagination">
      <button onClick={handlePrev} disabled={currentPage === 1}>
        Prev
      </button>
      {getVisiblePages().map((p) => (
        <button
          key={p}
          className={p === currentPage ? "active-page" : ""}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}
      <button onClick={handleNext} disabled={currentPage === totalPages}>
        Next
      </button>
      <span>
        Page {currentPage} / {totalPages}
      </span>
    </div>
  );
}

// ---------------- Installments Component ----------------
function Installments() {
  const [customers, setCustomers] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [installmentData, setInstallmentData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // ---------------- Fetch Customers ----------------
  useEffect(() => {
    axios
      .get("http://192.168.29.50:5001/api/customers")
      .then((res) => {
        const data = res.data.map((c) => ({
          ...c,
          installments: Array.isArray(c.installments) ? c.installments : [],
        }));
        setCustomers(data);
      })
      .catch((err) => console.error("Error fetching customers:", err));
  }, []);

  const toggleExpand = (customerId) => {
    setExpanded((prev) => ({ ...prev, [customerId]: !prev[customerId] }));
  };

  const openModal = (customer) => {
    setSelectedCustomer(customer);
    setInstallmentData({
      installmentNo: (customer.installments?.length || 0) + 1,
      installmentDate: "",
      nextDueDate: "",
      installmentAmount: "",
      receivedAmount: "",
      balanceAmount: customer.totalAmount - (customer.receivedAmount || 0),
      bankName: "",
      chequeNo: "",
      chequeDate: "",
      clearDate: "",
      remark: "",
      status: "Pending",
    });
    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInstallmentData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedInstallments = [
        ...(selectedCustomer.installments || []),
        installmentData,
      ];
      const receivedAmountTotal = updatedInstallments.reduce(
        (acc, inst) => acc + Number(inst.receivedAmount || 0),
        0
      );

      await axios.put(
        `http://localhost:5001/api/customers/${selectedCustomer._id}`,
        {
          installments: updatedInstallments,
          receivedAmount: receivedAmountTotal,
          balanceAmount:
            selectedCustomer.totalAmount - receivedAmountTotal,
        }
      );

      setCustomers((prev) =>
        prev.map((c) =>
          c._id === selectedCustomer._id
            ? {
                ...c,
                installments: updatedInstallments,
                receivedAmount: receivedAmountTotal,
                balanceAmount:
                  selectedCustomer.totalAmount - receivedAmountTotal,
              }
            : c
        )
      );
      setModalOpen(false);
    } catch (err) {
      console.error("Error adding installment:", err);
    }
  };

  // ---------------- Filter & Sort ----------------
  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    const safe = (val) => (val ? String(val).toLowerCase().trim() : "");
    return (
      safe(c.name).includes(term) ||
      safe(c.customerId).includes(term) ||
      safe(c.location).includes(term) ||
      safe(c.village).includes(term)
    );
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    const valA = (a[sortField] || "").toString().toLowerCase();
    const valB = (b[sortField] || "").toString().toLowerCase();
    if (!isNaN(valA) && !isNaN(valB)) {
      return sortOrder === "asc" ? valA - valB : valB - valA;
    }
    return sortOrder === "asc"
      ? valA.localeCompare(valB)
      : valB.localeCompare(valA);
  });

  // ---------------- Pagination ----------------
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCustomers = sortedCustomers.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);

  const changePage = (pageNumber) => setCurrentPage(pageNumber);
  const changeItemsPerPage = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // ---------------- Export CSV ----------------
  const exportCSV = () => {
    const headers = [
      "Customer ID",
      "Name",
      "Location",
      "Village",
      "Booking Area",
      "Total Amount",
      "Booking Amount",
      "Received Amount",
      "Balance Amount",
      "Total Installments",
    ];
    const rows = sortedCustomers.map((c) => [
      c.customerId,
      c.name,
      c.location,
      c.village || "-",
      c.bookingArea || "-",
      c.totalAmount,
      c.bookingAmount || 0,
      c.receivedAmount,
      c.balanceAmount,
      c.installments?.length || 0,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    saveAs(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
      "InstallmentsData.csv"
    );
  };

  return (
    <div className="installment-page-container">
      <h2>Installments</h2>

      {/* ---------- Controls ---------- */}
      <div className="controls">
        <input
          type="text"
          placeholder="Search by ID, Name, Location or Village"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={exportCSV}>Export CSV</button>
        <select value={sortField} onChange={(e) => setSortField(e.target.value)}>
          <option value="name">Sort by Name</option>
          <option value="customerId">Sort by Customer ID</option>
          <option value="location">Sort by Location</option>
          <option value="totalAmount">Sort by Total Amount</option>
          <option value="balanceAmount">Sort by Balance Amount</option>
        </select>
        <button
          onClick={() =>
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
          }
        >
          {sortOrder === "asc" ? "⬆ Asc" : "⬇ Desc"}
        </button>
        <select value={itemsPerPage} onChange={changeItemsPerPage}>
          {[5, 10, 15, 20, 25, 50, 100].map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>
      </div>

      {/* ---------- Table ---------- */}
      <table className="installment-table">
        <thead>
          <tr>
            <th>Customer ID</th>
            <th>Name</th>
            <th>Location</th>
            <th>Village</th>
            <th>Booking Area</th>
            <th>Total Amount</th>
            <th>Booking Amount</th>
            <th>Received Amount</th>
            <th>Balance Amount</th>
            <th>Total Installments</th>
            <th>Installments</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {currentCustomers.map((cust) => (
            <React.Fragment key={cust._id}>
              <tr>
                <td>{cust.customerId}</td>
                <td>{cust.name}</td>
                <td>{cust.location}</td>
                <td>{cust.village || "-"}</td>
                <td>{cust.bookingArea || "-"}</td>
                <td>{cust.totalAmount || 0}</td>
                <td style={{ color: "#007bff", fontWeight: "bold" }}>
                  {cust.bookingAmount || 0}
                </td>
                <td style={{ color: "green", fontWeight: "bold" }}>
                  {cust.receivedAmount || 0}
                </td>
                <td style={{ color: "red", fontWeight: "bold" }}>
                  {cust.balanceAmount || 0}
                </td>
                <td>{cust.installments?.length || 0}</td>
                <td>
                  <button onClick={() => toggleExpand(cust._id)}>
                    {expanded[cust._id] ? "Hide" : "Show"}
                  </button>
                </td>
                <td>
                  <button className="add-btn" onClick={() => openModal(cust)}>
                    Add Installment
                  </button>
                </td>
              </tr>

              {expanded[cust._id] && (
                <tr className="installment-row">
                  <td colSpan={12}>
                    <table className="inner-installment-table">
                      <thead>
                        <tr>
                          <th>Installment No</th>
                          <th>Installment Date</th>
                          <th>Next Due Date</th>
                          <th>Installment Amount</th>
                          <th>Received</th>
                          <th>Balance</th>
                          <th>Bank</th>
                          <th>Cheque No</th>
                          <th>Cheque Date</th>
                          <th>Clear Date</th>
                          <th>Remark</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cust.installments.length > 0 ? (
                          cust.installments.map((inst, idx) => (
                            <tr key={idx}>
                              <td>{inst.installmentNo || idx + 1}</td>
                              <td>{inst.installmentDate || "-"}</td>
                              <td>{inst.nextDueDate || ""}</td>
                              <td>{inst.installmentAmount || "-"}</td>
                              <td style={{ color: "green", fontWeight: "bold" }}>
                                {inst.receivedAmount || "-"}
                              </td>
                              <td style={{ color: "red", fontWeight: "bold" }}>
                                {inst.balanceAmount || "-"}
                              </td>
                              <td>{inst.bankName || "-"}</td>
                              <td>{inst.chequeNo || "-"}</td>
                              <td>{inst.chequeDate || "-"}</td>
                              <td>{inst.clearDate || "-"}</td>
                              <td>{inst.remark || "-"}</td>
                              <td>{inst.status || "-"}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={12} style={{ textAlign: "center" }}>
                              No Installments Added
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* ---------- Dynamic Pagination ---------- */}
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={(p) => setCurrentPage(p)}
      />

      {/* ---------- Modal ---------- */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add Installment for {selectedCustomer.name}</h3>
            <form onSubmit={handleSubmit}>
              <label>
                Installment No:
                <input
                  type="number"
                  name="installmentNo"
                  value={installmentData.installmentNo}
                  readOnly
                />
              </label>
              <label>
                Installment Date:
                <input
                  type="date"
                  name="installmentDate"
                  value={installmentData.installmentDate}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Next Due Date:
                <input
                  type="date"
                  name="nextDueDate"
                  value={installmentData.nextDueDate}
                  onChange={handleChange}
                />
              </label>
              <label>
                Installment Amount:
                <input
                  type="number"
                  name="installmentAmount"
                  value={installmentData.installmentAmount}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Received Amount:
                <input
                  type="number"
                  name="receivedAmount"
                  value={installmentData.receivedAmount}
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Balance Amount:
                <input
                  type="number"
                  name="balanceAmount"
                  value={installmentData.balanceAmount}
                  readOnly
                />
              </label>
              <label>
                Bank Name:
                <input
                  type="text"
                  name="bankName"
                  value={installmentData.bankName}
                  onChange={handleChange}
                />
              </label>
              <label>
                Cheque No:
                <input
                  type="text"
                  name="chequeNo"
                  value={installmentData.chequeNo}
                  onChange={handleChange}
                />
              </label>
              <label>
                Cheque Date:
                <input
                  type="date"
                  name="chequeDate"
                  value={installmentData.chequeDate}
                  onChange={handleChange}
                />
              </label>
              <label>
                Clear Date:
                <input
                  type="date"
                  name="clearDate"
                  value={installmentData.clearDate}
                  onChange={handleChange}
                />
              </label>
              <label>
                Remark:
                <input
                  type="text"
                  name="remark"
                  value={installmentData.remark}
                  onChange={handleChange}
                />
              </label>
              <label>
                Status:
                <select
                  name="status"
                  value={installmentData.status}
                  onChange={handleChange}
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                </select>
              </label>
              <button type="submit">Add Installment</button>
              <button type="button" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Installments;
