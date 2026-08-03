import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getCustomFrameworkById,
  refreshCustomFrameworkFromGoogleSheet,
} from "../services/customFrameworkService";

import {
  getControlStatusStyle,
  getFrameworkStatusStyle,
} from "../utils/statusUtils";

import { useUser } from "../context/useUser";

import {
  formatDate,
  getComplianceMessage,
  getPercentageText,
} from "../utils/formatUtils";

function CustomFrameworkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isComplianceManager } = useUser();

  const [framework, setFramework] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [refreshing, setRefreshing] =
    useState(false);

  const [refreshError, setRefreshError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadFramework() {
      try {
        const data =
          await getCustomFrameworkById(id);

        if (!cancelled) {
          setFramework(data);
          setError("");

        }
      } catch (loadError) {
        console.error(
          "Failed to load custom framework:",
          loadError
        );

        if (!cancelled) {
          setError(
            "Unable to load the custom framework."
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

  async function handleRefresh() {
    if (!isComplianceManager) {
      setRefreshError(
        "Only a Compliance Manager can refresh Google Sheets controls."
      );
      return;
    }

    if (refreshing) {
      return;
    }

    setRefreshing(true);
    setRefreshError("");

    try {
      const data =
        await refreshCustomFrameworkFromGoogleSheet(id);

      if (!data) {
        setRefreshError(
          "The requested custom framework no longer exists."
        );
        return;
      }

      setFramework(data);
    } catch (refreshLoadError) {
      console.error(
        "Failed to refresh custom framework:",
        refreshLoadError
      );

      setRefreshError(
        refreshLoadError?.message ||
          "The latest Google Sheets data could not be loaded. The previously loaded data is still displayed."
      );
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <StateCard
          title="Loading framework"
          message="Please wait while the framework details are loaded."
        />
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <StateCard
          title="Unable to load framework"
          message={error}
          actionLabel="Back to Custom Frameworks"
          onAction={() =>
            navigate("/custom-frameworks")
          }
        />
      </PageLayout>
    );
  }

  if (!framework) {
    return (
      <PageLayout>
        <StateCard
          title="Framework not found"
          message="The requested custom framework does not exist."
          actionLabel="Back to Custom Frameworks"
          onAction={() =>
            navigate("/custom-frameworks")
          }
        />
      </PageLayout>
    );
  }

  const controls = Array.isArray(
    framework.controls
  )
    ? framework.controls
    : [];

  const summary =
    getFrameworkMetrics(controls);

  const {
    total,
    passed,
    failed,
    inProgress,
    notStarted,
    compliance,
  } = summary;

  const formattedLastUpdated =
    formatDate(framework.lastUpdated);

  const formattedCreatedAt =
    formatDate(framework.createdAt);

  const frameworkSource =
    normalizeFrameworkSource(framework);

  const isGoogleSheetsSource =
    frameworkSource === "google-sheets";

  const googleSheet =
    getGoogleSheetConfiguration(framework);

  const {
    sheetName,
    spreadsheetId,
    spreadsheetUrl: configuredSpreadsheetUrl,
    lastSyncedAt,
    syncStatus,
    columnMapping,
  } = googleSheet;

  const spreadsheetUrl =
    configuredSpreadsheetUrl ||
    (spreadsheetId
      ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
      : "");

  const formattedLastSyncedAt =
    lastSyncedAt
      ? formatDate(lastSyncedAt)
      : "Not synced yet";

  const syncPresentation =
    getSyncPresentation(syncStatus);

  return (
    <PageLayout>
      <button
        type="button"
        onClick={() =>
          navigate("/custom-frameworks")
        }
        style={backButtonStyle}
      >
        <span aria-hidden="true">
          ←
        </span>

        Back to Custom Frameworks
      </button>

      <header style={headerStyle}>
        <div style={headerTextStyle}>
          <span style={eyebrowStyle}>
            Custom Framework
          </span>

          <h1 style={pageTitleStyle}>
            {framework.name}
          </h1>

          <p style={descriptionStyle}>
            {framework.description ||
              "No framework description has been provided."}
          </p>
        </div>

        <div style={headerActionsStyle}>
          <span
            style={getFrameworkStatusStyle(
              framework.frameworkStatus
            )}
          >
            {framework.frameworkStatus ||
              "Draft"}
          </span>

          {isGoogleSheetsSource &&
            isComplianceManager && (
            <button
              type="button"
              className="app-button app-button--secondary"
              onClick={handleRefresh}
              disabled={refreshing}
              aria-busy={refreshing}
              style={
                refreshing
                  ? refreshButtonDisabledStyle
                  : undefined
              }
            >
              {refreshing
                ? "Refreshing..."
                : "Refresh from Google Sheets"}
            </button>
          )}

          {isComplianceManager && (
            <button
              type="button"
              className="app-button app-button--secondary"
              onClick={() =>
                navigate(
                  `/custom-frameworks/${framework.id}/edit`
                )
              }
            >
              Edit Framework
            </button>
          )}
        </div>
      </header>

      {refreshError && (
        <div
          role="alert"
          style={refreshErrorStyle}
        >
          <div>
            <strong
              style={refreshErrorTitleStyle}
            >
              Refresh unsuccessful
            </strong>

            <p style={refreshErrorTextStyle}>
              {refreshError}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setRefreshError("")
            }
            style={dismissErrorButtonStyle}
            aria-label="Dismiss refresh error"
          >
            ×
          </button>
        </div>
      )}

      <section
        aria-label="Framework summary"
        style={summaryGridStyle}
      >
        <MetricCard
          label="Compliance"
          value={`${compliance}%`}
          supportingText={getComplianceMessage(
            compliance
          )}
          accent="#2563eb"
        />

        <MetricCard
          label="Passed"
          value={passed}
          supportingText={getPercentageText(
            passed,
            total
          )}
          accent="#16a34a"
        />

        <MetricCard
          label="Failed"
          value={failed}
          supportingText={getPercentageText(
            failed,
            total
          )}
          accent="#dc2626"
        />

        <MetricCard
          label="In Progress"
          value={inProgress}
          supportingText={getPercentageText(
            inProgress,
            total
          )}
          accent="#d97706"
        />

        <MetricCard
          label="Not Started"
          value={notStarted}
          supportingText={getPercentageText(
            notStarted,
            total
          )}
          accent="#64748b"
        />

        <MetricCard
          label="Total Controls"
          value={total}
          supportingText="Across this framework"
          accent="#475569"
        />
      </section>

      {isGoogleSheetsSource && (
        <section
          aria-label="Google Sheets data source"
          style={syncCardStyle}
        >
          <div style={syncSourceStyle}>
            <div style={syncSourceMarkStyle}>
              GS
            </div>

            <div>
              <p style={syncEyebrowStyle}>
                Data source
              </p>

              <h2 style={syncTitleStyle}>
                Google Sheets
              </h2>

              <p style={syncDescriptionStyle}>
                All control fields are read-only and displayed from the configured Google Sheets worksheet.
              </p>
            </div>
          </div>

          <div style={syncDetailsStyle}>
            <div style={syncDetailStyle}>
              <span style={syncLabelStyle}>
                Worksheet
              </span>

              <strong style={syncValueStyle}>
                {sheetName || "Not specified"}
              </strong>
            </div>

            <div style={syncDetailStyle}>
              <span style={syncLabelStyle}>
                Spreadsheet ID
              </span>

              <strong
                style={syncValueStyle}
                title={spreadsheetId || ""}
              >
                {spreadsheetId || "Not specified"}
              </strong>
            </div>

            <div style={syncDetailStyle}>
              <span style={syncLabelStyle}>
                Column mapping
              </span>

              <strong
                style={syncValueStyle}
                title={[
                  columnMapping.requirementNumber,
                  columnMapping.category,
                  columnMapping.question,
                  columnMapping.owner,
                  columnMapping.status,
                  columnMapping.evidenceUrl,
                  columnMapping.comments,
                ].filter(Boolean).join(", ")}
              >
                {[
                  columnMapping.requirementNumber,
                  columnMapping.category,
                  columnMapping.question,
                  columnMapping.owner,
                  columnMapping.status,
                  columnMapping.evidenceUrl,
                  columnMapping.comments,
                ].filter(Boolean).join(" · ")}
              </strong>
            </div>

            <div style={syncDetailStyle}>
              <span style={syncLabelStyle}>
                Imported controls
              </span>

              <strong style={syncValueStyle}>
                {total}
              </strong>
            </div>

            <div style={syncDetailStyle}>
              <span style={syncLabelStyle}>
                Last synced
              </span>

              <strong style={syncValueStyle}>
                {formattedLastSyncedAt}
              </strong>
            </div>

            <div style={syncDetailStyle}>
              <span style={syncLabelStyle}>
                Sync status
              </span>

              <strong
                style={{
                  ...syncStatusStyle,
                  color: syncPresentation.color,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    ...syncStatusDotStyle,
                    background:
                      syncPresentation.color,
                  }}
                />

                {syncPresentation.label}
              </strong>
            </div>
          </div>

          {spreadsheetUrl && (
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={openSpreadsheetStyle}
            >
              Open spreadsheet
              <span aria-hidden="true">
                ↗
              </span>
            </a>
          )}
        </section>
      )}

      <section style={sectionCardStyle}>
        <div style={sectionHeadingRowStyle}>
          <div>
            <p style={sectionEyebrowStyle}>
              Details
            </p>

            <h2 style={sectionTitleStyle}>
              Framework Information
            </h2>
          </div>
        </div>

        <div style={informationGridStyle}>
          <InformationItem
            label="Department"
            value={
              framework.department ||
              "Not specified"
            }
          />

          <InformationItem
            label="Owner"
            value={
              framework.owner ||
              "Not assigned"
            }
          />

          <InformationItem
            label="Review Frequency"
            value={
              framework.reviewFrequency ||
              "Not specified"
            }
          />

          <InformationItem
            label="Framework Status"
            value={
              framework.frameworkStatus ||
              "Draft"
            }
          />

          <InformationItem
            label="Created"
            value={formattedCreatedAt}
          />

          <InformationItem
            label="Last Updated"
            value={formattedLastUpdated}
          />
        </div>
      </section>

      <section style={sectionCardStyle}>
        <div style={sectionHeadingRowStyle}>
          <div>
            <p style={sectionEyebrowStyle}>
              Requirements
            </p>

            <h2 style={sectionTitleStyle}>
              Controls
            </h2>

            <p style={sectionDescriptionStyle}>
              Review each requirement, its
              category, owner, status, evidence,
              and comments.
            </p>
          </div>

          <span style={controlCountStyle}>
            {total}{" "}
            {total === 1
              ? "control"
              : "controls"}
          </span>
        </div>

        {controls.length === 0 ? (
          <div style={emptyStateStyle}>
            <h3 style={emptyStateTitleStyle}>
              No controls available
            </h3>

            <p style={emptyStateTextStyle}>
              This framework does not currently
              contain any controls.
            </p>
          </div>
        ) : (
          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <TableHeader>
                    REQ.No
                  </TableHeader>

                  <TableHeader>
                    Category
                  </TableHeader>

                  <TableHeader>
                    Question
                  </TableHeader>

                  <TableHeader>
                    Owner
                  </TableHeader>

                  <TableHeader>
                    Status
                  </TableHeader>

                  <TableHeader>
                    Evidence
                  </TableHeader>

                  <TableHeader>
                    Comments
                  </TableHeader>
                </tr>
              </thead>

              <tbody>
                {controls.map(
                  (control, index) => {
                    const requirementNumber =
                      control.requirementNumber ??
                      control.reqNo ??
                      control.requirementNo ??
                      control["REQ.No"] ??
                      "";

                    const question =
                      control.question ??
                      control.control ??
                      control.requirement ??
                      "";

                    const comments =
                      control.comments ??
                      control.notes ??
                      "";

                    const evidenceUrl =
                      control.evidenceUrl ??
                      control.evidence ??
                      "";

                    const rowKey =
                      control.id ||
                      `${requirementNumber}-${index}`;

                    return (
                      <tr key={rowKey}>
                        <TableCell>
                          <span
                            style={
                              requirementNumberStyle
                            }
                          >
                            {requirementNumber ||
                              "—"}
                          </span>
                        </TableCell>

                        <TableCell>
                          <span
                            style={
                              categoryStyle
                            }
                          >
                            {control.category ||
                              "General"}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div
                            style={
                              controlNameWrapperStyle
                            }
                          >
                            <strong
                              style={
                                controlNameStyle
                              }
                            >
                              {question ||
                                "No question provided"}
                            </strong>

                            {control.description && (
                              <p
                                style={
                                  controlDescriptionStyle
                                }
                              >
                                {
                                  control.description
                                }
                              </p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          {control.owner ||
                            "Not assigned"}
                        </TableCell>

                        <TableCell>
                          <StatusBadge
                            status={
                              control.status
                            }
                          />
                        </TableCell>

                        <TableCell>
                          {evidenceUrl ? (
                            <a
                              href={
                                evidenceUrl
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              style={
                                evidenceLinkStyle
                              }
                            >
                              View Evidence

                              <span
                                aria-hidden="true"
                                style={{
                                  fontSize:
                                    "13px",
                                }}
                              >
                                ↗
                              </span>
                            </a>
                          ) : (
                            <span
                              style={
                                noEvidenceStyle
                              }
                            >
                              No evidence
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          <span
                            style={
                              commentsStyle
                            }
                          >
                            {comments || "—"}
                          </span>
                        </TableCell>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={noticeCardStyle}>
        <div style={noticeIconStyle}>
          i
        </div>

        <div>
          <h2 style={noticeTitleStyle}>
            Independent custom framework
          </h2>

          <p style={noticeTextStyle}>
            This framework is managed separately from Secureframe. All displayed control values come from Google Sheets and must be updated in the source worksheet.
          </p>
        </div>
      </section>
    </PageLayout>
  );
}

function normalizeStatus(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getFrameworkMetrics(controls) {
  const safeControls = Array.isArray(controls)
    ? controls
    : [];

  const total = safeControls.length;
  const passed = safeControls.filter(
    (control) =>
      normalizeStatus(control?.status) ===
      "passed"
  ).length;
  const failed = safeControls.filter(
    (control) =>
      normalizeStatus(control?.status) ===
      "failed"
  ).length;
  const inProgress = safeControls.filter(
    (control) =>
      normalizeStatus(control?.status) ===
      "in progress"
  ).length;
  const notStarted = safeControls.filter(
    (control) =>
      normalizeStatus(control?.status) ===
      "not started"
  ).length;

  return {
    total,
    passed,
    failed,
    inProgress,
    notStarted,
    compliance:
      total === 0
        ? 0
        : Math.round((passed / total) * 100),
  };
}

function normalizeFrameworkSource(framework) {
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

function getGoogleSheetConfiguration(framework) {
  const googleSheet =
    framework?.googleSheet ?? {};

  const columnMapping =
    googleSheet.columnMapping ?? {};

  return {
    spreadsheetId: String(
      googleSheet.spreadsheetId ??
        framework?.spreadsheetId ??
        ""
    ).trim(),
    spreadsheetUrl: String(
      googleSheet.spreadsheetUrl ??
        framework?.spreadsheetUrl ??
        ""
    ).trim(),
    sheetName: String(
      googleSheet.sheetName ??
        framework?.sheetName ??
        ""
    ).trim(),
    lastSyncedAt:
      googleSheet.lastSyncedAt ??
      framework?.lastSyncedAt ??
      null,
    syncStatus: String(
      googleSheet.syncStatus ??
        framework?.syncStatus ??
        ""
    ).trim(),
    columnMapping: {
      requirementNumber: String(
        columnMapping.requirementNumber ??
          "REQ.No"
      ).trim(),
      category: String(
        columnMapping.category ??
          "Category"
      ).trim(),
      question: String(
        columnMapping.question ??
          "Question"
      ).trim(),
      owner: String(
        columnMapping.owner ??
          "Owner"
      ).trim(),
      status: String(
        columnMapping.status ??
          "Status"
      ).trim(),
      evidenceUrl: String(
        columnMapping.evidenceUrl ??
          "Evidence"
      ).trim(),
      comments: String(
        columnMapping.comments ??
          "Comments"
      ).trim(),
    },
  };
}

function getSyncPresentation(value) {
  const status = normalizeStatus(value);

  if (status === "error" || status === "failed") {
    return {
      label: "Sync error",
      color: "#dc2626",
    };
  }

  if (status === "syncing" || status === "pending") {
    return {
      label: "Sync pending",
      color: "#d97706",
    };
  }

  if (
    status === "up to date" ||
    status === "synced" ||
    status === "success"
  ) {
    return {
      label: "Synced",
      color: "#16a34a",
    };
  }

  return {
    label: "Not synchronized",
    color: "#64748b",
  };
}

function PageLayout({ children }) {
  return (
    <main style={pageStyle}>
      <div style={contentStyle}>
        {children}
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  supportingText,
  accent,
}) {
  return (
    <article style={metricCardStyle}>
      <div
        style={{
          ...metricAccentStyle,
          backgroundColor: accent,
        }}
      />

      <p style={metricLabelStyle}>
        {label}
      </p>

      <p style={metricValueStyle}>
        {value}
      </p>

      <p style={metricSupportingTextStyle}>
        {supportingText}
      </p>
    </article>
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
        {value}
      </strong>
    </div>
  );
}

function StatusBadge({ status }) {
  const displayedStatus =
    status || "Not Started";

  return (
    <span
      style={getControlStatusStyle(
        displayedStatus
      )}
    >
      {displayedStatus}
    </span>
  );
}

function TableHeader({
  children,
  align = "left",
}) {
  return (
    <th
      scope="col"
      style={{
        ...tableHeaderStyle,
        textAlign: align,
      }}
    >
      {children}
    </th>
  );
}

function TableCell({
  children,
  align = "left",
}) {
  return (
    <td
      style={{
        ...tableCellStyle,
        textAlign: align,
      }}
    >
      {children}
    </td>
  );
}

function StateCard({
  title,
  message,
  actionLabel,
  onAction,
}) {
  return (
    <section style={stateCardStyle}>
      <h1 style={stateTitleStyle}>
        {title}
      </h1>

      <p style={stateMessageStyle}>
        {message}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="app-button app-button--primary"
        >
          {actionLabel}
        </button>
      )}
    </section>
  );
}

const fontFamily =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const pageStyle = {
  minHeight: "100vh",
  padding: "32px 24px 60px",
  background: "#f5f7fb",
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
  marginBottom: "30px",
  border: "none",
  background: "transparent",
  color: "#475569",
  cursor: "pointer",
  fontFamily,
  fontSize: "14px",
  fontWeight: "600",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "24px",
  marginBottom: "32px",
};

const headerTextStyle = {
  minWidth: 0,
  maxWidth: "820px",
};

const headerActionsStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "12px",
  flexWrap: "wrap",
  flexShrink: 0,
};

const eyebrowStyle = {
  display: "inline-block",
  marginBottom: "12px",
  color: "#2563eb",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};

const pageTitleStyle = {
  margin: "0 0 10px",
  color: "#0f172a",
  fontSize: "clamp(32px, 5vw, 48px)",
  lineHeight: 1.08,
  letterSpacing: "-0.035em",
  fontWeight: "750",
};

const descriptionStyle = {
  maxWidth: "720px",
  margin: 0,
  color: "#64748b",
  fontSize: "16px",
  lineHeight: 1.65,
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "16px",
  marginBottom: "24px",
};

const metricCardStyle = {
  position: "relative",
  minHeight: "145px",
  padding: "24px",
  overflow: "hidden",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  boxShadow:
    "0 8px 24px rgba(15, 23, 42, 0.05)",
  boxSizing: "border-box",
};

const metricAccentStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "3px",
};

const metricLabelStyle = {
  margin: "0 0 14px",
  color: "#64748b",
  fontSize: "14px",
  fontWeight: "600",
};

const metricValueStyle = {
  margin: "0 0 8px",
  color: "#0f172a",
  fontSize: "32px",
  lineHeight: 1,
  fontWeight: "750",
  letterSpacing: "-0.03em",
};

const metricSupportingTextStyle = {
  margin: 0,
  color: "#94a3b8",
  fontSize: "13px",
  lineHeight: 1.5,
};

const sectionCardStyle = {
  marginBottom: "24px",
  padding: "28px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  boxShadow:
    "0 8px 24px rgba(15, 23, 42, 0.045)",
};

const sectionHeadingRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  paddingBottom: "22px",
  marginBottom: "24px",
  borderBottom: "1px solid #e2e8f0",
};

const sectionEyebrowStyle = {
  margin: "0 0 6px",
  color: "#2563eb",
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "0.09em",
  textTransform: "uppercase",
};

const sectionTitleStyle = {
  margin: 0,
  color: "#0f172a",
  fontSize: "22px",
  lineHeight: 1.25,
  fontWeight: "700",
  letterSpacing: "-0.02em",
};

const sectionDescriptionStyle = {
  margin: "8px 0 0",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.6,
};

const informationGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "28px 32px",
};

const informationItemStyle = {
  minWidth: 0,
};

const informationLabelStyle = {
  display: "block",
  marginBottom: "7px",
  color: "#64748b",
  fontSize: "13px",
  fontWeight: "500",
};

const informationValueStyle = {
  display: "block",
  color: "#0f172a",
  fontSize: "15px",
  fontWeight: "650",
  overflowWrap: "anywhere",
};

const controlCountStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "7px 11px",
  background: "#eff6ff",
  color: "#1d4ed8",
  borderRadius: "999px",
  fontSize: "13px",
  fontWeight: "700",
  whiteSpace: "nowrap",
};

const tableContainerStyle = {
  width: "100%",
  overflowX: "auto",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
};

const tableStyle = {
  width: "100%",
  minWidth: "1250px",
  borderCollapse: "collapse",
  background: "#ffffff",
};

const tableHeaderStyle = {
  padding: "14px 18px",
  background: "#f8fafc",
  borderBottom: "1px solid #e2e8f0",
  color: "#475569",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "0.035em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const tableCellStyle = {
  padding: "18px",
  borderBottom: "1px solid #e2e8f0",
  color: "#334155",
  fontSize: "14px",
  lineHeight: 1.5,
  verticalAlign: "middle",
};

const requirementNumberStyle = {
  display: "inline-block",
  minWidth: "58px",
  color: "#0f172a",
  fontSize: "13px",
  fontWeight: "700",
  whiteSpace: "nowrap",
};

const controlNameWrapperStyle = {
  minWidth: "260px",
  maxWidth: "420px",
};

const controlNameStyle = {
  display: "block",
  color: "#0f172a",
  fontSize: "14px",
  fontWeight: "700",
};

const controlDescriptionStyle = {
  margin: "5px 0 0",
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.5,
};

const categoryStyle = {
  display: "inline-flex",
  padding: "5px 9px",
  background: "#f1f5f9",
  color: "#475569",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: "600",
  whiteSpace: "nowrap",
};

const evidenceLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  color: "#2563eb",
  textDecoration: "none",
  fontSize: "13px",
  fontWeight: "700",
  whiteSpace: "nowrap",
};

const noEvidenceStyle = {
  color: "#94a3b8",
  fontSize: "13px",
  whiteSpace: "nowrap",
};

const commentsStyle = {
  display: "block",
  minWidth: "180px",
  maxWidth: "300px",
  color: "#475569",
  fontSize: "13px",
  lineHeight: 1.55,
  overflowWrap: "anywhere",
};

const emptyStateStyle = {
  padding: "52px 20px",
  background: "#f8fafc",
  border: "1px dashed #cbd5e1",
  borderRadius: "12px",
  textAlign: "center",
};

const emptyStateTitleStyle = {
  margin: "0 0 8px",
  color: "#0f172a",
  fontSize: "18px",
};

const emptyStateTextStyle = {
  margin: 0,
  color: "#64748b",
  fontSize: "14px",
};

const noticeCardStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "16px",
  padding: "22px 24px",
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: "14px",
};

const noticeIconStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: "30px",
  height: "30px",
  background: "#dbeafe",
  color: "#1d4ed8",
  borderRadius: "50%",
  fontSize: "15px",
  fontWeight: "800",
};

const noticeTitleStyle = {
  margin: "1px 0 5px",
  color: "#1e3a8a",
  fontSize: "15px",
  fontWeight: "700",
};

const noticeTextStyle = {
  margin: 0,
  color: "#475569",
  fontSize: "14px",
  lineHeight: 1.6,
};

const stateCardStyle = {
  maxWidth: "600px",
  margin: "100px auto 0",
  padding: "48px 30px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  boxShadow:
    "0 12px 35px rgba(15, 23, 42, 0.06)",
  textAlign: "center",
};

const stateTitleStyle = {
  margin: "0 0 10px",
  color: "#0f172a",
  fontSize: "24px",
};

const stateMessageStyle = {
  margin: "0 auto 22px",
  color: "#64748b",
  fontSize: "15px",
  lineHeight: 1.6,
};


const refreshButtonDisabledStyle = {
  opacity: 0.65,
  cursor: "not-allowed",
};

const refreshErrorStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  marginBottom: "24px",
  padding: "16px 18px",
  background: "#fff7ed",
  border: "1px solid #fed7aa",
  borderRadius: "10px",
};

const refreshErrorTitleStyle = {
  display: "block",
  marginBottom: "4px",
  color: "#9a3412",
  fontSize: "14px",
  fontWeight: "700",
};

const refreshErrorTextStyle = {
  margin: 0,
  color: "#c2410c",
  fontSize: "13px",
  lineHeight: 1.5,
};

const dismissErrorButtonStyle = {
  padding: 0,
  border: "none",
  background: "transparent",
  color: "#9a3412",
  cursor: "pointer",
  fontSize: "20px",
  lineHeight: 1,
};

const syncCardStyle = {
  display: "grid",
  gridTemplateColumns:
    "minmax(220px, 1.1fr) minmax(480px, 2fr) auto",
  alignItems: "center",
  gap: "28px",
  marginBottom: "24px",
  padding: "22px 24px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  boxShadow:
    "0 8px 24px rgba(15, 23, 42, 0.04)",
};

const syncSourceStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "14px",
  minWidth: 0,
};

const syncSourceMarkStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: "38px",
  height: "38px",
  background: "#ecfdf5",
  border: "1px solid #bbf7d0",
  borderRadius: "9px",
  color: "#15803d",
  fontSize: "11px",
  fontWeight: "800",
  letterSpacing: "0.04em",
};

const syncEyebrowStyle = {
  margin: "0 0 3px",
  color: "#64748b",
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "0.07em",
  textTransform: "uppercase",
};

const syncTitleStyle = {
  margin: 0,
  color: "#0f172a",
  fontSize: "16px",
  lineHeight: 1.3,
  fontWeight: "700",
};

const syncDescriptionStyle = {
  margin: "5px 0 0",
  color: "#64748b",
  fontSize: "12px",
  lineHeight: 1.5,
};

const syncDetailsStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(120px, 1fr))",
  gap: "20px",
  minWidth: 0,
};

const syncDetailStyle = {
  minWidth: 0,
};

const syncLabelStyle = {
  display: "block",
  marginBottom: "5px",
  color: "#64748b",
  fontSize: "11px",
  fontWeight: "600",
};

const syncValueStyle = {
  display: "block",
  overflow: "hidden",
  color: "#0f172a",
  fontSize: "13px",
  fontWeight: "700",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const syncStatusStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  color: "#166534",
  fontSize: "13px",
  fontWeight: "700",
};

const syncStatusDotStyle = {
  display: "inline-block",
  width: "7px",
  height: "7px",
  background: "#22c55e",
  borderRadius: "50%",
};

const openSpreadsheetStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  padding: "9px 12px",
  color: "#2563eb",
  border: "1px solid #bfdbfe",
  borderRadius: "8px",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: "700",
  whiteSpace: "nowrap",
};

export default CustomFrameworkDetail;