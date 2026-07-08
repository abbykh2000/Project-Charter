import { useNavigate } from "react-router-dom";

function FrameworkCard({ framework }) {
  const navigate = useNavigate();

  const getStatusStyle = (status) => {
    if (status === "Healthy") return { bg: "#dcfce7", text: "#166534", glow: "rgba(34,197,94,0.15)" };
    if (status === "Warning") return { bg: "#fef3c7", text: "#92400e", glow: "rgba(245,158,11,0.15)" };
    return { bg: "#fee2e2", text: "#991b1b", glow: "rgba(239,68,68,0.15)" };
  };

  const getFrameworkTag = (name) => {
    if (name.includes("SOC")) return "SOC 2";
    if (name.includes("ISO")) return "ISO 27001";
    if (name.includes("PCI")) return "PCI DSS";
    return "FRAMEWORK";
  };

  const statusStyle = getStatusStyle(framework.status);

  return (
    <div
      onClick={() => navigate(`/framework/${framework.id}`)}
      style={{
        background: "#ffffff",
        borderRadius: "16px",
        padding: "18px",
        marginBottom: "15px",
        cursor: "pointer",
        border: "1px solid #e5e7eb",
        boxShadow: `0 6px 18px ${statusStyle.glow}`,
        transition: "all 0.25s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0px)";
        e.currentTarget.style.boxShadow = `0 6px 18px ${statusStyle.glow}`;
      }}
    >
      {/* HEADER ROW */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>
          {framework.name}
        </h3>

        {/* FRAMEWORK TAG BADGE */}
        <span
          style={{
            fontSize: "11px",
            padding: "4px 8px",
            borderRadius: "999px",
            background: "#111827",
            color: "#fff",
            fontWeight: "600",
          }}
        >
          {getFrameworkTag(framework.name)}
        </span>
      </div>

      {/* STATUS */}
      <p style={{ margin: "10px 0", fontSize: "13px" }}>
        Status:{" "}
        <span
          style={{
            padding: "4px 10px",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: "600",
            background: statusStyle.bg,
            color: statusStyle.text,
          }}
        >
          ● {framework.status}
        </span>
      </p>

      {/* COMPLIANCE PROGRESS */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: "13px", color: "#6b7280" }}>
            Compliance
          </span>
          <b style={{ fontSize: "13px" }}>
            {framework.compliance}%
          </b>
        </div>

        <div
          style={{
            height: "8px",
            background: "#e5e7eb",
            borderRadius: "999px",
            marginTop: "6px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${framework.compliance}%`,
              background:
                framework.compliance >= 90
                  ? "#22c55e"
                  : framework.compliance >= 75
                  ? "#f59e0b"
                  : "#ef4444",
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>

      {/* CONTROLS */}
      <p style={{ margin: "10px 0 0 0", fontSize: "13px", color: "#444" }}>
        Controls: <b>{framework.passed}/{framework.total}</b>
      </p>

      {/* CTA */}
      <span
        style={{
          fontSize: "12px",
          color: "#6b7280",
          display: "block",
          marginTop: "10px",
          fontWeight: "500",
        }}
      >
        Click to view detailed compliance analysis →
      </span>
    </div>
  );
}

export default FrameworkCard;