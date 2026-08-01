import {
  Link,
  useLocation,
} from "react-router-dom";

function NotFound() {
  const location = useLocation();

  return (
    <main style={pageStyle}>
      <section
        aria-labelledby="not-found-title"
        style={cardStyle}
      >
        <div
          aria-hidden="true"
          style={errorCodeStyle}
        >
          404
        </div>

        <span style={eyebrowStyle}>
          Page not found
        </span>

        <h1
          id="not-found-title"
          style={titleStyle}
        >
          We could not find this page
        </h1>

        <p style={descriptionStyle}>
          The address may be incorrect, or the page may
          have been moved or removed.
        </p>

        <div style={pathContainerStyle}>
          <span style={pathLabelStyle}>
            Requested path
          </span>

          <code style={pathStyle}>
            {location.pathname}
          </code>
        </div>

        <div style={actionsStyle}>
          <Link
            to="/"
            style={primaryLinkStyle}
          >
            Return to dashboard
          </Link>

          <Link
            to="/custom-frameworks"
            style={secondaryLinkStyle}
          >
            View custom frameworks
          </Link>
        </div>
      </section>
    </main>
  );
}

const fontFamily =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const pageStyle = {
  display: "grid",
  placeItems: "center",
  minHeight: "100vh",
  padding: "32px 20px",
  background: "#f8fafc",
  color: "#0f172a",
  fontFamily,
  boxSizing: "border-box",
};

const cardStyle = {
  width: "100%",
  maxWidth: "620px",
  padding: "42px",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  background: "#ffffff",
  textAlign: "center",
  boxShadow:
    "0 18px 45px rgba(15, 23, 42, 0.08)",
  boxSizing: "border-box",
};

const errorCodeStyle = {
  display: "inline-grid",
  placeItems: "center",
  minWidth: "86px",
  minHeight: "48px",
  marginBottom: "20px",
  padding: "0 16px",
  borderRadius: "999px",
  background: "#eff6ff",
  color: "#2563eb",
  fontSize: "24px",
  lineHeight: 1,
  fontWeight: "800",
  letterSpacing: "-0.03em",
};

const eyebrowStyle = {
  display: "block",
  marginBottom: "8px",
  color: "#64748b",
  fontSize: "11px",
  lineHeight: 1.4,
  fontWeight: "750",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const titleStyle = {
  margin: 0,
  color: "#0f172a",
  fontSize: "30px",
  lineHeight: 1.2,
  fontWeight: "780",
  letterSpacing: "-0.035em",
};

const descriptionStyle = {
  maxWidth: "470px",
  margin: "14px auto 0",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.7,
};

const pathContainerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "7px",
  marginTop: "24px",
  padding: "14px",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  background: "#f8fafc",
};

const pathLabelStyle = {
  color: "#64748b",
  fontSize: "10px",
  lineHeight: 1.4,
  fontWeight: "750",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const pathStyle = {
  maxWidth: "100%",
  color: "#334155",
  fontFamily:
    '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
  fontSize: "12px",
  lineHeight: 1.5,
  overflowWrap: "anywhere",
};

const actionsStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  marginTop: "28px",
  flexWrap: "wrap",
};

const primaryLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "40px",
  padding: "10px 17px",
  border: "1px solid #2563eb",
  borderRadius: "9px",
  background: "#2563eb",
  color: "#ffffff",
  fontSize: "12px",
  lineHeight: 1.2,
  fontWeight: "700",
  textDecoration: "none",
  boxShadow:
    "0 4px 10px rgba(37, 99, 235, 0.2)",
};

const secondaryLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "40px",
  padding: "10px 17px",
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#334155",
  fontSize: "12px",
  lineHeight: 1.2,
  fontWeight: "700",
  textDecoration: "none",
};

export default NotFound;