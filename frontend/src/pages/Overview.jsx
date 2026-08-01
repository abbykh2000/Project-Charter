import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getFrameworks,
  refreshComplianceData,
} from "../services/complianceService";

import TopBar from "../components/TopBar";
import SummaryStrip from "../components/SummaryStrip";
import FrameworkCard from "../components/FrameworkCard";
import ControlsBreakdown from "../components/ControlsBreakdown";

const DEFAULT_STALE_AFTER_HOURS = 24;

const configuredStaleHours = Number(
  import.meta.env.VITE_STALE_AFTER_HOURS
);

const STALE_AFTER_HOURS =
  Number.isFinite(configuredStaleHours) &&
  configuredStaleHours > 0
    ? configuredStaleHours
    : DEFAULT_STALE_AFTER_HOURS;

const VALID_STATUSES = [
  "All",
  "Healthy",
  "Warning",
  "Failed",
];

function Overview() {
  const navigate = useNavigate();

  const [frameworks, setFrameworks] =
    useState([]);

  const [lastUpdated, setLastUpdated] =
    useState(null);

  const [currentTime, setCurrentTime] =
    useState(() => Date.now());

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState("All");

  useEffect(() => {
    let cancelled = false;

    async function loadInitialFrameworks() {
      try {
        const data =
          await getFrameworks();

        if (cancelled) {
          return;
        }

        setFrameworks(
          Array.isArray(data)
            ? data
            : []
        );

        setLastUpdated(new Date());
        setError("");
      } catch (loadError) {
        console.error(
          "Failed to load frameworks:",
          loadError
        );

        if (!cancelled) {
          setError(
            "Unable to load compliance data. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInitialFrameworks();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const clockInterval =
      window.setInterval(() => {
        setCurrentTime(Date.now());
      }, 60 * 1000);

    return () => {
      window.clearInterval(
        clockInterval
      );
    };
  }, []);

  async function retryLoadFrameworks() {
    try {
      setLoading(true);
      setError("");

      const data =
        await getFrameworks();

      setFrameworks(
        Array.isArray(data)
          ? data
          : []
      );

      setLastUpdated(new Date());
      setCurrentTime(Date.now());
    } catch (loadError) {
      console.error(
        "Failed to load frameworks:",
        loadError
      );

      setError(
        "Unable to load compliance data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function refreshData() {
    if (refreshing) {
      return;
    }

    try {
      setRefreshing(true);
      setError("");

      const result =
        await refreshComplianceData();

      const refreshedFrameworks =
        Array.isArray(
          result?.frameworks
        )
          ? result.frameworks
          : [];

      const refreshedAt =
        result?.refreshedAt
          ? new Date(
              result.refreshedAt
            )
          : new Date();

      setFrameworks(
        refreshedFrameworks
      );

      setLastUpdated(refreshedAt);
      setCurrentTime(Date.now());
    } catch (refreshError) {
      console.error(
        "Failed to refresh frameworks:",
        refreshError
      );

      setError(
        "The latest sync failed. Previously loaded data remains available."
      );
    } finally {
      setRefreshing(false);
    }
  }

  const stale = useMemo(() => {
    if (
      !lastUpdated ||
      currentTime === null
    ) {
      return false;
    }

    const lastUpdatedTime =
      lastUpdated.getTime();

    if (
      Number.isNaN(
        lastUpdatedTime
      ) ||
      !Number.isFinite(
        currentTime
      )
    ) {
      return false;
    }

    const elapsedHours =
      (currentTime -
        lastUpdatedTime) /
      (1000 * 60 * 60);

    return (
      elapsedHours >=
      STALE_AFTER_HOURS
    );
  }, [
    currentTime,
    lastUpdated,
  ]);

  const filteredFrameworks =
    useMemo(() => {
      const searchTerm =
        search
          .trim()
          .toLowerCase();

      return frameworks.filter(
        (framework) => {
          const frameworkName =
            String(
              framework?.name ?? ""
            ).toLowerCase();

          const matchesSearch =
            frameworkName.includes(
              searchTerm
            );

          const matchesFilter =
            filter === "All" ||
            framework?.status ===
              filter;

          return (
            matchesSearch &&
            matchesFilter
          );
        }
      );
    }, [
      filter,
      frameworks,
      search,
    ]);

  function handleStatusFilter(
    status
  ) {
    if (
      VALID_STATUSES.includes(
        status
      )
    ) {
      setFilter(status);
    }
  }

  function clearFilters() {
    setSearch("");
    setFilter("All");
  }

  const hasActiveFilters =
    search.trim().length > 0 ||
    filter !== "All";

  return (
    <div style={pageStyle}>
      <TopBar
        lastUpdated={lastUpdated}
        onRefresh={refreshData}
        isRefreshing={refreshing}
      />

      <div style={pageContainerStyle}>
        <header style={pageHeaderStyle}>
          <div style={pageHeaderCopyStyle}>
            <span style={eyebrowStyle}>
              Compliance Management
            </span>

            <h1 style={pageTitleStyle}>
              Compliance Overview
            </h1>

            <p style={pageDescriptionStyle}>
              Monitor framework health,
              control performance, and
              compliance status across all
              active programs.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/custom-frameworks"
              )
            }
            style={secondaryButtonStyle}
          >
            Custom Frameworks
          </button>
        </header>

        <main
          aria-busy={
            loading || refreshing
          }
        >
          {stale && (
            <StatusBanner
              tone="warning"
              title="Data may be outdated"
              message={`No successful sync has been recorded in the past ${STALE_AFTER_HOURS} hours.`}
              actionLabel={
                refreshing
                  ? "Refreshing..."
                  : "Refresh now"
              }
              onAction={refreshData}
              actionDisabled={
                refreshing
              }
            />
          )}

          {loading ? (
            <LoadingState />
          ) : error &&
            frameworks.length === 0 ? (
            <ErrorState
              message={error}
              onRetry={
                retryLoadFrameworks
              }
            />
          ) : (
            <>
              {error && (
                <StatusBanner
                  tone="error"
                  title="Sync issue"
                  message={error}
                />
              )}

              <section
                aria-label="Compliance summary"
                style={summarySectionStyle}
              >
                <SummaryStrip
                  frameworks={
                    frameworks
                  }
                  activeStatus={
                    filter
                  }
                  onStatusSelect={
                    handleStatusFilter
                  }
                />
              </section>

              <section
                aria-label="Control status breakdown"
                style={
                  breakdownSectionStyle
                }
              >
                <ControlsBreakdown
                  frameworks={
                    frameworks
                  }
                />
              </section>

              <section
                aria-labelledby="frameworks-heading"
                style={
                  frameworksSectionStyle
                }
              >
                <div
                  style={
                    frameworksHeaderStyle
                  }
                >
                  <div>
                    <span
                      style={
                        sectionEyebrowStyle
                      }
                    >
                      Framework Portfolio
                    </span>

                    <h2
                      id="frameworks-heading"
                      style={
                        sectionTitleStyle
                      }
                    >
                      Active Frameworks
                    </h2>

                    <p
                      aria-live="polite"
                      style={
                        sectionDescriptionStyle
                      }
                    >
                      Showing{" "}
                      {
                        filteredFrameworks.length
                      }{" "}
                      of{" "}
                      {frameworks.length}{" "}
                      frameworks
                    </p>
                  </div>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={
                        clearFilters
                      }
                      style={
                        clearButtonStyle
                      }
                    >
                      Clear filters
                    </button>
                  )}
                </div>

                <div
                  style={searchPanelStyle}
                >
                  <label
                    htmlFor="framework-search"
                    style={searchFieldStyle}
                  >
                    <span
                      style={
                        searchLabelStyle
                      }
                    >
                      Search frameworks
                    </span>

                    <input
                      id="framework-search"
                      type="search"
                      placeholder="Search by framework name"
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target
                            .value
                        )
                      }
                      style={
                        searchInputStyle
                      }
                    />
                  </label>

                  <div
                    style={
                      activeFilterStyle
                    }
                  >
                    <span
                      style={
                        activeFilterLabelStyle
                      }
                    >
                      Active status
                    </span>

                    <strong
                      style={
                        activeFilterValueStyle
                      }
                    >
                      {filter}
                    </strong>
                  </div>
                </div>

                {frameworks.length ===
                0 ? (
                  <EmptyState
                    title="No compliance frameworks available"
                    message="No active framework data was returned by the compliance service."
                  />
                ) : filteredFrameworks.length ===
                  0 ? (
                  <EmptyState
                    title="No matching frameworks"
                    message="Try changing the search term or selecting a different status."
                    actionLabel="Clear filters"
                    onAction={
                      clearFilters
                    }
                  />
                ) : (
                  <div
                    style={
                      frameworkGridStyle
                    }
                  >
                    {filteredFrameworks.map(
                      (framework) => (
                        <FrameworkCard
                          key={
                            framework.id
                          }
                          framework={
                            framework
                          }
                        />
                      )
                    )}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function StatusBanner({
  tone,
  title,
  message,
  actionLabel,
  onAction,
  actionDisabled = false,
}) {
  const isError =
    tone === "error";

  return (
    <div
      role="alert"
      style={{
        ...bannerStyle,
        ...(isError
          ? errorBannerStyle
          : warningBannerStyle),
      }}
    >
      <div style={bannerCopyStyle}>
        <div
          aria-hidden="true"
          style={{
            ...bannerIconStyle,
            ...(isError
              ? errorBannerIconStyle
              : warningBannerIconStyle),
          }}
        >
          {isError ? "!" : "i"}
        </div>

        <div>
          <strong
            style={{
              ...bannerTitleStyle,
              color: isError
                ? "#991b1b"
                : "#92400e",
            }}
          >
            {title}
          </strong>

          <p
            style={{
              ...bannerMessageStyle,
              color: isError
                ? "#b91c1c"
                : "#92400e",
            }}
          >
            {message}
          </p>
        </div>
      </div>

      {actionLabel &&
        onAction && (
          <button
            type="button"
            onClick={onAction}
            disabled={
              actionDisabled
            }
            style={{
              ...bannerActionStyle,
              cursor:
                actionDisabled
                  ? "not-allowed"
                  : "pointer",
              opacity:
                actionDisabled
                  ? 0.65
                  : 1,
            }}
          >
            {actionLabel}
          </button>
        )}
    </div>
  );
}

function LoadingState() {
  return (
    <section
      aria-live="polite"
      style={stateCardStyle}
    >
      <div
        aria-hidden="true"
        style={stateIconStyle}
      >
        …
      </div>

      <h2 style={stateTitleStyle}>
        Loading compliance data
      </h2>

      <p style={stateMessageStyle}>
        Please wait while the latest
        framework information is loaded.
      </p>
    </section>
  );
}

function ErrorState({
  message,
  onRetry,
}) {
  return (
    <section
      role="alert"
      style={{
        ...stateCardStyle,
        border:
          "1px solid #fecaca",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          ...stateIconStyle,
          background: "#fee2e2",
          color: "#b91c1c",
        }}
      >
        !
      </div>

      <h2 style={stateTitleStyle}>
        Unable to load data
      </h2>

      <p style={stateMessageStyle}>
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        style={primaryButtonStyle}
      >
        Try again
      </button>
    </section>
  );
}

function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}) {
  return (
    <div style={emptyStateStyle}>
      <div
        aria-hidden="true"
        style={emptyStateIconStyle}
      >
        FW
      </div>

      <h3 style={emptyStateTitleStyle}>
        {title}
      </h3>

      <p
        style={emptyStateMessageStyle}
      >
        {message}
      </p>

      {actionLabel &&
        onAction && (
          <button
            type="button"
            onClick={onAction}
            style={
              emptyStateActionStyle
            }
          >
            {actionLabel}
          </button>
        )}
    </div>
  );
}

const fontFamily =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const pageStyle = {
  minHeight: "100vh",
  background: "#f5f7fb",
  color: "#0f172a",
  fontFamily,
};

const pageContainerStyle = {
  width: "100%",
  maxWidth: "1440px",
  margin: "0 auto",
  padding: "30px 24px 64px",
  boxSizing: "border-box",
};

const pageHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "24px",
  marginBottom: "28px",
  flexWrap: "wrap",
};

const pageHeaderCopyStyle = {
  minWidth: 0,
};

const eyebrowStyle = {
  display: "block",
  marginBottom: "8px",
  color: "#2563eb",
  fontSize: "11px",
  fontWeight: "750",
  letterSpacing: "0.09em",
  textTransform: "uppercase",
};

const pageTitleStyle = {
  margin: "0 0 9px",
  color: "#0f172a",
  fontSize:
    "clamp(30px, 4vw, 42px)",
  lineHeight: 1.1,
  fontWeight: "760",
  letterSpacing: "-0.035em",
};

const pageDescriptionStyle = {
  maxWidth: "720px",
  margin: 0,
  color: "#64748b",
  fontSize: "15px",
  lineHeight: 1.65,
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
  whiteSpace: "nowrap",
};

const primaryButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "42px",
  padding: "10px 18px",
  border: "1px solid #0f172a",
  borderRadius: "9px",
  background: "#0f172a",
  color: "#ffffff",
  cursor: "pointer",
  fontFamily,
  fontSize: "13px",
  fontWeight: "700",
};

const summarySectionStyle = {
  marginBottom: "20px",
};

const breakdownSectionStyle = {
  marginBottom: "24px",
};

const frameworksSectionStyle = {
  padding: "26px",
  background: "#ffffff",
  border: "1px solid #dfe5ec",
  borderRadius: "14px",
  boxShadow:
    "0 8px 26px rgba(15, 23, 42, 0.045)",
};

const frameworksHeaderStyle = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: "18px",
  paddingBottom: "20px",
  marginBottom: "20px",
  borderBottom: "1px solid #e2e8f0",
  flexWrap: "wrap",
};

const sectionEyebrowStyle = {
  display: "block",
  marginBottom: "6px",
  color: "#2563eb",
  fontSize: "10.5px",
  fontWeight: "750",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const sectionTitleStyle = {
  margin: "0 0 6px",
  color: "#0f172a",
  fontSize: "22px",
  lineHeight: 1.25,
  fontWeight: "730",
  letterSpacing: "-0.02em",
};

const sectionDescriptionStyle = {
  margin: 0,
  color: "#64748b",
  fontSize: "13px",
};

const clearButtonStyle = {
  minHeight: "38px",
  padding: "8px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  background: "#f8fafc",
  color: "#475569",
  cursor: "pointer",
  fontFamily,
  fontSize: "12px",
  fontWeight: "700",
};

const searchPanelStyle = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: "18px",
  marginBottom: "22px",
  flexWrap: "wrap",
};

const searchFieldStyle = {
  display: "grid",
  gap: "7px",
  width: "min(100%, 520px)",
};

const searchLabelStyle = {
  color: "#475569",
  fontSize: "11px",
  fontWeight: "750",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};

const searchInputStyle = {
  width: "100%",
  minHeight: "42px",
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#0f172a",
  fontFamily,
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
};

const activeFilterStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  minHeight: "42px",
  padding: "9px 12px",
  border: "1px solid #e2e8f0",
  borderRadius: "9px",
  background: "#f8fafc",
};

