import React, { useState, useContext, useMemo } from "react";
import { CustomerContext } from "../context/CustomerContext.js";
import { CSVLink } from "react-csv";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import "../components/Projects.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

function Projects({ user }) {
  const { customers, loading } = useContext(CustomerContext);

  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [chartType, setChartType] = useState("bar"); // ← NEW
  const itemsPerPage = 5;

  const maskPhone = (phone) => phone.replace(/\d(?=\d{4})/g, "*");

  // ---------------- Dynamic Locations and Villages ----------------
  const locationsMap = useMemo(() => {
    const map = {};
    customers.forEach((c) => {
      if (!c.location) return;
      if (!map[c.location]) map[c.location] = new Set();
      if (c.village) map[c.location].add(c.village);
    });
    Object.keys(map).forEach((loc) => {
      map[loc] = Array.from(map[loc]);
    });
    return map;
  }, [customers]);

  // ---------------- Filter Customers ----------------
  const filteredCustomers = customers.filter((c) => {
    let match = true;
    if (selectedLocation) match = match && c.location === selectedLocation;
    if (selectedVillage) match = match && c.village === selectedVillage;
    return match;
  });

  // ---------------- Pagination ----------------
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // ---------------- CSV headers ----------------
  const headers = [
    { label: "Customer ID", key: "customerId" },
    { label: "Name", key: "name" },
    { label: "Phone", key: "phone" },
    { label: "Total Amount", key: "totalAmount" },
    { label: "Booking Amount", key: "bookingAmount" },
    { label: "Balance Amount", key: "balanceAmount" },
    { label: "Location", key: "location" },
    { label: "Village", key: "village" },
  ];

  // ---------------- ADD GRAPH SECTION ----------------
  const projectStats = useMemo(() => {
    const stats = {};
    customers.forEach((c) => {
      if (!c.location) return;
      if (!stats[c.location]) {
        stats[c.location] = { count: 0, total: 0 };
      }
      stats[c.location].count += 1;
      stats[c.location].total += Number(c.totalAmount) || 0;
    });
    return stats;
  }, [customers]);

  const chartData = {
    labels: Object.keys(projectStats),
    datasets: [
      {
        label: "Total Customers",
        data: Object.values(projectStats).map((s) => s.count),
        backgroundColor: "rgba(75,192,192,0.5)",
      },
      {
        label: "Total Amount (₹)",
        data: Object.values(projectStats).map((s) => s.total),
        backgroundColor: "rgba(255,99,132,0.5)",
      },
    ],
  };

  // ---------------- RENDER ----------------
  return (
    <div className="projects-container">
      <h2>🗂 Projects / Locations</h2>

      {/* 🔹 PROJECT GRAPH */}
      <div className="chart-section">
        <div className="chart-header">
          <h3>📊 Project-wise Overview</h3>
          <button
            onClick={() => setChartType(chartType === "bar" ? "pie" : "bar")}
            className="toggle-chart-btn"
          >
            Switch to {chartType === "bar" ? "Pie" : "Bar"} Chart
          </button>
        </div>

        <div className="chart-wrapper">
          {chartType === "bar" ? (
            <Bar data={chartData} options={{ responsive: true }} />
          ) : (
            <Pie
              data={{
                labels: Object.keys(projectStats),
                datasets: [
                  {
                    data: Object.values(projectStats).map((s) => s.total),
                    backgroundColor: [
                      "#4BC0C0",
                      "#FF6384",
                      "#FFCE56",
                      "#36A2EB",
                      "#9966FF",
                    ],
                  },
                ],
              }}
            />
          )}
        </div>
      </div>

      {/* बाकी तुझं आधीचं filters + table code खाली ठेवा */}
      {/* Location Filter */}
      <div className="location-filter">
        <h4>Select Location:</h4>
        {Object.keys(locationsMap).map((loc) => (
          <button
            key={loc}
            className={selectedLocation === loc ? "active" : ""}
            onClick={() => {
              setSelectedLocation(loc);
              setSelectedVillage("");
              setCurrentPage(1);
            }}
          >
            {loc}
          </button>
        ))}
      </div>

      {selectedLocation && (
        <div className="table-wrapper">
          <h4>
            Customers in "{selectedLocation}"{" "}
            {selectedVillage && `- ${selectedVillage}`}
          </h4>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className="customer-table">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Total Amount</th>
                  <th>Booking Amount</th>
                  <th>Balance Amount</th>
                  <th>Location</th>
                  <th>Village</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.length > 0 ? (
                  paginatedCustomers.map((c) => (
                    <tr key={c._id}>
                      <td>{c.customerId}</td>
                      <td>{c.name}</td>
                      <td>{user.role === "admin" ? c.phone : maskPhone(c.phone)}</td>
                      <td>{c.totalAmount}</td>
                      <td>{c.bookingAmount}</td>
                      <td>{c.balanceAmount}</td>
                      <td>{c.location}</td>
                      <td>{c.village}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center" }}>
                      No customers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default Projects;
