import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import { useUser } from "../context/useUser";

import {
  deleteCustomFramework,
  getCustomFrameworks,
} from "../services/customFrameworkService";

function CustomFrameworks() {
  const navigate = useNavigate();
  const {
    users,
    currentUser,
    setCurrentUserId,
    isComplianceManager,
    directoryLoading,
    directoryError,
    directorySource,
  } = useUser();

  const [frameworks, setFrameworks] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [deletingId, setDeletingId] =
    useState(null);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [sourceFilter, setSourceFilter] =
    useState("all");

  useEffect(() => {
    let cancelled = false;

    async function loadFrameworks() {
      try {
        const data =
          await getCustomFrameworks();

        if (!cancelled) {
          setFrameworks(
            Array.isArray(data)
              ? data
              : []
          );
          setError("");
        }
      } catch (loadError) {
        console.error(
          "Failed to load custom frameworks:",
          loadError
        );

        if (!cancelled) {
          setError(
            "Unable to load custom frameworks. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadFrameworks();

    return () => {
      cancelled = true;
    };
  }, []);

  const portfolioSummary = useMemo(() => {
    return frameworks.reduce(
      (summary, framework) => {
        const metrics =
          getFrameworkMetrics(framework);

        summary.totalControls +=
          metrics.total;
        summary.passedControls +=
          metrics.passed;

        if (
          normaliseSource(framework) ===
          "google-sheets"
        ) {
          summary.googleSheets += 1;
        }

        return summary;
      },
      {
        totalControls: 0,
        passedControls: 0,
        googleSheets: 0,
      }
    );
  }, [frameworks]);

  const portfolioCompliance =
    portfolioSummary.totalControls === 0
      ? 0
      : Math.round(
          (portfolioSummary.passedControls /
            portfolioSummary.totalControls) *
            100
        );

  const visibleFrameworks = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    return [...frameworks]
      .filter((framework) => {
        const source =
          normaliseSource(framework);

        const matchesSource =
          sourceFilter === "all" ||
          source === sourceFilter;

        const searchableText = [
          framework.name,
          framework.description,
          framework.department,
          framework.owner,
          getGoogleSheetConfiguration(framework).sheetName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !normalizedSearch ||
          searchableText.includes(
            normalizedSearch
          );

        return matchesSource && matchesSearch;
      })
      .sort((first, second) => {
        const firstDate = new Date(
          first.updatedAt ??
            first.lastUpdated ??
            first.createdAt ??
            0
        ).getTime();

        const secondDate = new Date(
          second.updatedAt ??
            second.lastUpdated ??
            second.createdAt ??
            0
        ).getTime();

        return secondDate - firstDate;
      });
  }, [frameworks, searchTerm, sourceFilter]);

  const handleDelete = async (
    event,
    framework
  ) => {
    event.stopPropagation();

    if (!isComplianceManager) {
      setError(
        "Only a Compliance Manager can delete custom frameworks."
      );
      return;
    }

    if (deletingId) {
      return;
    }

    const shouldDelete =
      window.confirm(
        `Delete "${framework.name}"? This action cannot be undone.`
      );

    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingId(framework.id);
      setError("");

      await deleteCustomFramework(
        framework.id
      );

      setFrameworks(
        (currentFrameworks) =>
          currentFrameworks.filter(
            (item) =>
              item.id !== framework.id
          )
      );
    } catch (deleteError) {
      console.error(
        "Failed to delete framework:",
        deleteError
      );

      setError(
        "Unable to delete the framework. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main style={pageStyle}>
      <div style={contentStyle}>
        <button
          type="button"
          onClick={() => navigate("/")}
          style={backButtonStyle}
        >
          <span aria-hidden="true">←</span>
          Compliance Overview
        </button>

        <header style={headerStyle}>
          <div style={headerCopyStyle}>
            <p style={eyebrowStyle}>
              Internal assurance
            </p>

            <h1 style={pageTitleStyle}>
              Custom Frameworks
            </h1>

            <p style={pageDescriptionStyle}>
              Manage independent compliance
              frameworks, monitor implementation
              progress, and keep control records
              aligned with their source data.
            </p>
          </div>

          <div style={headerControlsStyle}>
            <label style={userSelectorStyle}>
              <span style={userSelectorLabelStyle}>
                Current user · {directoryLoading
                  ? "loading directory"
                  : directorySource === "secureframe"
                    ? "Secureframe directory"
                    : "local directory"}
              </span>
              <select
                value={currentUser?.id || ""}
                onChange={(event) =>
                  setCurrentUserId(event.target.value)
                }
                style={userSelectorInputStyle}
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} — {user.role}
                  </option>
                ))}
              </select>
            </label>

            {directoryError && (
              <span
                title={directoryError}
                style={directoryWarningStyle}
              >
                User directory fallback active
              </span>
            )}

            {isComplianceManager && (
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/custom-frameworks/create"
                  )
                }
                style={primaryButtonStyle}
              >
                <span
                  aria-hidden="true"
                  style={buttonIconStyle}
                >
                  +
                </span>
                New framework
              </button>
            )}
          </div>
        </header>

        {!loading && frameworks.length > 0 && (
          <section
            aria-label="Custom framework portfolio summary"
            style={portfolioPanelStyle}
          >
            <PortfolioMetric
              label="Frameworks"
              value={frameworks.length}
              detail="Independent programmes"
            />

            <PortfolioMetric
              label="Portfolio compliance"
              value={`${portfolioCompliance}%`}
              detail={getComplianceLabel(
                portfolioCompliance
              )}
            />

            <PortfolioMetric
              label="Controls monitored"
              value={
                portfolioSummary.totalControls
              }
              detail="Across all frameworks"
            />

            <PortfolioMetric
              label="Connected sheets"
              value={
                portfolioSummary.googleSheets
              }
              detail="Live Google Sheets sources"
              isLast
            />
          </section>
        )}

        {!loading && frameworks.length > 0 && (
          <section style={toolbarStyle}>
            <label style={searchFieldStyle}>
              <span style={visuallyHiddenStyle}>
                Search frameworks
              </span>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search frameworks..."
                style={searchInputStyle}
              />
            </label>

            <label style={filterFieldStyle}>
              <span style={filterLabelStyle}>
                Source
              </span>
              <select
                value={sourceFilter}
                onChange={(event) =>
                  setSourceFilter(event.target.value)
                }
                style={filterSelectStyle}
              >
                <option value="all">All sources</option>
                <option value="local">Local</option>
                <option value="google-sheets">
                  Google Sheets
                </option>
              </select>
            </label>
          </section>
        )}

        {error && (
          <div
            role="alert"
            style={errorBannerStyle}
          >
            <div>
              <strong style={errorTitleStyle}>
                Something went wrong
              </strong>
              <p style={errorTextStyle}>
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              style={dismissButtonStyle}
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <LoadingState />
        ) : frameworks.length === 0 ? (
          <EmptyState
            canCreate={isComplianceManager}
            onCreate={() =>
              navigate(
                "/custom-frameworks/create"
              )
            }
          />
        ) : visibleFrameworks.length === 0 ? (
          <section style={noResultsStyle}>
            <h2 style={noResultsTitleStyle}>
              No matching frameworks
            </h2>
            <p style={noResultsTextStyle}>
              Adjust the search term or source filter.
            </p>
          </section>
        ) : (
          <section
            aria-label="Custom frameworks"
            style={frameworkGridStyle}
          >
            {visibleFrameworks.map(
              (framework) => (
                <CustomFrameworkCard
                  key={framework.id}
                  framework={framework}
                  deleting={
                    deletingId === framework.id
                  }
                  canDelete={isComplianceManager}
                  onOpen={() =>
                    navigate(
                      `/custom-frameworks/${framework.id}`
                    )
                  }
                  onDelete={(event) =>
                    handleDelete(
                      event,
                      framework
                    )
                  }
                />
              )
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function PortfolioMetric({
  label,
  value,
  detail,
  isLast = false,
}) {
  return (
    <div
      style={{
        ...portfolioMetricStyle,
        ...(isLast
          ? portfolioMetricLastStyle
          : {}),
      }}
    >
      <span style={portfolioLabelStyle}>
        {label}
      </span>
      <strong style={portfolioValueStyle}>
        {value}
      </strong>
      <span style={portfolioDetailStyle}>
        {detail}
      </span>
    </div>
  );
}

function CustomFrameworkCard({
  framework,
  onOpen,
  onDelete,
  deleting,
  canDelete,
}) {
  const [hovered, setHovered] =
    useState(false);

  const metrics =
    getFrameworkMetrics(framework);

  const source =
    normaliseSource(framework);

  const isGoogleSheets =
    source === "google-sheets";

  const status =
    framework.frameworkStatus || "Draft";

  const complianceTone =
    getComplianceTone(metrics.compliance);

  const googleSheet =
    getGoogleSheetConfiguration(framework);

  const lastUpdated =
    formatCardDate(
      isGoogleSheets
        ? googleSheet.lastSyncedAt ||
            framework.lastUpdated ||
            framework.updatedAt ||
            framework.createdAt
        : framework.lastUpdated ||
            framework.updatedAt ||
            framework.createdAt
    );

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      onOpen();
    }
  };

  return (
    <article
      tabIndex={0}
      role="button"
      aria-label={`Open ${framework.name}`}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...frameworkCardStyle,
        ...(hovered
          ? frameworkCardHoverStyle
          : {}),
      }}
    >
      <div style={cardTopRowStyle}>
        <SourceBadge
          isGoogleSheets={isGoogleSheets}
          sheetName={googleSheet.sheetName}
          syncStatus={googleSheet.syncStatus}
        />

        <span
          style={getStatusPillStyle(status)}
        >
          {status}
        </span>
      </div>

      <div style={cardMainStyle}>
        <h2 style={cardTitleStyle}>
          {framework.name}
        </h2>

        <p style={cardDescriptionStyle}>
          {framework.description ||
            "No description has been provided for this framework."}
        </p>
      </div>

      <div style={complianceSectionStyle}>
        <div style={complianceHeadingStyle}>
          <div>
            <span style={metricEyebrowStyle}>
              Compliance
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
                  ...complianceMessageStyle,
                  color: complianceTone.color,
                  background:
                    complianceTone.background,
                }}
              >
                {complianceTone.label}
              </span>
            </div>
          </div>

          <div style={controlTotalStyle}>
            <strong style={controlTotalValueStyle}>
              {metrics.total}
            </strong>
            <span style={controlTotalLabelStyle}>
              controls
            </span>
          </div>
        </div>

        <div
          aria-label={`${metrics.compliance}% compliant`}
          style={progressTrackStyle}
        >
          <div
            style={{
              ...progressFillStyle,
              width: `${Math.min(
                Math.max(
                  metrics.compliance,
                  0
                ),
                100
              )}%`,
              background:
                complianceTone.color,
            }}
          />
        </div>

        <div style={statusBreakdownStyle}>
          <StatusCount
            label="Passed"
            value={metrics.passed}
          />
          <StatusCount
            label="In progress"
            value={metrics.inProgress}
          />
          <StatusCount
            label="Failed"
            value={metrics.failed}
          />
        </div>
      </div>

      <div style={metadataGridStyle}>
        <MetadataItem
          label="Owner"
          value={
            framework.owner ||
            "Not assigned"
          }
        />

        <MetadataItem
          label="Department"
          value={
            framework.department ||
            "Not specified"
          }
        />

        <MetadataItem
          label={
            isGoogleSheets
              ? "Last sync"
              : "Last updated"
          }
          value={lastUpdated}
        />
      </div>

      <div style={cardFooterStyle}>
        <span style={viewActionStyle}>
          View framework
          <span
            aria-hidden="true"
            style={{
              ...viewArrowStyle,
              transform: hovered
                ? "translateX(3px)"
                : "translateX(0)",
            }}
          >
            →
          </span>
        </span>

        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            aria-label={`Delete ${framework.name}`}
            style={{
              ...deleteButtonStyle,
              ...(deleting
                ? disabledButtonStyle
                : {}),
            }}
          >
            {deleting
              ? "Deleting..."
              : "Delete"}
          </button>
        )}
      </div>
    </article>
  );
}