const activeFilterLabelStyle = {
  color: "#64748b",
  fontSize: "12px",
};

const activeFilterValueStyle = {
  color: "#334155",
  fontSize: "12px",
};

const frameworkGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "18px",
};

const bannerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "18px",
  padding: "15px 17px",
  marginBottom: "18px",
  borderRadius: "11px",
  flexWrap: "wrap",
};

const warningBannerStyle = {
  border: "1px solid #fde68a",
  background: "#fffbeb",
};

const errorBannerStyle = {
  border: "1px solid #fecaca",
  background: "#fef2f2",
};

const bannerCopyStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  minWidth: 0,
};

const bannerIconStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: "26px",
  height: "26px",
  borderRadius: "50%",
  fontSize: "13px",
  fontWeight: "800",
};

const warningBannerIconStyle = {
  background: "#fef3c7",
  color: "#92400e",
};

const errorBannerIconStyle = {
  background: "#fee2e2",
  color: "#b91c1c",
};

const bannerTitleStyle = {
  display: "block",
  marginBottom: "2px",
  fontSize: "13px",
};

const bannerMessageStyle = {
  margin: 0,
  fontSize: "12.5px",
  lineHeight: 1.5,
};

const bannerActionStyle = {
  minHeight: "36px",
  padding: "8px 12px",
  border: "1px solid #d97706",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#92400e",
  fontFamily,
  fontSize: "12px",
  fontWeight: "700",
};

