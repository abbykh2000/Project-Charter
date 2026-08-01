function ControlsBreakdown({ frameworks = [] }) {
  const totals = frameworks.reduce(
    (summary, framework) => {
      summary.passed += normalizeNumber(
        framework?.passed
      );

      summary.failed += normalizeNumber(
        framework?.failed
      );

      return summary;
    },
    {
      passed: 0,
      failed: 0,
    }
  );

  const evaluatedControls =
    totals.passed + totals.failed;

  const passPercent =
    evaluatedControls > 0
      ? Math.round(
          (totals.passed /
            evaluatedControls) *
            100
        )
      : 0;

  const failPercent =
    evaluatedControls > 0
      ? 100 - passPercent
      : 0;

  return (
    <section
      aria-labelledby="controls-breakdown-title"
      style={sectionStyle}
    >
      <div style={headerStyle}>
        <div>
          <span style={eyebrowStyle}>
            Control Performance
          </span>

          <h2
            id="controls-breakdown-title"
            style={titleStyle}
          >
            Controls Breakdown
          </h2>
        </div>

        {evaluatedControls > 0 && (
          <div style={totalSummaryStyle}>
            <strong style={totalValueStyle}>
              {evaluatedControls}
            </strong>

            <span style={totalLabelStyle}>
              Evaluated controls
            </span>
          </div>
        )}
      </div>

      {evaluatedControls === 0 ? (
        <div
          role="status"
          style={emptyStateStyle}
        >
          <div
            aria-hidden="true"
            style={emptyIconStyle}
          >
            —
          </div>

          <strong style={emptyTitleStyle}>
            No control data available
          </strong>

          <span style={emptyDescriptionStyle}>
            Control results will appear here once
            framework data has been loaded.
          </span>
        </div>
      ) : (
        <>
          <div
            role="img"
            aria-label={`${totals.passed} passed controls, ${passPercent} percent. ${totals.failed} failed controls, ${failPercent} percent.`}
            style={progressTrackStyle}
          >
            {totals.passed > 0 && (
              <div
                title={`Passed: ${totals.passed} (${passPercent}%)`}
                style={{
                  ...progressSegmentStyle,
                  width: `${passPercent}%`,
                  background: "#16a34a",
                }}
              />
            )}

            {totals.failed > 0 && (
              <div
                title={`Failed: ${totals.failed} (${failPercent}%)`}
                style={{
                  ...progressSegmentStyle,
                  width: `${failPercent}%`,
                  background: "#dc2626",
                }}
              />
            )}
          </div>

          <div style={metricsGridStyle}>
            <MetricCard
              label="Passed"
              value={totals.passed}
              percentage={passPercent}
              accent="#15803d"
              background="#f0fdf4"
              border="#bbf7d0"
            />

            <MetricCard
              label="Failed"
              value={totals.failed}
              percentage={failPercent}
              accent="#b91c1c"
              background="#fef2f2"
              border="#fecaca"
            />

            <MetricCard
              label="Total Evaluated"
              value={evaluatedControls}
              accent="#334155"
              background="#f8fafc"
              border="#e2e8f0"
            />
          </div>
        </>
      )}
    </section>
  );
}

function MetricCard({
  label,
  value,
  percentage,
  accent,
  background,
  border,
}) {
  return (
    <div
      style={{
        ...metricCardStyle,
        background,
        borderColor: border,
      }}
    >
      <div style={metricHeaderStyle}>
        <span
          aria-hidden="true"
          style={{
            ...metricIndicatorStyle,
            background: accent,
          }}
        />

        <span style={metricLabelStyle}>
          {label}
        </span>
      </div>

      <div style={metricValueRowStyle}>
        <strong
          style={{
            ...metricValueStyle,
            color: accent,
          }}
        >
          {value}
        </strong>

        {Number.isFinite(percentage) && (
          <span
            style={{
              ...percentageStyle,
              color: accent,
            }}
          >
            {percentage}%
          </span>
        )}
      </div>
    </div>
  );
}

function normalizeNumber(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(numericValue)
  );
}

const fontFamily =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const sectionStyle = {
  width: "100%",
  padding: "22px",
  border: "1px solid #e2e8f0",
  borderRadius: "13px",
  background: "#ffffff",
  color: "#0f172a",
  fontFamily,
  boxShadow:
    "0 4px 14px rgba(15, 23, 42, 0.055)",
  boxSizing: "border-box",
};

const headerStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "20px",
  marginBottom: "22px",
  flexWrap: "wrap",
};

const eyebrowStyle = {
  display: "block",
  marginBottom: "5px",
  color: "#64748b",
  fontSize: "10px",
  lineHeight: 1.4,
  fontWeight: "750",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const titleStyle = {
  margin: 0,
  color: "#0f172a",
  fontSize: "18px",
  lineHeight: 1.35,
  fontWeight: "740",
  letterSpacing: "-0.02em",
};

const totalSummaryStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  minWidth: "120px",
};

const totalValueStyle = {
  color: "#0f172a",
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: "760",
  letterSpacing: "-0.03em",
};

const totalLabelStyle = {
  marginTop: "5px",
  color: "#64748b",
  fontSize: "11px",
  lineHeight: 1.4,
};

const progressTrackStyle = {
  display: "flex",
  width: "100%",
  height: "12px",
  marginBottom: "20px",
  overflow: "hidden",
  border: "1px solid #cbd5e1",
  borderRadius: "999px",
  background: "#e2e8f0",
  boxSizing: "border-box",
};

const progressSegmentStyle = {
  height: "100%",
  minWidth: 0,
  transition: "width 300ms ease",
};

const metricsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(170px, 1fr))",
  gap: "12px",
};

const metricCardStyle = {
  minWidth: 0,
  padding: "15px",
  border: "1px solid",
  borderRadius: "10px",
  boxSizing: "border-box",
};

const metricHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  marginBottom: "10px",
};

const metricIndicatorStyle = {
  flexShrink: 0,
  width: "8px",
  height: "8px",
  borderRadius: "50%",
};

const metricLabelStyle = {
  color: "#475569",
  fontSize: "10.5px",
  lineHeight: 1.4,
  fontWeight: "750",
  letterSpacing: "0.045em",
  textTransform: "uppercase",
};

const metricValueRowStyle = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: "12px",
};

const metricValueStyle = {
  fontSize: "22px",
  lineHeight: 1,
  fontWeight: "760",
  letterSpacing: "-0.025em",
};

const percentageStyle = {
  fontSize: "12px",
  lineHeight: 1,
  fontWeight: "700",
};

const emptyStateStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "150px",
  padding: "24px",
  border: "1px dashed #cbd5e1",
  borderRadius: "10px",
  background: "#f8fafc",
  textAlign: "center",
  boxSizing: "border-box",
};

const emptyIconStyle = {
  display: "grid",
  placeItems: "center",
  width: "34px",
  height: "34px",
  marginBottom: "11px",
  borderRadius: "50%",
  background: "#e2e8f0",
  color: "#64748b",
  fontSize: "18px",
  fontWeight: "700",
};

const emptyTitleStyle = {
  marginBottom: "5px",
  color: "#334155",
  fontSize: "13px",
  lineHeight: 1.4,
  fontWeight: "700",
};

const emptyDescriptionStyle = {
  maxWidth: "360px",
  color: "#64748b",
  fontSize: "12px",
  lineHeight: 1.55,
};

export default ControlsBreakdown;