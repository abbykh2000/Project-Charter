function FrameworkControlsBreakdown({ framework }) {
  const passedPercent =
    (framework.passed / framework.total) * 100;

  const failedPercent =
    (framework.failed / framework.total) * 100;

  return (
    <div
      style={{
        background: "#ffffff",
        padding: "24px",
        borderRadius: "12px",
        marginTop: "30px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: "25px",
          color: "#1e293b",
          fontSize: "22px",
        }}
      >
        Controls Breakdown
      </h2>

      {/* Passed Controls */}
      <div style={{ marginBottom: "25px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <strong>Passed Controls</strong>
          <span>{framework.passed}</span>
        </div>

        <div
          style={{
            height: "14px",
            background: "#e5e7eb",
            borderRadius: "999px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${passedPercent}%`,
              height: "100%",
              background: "#22c55e",
            }}
          />
        </div>
      </div>

      {/* Failed Controls */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <strong>Failed Controls</strong>
          <span>{framework.failed}</span>
        </div>

        <div
          style={{
            height: "14px",
            background: "#e5e7eb",
            borderRadius: "999px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${failedPercent}%`,
              height: "100%",
              background: "#ef4444",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default FrameworkControlsBreakdown;