const stateCardStyle = {
  maxWidth: "620px",
  margin: "70px auto 0",
  padding: "48px 28px",
  background: "#ffffff",
  border: "1px solid #dfe5ec",
  borderRadius: "14px",
  boxShadow:
    "0 10px 30px rgba(15, 23, 42, 0.05)",
  textAlign: "center",
};

const stateIconStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "42px",
  height: "42px",
  marginBottom: "15px",
  borderRadius: "10px",
  background: "#e2e8f0",
  color: "#475569",
  fontSize: "18px",
  fontWeight: "800",
};

const stateTitleStyle = {
  margin: "0 0 8px",
  color: "#0f172a",
  fontSize: "21px",
  fontWeight: "730",
};

const stateMessageStyle = {
  maxWidth: "480px",
  margin: "0 auto 20px",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.6,
};

const emptyStateStyle = {
  padding: "46px 24px",
  border: "1px dashed #cbd5e1",
  borderRadius: "11px",
  background: "#f8fafc",
  textAlign: "center",
};

const emptyStateIconStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "42px",
  height: "42px",
  marginBottom: "15px",
  borderRadius: "9px",
  background: "#0f172a",
  color: "#ffffff",
  fontSize: "10px",
  fontWeight: "800",
  letterSpacing: "0.05em",
};

const emptyStateTitleStyle = {
  margin: "0 0 7px",
  color: "#0f172a",
  fontSize: "17px",
  fontWeight: "720",
};

const emptyStateMessageStyle = {
  maxWidth: "500px",
  margin: "0 auto",
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.6,
};

const emptyStateActionStyle = {
  minHeight: "38px",
  marginTop: "17px",
  padding: "8px 13px",
  border: "1px solid #0f172a",
  borderRadius: "8px",
  background: "#0f172a",
  color: "#ffffff",
  cursor: "pointer",
  fontFamily,
  fontSize: "12px",
  fontWeight: "700",
};

export default Overview;