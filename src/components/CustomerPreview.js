// CustomerPreview.js
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import EditCustomerModal from "./EditCustomerModal.js";
import "./CustomerPreview.css";

// =================== DATE FORMAT FUNCTION ===================
const formatDMY = (rawDate) => {
  if (!rawDate) return "-";
  if (typeof rawDate === "string" && rawDate.match(/^\d{2}-\d{2}-\d{4}$/)) return rawDate;
  const date = new Date(rawDate);
  if (isNaN(date)) return rawDate;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

function CustomerPreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { customer, user } = location.state || {};
  const [expandedInstallments, setExpandedInstallments] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(customer);

  if (!currentCustomer) {
    return (
      <div className="preview-container">
        <h2>No Customer Selected</h2>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const toggleInstallments = () => setExpandedInstallments((prev) => !prev);
  const handleEditSave = (updatedCustomer) => setCurrentCustomer(updatedCustomer);

  // =================== PDF Download ===================
  const downloadInvoice = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Zaminwale Pvt. Ltd.", 200 - 10, 15, { align: "right" });
    doc.setFontSize(18);
    doc.text("Customer Full Details", 105, 30, null, null, "center");

    const details = [
      ["Date", formatDMY(currentCustomer.date)],
      ["Customer ID", currentCustomer.customerId || "-"],
      ["Name", currentCustomer.name || "-"],
      ["Address", currentCustomer.address || "-"],
      ["Phone", currentCustomer.phone || "-"],
      ["Aadhar", currentCustomer.aadharCard || "-"],
      ["PAN", currentCustomer.panCard || "-"],
      ["Booking Area", currentCustomer.bookingArea || "-"],
      ["Rate", currentCustomer.rate || "-"],
      ["Total Amount", currentCustomer.totalAmount || "-"],
      ["Booking Amount", currentCustomer.bookingAmount || "-"],
      ["Received Amount", currentCustomer.receivedAmount || "-"],
      ["Balance", currentCustomer.balanceAmount || "-"],
      ["Discount", currentCustomer.discount || "-"],
      ["Stamp Duty", currentCustomer.stampDutyCharges || "-"],
      ["Stamp Duty Date", formatDMY(currentCustomer.stampDutyDate)],
      ["Stamp Duty Payment Mode", currentCustomer.stampDutyPaymentMode || "-"],
      ["Mou Charge", currentCustomer.mouCharge || "-"],
      ["Location", currentCustomer.location || "-"],
      ["Village", currentCustomer.village || "-"],
      ["Bank", currentCustomer.bankName || "-"],
      ["Payment Mode", currentCustomer.paymentMode || "-"],
      ["Cheque No/UTR", currentCustomer.chequeNo || "-"],
      ["Cheque Date", formatDMY(currentCustomer.chequeDate)],
      ["Remark", currentCustomer.remark || "-"],
      ["Status", currentCustomer.status || "-"],
      ["Calling By", currentCustomer.callingBy || "-"],
      ["Attending By", currentCustomer.attendingBy || "-"],
      ["Site Visiting By", currentCustomer.siteVisitingBy || "-"],
      ["Closing By", currentCustomer.closingBy || "-"],
      ["Paid By Customer ID", currentCustomer.paidByCustomerId || "-"],
      ["Cross Payment Flag", currentCustomer.crossPaymentFlag ? "Yes" : "No"],
    ];

    autoTable(doc, {
      head: [["Field", "Value"]],
      body: details,
      startY: 40,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 120 } },
    });

    const startY = doc.lastAutoTable.finalY + 10;
    const installmentTable = (currentCustomer.installments || []).map(
      (inst, idx) => [
        idx + 1,
        formatDMY(inst.installmentDate),
        inst.installmentAmount || "-",
        inst.receivedAmount || "-",
        inst.balanceAmount || "-",
        inst.bankName || "-",
        inst.paymentMode || "-",
        inst.chequeNo || "-",
        formatDMY(inst.chequeDate),
        inst.status || "-",
        inst.remark || "-",
      ]
    );

    if (installmentTable.length > 0) {
      autoTable(doc, {
        startY,
        head: [
          [
            "Sr No",
            "Date",
            "Amount",
            "Received",
            "Balance",
            "Bank",
            "Mode",
            "Cheque No",
            "Cheque Date",
            "Status",
            "Remark",
          ],
        ],
        body: installmentTable,
        theme: "grid",
        styles: { fontSize: 9 },
        headStyles: { fillColor: [100, 149, 237], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 20 },
          2: { cellWidth: 20 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 },
          6: { cellWidth: 20 },
          7: { cellWidth: 25 },
          8: { cellWidth: 20 },
          9: { cellWidth: 20 },
        },
      });
    }

    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 260;
    doc.setFontSize(12);
    doc.text("Authorized Signature", 190, finalY + 20, { align: "right" });
    doc.line(150, finalY + 15, 200, finalY + 15);

    doc.save(`Customer_${currentCustomer.customerId || "Details"}.pdf`);
  };

  // =================== Print Function ===================
  const printInvoice = () => {
    const printWindow = window.open("", "_blank");
    const installmentsRows = (currentCustomer.installments || [])
      .map(
        (inst, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${formatDMY(inst.installmentDate)}</td>
        <td>${inst.installmentAmount || "-"}</td>
        <td>${inst.receivedAmount || "-"}</td>
        <td>${inst.balanceAmount || "-"}</td>
        <td>${inst.bankName || "-"}</td>
        <td>${inst.paymentMode || "-"}</td>
        <td>${inst.chequeNo || "-"}</td>
        <td>${formatDMY(inst.chequeDate)}</td>
        <td>${inst.status || "-"}</td>
        <td>${inst.remark || "-"}</td>
      </tr>`
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Customer Details</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h2 { text-align: center; margin-bottom: 20px; }
            div { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #000; padding: 5px; text-align: center; font-size: 12px; }
            th { background-color: #2980b9; color: white; }
          </style>
        </head>
        <body>
          <h2>Customer Full Details</h2>
          ${Object.entries(currentCustomer)
            .filter(([key, val]) => typeof val !== "object" || val === null)
            .map(([key, val]) => {
              if (["date", "chequeDate", "stampDutyDate"].includes(key))
                return `<div><b>${key}:</b> ${formatDMY(val)}</div>`;
              return `<div><b>${key}:</b> ${val || "-"}</div>`;
            })
            .join("")}
          <h3>Installments</h3>
          <table>
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Received</th>
                <th>Balance</th>
                <th>Bank</th>
                <th>Mode</th>
                <th>Cheque No / UTR No</th>
                <th>Cheque Date</th>
                <th>Status</th>
                <th>Remark</th>
              </tr>
            </thead>
            <tbody>${installmentsRows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // =================== JSX ===================
  return (
    <div className="preview-container">
      <h2>Customer Details: {currentCustomer.name}</h2>

      {/* Full 2-Column Layout */}
      <div className="customer-info-grid">
        {[
          ["Date", formatDMY(currentCustomer.date)],
          ["Customer ID", currentCustomer.customerId],
          ["Name", currentCustomer.name],
          ["Address", currentCustomer.address],
          ["Phone", currentCustomer.phone],
          ["Aadhar", currentCustomer.aadharCard],
          ["PAN", currentCustomer.panCard],
          ["Booking Area", currentCustomer.bookingArea],
          ["Rate", currentCustomer.rate],
          ["Total Amount", currentCustomer.totalAmount],
          ["Booking Amount", currentCustomer.bookingAmount],
          ["Received Amount", currentCustomer.receivedAmount],
          ["Balance", currentCustomer.balanceAmount],
          ["Discount", currentCustomer.discount],
          ["Stamp Duty", currentCustomer.stampDutyCharges],
          ["Stamp Duty Date", formatDMY(currentCustomer.stampDutyDate)],
          ["Stamp Duty Payment Mode", currentCustomer.stampDutyPaymentMode],
          ["Legal Charges", `₹${(currentCustomer.legalCharges ?? 15000).toLocaleString("en-IN")}`],
          ["Mou Charge", currentCustomer.mouCharge],
          ["Location", currentCustomer.location],
          ["Village", currentCustomer.village],
          ["Bank", currentCustomer.bankName],
          ["Payment Mode", currentCustomer.paymentMode],
          ["Cheque No / UTR No", currentCustomer.chequeNo],
          ["Cheque Date", formatDMY(currentCustomer.chequeDate)],
          ["Remark", currentCustomer.remark],
          ["Status", currentCustomer.status],
          ["Calling By", currentCustomer.callingBy],
          ["Attending By", currentCustomer.attendingBy],
          ["Site Visiting By", currentCustomer.siteVisitingBy],
          ["Closing By", currentCustomer.closingBy],
          ["Paid By Customer ID", currentCustomer.paidByCustomerId],
          ["Cross Payment", currentCustomer.crossPaymentFlag ? "Yes" : "No"],
        ].map(([label, value], idx) => (
          <div className="info-row" key={idx}>
            <b>{label}:</b> {value || "-"}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div style={{ marginTop: "20px" }}>
        <button className="download-btn" onClick={downloadInvoice}>
          Download PDF
        </button>
        {user?.role === "admin" && (
          <button
            className="download-btn"
            onClick={() => setShowEditModal(true)}
            style={{ marginLeft: "10px" }}
          >
            Edit Customer
          </button>
        )}
        <button
          className="download-btn"
          onClick={printInvoice}
          style={{ marginLeft: "10px" }}
        >
          Print
        </button>
      </div>

      {/* Installments Table */}
      <div className="installments-section">
        <button className="toggle-btn" onClick={toggleInstallments}>
          {expandedInstallments
            ? "Hide Installments"
            : `Show Installments (${currentCustomer.installments?.length || 0})`}
        </button>

        {expandedInstallments && currentCustomer.installments?.length > 0 && (
          <table className="installments-table">
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Received</th>
                <th>Balance</th>
                <th>Bank</th>
                <th>Mode</th>
                <th>Cheque No / UTR No</th>
                <th>Cheque Date</th>
                <th>Status</th>
                <th>Remark</th>
              </tr>
            </thead>
            <tbody>
              {currentCustomer.installments.map((inst, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{formatDMY(inst.installmentDate)}</td>
                  <td>{inst.installmentAmount || "-"}</td>
                  <td>{inst.receivedAmount || "-"}</td>
                  <td>{inst.balanceAmount || "-"}</td>
                  <td>{inst.bankName || "-"}</td>
                  <td>{inst.paymentMode || "-"}</td>
                  <td>{inst.chequeNo || "-"}</td>
                  <td>{formatDMY(inst.chequeDate)}</td>
                  <td>{inst.status || "-"}</td>
                  <td>{inst.remark || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      {/* Edit Customer Modal */}
      {user?.role === "admin" && (
        <EditCustomerModal
          show={showEditModal}
          onClose={() => setShowEditModal(false)}
          customer={currentCustomer}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}

export default CustomerPreview;
