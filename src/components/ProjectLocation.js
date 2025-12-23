import React, { useContext, useState, useMemo, useEffect } from "react";
import { CustomerContext } from "../context/CustomerContext.js";
import "../styles/ProjectLocation.css";

// ✅ PHASE NORMALIZER
const resolvePhaseName = (phase) => {
  if (!phase) return "";
  const p = phase.toLowerCase();

  if (p.includes("phase 1")) return "MahaMumbai Phase 1";
  if (p.includes("phase 2")) return "MahaMumbai Phase 2";
  if (p.includes("phase 3") || p.includes("3.0")) return "MahaMumbai 3.0";
  if (p.includes("phase 4") || p.includes("4.0")) return "MahaMumbai 4";

  return phase;
};

// ✅ Normalize helper
const normalize = (v) =>
  v?.toString().toLowerCase().replace(/\s+/g, "").trim();

const ProjectLocation = () => {
  const { customers, loading } = useContext(CustomerContext);

  const [selectedProject, setSelectedProject] = useState("");
  const [selectedPhase, setSelectedPhase] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 20;

  // ✅ PROJECTS
  const projects = ["MahaMumbai"];

  // ✅ PHASE LIST
  const phaseList = [
    "MahaMumbai Phase 1",
    "MahaMumbai Phase 2",
    "MahaMumbai 3.0",
    "MahaMumbai 4",
  ];

  // ✅ PHASE → VILLAGES MAP
  const phaseVillageMap = {
    "MahaMumbai Phase 1": ["JUI", "Punade", "Vindhane", "Pirkon", "Sarade", "Vasheni", "Khopta", "Kalamusare"],
    "MahaMumbai Phase 2": ["Sangepalleliwavedi", "Sonkhar"],
    "MahaMumbai 3.0": ["Vadhvan-Bandar"],
    "MahaMumbai 4": ["Pali", "Khopoli", "Sudhagad"],
  };

  // ✅ village dropdown list
  const villagesForPhase = useMemo(() => {
    return selectedPhase ? phaseVillageMap[selectedPhase] || [] : [];
  }, [selectedPhase]);

  // ✅ FINAL FILTER
  const filteredCustomers = useMemo(() => {
    if (!selectedProject) return [];

    return customers.filter((c) => {
      const dbPhase = resolvePhaseName(c.phase || c.location);

      const matchPhase = selectedPhase ? dbPhase === selectedPhase : true;

      const matchVillage = selectedVillage
        ? normalize(c.village) === normalize(selectedVillage)
        : true;

      return matchPhase && matchVillage;
    });
  }, [customers, selectedProject, selectedPhase, selectedVillage]);

  // ✅ pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const start = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(start, start + itemsPerPage);

  const next = () => setCurrentPage(p => Math.min(p + 1, totalPages));
  const prev = () => setCurrentPage(p => Math.max(p - 1, 1));

  // ✅ reset page on change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProject, selectedPhase, selectedVillage]);

  return (
    <div className="project-location-container">
      <h1>Project Locations</h1>

      {/* ✅ PROJECT DROPDOWN */}
      <div className="filter-row">
        <label>Select Project:</label>
        <select
          value={selectedProject}
          onChange={(e) => {
            setSelectedProject(e.target.value);
            setSelectedPhase("");
            setSelectedVillage("");
          }}
        >
          <option value="">-- Select Project --</option>
          {projects.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* ✅ PHASE DROPDOWN */}
      {selectedProject && (
        <div className="filter-row">
          <label>Select Phase:</label>
          <select
            value={selectedPhase}
            onChange={(e) => {
              setSelectedPhase(e.target.value);
              setSelectedVillage("");
            }}
          >
            <option value="">-- Select Phase --</option>
            {phaseList.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      )}

      {/* ✅ VILLAGE DROPDOWN */}
      {selectedPhase && (
        <div className="filter-row">
          <label>Select Village:</label>
          <select
            value={selectedVillage}
            onChange={(e) => setSelectedVillage(e.target.value)}
          >
            <option value="">-- All Villages --</option>
            {villagesForPhase.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      )}

      {/* ✅ TABLE */}
      {selectedPhase && (
        <div className="location-details">

          <h3>
            {selectedProject} → {selectedPhase}
            {selectedVillage && ` → ${selectedVillage}`}
          </h3>

          {loading ? (
            <p>Loading...</p>
          ) : paginatedCustomers.length > 0 ? (
            <>
              <table className="location-table">
                <thead>
                  <tr>
                    <th>Customer ID</th>
                    <th>Name</th>
                    <th>Village</th>
                    <th>Phone</th>
                    <th>Booking Area</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCustomers.map((c, i) => (
                    <tr key={i}>
                      <td>{c.customerId}</td>
                      <td>{c.name}</td>
                      <td>{c.village}</td>
                      <td>{c.phone}</td>
                      <td>{c.bookingArea}</td>
                      <td>{c.totalAmount?.toLocaleString()}</td>
                      <td className={c.status?.includes("Active") ? "active" : "inactive"}>
                        {c.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pagination-controls">
                <button onClick={prev}>Prev</button>
                <span>{currentPage} / {totalPages}</span>
                <button onClick={next}>Next</button>
              </div>
            </>
          ) : (
            <p>No customers found</p>
          )}
        </div>
      )}

    </div>
  );
};

export default ProjectLocation;
