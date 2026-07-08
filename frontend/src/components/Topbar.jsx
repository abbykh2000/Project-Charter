function TopBar({ lastUpdated, onRefresh }) {
  return (
    <div
      style={{
        padding: "12px 20px",
        borderBottom: "1px solid #e5e7eb",
        background: "#ffffff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
        Last synced: {lastUpdated.toLocaleTimeString()}
      </p>

      {/* RIGHT SIDE */}
      <button
        onClick={onRefresh}
        style={{
          padding: "6px 12px",
          borderRadius: "6px",
          border: "1px solid #ddd",
          cursor: "pointer",
        }}
      >
        Refresh
      </button>
    </div>
  );
}

export default TopBar;