function SourceBadge({
  isGoogleSheets,
  sheetName,
  syncStatus,
}) {
  const normalizedSyncStatus =
    String(syncStatus || "")
      .trim()
      .toLowerCase();

  let syncLabel =
    "Not synchronized";

  if (
    normalizedSyncStatus === "error" ||
    normalizedSyncStatus === "failed"
  ) {
    syncLabel = "Sync error";
  } else if (
    normalizedSyncStatus === "syncing" ||
    normalizedSyncStatus === "pending"
  ) {
    syncLabel = "Syncing";
  } else if (
    normalizedSyncStatus === "up to date" ||
    normalizedSyncStatus === "uptodate" ||
    normalizedSyncStatus === "synced" ||
    normalizedSyncStatus === "success"
  ) {
    syncLabel = "Up to Date";
  }

  return (
    <span style={sourceBadgeStyle}>
      <span
        aria-hidden="true"
        style={{
          ...sourceMarkStyle,
          ...(isGoogleSheets
            ? googleSourceMarkStyle
            : manualSourceMarkStyle),
        }}
      >
        {isGoogleSheets ? "GS" : "IN"}
      </span>

      <span style={sourceTextGroupStyle}>
        <strong style={sourceNameStyle}>
          {isGoogleSheets
            ? "Google Sheets"
            : "Local"}
        </strong>

        <span style={sourceDetailStyle}>
          {isGoogleSheets
            ? [sheetName || "Worksheet not specified", syncLabel]
                .filter(Boolean)
                .join(" · ")
            : "Dashboard managed"}
        </span>
      </span>
    </span>
  );
}

