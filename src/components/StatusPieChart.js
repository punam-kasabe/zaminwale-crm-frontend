import React from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);
export default function StatusPieChart({ data = [] }) {

  // Ensure data is always an array
  const safeData = Array.isArray(data) ? data : [];

  // --- Count statuses accurately from MongoDB ---
  const countStatus = (keywords = []) => {
    return safeData.filter((c) =>
      keywords.some((key) =>
        String(c?.status || "").toLowerCase() === key.toLowerCase()
      )
    ).length;
  };
  // --- MAIN STATUS COUNTS BASED ON YOUR MONGO DB ---
  const active = countStatus(["Active Customer"]);
  const saledeed = countStatus(["SALEDEED DONE"]);
  const cancelled = countStatus(["BOOKING CANCELLED"]);
  const refunded = countStatus(["Refunded"]);
  const chequeBounce = countStatus(["Cheque Bounce"]);

  // --- CHART DATA ---
  const chartData = {
    labels: ["Active Customer", "Sale Deed Done", "Booking Cancelled", "Refunded", "Cheque Bounce"],
    datasets: [
      {
        data: [active, saledeed, cancelled, refunded, chequeBounce],
        backgroundColor: [
          "rgba(76, 175, 80, 0.85)",   // Active Customer
          "rgba(33,150,243,0.85)",     // Sale Deed Done
          "rgba(255, 82, 82, 0.85)",   // Booking Cancelled
          "rgba(255, 193, 7, 0.85)",   // Refunded
          "rgba(156, 39, 176,0.85)",   // Cheque Bounce
        ],
        borderWidth: 2,
        borderColor: "#fff",
        hoverOffset: 12,
      },
    ],
  };

  return (
    <div style={{ width: "260px", height: "260px", margin: "0 auto" }}>
      <Pie
        data={chartData}
        options={{
          plugins: {
            legend: {
              position: "bottom",
              labels: { font: { size: 13 } },
            },
          },
        }}
      />
    </div>
  );
}
