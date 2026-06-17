function FrameworkCard({ framework }) {
  const getColor = (status) => {
    if (status === "Healthy") return "#078d3f"; // green
    if (status === "Warning") return "#b6750c"; // orange
    if (status === "Failed") return "#af1a09";  // red
    return "#ccc";
  };

  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: "15px",
        marginBottom: "10px",
        borderRadius: "8px",
      }}
    >
      <h3>{framework.name}</h3>

      <p>
        Status:{" "}
        <span style={{ color: getColor(framework.status), fontWeight: "bold" }}>
          {framework.status}
        </span>
      </p>

      <p>Compliance: {framework.compliance}%</p>

      <p>
        Controls: {framework.passed}/{framework.total}
      </p>
    </div>
  );
}

export default FrameworkCard;