function StatusCount({
  label,
  value,
}) {
  return (
    <div style={statusCountStyle}>
      <strong style={statusCountValueStyle}>
        {value}
      </strong>
      <span style={statusCountLabelStyle}>
        {label}
      </span>
    </div>
  );
}

function MetadataItem({
  label,
  value,
}) {
  return (
    <div style={metadataItemStyle}>
      <span style={metadataLabelStyle}>
        {label}
      </span>
      <strong style={metadataValueStyle}>
        {value}
      </strong>
    </div>
  );
}

function LoadingState() {
  return (
    <section style={loadingGridStyle}>
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          style={loadingCardStyle}
        >
          <div
            style={{
              ...loadingLineStyle,
              width: "28%",
            }}
          />
          <div
            style={{
              ...loadingLineStyle,
              width: "64%",
              height: "22px",
              marginTop: "28px",
            }}
          />
          <div
            style={{
              ...loadingLineStyle,
              width: "92%",
              marginTop: "14px",
            }}
          />
          <div
            style={{
              ...loadingLineStyle,
              width: "76%",
              marginTop: "8px",
            }}
          />
        </div>
      ))}
    </section>
  );
}

function EmptyState({ onCreate, canCreate }) {
  return (
    <section style={emptyStateStyle}>
      <div style={emptyMarkStyle}>
        CF
      </div>

      <p style={emptyEyebrowStyle}>
        Custom assurance
      </p>

      <h2 style={emptyTitleStyle}>
        Build your first framework
      </h2>

      <p style={emptyTextStyle}>
        Create a local framework or connect
        an existing Google Sheet, then track
        compliance independently from
        Secureframe.
      </p>

      {canCreate ? (
        <button
          type="button"
          onClick={onCreate}
          style={primaryButtonStyle}
        >
          Create framework
        </button>
      ) : (
        <p style={readOnlyMessageStyle}>
          You have read-only access. A Compliance Manager
          can create and manage custom frameworks.
        </p>
      )}
    </section>
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
            normaliseStatus(
              control.status
            ) === "passed"
        ).length
      : Number(framework.passed) || 0;

  const failed =
    controls.length > 0
      ? controls.filter(
          (control) =>
            normaliseStatus(
              control.status
            ) === "failed"
        ).length
      : Number(framework.failed) || 0;

  const inProgress =
    controls.length > 0
      ? controls.filter(
          (control) =>
            normaliseStatus(
              control.status
            ) === "in progress"
        ).length
      : Number(framework.inProgress) || 0;

  const compliance =
    total === 0
      ? Number(framework.compliance) || 0
      : Math.round((passed / total) * 100);

  return {
    total,
    passed,
    failed,
    inProgress,
    compliance,
  };
}

function normaliseStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getGoogleSheetConfiguration(
  framework
) {
  const googleSheet =
    framework?.googleSheet ?? {};

  return {
    sheetName: String(
      googleSheet.sheetName ??
        ""
    ).trim(),

    lastSyncedAt:
      googleSheet.lastSyncedAt ??
      null,

    syncStatus: String(
      googleSheet.syncStatus ??
        ""
    ).trim(),

    syncError: String(
      googleSheet.syncError ??
        ""
    ).trim(),
  };
}

function normaliseSource(framework) {
  const source = String(
    framework?.sourceType ??
      framework?.source ??
      framework?.integrationType ??
      ""
  )
    .trim()
    .toLowerCase();

  return source === "google-sheets" ||
    source === "google-workspace"
    ? "google-sheets"
    : "local";
}

function getComplianceTone(value) {
  if (value >= 85) {
    return {
      label: "Strong",
      color: "#15803d",
      background: "#f0fdf4",
    };
  }

  if (value >= 65) {
    return {
      label: "In progress",
      color: "#b45309",
      background: "#fffbeb",
    };
  }

  return {
    label: "Needs attention",
    color: "#b91c1c",
    background: "#fef2f2",
  };
}

function getComplianceLabel(value) {
  if (value >= 85) {
    return "Strong overall position";
  }

  if (value >= 65) {
    return "Improvement underway";
  }

  return "Attention required";
}

