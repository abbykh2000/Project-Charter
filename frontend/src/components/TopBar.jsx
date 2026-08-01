function TopBar({
  lastUpdated,
  onRefresh,
  isRefreshing = false,
}) {
  const formattedLastUpdated =
    formatLastUpdated(lastUpdated);

  const canRefresh =
    typeof onRefresh === "function" &&
    !isRefreshing;

  return (
    <header style={headerStyle}>
      <div style={brandSectionStyle}>
        <div aria-hidden="true" style={brandMarkStyle}>
          CD
        </div>

        <div style={titleGroupStyle}>
          <h1 style={titleStyle}>Compliance Dashboard</h1>

          <div style={syncStatusStyle}>
            <span
              aria-hidden="true"
              style={{
                ...syncIndicatorStyle,
                background:
                  lastUpdated && isValidDate(lastUpdated)
                    ? "#16a34a"
                    : "#94a3b8",
              }}
            />

            <span style={syncLabelStyle}>Last synced:</span>

            <time
              dateTime={
                lastUpdated && isValidDate(lastUpdated)
                  ? toDate(lastUpdated).toISOString()
                  : undefined
              }
              style={syncValueStyle}
            >
              {formattedLastUpdated}
            </time>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={!canRefresh}
        aria-label={
          isRefreshing
            ? "Refreshing compliance data"
            : "Refresh compliance data"
        }
        aria-busy={isRefreshing}
        style={{
          ...refreshButtonStyle,
          ...(canRefresh
            ? enabledButtonStyle
            : disabledButtonStyle),
        }}
      >
        <span
          className="top-bar-refresh-icon"
          aria-hidden="true"
          style={{
            ...refreshIconStyle,
            animation: isRefreshing
              ? "topBarRefreshSpin 900ms linear infinite"
              : "none",
          }}
        >
          ↻
        </span>

        <span>
          {isRefreshing ? "Refreshing..." : "Refresh data"}
        </span>
      </button>

      <style>{`
        @keyframes topBarRefreshSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .top-bar-refresh-icon {
            animation: none !important;
          }
        }
      `}</style>
    </header>
  );
}

function formatLastUpdated(value) {
  if (!value || !isValidDate(value)) {
    return "Not synced yet";
  }

  return toDate(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function isValidDate(value) {
  return !Number.isNaN(toDate(value).getTime());
}

function toDate(value) {
  return value instanceof Date ? value : new Date(value);
}

const fontFamily =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "20px",
  width: "100%",
  minHeight: "72px",
  padding: "14px 24px",
  borderBottom: "1px solid #e2e8f0",
  background: "rgba(255,255,255,0.96)",
  fontFamily,
  flexWrap: "wrap",
  boxSizing: "border-box",
};

const brandSectionStyle = { display:"flex", alignItems:"center", gap:"12px" };
const brandMarkStyle = {
  display:"grid", placeItems:"center", width:"38px", height:"38px",
  borderRadius:"10px", background:"linear-gradient(135deg,#1d4ed8,#2563eb)",
  color:"#fff", fontWeight:"800"
};
const titleGroupStyle = {};
const titleStyle = { margin:0, fontSize:"17px", fontWeight:"760", color:"#0f172a" };
const syncStatusStyle = { display:"flex", gap:"5px", marginTop:"4px", fontSize:"11.5px", color:"#64748b", flexWrap:"wrap" };
const syncIndicatorStyle = { width:"7px", height:"7px", borderRadius:"50%" };
const syncLabelStyle = {};
const syncValueStyle = { fontWeight:"650", color:"#475569" };

const refreshButtonStyle = {
  display:"inline-flex",
  alignItems:"center",
  gap:"8px",
  padding:"9px 15px",
  border:"1px solid",
  borderRadius:"9px",
  fontFamily,
  fontWeight:"700",
  boxShadow:"0 2px 6px rgba(15,23,42,0.04)",
  transition:"all 180ms ease",
  outline:"none",
};

const enabledButtonStyle = {
  borderColor:"#cbd5e1",
  background:"#ffffff",
  color:"#1e293b",
  cursor:"pointer",
};

const disabledButtonStyle = {
  borderColor:"#e2e8f0",
  background:"#f1f5f9",
  color:"#94a3b8",
  cursor:"not-allowed",
  boxShadow:"none",
};

const refreshIconStyle = {
  display:"inline-block",
  fontSize:"17px",
  lineHeight:1,
  transformOrigin:"center",
};

export default TopBar;