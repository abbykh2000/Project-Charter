function TopBar({ lastUpdated, onRefresh }) {
  return (
    <div style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
      <h2>Compliance Dashboard</h2>

      <p>
        Last synced: {lastUpdated.toLocaleTimeString()}
      </p>

      <button onClick={onRefresh}>
        Refresh
      </button>
    </div>
  );
}

export default TopBar;