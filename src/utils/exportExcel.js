import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/**
 * Export multiple sheets to Excel
 * @param {Array} sheets - Array of objects: { sheetName: string, data: Array of objects }
 */
export const exportToExcel = (sheets) => {
  const workbook = XLSX.utils.book_new();

  sheets.forEach(({ sheetName, data }) => {
    // Only export if data is not empty
    if (data.length > 0) {
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, ws, sheetName);
    }
  });

  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([wbout], { type: "application/octet-stream" }), "CustomerData.xlsx");
};

/**
 * Helper to prepare data and call exportToExcel
 * @param {Array} customers - Array of customer objects
 */
export const exportCustomersWithInstallments = (customers) => {
  // Prepare customers data
  const customersData = customers.map(c => ({
    Date: c.date || "-",
    "Customer ID": c.customerId || "-",
    Name: c.name || "-",
    Address: c.address || "-",
    Phone: c.phone || "-",
    Aadhar: c.aadharCard || "-",
    PAN: c.panCard || "-",
    "Booking Area": c.bookingArea || "-",
    Rate: c.rate || "-",
    "Total Amount": c.totalAmount || "-",
    "Booking Amount": c.bookingAmount || "-",
    "Received Amount": c.receivedAmount || "-",
    Balance: c.balanceAmount || "-",
    "Stamp Duty": c.stampDutyCharges || "-",
    Location: c.location || "-",
    Village: c.village || "-",
    "Mou Charge": c.mouCharge || "-",
    Bank: c.bankName || "-",
    "Payment Mode": c.paymentMode || "-",
    "Cheque No": c.chequeNo || "-",
    "Cheque Date": c.chequeDate || "-",
    Remark: c.remark || "-",
    Status: c.status || "-",
    "Calling By": c.callingBy || "-",
    "Attending By": c.attendingBy || "-",
    "Site Visiting By": c.siteVisitBy || "-",
    "Closing By": c.closingBy || "-"
  }));

  // Prepare installments data
  const installmentsData = [];
  customers.forEach(c => {
    if (c.installments?.length > 0) {
      c.installments.forEach(inst => {
        installmentsData.push({
          "Customer ID": c.customerId,
          "Installment No": inst.installmentNo || "-",
          Date: inst.installmentDate || "-",
          Amount: inst.installmentAmount || "-",
          Received: inst.receivedAmount || "-",
          Balance: inst.balanceAmount || "-",
          Bank: inst.bankName || "-",
          Mode: inst.paymentMode || "-",
          "Cheque No / UTR": inst.chequeNo || "-",
          "Cheque Date": inst.chequeDate || "-",
          "Clear Date": inst.clearDate || "-",
          Remark: inst.remark || "-",
          Status: inst.status || "-"
        });
      });
    }
  });

  // Export both sheets
  exportToExcel([
    { sheetName: "Customers", data: customersData },
    { sheetName: "Installments", data: installmentsData }
  ]);
};
