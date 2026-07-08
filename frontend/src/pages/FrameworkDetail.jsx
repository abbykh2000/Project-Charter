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
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <button
        onClick={() => navigate("/")}
        style={{ marginBottom: "15px" }}
      >
        ← Back to Dashboard
      </button>

      <h1>{framework.name}</h1>

      <p><b>Status:</b> {framework.status}</p>
      <p><b>Compliance:</b> {framework.compliance}%</p>
      <p><b>Passed:</b> {framework.passed}</p>
      <p><b>Failed:</b> {framework.failed}</p>
      <p><b>Total:</b> {framework.total}</p>
    </div>
  );
}

export default FrameworkDetail;