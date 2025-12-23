import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../config.js";
import "./EditCustomerModal.css";

/* 🔹 COMMON STATUS OPTIONS */
const STATUS_OPTIONS = [
  "Active Customer",
  "For Feit",
  "Cancelled",
  "Refunded",
  "SALEDEED DONE",
  "BOOKING CANCELLED",
  "Cheque Bounce",
  "Bounced",
  "Pending",
  "Paid",
  "Cheque not clear",
];

function EditCustomerModal({ show, onClose, customer, onSave }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  const formatDate = (date) => {
    if (!date) return "";
    try {
      return date.toString().substring(0, 10);
    } catch {
      return "";
    }
  };

  // 🔹 INIT CUSTOMER DATA
  useEffect(() => {
    if (!customer) return;

    const updated = { ...customer };

    updated.date = formatDate(customer.date);
    updated.chequeDate = formatDate(customer.chequeDate);
    updated.clearDate = formatDate(customer.clearDate);
    updated.dueDate = formatDate(customer.dueDate);
    updated.nextDueDate = formatDate(customer.nextDueDate);

    updated.baseReceivedAmount = Number(customer.receivedAmount) || 0;

    updated.installments = (customer.installments || []).map((inst) => ({
      ...inst,
      installmentDate: formatDate(inst.installmentDate),
      chequeDate: formatDate(inst.chequeDate),
      nextDueDate: formatDate(inst.nextDueDate),
      clearDate: formatDate(inst.clearDate),
      receivedAmount: inst.receivedAmount || "",
      status: inst.status || "Pending",
    }));

    setFormData(updated);
  }, [customer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🔥 INSTALLMENT RECEIVED → AUTO UPDATE TOTAL
  const updateInstallmentField = (index, field, value) => {
    const updatedInstallments = [...formData.installments];
    updatedInstallments[index][field] = value;

    const installmentReceivedTotal = updatedInstallments.reduce(
      (sum, i) => sum + (Number(i.receivedAmount) || 0),
      0
    );

    const totalReceived =
      (Number(formData.baseReceivedAmount) || 0) +
      installmentReceivedTotal;

    const balanceAmount =
      (Number(formData.totalAmount) || 0) -
      (Number(formData.bookingAmount) || 0) -
      totalReceived;

    setFormData({
      ...formData,
      installments: updatedInstallments,
      receivedAmount: totalReceived,
      balanceAmount: balanceAmount,
    });
  };

  // ➕ ADD INSTALLMENT
  const addInstallment = () => {
    const newInst = {
      installmentNo: (formData.installments?.length || 0) + 1,
      installmentDate: "",
      installmentAmount: "",
      receivedAmount: "",
      balanceAmount: "",
      bankName: "",
      paymentMode: "",
      chequeNo: "",
      chequeDate: "",
      nextDueDate: "",
      clearDate: "",
      remark: "",
      status: "Pending",
    };

    setFormData({
      ...formData,
      installments: [...(formData.installments || []), newInst],
    });
  };

  const removeInstallment = (index) => {
    const updatedInstallments = [...formData.installments];
    updatedInstallments.splice(index, 1);

    const installmentReceivedTotal = updatedInstallments.reduce(
      (sum, i) => sum + (Number(i.receivedAmount) || 0),
      0
    );

    const totalReceived =
      (Number(formData.baseReceivedAmount) || 0) +
      installmentReceivedTotal;

    const balanceAmount =
      (Number(formData.totalAmount) || 0) -
      (Number(formData.bookingAmount) || 0) -
      totalReceived;

    setFormData({
      ...formData,
      installments: updatedInstallments,
      receivedAmount: totalReceived,
      balanceAmount: balanceAmount,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(
        `${BASE_URL}/api/customers/${customer._id}`,
        formData
      );
      onSave(formData);
      alert("✅ Customer updated successfully!");
      onClose();
    } catch (err) {
      console.error(err);
      alert("❌ Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  const fields = [
    "date","customerId","name","phone","address","location","village",
    "aadharCard","panCard","bookingArea","rate","totalAmount",
    "bookingAmount","receivedAmount","balanceAmount",
    "bankName","stampDutyCharges","mouCharge","paymentMode",
    "chequeNo","chequeDate","nextDueDate","clearDate",
    "callingBy","attendingBy","siteVisitBy","closingBy","remark","status",
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Customer</h2>

        <form className="edit-customer-form">
          {fields.map((field) => (
            <div className="form-group" key={field}>
              <label>{field.replace(/([A-Z])/g, " $1")}</label>

              {/* ✅ CUSTOMER STATUS DROPDOWN */}
              {field === "status" ? (
                <select
                  name="status"
                  value={formData.status || ""}
                  onChange={handleChange}
                >
                  <option value="">Select Status</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={
                    field.toLowerCase().includes("date")
                      ? "date"
                      : field.toLowerCase().includes("amount") ||
                        field.toLowerCase().includes("rate")
                      ? "number"
                      : "text"
                  }
                  name={field}
                  value={formData[field] || ""}
                  onChange={handleChange}
                />
              )}
            </div>
          ))}

          <h3>Installments</h3>

          {(formData.installments || []).map((inst, index) => (
            <div className="installment-row" key={index}>
              <h4>Installment {index + 1}</h4>

              <input type="date" value={inst.installmentDate}
                onChange={(e)=>updateInstallmentField(index,"installmentDate",e.target.value)} />

              <input type="number" placeholder="Installment Amount"
                value={inst.installmentAmount}
                onChange={(e)=>updateInstallmentField(index,"installmentAmount",e.target.value)} />

              <input type="number" placeholder="Received Amount"
                value={inst.receivedAmount}
                onChange={(e)=>updateInstallmentField(index,"receivedAmount",e.target.value)} />

              <textarea placeholder="Remark"
                value={inst.remark}
                onChange={(e)=>updateInstallmentField(index,"remark",e.target.value)} />

              {/* ✅ INSTALLMENT STATUS DROPDOWN */}
              <select
                value={inst.status}
                onChange={(e)=>updateInstallmentField(index,"status",e.target.value)}
              >
                <option value="">Select Status</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <button type="button" className="remove-btn"
                onClick={()=>removeInstallment(index)}>
                ❌ Remove
              </button>
            </div>
          ))}

          <button type="button" onClick={addInstallment}>+ Add Installment</button>

          <div className="footer-buttons">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" onClick={handleSubmit} disabled={loading}>
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditCustomerModal;