function getStatusPillStyle(status) {
  const normalised = normaliseStatus(status);

  if (
    normalised === "active" ||
    normalised === "published"
  ) {
    return {
      ...statusPillBaseStyle,
      color: "#166534",
      background: "#f0fdf4",
      border: "1px solid #bbf7d0",
    };
  }

  if (
    normalised === "archived" ||
    normalised === "inactive"
  ) {
    return {
      ...statusPillBaseStyle,
      color: "#475569",
      background: "#f8fafc",
      border: "1px solid #cbd5e1",
    };
  }

  return {
    ...statusPillBaseStyle,
    color: "#92400e",
    background: "#fffbeb",
    border: "1px solid #fde68a",
  };
}

function formatCardDate(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(
    "en",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
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
  marginBottom: "32px",
  border: "none",
  background: "transparent",
  color: "#475569",
  cursor: "pointer",
  fontFamily,
  fontSize: "14px",
  fontWeight: "650",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: "28px",
  marginBottom: "28px",
};

const headerCopyStyle = {
  maxWidth: "760px",
};

const eyebrowStyle = {
  margin: "0 0 10px",
  color: "#2563eb",
  fontSize: "12px",
  fontWeight: "750",
  letterSpacing: "0.11em",
  textTransform: "uppercase",
};

const pageTitleStyle = {
  margin: "0 0 12px",
  color: "#0f172a",
  fontSize: "clamp(34px, 5vw, 48px)",
  lineHeight: 1.05,
  fontWeight: "760",
  letterSpacing: "-0.04em",
};

const pageDescriptionStyle = {
  maxWidth: "700px",
  margin: 0,
  color: "#64748b",
  fontSize: "16px",
  lineHeight: 1.65,
};

const headerControlsStyle = {
  display: "flex",
  alignItems: "flex-end",
  gap: "12px",
  flexWrap: "wrap",
};

const userSelectorStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "5px",
};

const userSelectorLabelStyle = {
  color: "#64748b",
  fontSize: "11px",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const userSelectorInputStyle = {
  minHeight: "44px",
  maxWidth: "330px",
  padding: "9px 11px",
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#334155",
  fontFamily,
  fontSize: "13px",
};

const primaryButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  minHeight: "44px",
  padding: "11px 17px",
  border: "1px solid #0f172a",
  borderRadius: "9px",
  background: "#0f172a",
  color: "#ffffff",
  cursor: "pointer",
  fontFamily,
  fontSize: "14px",
  fontWeight: "700",
  boxShadow:
    "0 1px 2px rgba(15, 23, 42, 0.18)",
  whiteSpace: "nowrap",
};

const buttonIconStyle = {
  fontSize: "19px",
  lineHeight: 1,
  fontWeight: "400",
};

const portfolioPanelStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(190px, 1fr))",
  marginBottom: "28px",
  overflow: "hidden",
  background: "#0f172a",
  border: "1px solid #0f172a",
  borderRadius: "14px",
  boxShadow:
    "0 10px 30px rgba(15, 23, 42, 0.10)",
};

const portfolioMetricStyle = {
  minWidth: 0,
  padding: "21px 23px",
  borderRight:
    "1px solid rgba(255, 255, 255, 0.10)",
};

const portfolioMetricLastStyle = {
  borderRight: "none",
};

const portfolioLabelStyle = {
  display: "block",
  marginBottom: "9px",
  color: "#94a3b8",
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const portfolioValueStyle = {
  display: "block",
  marginBottom: "6px",
  color: "#ffffff",
  fontSize: "25px",
  lineHeight: 1,
  fontWeight: "750",
  letterSpacing: "-0.03em",
};

const portfolioDetailStyle = {
  display: "block",
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: 1.45,
};

const errorBannerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px",
  marginBottom: "24px",
  padding: "16px 18px",
  background: "#fff7ed",
  border: "1px solid #fed7aa",
  borderRadius: "10px",
};

