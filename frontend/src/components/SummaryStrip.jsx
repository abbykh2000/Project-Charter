function SummaryStrip({
  frameworks = [],
  activeStatus = "All",
  onStatusSelect,
}) {
  const summaryItems = [
    {
      label: "Total Frameworks",
      status: "All",
      value: frameworks.length,
      accent: "#2563eb",
      background: "#eff6ff",
      border: "#bfdbfe",
    },
    {
      label: "Healthy",
      status: "Healthy",
      value: frameworks.filter(
        (framework) =>
          framework?.status ===
          "Healthy"
      ).length,
      accent: "#15803d",
      background: "#f0fdf4",
      border: "#bbf7d0",
    },
    {
      label: "Warning",
      status: "Warning",
      value: frameworks.filter(
        (framework) =>
          framework?.status ===
          "Warning"
      ).length,
      accent: "#b45309",
      background: "#fffbeb",
      border: "#fde68a",
    },
    {
      label: "Failed",
      status: "Failed",
      value: frameworks.filter(
        (framework) =>
          framework?.status ===
          "Failed"
      ).length,
      accent: "#b91c1c",
      background: "#fef2f2",
      border: "#fecaca",
    },
  ];

  return (
    <section
      aria-label="Framework status summary"
      style={summaryGridStyle}
    >
      {summaryItems.map((item) => {
        const isActive =
          activeStatus === item.status;

        return (
          <button
            key={item.status}
            type="button"
            onClick={() =>
              onStatusSelect?.(
                item.status
              )
            }
            aria-pressed={isActive}
            aria-label={`${item.label}: ${item.value}`}
            style={{
              ...summaryCardStyle,
              borderColor: isActive
                ? item.accent
                : "#e2e8f0",
              background: isActive
                ? item.background
                : "#ffffff",
              boxShadow: isActive
                ? `0 0 0 2px ${item.border}`
                : summaryCardStyle.boxShadow,
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.transform =
                "translateY(-2px)";

              event.currentTarget.style.boxShadow =
                isActive
                  ? `0 0 0 2px ${item.border}, 0 8px 18px rgba(15, 23, 42, 0.08)`
                  : "0 8px 18px rgba(15, 23, 42, 0.08)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.transform =
                "translateY(0)";

              event.currentTarget.style.boxShadow =
                isActive
                  ? `0 0 0 2px ${item.border}`
                  : summaryCardStyle.boxShadow;
            }}
            onFocus={(event) => {
              event.currentTarget.style.outline =
                `3px solid ${item.border}`;

              event.currentTarget.style.outlineOffset =
                "3px";
            }}
            onBlur={(event) => {
              event.currentTarget.style.outline =
                "none";

              event.currentTarget.style.outlineOffset =
                "0";
            }}
          >
            <div style={cardHeaderStyle}>
              <span
                aria-hidden="true"
                style={{
                  ...statusIndicatorStyle,
                  background:
                    item.accent,
                }}
              />

              <span
                style={statusLabelStyle}
              >
                {item.label}
              </span>
            </div>

            <strong
              style={{
                ...statusValueStyle,
                color: item.accent,
              }}
            >
              {item.value}
            </strong>

            <span
              style={filterHintStyle}
            >
              {isActive
                ? "Currently selected"
                : "Select to filter"}
            </span>
          </button>
        );
      })}
    </section>
  );
}

const fontFamily =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "14px",
  width: "100%",
};

const summaryCardStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  minWidth: 0,
  minHeight: "132px",
  padding: "17px 18px",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  background: "#ffffff",
  color: "#0f172a",
  fontFamily,
  textAlign: "left",
  cursor: "pointer",
  boxShadow:
    "0 3px 12px rgba(15, 23, 42, 0.05)",
  transition:
    "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease",
  outline: "none",
  boxSizing: "border-box",
};

const cardHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "16px",
};

const statusIndicatorStyle = {
  flexShrink: 0,
  width: "8px",
  height: "8px",
  borderRadius: "50%",
};

const statusLabelStyle = {
  minWidth: 0,
  color: "#475569",
  fontSize: "11px",
  lineHeight: 1.4,
  fontWeight: "750",
  letterSpacing: "0.045em",
  textTransform: "uppercase",
};

const statusValueStyle = {
  display: "block",
  marginBottom: "7px",
  fontSize: "28px",
  lineHeight: 1,
  fontWeight: "780",
  letterSpacing: "-0.035em",
};

const filterHintStyle = {
  marginTop: "auto",
  color: "#94a3b8",
  fontSize: "11px",
  lineHeight: 1.4,
};

export default SummaryStrip;