import React, { useContext, useMemo } from "react";
import { CustomerContext } from "../context/CustomerContext.js";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

// Chart.js register
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
const StatusMonthGraphSpark = () => {
  const { customers } = useContext(CustomerContext);

  // Year-wise Active / SaleDeed counts calculation
  const chartData = useMemo(() => {
    const years = [2022, 2023, 2024, 2025];
    const activeCounts = [];
    const saleDeedCounts = [];

    years.forEach((year) => {
      const yearCustomers = customers.filter((c) => {
        if (!c.date) return false;
        const d = new Date(c.date);
        return d.getFullYear() === year;
      });
      const active = yearCustomers.filter(
        (c) =>
          c.status?.toLowerCase() === "active" ||
          c.status?.toLowerCase() === "active customer"
      ).length;
      const saleDeed = yearCustomers.filter(
        (c) =>
          c.status?.toLowerCase() === "saledeed done" ||
          c.status?.toLowerCase() === "sale deed done"
      ).length;
      activeCounts.push(active);
      saleDeedCounts.push(saleDeed);
    });
    return {
      labels: years,
      datasets: [
        {
          label: "Active",
          data: activeCounts,
          backgroundColor: "#1E90FF" // Orange
        },
        {
          label: "SaleDeed",
          data: saleDeedCounts,
          backgroundColor: "#28A745" // Green
        }
      ]
    };
  }, [customers]);
  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Year-wise Active / SaleDeed Customers" }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 }
      }
    }
  };

  return <Bar data={chartData} options={options} />;
};

export default StatusMonthGraphSpark;
