import { useState } from "react";
import { frameworks as initialData } from "../data/complianceData";

import TopBar from "../components/TopBar";
import SummaryStrip from "../components/SummaryStrip";
import FrameworkCard from "../components/FrameworkCard";
import ControlsBreakdown from "../components/ControlsBreakdown";

function Overview() {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [frameworks, setFrameworks] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // ✅ STEP 12.9 STATE (SEARCH + FILTER)
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const refreshData = () => {
    setLoading(true);
    setError(false);

    setTimeout(() => {
      const success = Math.random() > 0.2;

      if (success) {
        setFrameworks(initialData);
        setLastUpdated(new Date());
        setError(false);
      } else {
        setError(true);
      }

      setLoading(false);
    }, 1000);
  };

  const isStale = () => {
    const now = new Date();
    const diffMinutes = (now - lastUpdated) / (1000 * 60);
    return diffMinutes > 1;
  };

  // ================= KPI CALCULATIONS =================
  const total = frameworks.length;

  const healthy = frameworks.filter((f) => f.status === "Healthy").length;
  const warning = frameworks.filter((f) => f.status === "Warning").length;
  const failed = frameworks.filter((f) => f.status === "Failed").length;

  const avgCompliance =
    frameworks.length > 0
      ? frameworks.reduce((sum, f) => sum + f.compliance, 0) /
        frameworks.length
      : 0;

  // ================= FILTER LOGIC (12.9 CORE) =================
  const filteredFrameworks = frameworks.filter((f) => {
    const matchesSearch = f.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter =
      filter === "All" || f.status === filter;

    return matchesSearch && matchesFilter;
  });

  // ================= RENDER =================
  return (
    <div
      style={{
        fontFamily: "Arial",
        background: "#f8fafc",
        minHeight: "100vh",
        color: "#111827",
      }}
    >
      <TopBar lastUpdated={lastUpdated} onRefresh={refreshData} />

      {/* TITLE */}
      <div style={{ margin: "14px 20px 10px 20px" }}>
        <h2
          style={{
            margin: 0,
            fontSize: "28px",
            fontWeight: "800",
            color: "#0f172a",
          }}
        >
          Compliance Dashboard
        </h2>
        <p style={{ margin: "6px 0 0 0", fontSize: "14px", color: "#6b7280" }}>
          Real-time compliance monitoring across all frameworks
        </p>
      </div>

      <div style={{ padding: "20px" }}>
        
        {/* KPI STRIP */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "10px",
            padding: "15px",
            marginBottom: "20px",
            background: "linear-gradient(to right, #ffffff, #f9fafb)",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
            textAlign: "center",
          }}
        >
          <div>
            <h4 style={{ margin: 0 }}>{total}</h4>
            <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
              Frameworks
            </p>
          </div>

          <div>
            <h4 style={{ margin: 0, color: "#22c55e" }}>{healthy}</h4>
            <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
              Healthy
            </p>
          </div>

          <div>
            <h4 style={{ margin: 0, color: "#f59e0b" }}>{warning}</h4>
            <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
              Warning
            </p>
          </div>

          <div>
            <h4 style={{ margin: 0, color: "#ef4444" }}>{failed}</h4>
            <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
              Failed
            </p>
          </div>

          <div>
            <h4 style={{ margin: 0 }}>
              {avgCompliance.toFixed(1)}%
            </h4>
            <p style={{ margin: 0, fontSize: "12px", color: "#6b7280" }}>
              Avg Compliance
            </p>
          </div>
        </div>

        {/* STALE WARNING */}
        {isStale() && (
          <div
            style={{
              background: "#1f2937",
              padding: "10px",
              color: "#fff",
              marginBottom: "15px",
              borderRadius: "6px",
            }}
          >
            ⚠ Data may be stale. Please refresh.
          </div>
        )}

        {/* SEARCH + FILTER BAR (12.9 FEATURE) */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "15px",
            alignItems: "center",
          }}
        >
          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search frameworks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              flex: 1,
            }}
          />

          {/* FILTER BUTTONS */}
          {["All", "Healthy", "Warning", "Failed"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                cursor: "pointer",
                background: filter === status ? "#111827" : "#fff",
                color: filter === status ? "#fff" : "#111827",
                fontWeight: "600",
              }}
            >
              {status}
            </button>
          ))}
        </div>

        {/* COMPONENTS */}
        <SummaryStrip />
        <ControlsBreakdown />

        {loading && <p>Loading compliance data...</p>}
        {error && <p style={{ color: "red" }}>Failed to load data.</p>}

        {/* GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "15px",
            marginTop: "15px",
          }}
        >
          {!loading &&
            !error &&
            filteredFrameworks.map((f) => (
              <FrameworkCard key={f.id} framework={f} />
            ))}
        </div>

      </div>
    </div>
  );
}

export default Overview;
