import { useParams, useNavigate } from "react-router-dom";
import { frameworks } from "../data/complianceData";
import ComplianceTrendChart from "../components/ComplianceTrendChart";
import ControlsList from "../components/ControlsList";

function FrameworkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const framework = frameworks.find(
    (f) => f.id === Number(id)
  );

  if (!framework) {
    return (
      <div style={{ padding: "20px", fontFamily: "Arial" }}>
        <h2>Framework not found</h2>

        <button
          onClick={() => navigate("/")}
          style={{
            backgroundColor: "#1e293b",
            color: "#ffffff",
            padding: "10px 18px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            marginTop: "15px",
          }}
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const passedPercent =
    (framework.passed / framework.total) * 100;

  const failedPercent =
    (framework.failed / framework.total) * 100;

  return (
    <div
      style={{
        padding: "30px",
        fontFamily: "Arial",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        style={{
          backgroundColor: "#1e293b",
          color: "#ffffff",
          padding: "10px 18px",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          marginBottom: "25px",
          fontWeight: "600",
        }}
      >
        ← Back to Dashboard
      </button>

      {/* Header */}
      <h1
        style={{
          marginBottom: "8px",
          color: "#1e293b",
        }}
      >
        {framework.name}
      </h1>

      <p
        style={{
          color: "#64748b",
          marginBottom: "30px",
        }}
      >
        Framework Compliance Overview
      </p>

      {/* Summary Cards */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "35px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "12px",
            minWidth: "180px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h3 style={{ marginTop: 0, color: "#64748b" }}>
            Compliance
          </h3>

          <h2 style={{ color: "#1e293b" }}>
            {framework.compliance}%
          </h2>
        </div>

        <div
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "12px",
            minWidth: "180px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h3 style={{ marginTop: 0, color: "#64748b" }}>
            Passed Controls
          </h3>

          <h2 style={{ color: "#16a34a" }}>
            {framework.passed}
          </h2>
        </div>

        <div
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "12px",
            minWidth: "180px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h3 style={{ marginTop: 0, color: "#64748b" }}>
            Failed Controls
          </h3>

          <h2 style={{ color: "#dc2626" }}>
            {framework.failed}
          </h2>
        </div>

        <div
          style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "12px",
            minWidth: "180px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h3 style={{ marginTop: 0, color: "#64748b" }}>
            Total Controls
          </h3>

          <h2 style={{ color: "#1e293b" }}>
            {framework.total}
          </h2>
        </div>
      </div>

      {/* Controls Breakdown */}
      <div
        style={{
          background: "#ffffff",
          padding: "25px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          marginBottom: "30px",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: "25px",
            color: "#1e293b",
          }}
        >
          Controls Breakdown
        </h2>

        {/* Passed */}
        <div style={{ marginBottom: "25px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <strong>Passed Controls</strong>
            <strong>{framework.passed}</strong>
          </div>

          <div
            style={{
              background: "#e5e7eb",
              height: "16px",
              borderRadius: "999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${passedPercent}%`,
                background: "#22c55e",
                height: "100%",
              }}
            />
          </div>
        </div>

        {/* Failed */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <strong>Failed Controls</strong>
            <strong>{framework.failed}</strong>
          </div>

          <div
            style={{
              background: "#e5e7eb",
              height: "16px",
              borderRadius: "999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${failedPercent}%`,
                background: "#ef4444",
                height: "100%",
              }}
            />
          </div>
        </div>
      </div>

<ComplianceTrendChart framework={framework} />

      {/* Last Updated */}
      <div
        style={{
          background: "#ffffff",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <h3 style={{ marginTop: 0, color: "#64748b" }}>
          Last Updated
        </h3>

        <p style={{ marginBottom: 0 }}>
          Today
        </p>
      </div>
    </div>
  );
}

export default FrameworkDetail;