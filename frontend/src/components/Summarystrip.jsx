import { frameworks } from "../data/complianceData";

function SummaryStrip() {
  const allFrameworks = frameworks.length;

  const healthy = frameworks.filter(f => f.status === "Healthy").length;
  const warning = frameworks.filter(f => f.status === "Warning").length;
  const failed = frameworks.filter(f => f.status === "Failed").length;

  return (
    <div style={{
      display: "flex",
      gap: "20px",
      padding: "10px",
      borderBottom: "1px solid #eee"
    }}>
      <div>Total: {allFrameworks}</div>
      <div style={{ color: "#2ecc71" }}>Healthy: {healthy}</div>
      <div style={{ color: "#f39c12" }}>Warning: {warning}</div>
      <div style={{ color: "#e74c3c" }}>Failed: {failed}</div>
    </div>
  );
}

export default SummaryStrip;