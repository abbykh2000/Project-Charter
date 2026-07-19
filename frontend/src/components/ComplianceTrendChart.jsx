import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function ComplianceTrendChart({ framework }) {
  let data = [];

  switch (framework.name) {
    case "SOC 2":
      data = [
        { month: "Jan", compliance: 78 },
        { month: "Feb", compliance: 82 },
        { month: "Mar", compliance: 86 },
        { month: "Apr", compliance: 89 },
        { month: "May", compliance: 92 },
      ];
      break;

    case "ISO 27001":
      data = [
        { month: "Jan", compliance: 65 },
        { month: "Feb", compliance: 69 },
        { month: "Mar", compliance: 72 },
        { month: "Apr", compliance: 74 },
        { month: "May", compliance: 76 },
      ];
      break;

    case "PCI DSS":
      data = [
        { month: "Jan", compliance: 48 },
        { month: "Feb", compliance: 53 },
        { month: "Mar", compliance: 56 },
        { month: "Apr", compliance: 59 },
        { month: "May", compliance: 61 },
      ];
      break;

    default:
      data = [];
  }

  return (
    <div
      style={{
        background: "#ffffff",
        padding: "25px",
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
        }}
      >
        Compliance Trend
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="4 4" />

          <XAxis dataKey="month" />

          <YAxis domain={[0, 100]} />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="compliance"
            stroke="#2563eb"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ComplianceTrendChart;