import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function ComplianceTrendChart({ trendData = [] }) {
  return (
    <section
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

      {trendData.length === 0 ? (
        <div
          style={{
            height: "300px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f8fafc",
            borderRadius: "8px",
            color: "#64748b",
            textAlign: "center",
          }}
        >
          No compliance trend data is available.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={trendData}
            margin={{
              top: 10,
              right: 20,
              left: 0,
              bottom: 10,
            }}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="#e2e8f0"
            />

            <XAxis
              dataKey="month"
              tick={{ fill: "#64748b", fontSize: 12 }}
            />

            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
            />

            <Tooltip
              formatter={(value) => [
                `${value}%`,
                "Compliance",
              ]}
            />

            <Line
              type="monotone"
              dataKey="compliance"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{
                r: 4,
                fill: "#2563eb",
              }}
              activeDot={{
                r: 6,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}

export default ComplianceTrendChart;