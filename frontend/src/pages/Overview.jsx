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

  const refreshData = () => {
    setLoading(true);
    setError(false);

    setTimeout(() => {
      // simulate success OR failure
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

return (
  <div style={{ fontFamily: "Arial", background: "#0e5858", minHeight: "100vh" }}>

    <TopBar lastUpdated={lastUpdated} onRefresh={refreshData} />

    {isStale() && (
      <div style={{
        background: "#3d3a3a",
        padding: "10px",
        color: "#aa1c1c",
        margin: "10px"
      }}>
        ⚠ Data may be stale. Please refresh.
      </div>
    )}

    <div style={{ padding: "20px" }}>

      <SummaryStrip />
      <ControlsBreakdown />

      <h2>Framework Overview</h2>

      {loading && <p>Loading compliance data...</p>}

      {error && <p style={{ color: "red" }}>Failed to load data. Try refresh.</p>}

      {!loading && !error && frameworks.length === 0 && (
        <p>No compliance data available.</p>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "15px"
      }}>
        {!loading && !error && frameworks.map(f => (
          <FrameworkCard key={f.id} framework={f} />
        ))}
      </div>

    </div>
  </div>
);
}

export default Overview;
