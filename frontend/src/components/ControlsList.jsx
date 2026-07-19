function ControlsList({ framework }) {
  const controls = {
    "SOC 2": [
      { id: 1, control: "Access Reviews", category: "Access Control", status: "Passed" },
      { id: 2, control: "Multi-Factor Authentication", category: "Authentication", status: "Passed" },
      { id: 3, control: "Backup Policy", category: "Disaster Recovery", status: "Failed" },
      { id: 4, control: "Encryption Standards", category: "Data Protection", status: "Passed" },
      { id: 5, control: "Vendor Risk Assessment", category: "Risk Management", status: "Passed" },
    ],

    "ISO 27001": [
      { id: 1, control: "Asset Inventory", category: "Asset Management", status: "Passed" },
      { id: 2, control: "Incident Response", category: "Security", status: "Passed" },
      { id: 3, control: "Business Continuity", category: "Operations", status: "Failed" },
      { id: 4, control: "Physical Security", category: "Facilities", status: "Passed" },
      { id: 5, control: "Risk Register", category: "Risk Management", status: "Passed" },
    ],

    "PCI DSS": [
      { id: 1, control: "Firewall Configuration", category: "Network Security", status: "Passed" },
      { id: 2, control: "Cardholder Encryption", category: "Encryption", status: "Failed" },
      { id: 3, control: "Password Policy", category: "Authentication", status: "Passed" },
      { id: 4, control: "System Monitoring", category: "Monitoring", status: "Failed" },
      { id: 5, control: "Security Testing", category: "Testing", status: "Passed" },
    ],
  };

  const data = controls[framework.name] || [];

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
          marginBottom: "20px",
          color: "#1e293b",
        }}
      >
        Controls List
      </h2>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr
            style={{
              background: "#f8fafc",
            }}
          >
            <th style={{ padding: "12px", textAlign: "left" }}>Control</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Category</th>
            <th style={{ padding: "12px", textAlign: "left" }}>Status</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr
              key={item.id}
              style={{
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <td style={{ padding: "12px" }}>{item.control}</td>

              <td style={{ padding: "12px" }}>{item.category}</td>

              <td
                style={{
                  padding: "12px",
                  color:
                    item.status === "Passed"
                      ? "#16a34a"
                      : "#dc2626",
                  fontWeight: "600",
                }}
              >
                {item.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ControlsList;