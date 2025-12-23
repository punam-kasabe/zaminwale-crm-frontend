import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/ActivityLogPage.css";

const ActivityLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all, today, week
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/activity-log");
        setLogs(res.data);
      } catch (err) {
        console.error("Error fetching logs:", err);
      }
    };
    fetchLogs();
  }, []);

  const now = new Date();
  const startOfToday = new Date(now.setHours(0, 0, 0, 0));
  const startOfWeek = new Date();
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  // Filter logs based on search and filter
  const filteredLogs = logs
    .filter((log) => {
      const logTime = new Date(log.timestamp);
      if (filter === "today") return logTime >= startOfToday;
      if (filter === "week") return logTime >= startOfWeek;
      return true;
    })
    .filter(
      (log) =>
        log.user?.toLowerCase().includes(search.toLowerCase()) ||
        log.action?.toLowerCase().includes(search.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(search.toLowerCase()))
    );

  // Pagination
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredLogs.length / recordsPerPage);

  return (
    <div className="activity-log-container">
      <h2>Activity Log</h2>

      <div className="controls">
        <div className="filter-buttons">
          <button
            className={filter === "today" ? "active" : ""}
            onClick={() => setFilter("today")}
          >
            Today
          </button>
          <button
            className={filter === "week" ? "active" : ""}
            onClick={() => setFilter("week")}
          >
            This Week
          </button>
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All
          </button>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by user, action, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <p className="no-logs">No activity logs found.</p>
      ) : (
        <>
          <table className="activity-table">
            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Action</th>
                <th>Customer / Module Details</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {currentLogs.map((log, idx) => (
                <tr key={idx}>
                  <td>{indexOfFirstRecord + idx + 1}</td>
                  <td>{log.user}</td>
                  <td>{log.action}</td>
                  <td>{log.details || "-"}</td>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination: Only Previous / Next */}
          <div className="pagination">
            <button
              onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            <button
              onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ActivityLogPage;
