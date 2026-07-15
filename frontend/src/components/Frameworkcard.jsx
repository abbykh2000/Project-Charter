import { useNavigate } from "react-router-dom";

function FrameworkCard({ framework }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/framework/${framework.id}`)}
      style={{
        background: "#ffffff",
        borderRadius: "14px",
        padding: "18px",
        marginBottom: "15px",
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        border: "1px solid #f0f0f0",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
      }}
    >
      {/* Framework Name */}
      <h3
        style={{
          margin: "0 0 14px 0",
          fontSize: "18px",
          fontWeight: "600",
          color: "#111827",
        }}
      >
        {framework.name}
      </h3>

      {/* Compliance Percentage */}
      <p
        style={{
          margin: "6px 0",
          fontSize: "14px",
          color: "#374151",
        }}
      >
        Compliance: <b>{framework.compliance}%</b>
      </p>

      {/* Controls */}
      <p
        style={{
          margin: "6px 0",
          fontSize: "14px",
          color: "#374151",
        }}
      >
        Controls: <b>{framework.passed}/{framework.total}</b>
      </p>

      {/* View Details */}
      <span
        style={{
          display: "block",
          marginTop: "14px",
          fontSize: "13px",
          fontWeight: "600",
          color: "#2563eb",
        }}
      >
        View Details →
      </span>
    </div>
  );
}

export default FrameworkCard;