const errorTitleStyle = {
  display: "block",
  marginBottom: "4px",
  color: "#9a3412",
  fontSize: "14px",
};

const errorTextStyle = {
  margin: 0,
  color: "#c2410c",
  fontSize: "13px",
  lineHeight: 1.5,
};

const dismissButtonStyle = {
  padding: 0,
  border: "none",
  background: "transparent",
  color: "#9a3412",
  cursor: "pointer",
  fontSize: "20px",
  lineHeight: 1,
};

const toolbarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  marginBottom: "24px",
  flexWrap: "wrap",
};

const searchFieldStyle = {
  flex: "1 1 320px",
};

const searchInputStyle = {
  width: "100%",
  minHeight: "42px",
  padding: "10px 13px",
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#0f172a",
  fontFamily,
  fontSize: "14px",
  boxSizing: "border-box",
};

const filterFieldStyle = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
};

const filterLabelStyle = {
  color: "#64748b",
  fontSize: "13px",
  fontWeight: "700",
};

const filterSelectStyle = {
  minHeight: "42px",
  padding: "9px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#334155",
  fontFamily,
  fontSize: "14px",
};

const visuallyHiddenStyle = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

const noResultsStyle = {
  padding: "48px 24px",
  background: "#ffffff",
  border: "1px dashed #cbd5e1",
  borderRadius: "12px",
  textAlign: "center",
};

const noResultsTitleStyle = {
  margin: "0 0 8px",
  color: "#0f172a",
  fontSize: "19px",
};

const noResultsTextStyle = {
  margin: 0,
  color: "#64748b",
  fontSize: "14px",
};

const frameworkGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(360px, 1fr))",
  gap: "20px",
  alignItems: "stretch",
};

const frameworkCardStyle = {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
  padding: "22px 22px 18px",
  background: "#ffffff",
  border: "1px solid #dfe5ec",
  borderRadius: "13px",
  boxShadow:
    "0 4px 16px rgba(15, 23, 42, 0.045)",
  cursor: "pointer",
  outline: "none",
  transition:
    "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
};

const frameworkCardHoverStyle = {
  transform: "translateY(-2px)",
  border: "1px solid #b8c4d1",
  boxShadow:
    "0 12px 30px rgba(15, 23, 42, 0.09)",
};

const cardTopRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "14px",
  marginBottom: "21px",
};

const sourceBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  minWidth: 0,
  color: "#475569",
  fontSize: "12px",
  fontWeight: "650",
};

const sourceTextGroupStyle = {
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
};

const sourceNameStyle = {
  color: "#334155",
  fontSize: "12px",
  lineHeight: 1.25,
};

const sourceDetailStyle = {
  maxWidth: "190px",
  overflow: "hidden",
  color: "#94a3b8",
  fontSize: "10.5px",
  fontWeight: "600",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const sourceMarkStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "27px",
  height: "27px",
  borderRadius: "7px",
  fontSize: "9px",
  fontWeight: "800",
  letterSpacing: "0.04em",
};

const googleSourceMarkStyle = {
  color: "#166534",
  background: "#ecfdf5",
  border: "1px solid #bbf7d0",
};

const manualSourceMarkStyle = {
  color: "#334155",
  background: "#f1f5f9",
  border: "1px solid #cbd5e1",
};

const statusPillBaseStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "5px 9px",
  border: "1px solid",
  borderRadius: "999px",
  fontSize: "11px",
  lineHeight: 1,
  fontWeight: "700",
  whiteSpace: "nowrap",
};

const cardMainStyle = {
  minHeight: "116px",
};

const cardTitleStyle = {
  margin: "0 0 9px",
  color: "#0f172a",
  fontSize: "21px",
  lineHeight: 1.25,
  fontWeight: "730",
  letterSpacing: "-0.025em",
};

const cardDescriptionStyle = {
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  margin: 0,
  color: "#64748b",
  fontSize: "13.5px",
  lineHeight: 1.6,
};

const complianceSectionStyle = {
  marginTop: "19px",
  padding: "18px",
  background: "#f8fafc",
  border: "1px solid #e8edf3",
  borderRadius: "10px",
};

const complianceHeadingStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: "16px",
};

const metricEyebrowStyle = {
  display: "block",
  marginBottom: "6px",
  color: "#64748b",
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "0.07em",
  textTransform: "uppercase",
};

const complianceValueRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};

