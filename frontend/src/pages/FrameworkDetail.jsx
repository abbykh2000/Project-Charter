import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getFrameworkById } from "../services/complianceService";

import ComplianceTrendChart from "../components/ComplianceTrendChart";
import ControlsList from "../components/ControlsList";

function FrameworkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [framework, setFramework] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadFramework() {
      try {
        setLoading(true);
        setError("");

        const data = await getFrameworkById(id);

        if (!cancelled) {
          setFramework(data);
        }
      } catch (loadError) {
        console.error(
          "Failed to load framework details:",
          loadError
        );

        if (!cancelled) {
          setError(
            "Unable to load the selected framework."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadFramework();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <PageContainer>
        <LoadingState />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorState
          message={error}
          onRetry={() => window.location.reload()}
          onBack={() => navigate("/")}
        />
      </PageContainer>
    );
  }

  if (!framework) {
    return (
      <PageContainer>
        <NotFoundState
          onBack={() => navigate("/")}
        />
      </PageContainer>
    );
  }

  const metrics = getFrameworkMetrics(framework);
  const complianceTone = getComplianceTone(
    metrics.compliance
  );

  const frameworkStatus =
    framework.frameworkStatus ||
    framework.status ||
    "Active";

  const owner =
    framework.owner || "Not assigned";

  const department =
    framework.department || "Not specified";

  const sourceLabel =
    getSourceLabel(framework);

  const lastUpdated =
    formatDateTime(
      framework.lastSyncedAt ||
        framework.lastUpdated ||
        framework.updatedAt ||
        framework.createdAt
    );

  return (
    <PageContainer>
      <div style={contentStyle}>
        <button
          type="button"
          onClick={() => navigate("/")}
          style={backButtonStyle}
        >
          <span aria-hidden="true">←</span>
          Compliance Overview
        </button>

        <header style={heroStyle}>
          <div style={heroCopyStyle}>
            <div style={heroBadgeRowStyle}>
              <span style={sourceBadgeStyle}>
                {sourceLabel}
              </span>

              <span
                style={getFrameworkStatusStyle(
                  frameworkStatus
                )}
              >
                {frameworkStatus}
              </span>
            </div>

            <h1 style={pageTitleStyle}>
              {framework.name}
            </h1>

            <p style={pageDescriptionStyle}>
              {framework.description ||
                "Review compliance performance, monitor control health, and inspect the evidence attached to this framework."}
            </p>
          </div>

          <div style={heroMetaGridStyle}>
            <MetadataItem
              label="Owner"
              value={owner}
            />

            <MetadataItem
              label="Department"
              value={department}
            />

            <MetadataItem
              label="Last updated"
              value={lastUpdated}
            />
          </div>
        </header>

        <section
          aria-label="Framework compliance summary"
          style={summaryPanelStyle}
        >
          <div style={complianceLeadStyle}>
            <span style={sectionEyebrowStyle}>
              Overall compliance
            </span>

            <div style={complianceValueRowStyle}>
              <strong
                style={{
                  ...complianceValueStyle,
                  color: complianceTone.color,
                }}
              >
                {metrics.compliance}%
              </strong>

              <span
                style={{
                  ...complianceToneStyle,
                  color: complianceTone.color,
                  background:
                    complianceTone.background,
                  border: `1px solid ${complianceTone.border}`,
                }}
              >
                {complianceTone.label}
              </span>
            </div>

            <div style={progressTrackStyle}>
              <div
                style={{
                  ...progressFillStyle,
                  width: `${clampPercent(
                    metrics.compliance
                  )}%`,
                  background:
                    complianceTone.color,
                }}
              />
            </div>

            <p style={complianceSummaryTextStyle}>
              {getComplianceSummaryText(
                metrics
              )}
            </p>
          </div>

          <div style={summaryMetricsGridStyle}>
            <SummaryMetric
              label="Passed"
              value={metrics.passed}
              tone="#15803d"
            />

            <SummaryMetric
              label="Failed"
              value={metrics.failed}
              tone="#b91c1c"
            />

            <SummaryMetric
              label="In progress"
              value={metrics.inProgress}
              tone="#b45309"
            />

            <SummaryMetric
              label="Total controls"
              value={metrics.total}
              tone="#0f172a"
            />
          </div>
        </section>

        <section
          aria-label="Controls health"
          style={sectionCardStyle}
        >
          <SectionHeader
            eyebrow="Control health"
            title="Implementation breakdown"
            description="A status-based view of how controls are progressing across this framework."
          />

          {metrics.total === 0 ? (
            <EmptySection message="No control breakdown data is available for this framework." />
          ) : (
            <div style={healthListStyle}>
              <HealthRow
                label="Passed controls"
                value={metrics.passed}
                total={metrics.total}
                color="#15803d"
                background="#dcfce7"
              />

              <HealthRow
                label="In-progress controls"
                value={metrics.inProgress}
                total={metrics.total}
                color="#b45309"
                background="#fef3c7"
              />

              <HealthRow
                label="Failed controls"
                value={metrics.failed}
                total={metrics.total}
                color="#b91c1c"
                background="#fee2e2"
                isLast
              />
            </div>
          )}
        </section>

        <section style={sectionCardStyle}>
          <SectionHeader
            eyebrow="Performance"
            title="Compliance trend"
            description="Track how compliance has changed over time and identify sustained improvement or decline."
          />

          <ComplianceTrendChart
            trendData={framework.trend ?? []}
          />
        </section>

        <ControlsList
          framework={framework}
          controls={framework.controls ?? []}
        />

        <section
          aria-label="Framework information"
          style={sectionCardStyle}
        >
          <SectionHeader
            eyebrow="Framework information"
            title="Source and ownership"
            description="Reference details for the framework, its data source, and accountable team."
          />

          <div style={informationGridStyle}>
            <InformationItem
              label="Source"
              value={sourceLabel}
            />

            <InformationItem
              label="Framework status"
              value={frameworkStatus}
            />

            <InformationItem
              label="Owner"
              value={owner}
            />

            <InformationItem
              label="Department"
              value={department}
            />

            <InformationItem
              label="Last updated"
              value={lastUpdated}
            />

            <InformationItem
              label="Framework ID"
              value={framework.id ?? id}
            />
          </div>
        </section>
      </div>
    </PageContainer>
  );
}

function PageContainer({ children }) {
  return (
    <main style={pageStyle}>
      {children}
    </main>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}) {
  return (
    <div style={sectionHeaderStyle}>
      <p style={sectionEyebrowStyle}>
        {eyebrow}
      </p>

      <h2 style={sectionTitleStyle}>
        {title}
      </h2>

      <p style={sectionDescriptionStyle}>
        {description}
      </p>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  tone,
}) {
  return (
    <div style={summaryMetricStyle}>
      <span style={summaryMetricLabelStyle}>
        {label}
      </span>

      <strong
        style={{
          ...summaryMetricValueStyle,
          color: tone,
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function HealthRow({
  label,
  value,
  total,
  color,
  background,
  isLast = false,
}) {
  const percent =
    total > 0
      ? Math.round((value / total) * 100)
      : 0;

  return (
    <div
      style={{
        ...healthRowStyle,
        ...(isLast
          ? healthRowLastStyle
          : {}),
      }}
    >
      <div style={healthRowHeaderStyle}>
        <div>
          <strong style={healthLabelStyle}>
            {label}
          </strong>

          <span style={healthPercentStyle}>
            {percent}% of controls
          </span>
        </div>

        <strong
          style={{
            ...healthValueStyle,
            color,
          }}
        >
          {value}
        </strong>
      </div>

      <div
        style={{
          ...healthTrackStyle,
          background,
        }}
      >
        <div
          style={{
            ...healthFillStyle,
            width: `${clampPercent(
              percent
            )}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

function MetadataItem({ label, value }) {
  return (
    <div style={heroMetaItemStyle}>
      <span style={heroMetaLabelStyle}>
        {label}
      </span>

      <strong style={heroMetaValueStyle}>
        {value}
      </strong>
    </div>
  );
}

function InformationItem({
  label,
  value,
}) {
  return (
    <div style={informationItemStyle}>
      <span style={informationLabelStyle}>
        {label}
      </span>

      <strong style={informationValueStyle}>
        {String(value ?? "Not available")}
      </strong>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={contentStyle}>
      <div style={loadingBackStyle} />

      <section style={loadingHeroStyle}>
        <div>
          <div
            style={{
              ...loadingLineStyle,
              width: "110px",
            }}
          />

          <div
            style={{
              ...loadingLineStyle,
              width: "58%",
              height: "34px",
              marginTop: "22px",
            }}
          />

          <div
            style={{
              ...loadingLineStyle,
              width: "82%",
              marginTop: "16px",
            }}
          />
        </div>
      </section>

      <section style={loadingSummaryStyle}>
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            style={loadingMetricStyle}
          />
        ))}
      </section>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
  onBack,
}) {
  return (
    <div style={stateCardStyle}>
      <p style={stateEyebrowStyle}>
        Framework unavailable
      </p>

      <h1 style={stateTitleStyle}>
        Unable to load framework
      </h1>

      <p style={stateTextStyle}>
        {message}
      </p>

      <div style={stateActionsStyle}>
        <button
          type="button"
          onClick={onRetry}
          style={primaryButtonStyle}
        >
          Try again
        </button>

        <button
          type="button"
          onClick={onBack}
          style={secondaryButtonStyle}
        >
          Back to overview
        </button>
      </div>
    </div>
  );
}

function NotFoundState({ onBack }) {
  return (
    <div style={stateCardStyle}>
      <p style={stateEyebrowStyle}>
        Framework unavailable
      </p>

      <h1 style={stateTitleStyle}>
        Framework not found
      </h1>

      <p style={stateTextStyle}>
        The requested framework does not
        exist or is no longer available.
      </p>

      <button
        type="button"
        onClick={onBack}
        style={primaryButtonStyle}
      >
        Back to overview
      </button>
    </div>
  );
}

function EmptySection({ message }) {
  return (
    <div style={emptySectionStyle}>
      {message}
    </div>
  );
}

function getFrameworkMetrics(framework) {
  const controls = Array.isArray(
    framework.controls
  )
    ? framework.controls
    : [];

  const total =
    controls.length > 0
      ? controls.length
      : Number(framework.total) || 0;

  const passed =
    controls.length > 0
      ? controls.filter(
          (control) =>
            normalizeStatus(
              control.status
            ) === "passed"
        ).length
      : Number(framework.passed) || 0;

  const failed =
    controls.length > 0
      ? controls.filter(
          (control) =>
            normalizeStatus(
              control.status
            ) === "failed"
        ).length
      : Number(framework.failed) || 0;

  const inProgress =
    controls.length > 0
      ? controls.filter(
          (control) =>
            normalizeStatus(
              control.status
            ) === "in progress"
        ).length
      : Number(framework.inProgress) || 0;

  const compliance =
    total > 0
      ? Math.round((passed / total) * 100)
      : Number(framework.compliance) || 0;

  return {
    total,
    passed,
    failed,
    inProgress,
    compliance,
  };
}

function normalizeStatus(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getComplianceTone(value) {
  if (value >= 85) {
    return {
      label: "Strong",
      color: "#15803d",
      background: "#f0fdf4",
      border: "#bbf7d0",
    };
  }

  if (value >= 65) {
    return {
      label: "In progress",
      color: "#b45309",
      background: "#fffbeb",
      border: "#fde68a",
    };
  }

  return {
    label: "Needs attention",
    color: "#b91c1c",
    background: "#fef2f2",
    border: "#fecaca",
  };
}

function getComplianceSummaryText(metrics) {
  if (metrics.total === 0) {
    return "No controls are currently available for compliance calculation.";
  }

  if (metrics.compliance >= 85) {
    return "Most controls are operating effectively, with only limited remediation remaining.";
  }

  if (metrics.compliance >= 65) {
    return "Implementation is progressing, but several controls still require attention.";
  }

  return "A significant number of controls require remediation or further implementation.";
}

function getFrameworkStatusStyle(status) {
  const normalized = normalizeStatus(status);

  if (
    normalized === "active" ||
    normalized === "published"
  ) {
    return {
      ...statusBadgeBaseStyle,
      color: "#166534",
      background: "#f0fdf4",
      border: "1px solid #bbf7d0",
    };
  }

  if (
    normalized === "archived" ||
    normalized === "inactive"
  ) {
    return {
      ...statusBadgeBaseStyle,
      color: "#475569",
      background: "#f8fafc",
      border: "1px solid #cbd5e1",
    };
  }

  return {
    ...statusBadgeBaseStyle,
    color: "#92400e",
    background: "#fffbeb",
    border: "1px solid #fde68a",
  };
}

function getSourceLabel(framework) {
  const source = String(
    framework.sourceType ||
      framework.source ||
      ""
  )
    .trim()
    .toLowerCase();

  if (source === "google-sheets") {
    return "Google Sheets";
  }

  if (source === "secureframe") {
    return "Secureframe";
  }

  return "Internal";
}

function formatDateTime(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function clampPercent(value) {
  return Math.min(
    Math.max(Number(value) || 0, 0),
    100
  );
}

const fontFamily =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const pageStyle = {
  minHeight: "100vh",
  padding: "32px 24px 64px",
  background: "#f4f6f9",
  color: "#0f172a",
  fontFamily,
  boxSizing: "border-box",
};

const contentStyle = {
  width: "100%",
  maxWidth: "1240px",
  margin: "0 auto",
};

const backButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: 0,
  marginBottom: "28px",
  border: "none",
  background: "transparent",
  color: "#475569",
  cursor: "pointer",
  fontFamily,
  fontSize: "14px",
  fontWeight: "650",
};

const heroStyle = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0, 1.7fr) minmax(280px, 0.8fr)",
  gap: "32px",
  marginBottom: "24px",
  padding: "30px",
  background: "#ffffff",
  border: "1px solid #dfe5ec",
  borderRadius: "14px",
  boxShadow:
    "0 8px 26px rgba(15, 23, 42, 0.055)",
};

const heroCopyStyle = {
  minWidth: 0,
};

const heroBadgeRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
  flexWrap: "wrap",
  marginBottom: "18px",
};

const sourceBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  color: "#334155",
  background: "#f8fafc",
  border: "1px solid #dfe5ec",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: "700",
};

const statusBadgeBaseStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: "700",
};

const pageTitleStyle = {
  margin: "0 0 12px",
  color: "#0f172a",
  fontSize: "clamp(32px, 4vw, 46px)",
  lineHeight: 1.08,
  fontWeight: "760",
  letterSpacing: "-0.04em",
};

const pageDescriptionStyle = {
  maxWidth: "720px",
  margin: 0,
  color: "#64748b",
  fontSize: "15px",
  lineHeight: 1.7,
};

const heroMetaGridStyle = {
  display: "grid",
  gap: "1px",
  alignSelf: "stretch",
  overflow: "hidden",
  background: "#e8edf3",
  border: "1px solid #e8edf3",
  borderRadius: "10px",
};

const heroMetaItemStyle = {
  padding: "16px",
  background: "#f8fafc",
};

const heroMetaLabelStyle = {
  display: "block",
  marginBottom: "5px",
  color: "#94a3b8",
  fontSize: "10.5px",
  fontWeight: "700",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const heroMetaValueStyle = {
  display: "block",
  overflow: "hidden",
  color: "#334155",
  fontSize: "13px",
  fontWeight: "700",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const summaryPanelStyle = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0, 1.35fr) minmax(360px, 1fr)",
  gap: "28px",
  marginBottom: "24px",
  padding: "28px",
  background: "#0f172a",
  border: "1px solid #0f172a",
  borderRadius: "14px",
  boxShadow:
    "0 12px 34px rgba(15, 23, 42, 0.14)",
};

const complianceLeadStyle = {
  minWidth: 0,
};

const sectionEyebrowStyle = {
  margin: "0 0 8px",
  color: "#2563eb",
  fontSize: "11px",
  fontWeight: "750",
  letterSpacing: "0.09em",
  textTransform: "uppercase",
};

const complianceValueRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
};

const complianceValueStyle = {
  color: "#ffffff",
  fontSize: "52px",
  lineHeight: 1,
  fontWeight: "780",
  letterSpacing: "-0.05em",
};

const complianceToneStyle = {
  display: "inline-flex",
  padding: "5px 8px",
  borderRadius: "7px",
  fontSize: "11px",
  fontWeight: "750",
};

const progressTrackStyle = {
  width: "100%",
  height: "7px",
  marginTop: "22px",
  overflow: "hidden",
  background: "#334155",
  borderRadius: "999px",
};

const progressFillStyle = {
  height: "100%",
  borderRadius: "999px",
  transition: "width 180ms ease",
};

const complianceSummaryTextStyle = {
  maxWidth: "620px",
  margin: "16px 0 0",
  color: "#94a3b8",
  fontSize: "13px",
  lineHeight: 1.6,
};

const summaryMetricsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "1px",
  overflow: "hidden",
  alignSelf: "stretch",
  background: "rgba(255, 255, 255, 0.10)",
  border: "1px solid rgba(255, 255, 255, 0.10)",
  borderRadius: "10px",
};

const summaryMetricStyle = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  minHeight: "92px",
  padding: "16px",
  background: "#172033",
};

const summaryMetricLabelStyle = {
  color: "#94a3b8",
  fontSize: "11px",
  fontWeight: "650",
};

const summaryMetricValueStyle = {
  fontSize: "25px",
  lineHeight: 1,
  fontWeight: "760",
};

const sectionCardStyle = {
  marginBottom: "24px",
  padding: "26px",
  background: "#ffffff",
  border: "1px solid #dfe5ec",
  borderRadius: "14px",
  boxShadow:
    "0 6px 22px rgba(15, 23, 42, 0.045)",
};

const sectionHeaderStyle = {
  marginBottom: "22px",
};

const sectionTitleStyle = {
  margin: "0 0 8px",
  color: "#0f172a",
  fontSize: "22px",
  lineHeight: 1.25,
  fontWeight: "740",
  letterSpacing: "-0.025em",
};

const sectionDescriptionStyle = {
  maxWidth: "760px",
  margin: 0,
  color: "#64748b",
  fontSize: "13.5px",
  lineHeight: 1.6,
};

const healthListStyle = {
  display: "grid",
};

const healthRowStyle = {
  padding: "18px 0",
  borderBottom: "1px solid #e8edf3",
};

const healthRowLastStyle = {
  borderBottom: "none",
  paddingBottom: 0,
};

const healthRowHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: "18px",
  marginBottom: "10px",
};

const healthLabelStyle = {
  display: "block",
  marginBottom: "3px",
  color: "#334155",
  fontSize: "13px",
};

const healthPercentStyle = {
  color: "#94a3b8",
  fontSize: "11px",
};

const healthValueStyle = {
  fontSize: "20px",
  lineHeight: 1,
};

const healthTrackStyle = {
  width: "100%",
  height: "7px",
  overflow: "hidden",
  borderRadius: "999px",
};

const healthFillStyle = {
  height: "100%",
  borderRadius: "999px",
  transition: "width 180ms ease",
};

const informationGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "1px",
  overflow: "hidden",
  background: "#e8edf3",
  border: "1px solid #e8edf3",
  borderRadius: "10px",
};

const informationItemStyle = {
  minWidth: 0,
  padding: "17px",
  background: "#f8fafc",
};

const informationLabelStyle = {
  display: "block",
  marginBottom: "6px",
  color: "#94a3b8",
  fontSize: "10.5px",
  fontWeight: "700",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};

const informationValueStyle = {
  display: "block",
  overflow: "hidden",
  color: "#334155",
  fontSize: "13px",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const emptySectionStyle = {
  padding: "34px 20px",
  textAlign: "center",
  background: "#f8fafc",
  border: "1px dashed #cbd5e1",
  borderRadius: "10px",
  color: "#64748b",
  fontSize: "13px",
};

const primaryButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "42px",
  padding: "10px 16px",
  border: "1px solid #0f172a",
  borderRadius: "9px",
  background: "#0f172a",
  color: "#ffffff",
  cursor: "pointer",
  fontFamily,
  fontSize: "13px",
  fontWeight: "700",
};

const secondaryButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "42px",
  padding: "10px 16px",
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#334155",
  cursor: "pointer",
  fontFamily,
  fontSize: "13px",
  fontWeight: "700",
};

const stateCardStyle = {
  width: "100%",
  maxWidth: "680px",
  margin: "64px auto 0",
  padding: "54px 34px",
  background: "#ffffff",
  border: "1px solid #dfe5ec",
  borderRadius: "14px",
  boxShadow:
    "0 10px 30px rgba(15, 23, 42, 0.06)",
  textAlign: "center",
};

const stateEyebrowStyle = {
  margin: "0 0 9px",
  color: "#b45309",
  fontSize: "11px",
  fontWeight: "750",
  letterSpacing: "0.09em",
  textTransform: "uppercase",
};

const stateTitleStyle = {
  margin: "0 0 10px",
  color: "#0f172a",
  fontSize: "28px",
  letterSpacing: "-0.03em",
};

const stateTextStyle = {
  maxWidth: "500px",
  margin: "0 auto 24px",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.65,
};

const stateActionsStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "10px",
  flexWrap: "wrap",
};

const loadingBackStyle = {
  width: "180px",
  height: "14px",
  marginBottom: "28px",
  background: "#e2e8f0",
  borderRadius: "999px",
};

const loadingHeroStyle = {
  minHeight: "210px",
  marginBottom: "24px",
  padding: "30px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
};

const loadingSummaryStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "16px",
};

const loadingMetricStyle = {
  minHeight: "120px",
  background: "#e8edf3",
  borderRadius: "12px",
};

const loadingLineStyle = {
  height: "12px",
  background: "#e8edf3",
  borderRadius: "999px",
};

export default FrameworkDetail;