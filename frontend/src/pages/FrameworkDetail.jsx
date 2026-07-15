import { useParams, useNavigate } from "react-router-dom";
import { frameworks } from "../data/complianceData";

function FrameworkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  console.log("Clicked ID:", id);

  const framework = frameworks.find(
    (f) => f.id === Number(id)
  );

  console.log("Matched framework:", framework);

  if (!framework) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>Framework not found</h2>
        <p>ID received: {id}</p>

        <button onClick={() => navigate("/")}>
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "30px",
        fontFamily: "Arial",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
<button
  onClick={() => navigate("/")}
  style={{
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",

    backgroundColor: "#1e293b",
    color: "#ffffff",

    padding: "12px 20px",

    border: "none",
    borderRadius: "8px",

    fontSize: "14px",
    fontWeight: "600",

    cursor: "pointer",

    marginBottom: "30px",
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
          fontSize: "15px",
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
        {/* Compliance */}
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

          <h2 style={{ color: "#1e293b", marginBottom: 0 }}>
            {framework.compliance}%
          </h2>
        </div>

        {/* Passed Controls */}
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

          <h2 style={{ color: "#16a34a", marginBottom: 0 }}>
            {framework.passed}
          </h2>
        </div>

        {/* Failed Controls */}
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

          <h2 style={{ color: "#dc2626", marginBottom: 0 }}>
            {framework.failed}
          </h2>
        </div>

        {/* Total Controls */}
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

          <h2 style={{ color: "#1e293b", marginBottom: 0 }}>
            {framework.total}
          </h2>
        </div>
      </div>

      {/* Last Updated */}
      <div
        style={{
          background: "#ffffff",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <h3
          style={{
            marginTop: 0,
            color: "#64748b",
          }}
        >
          Last Updated
        </h3>

        <p
          style={{
            marginBottom: 0,
            color: "#1e293b",
          }}
        >
          Today
        </p>
      </div>
    </div>
  );
}

export default FrameworkDetail;