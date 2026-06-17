import { frameworks } from "../data/complianceData";

function ControlsBreakdown() {
  let passed = 0;
  let failed = 0;

  frameworks.forEach(f => {
    passed += f.passed;
    failed += f.failed;
  });

  const total = passed + failed;

  const passPercent = Math.round((passed / total) * 100);
  const failPercent = 100 - passPercent;

  return (
    <div style={{ padding: "20px" }}>
      <h3>Controls Breakdown</h3>

      <div style={{
        display: "flex",
        height: "25px",
        width: "100%",
        border: "1px solid #ccc",
        borderRadius: "5px",
        overflow: "hidden"
      }}>
        <div style={{
          width: `${passPercent}%`,
          backgroundColor: "#2ecc71"
        }} />

        <div style={{
          width: `${failPercent}%`,
          backgroundColor: "#e74c3c"
        }} />
      </div>

      <p>
        Passed: {passed} | Failed: {failed}
      </p>
    </div>
  );
}

export default ControlsBreakdown;