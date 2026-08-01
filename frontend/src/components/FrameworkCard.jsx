import { useNavigate } from "react-router-dom";

function FrameworkCard({ framework }) {
  const navigate = useNavigate();

  const frameworkId = framework?.id;

  const frameworkName =
    framework?.name?.trim() ||
    "Unnamed Framework";

  const compliance = normalizeNumber(
    framework?.compliance
  );

  const passed = normalizeNumber(
    framework?.passed
  );

  const total = normalizeNumber(
    framework?.total
  );

  const boundedCompliance = Math.min(
    Math.max(compliance, 0),
    100
  );

  function openFramework() {
    if (
      frameworkId === undefined ||
      frameworkId === null
    ) {
      return;
    }

    navigate(
      `/framework/${frameworkId}`
    );
  }

  return (
    <button
      type="button"
      onClick={openFramework}
      aria-label={`Open details for ${frameworkName}`}
      style={cardStyle}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform =
          "translateY(-3px)";

        event.currentTarget.style.boxShadow =
          "0 10px 24px rgba(15, 23, 42, 0.1)";

        event.currentTarget.style.borderColor =
          "#bfdbfe";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform =
          "translateY(0)";

        event.currentTarget.style.boxShadow =
          cardStyle.boxShadow;

        event.currentTarget.style.borderColor =
          cardStyle.borderColor;
      }}
      onFocus={(event) => {
        event.currentTarget.style.outline =
          "3px solid rgba(37, 99, 235, 0.2)";

        event.currentTarget.style.outlineOffset =
          "3px";

        event.currentTarget.style.borderColor =
          "#60a5fa";
      }}
      onBlur={(event) => {
        event.currentTarget.style.outline =
          "none";

        event.currentTarget.style.outlineOffset =
          "0";

        event.currentTarget.style.borderColor =
          cardStyle.borderColor;
      }}
    >
      <div style={headerStyle}>
        <span style={eyebrowStyle}>
          Compliance Framework
        </span>

        <h3 style={titleStyle}>
          {frameworkName}
        </h3>
      </div>

      <div style={complianceHeaderStyle}>
        <div>
          <span style={metricLabelStyle}>
            Compliance
          </span>

          <strong
            style={complianceValueStyle}
          >
            {boundedCompliance}%
          </strong>
        </div>

        <span style={controlSummaryStyle}>
          {passed} of {total} controls
        </span>
      </div>

      <div
        role="progressbar"
        aria-label={`${frameworkName} compliance`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={
          boundedCompliance
        }
        style={progressTrackStyle}
      >
        <div
          style={{
            ...progressFillStyle,
            width: `${boundedCompliance}%`,
          }}
        />
      </div>

      <div style={metricsGridStyle}>
        <Metric
          label="Passed"
          value={passed}
        />

        <Metric
          label="Total Controls"
          value={total}
        />
      </div>

      <div style={footerStyle}>
        <span style={detailsTextStyle}>
          View framework details
        </span>

        <span
          aria-hidden="true"
          style={arrowStyle}
        >
          →
        </span>
      </div>
    </button>
  );
}

function Metric({ label, value }) {
  return (
    <div style={metricCardStyle}>
      <span style={metricLabelStyle}>
        {label}
      </span>

      <strong style={metricValueStyle}>
        {value}
      </strong>
    </div>
  );
}

function normalizeNumber(value) {
  const numericValue = Number(value);

  if (
    !Number.isFinite(numericValue)
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(numericValue)
  );
}

const fontFamily =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const cardStyle = {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  minWidth: 0,
  padding: "21px",
  border: "1px solid #e2e8f0",
  borderColor: "#e2e8f0",
  borderRadius: "13px",
  background: "#ffffff",
  color: "#0f172a",
  fontFamily,
  textAlign: "left",
  cursor: "pointer",
  boxShadow:
    "0 4px 14px rgba(15, 23, 42, 0.055)",
  transition:
    "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
  outline: "none",
  boxSizing: "border-box",
};

const headerStyle = {
  minWidth: 0,
  marginBottom: "24px",
};

const eyebrowStyle = {
  display: "block",
  marginBottom: "6px",
  color: "#64748b",
  fontSize: "10px",
  fontWeight: "750",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const titleStyle = {
  margin: 0,
  color: "#0f172a",
  fontSize: "17px",
  lineHeight: 1.35,
  fontWeight: "730",
  letterSpacing: "-0.015em",
  overflowWrap: "anywhere",
};

const complianceHeaderStyle = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: "14px",
  marginBottom: "10px",
};

const metricLabelStyle = {
  display: "block",
  marginBottom: "4px",
  color: "#64748b",
  fontSize: "10.5px",
  fontWeight: "700",
  letterSpacing: "0.045em",
  textTransform: "uppercase",
};

const complianceValueStyle = {
  display: "block",
  color: "#0f172a",
  fontSize: "24px",
  lineHeight: 1,
  fontWeight: "760",
  letterSpacing: "-0.03em",
};

const controlSummaryStyle = {
  color: "#64748b",
  fontSize: "11.5px",
  lineHeight: 1.4,
  textAlign: "right",
};

const progressTrackStyle = {
  width: "100%",
  height: "7px",
  marginBottom: "20px",
  overflow: "hidden",
  borderRadius: "999px",
  background: "#e2e8f0",
};

const progressFillStyle = {
  height: "100%",
  borderRadius: "inherit",
  background: "#2563eb",
  transition: "width 300ms ease",
};

const metricsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "10px",
  marginBottom: "19px",
};

const metricCardStyle = {
  minWidth: 0,
  padding: "11px 12px",
  border: "1px solid #e2e8f0",
  borderRadius: "9px",
  background: "#f8fafc",
};

const metricValueStyle = {
  display: "block",
  color: "#1e293b",
  fontSize: "15px",
  lineHeight: 1.2,
  fontWeight: "730",
};

const footerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  paddingTop: "16px",
  marginTop: "auto",
  borderTop: "1px solid #e2e8f0",
};

const detailsTextStyle = {
  color: "#2563eb",
  fontSize: "12px",
  fontWeight: "700",
};

const arrowStyle = {
  color: "#2563eb",
  fontSize: "17px",
  lineHeight: 1,
  fontWeight: "700",
};

export default FrameworkCard;