const complianceValueStyle = {
  fontSize: "29px",
  lineHeight: 1,
  fontWeight: "780",
  letterSpacing: "-0.04em",
};

const complianceMessageStyle = {
  display: "inline-flex",
  padding: "4px 7px",
  borderRadius: "6px",
  fontSize: "10px",
  fontWeight: "750",
  whiteSpace: "nowrap",
};

const controlTotalStyle = {
  textAlign: "right",
};

const controlTotalValueStyle = {
  display: "block",
  color: "#0f172a",
  fontSize: "18px",
  lineHeight: 1.1,
};

const controlTotalLabelStyle = {
  display: "block",
  marginTop: "3px",
  color: "#64748b",
  fontSize: "11px",
};

const progressTrackStyle = {
  width: "100%",
  height: "5px",
  marginTop: "17px",
  overflow: "hidden",
  background: "#e2e8f0",
  borderRadius: "999px",
};

const progressFillStyle = {
  height: "100%",
  borderRadius: "999px",
  transition: "width 180ms ease",
};

const statusBreakdownStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "12px",
  marginTop: "15px",
};

const statusCountStyle = {
  minWidth: 0,
};

const statusCountValueStyle = {
  display: "block",
  marginBottom: "2px",
  color: "#0f172a",
  fontSize: "13px",
};

const statusCountLabelStyle = {
  display: "block",
  color: "#64748b",
  fontSize: "10.5px",
  whiteSpace: "nowrap",
};

const metadataGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",
  gap: "16px",
  marginTop: "20px",
  paddingTop: "18px",
  borderTop: "1px solid #e8edf3",
};

const metadataItemStyle = {
  minWidth: 0,
};

const metadataLabelStyle = {
  display: "block",
  marginBottom: "5px",
  color: "#94a3b8",
  fontSize: "10.5px",
  fontWeight: "650",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const metadataValueStyle = {
  display: "block",
  overflow: "hidden",
  color: "#334155",
  fontSize: "12px",
  fontWeight: "650",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const cardFooterStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  marginTop: "auto",
  paddingTop: "21px",
};

const viewActionStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  color: "#1d4ed8",
  fontSize: "13px",
  fontWeight: "700",
};

const viewArrowStyle = {
  display: "inline-block",
  transition: "transform 160ms ease",
};

const deleteButtonStyle = {
  padding: "6px 8px",
  border: "none",
  background: "transparent",
  color: "#94a3b8",
  cursor: "pointer",
  fontFamily,
  fontSize: "11px",
  fontWeight: "650",
};

const disabledButtonStyle = {
  opacity: 0.55,
  cursor: "not-allowed",
};

const loadingGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(360px, 1fr))",
  gap: "20px",
};

const loadingCardStyle = {
  minHeight: "310px",
  padding: "24px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "13px",
};

const loadingLineStyle = {
  height: "12px",
  background: "#e8edf3",
  borderRadius: "999px",
};

const emptyStateStyle = {
  maxWidth: "720px",
  margin: "32px auto 0",
  padding: "70px 34px",
  background: "#ffffff",
  border: "1px solid #dfe5ec",
  borderRadius: "14px",
  boxShadow:
    "0 10px 28px rgba(15, 23, 42, 0.055)",
  textAlign: "center",
};

const emptyMarkStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "46px",
  height: "46px",
  margin: "0 auto 19px",
  background: "#0f172a",
  color: "#ffffff",
  borderRadius: "10px",
  fontSize: "11px",
  fontWeight: "800",
  letterSpacing: "0.06em",
};

const emptyEyebrowStyle = {
  margin: "0 0 8px",
  color: "#2563eb",
  fontSize: "11px",
  fontWeight: "750",
  letterSpacing: "0.09em",
  textTransform: "uppercase",
};

const emptyTitleStyle = {
  margin: "0 0 10px",
  color: "#0f172a",
  fontSize: "25px",
  letterSpacing: "-0.025em",
};

const directoryWarningStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "7px 10px",
  border: "1px solid #fde68a",
  borderRadius: "8px",
  background: "#fffbeb",
  color: "#92400e",
  fontSize: "11px",
  fontWeight: "700",
  whiteSpace: "nowrap",
};

const readOnlyMessageStyle = {
  margin: "0 auto",
  color: "#475569",
  fontSize: "13px",
  fontWeight: "650",
};

const emptyTextStyle = {
  maxWidth: "510px",
  margin: "0 auto 24px",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.65,
};

export default CustomFrameworks;