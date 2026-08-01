import {
  CONTROL_STATUSES,
  CONTROL_STATUS_FAILED,
  CONTROL_STATUS_IN_PROGRESS,
  CONTROL_STATUS_NOT_STARTED,
  CONTROL_STATUS_PASSED,
  DEFAULT_CONTROL_STATUS,
  DEFAULT_FRAMEWORK_STATUS,
  FRAMEWORK_STATUSES,
} from "../constants/frameworkConstants";

// --------------------------------------------------
// Shared badge styles
// --------------------------------------------------

const badgeBaseStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "5px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "700",
  whiteSpace: "nowrap",
};

const frameworkBadgeBaseStyle = {
  ...badgeBaseStyle,
  flexShrink: 0,
  padding: "7px 12px",
  fontSize: "13px",
};

// --------------------------------------------------
// Status colour configuration
// --------------------------------------------------

const controlStatusStyles = {
  [CONTROL_STATUS_PASSED.toLowerCase()]: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
  },

  [CONTROL_STATUS_FAILED.toLowerCase()]: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
  },

  [CONTROL_STATUS_IN_PROGRESS.toLowerCase()]: {
    background: "#fef3c7",
    color: "#92400e",
    border: "1px solid #fde68a",
  },

  [CONTROL_STATUS_NOT_STARTED.toLowerCase()]: {
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #cbd5e1",
  },

  unknown: {
    background: "#e2e8f0",
    color: "#475569",
    border: "1px solid #cbd5e1",
  },
};

const frameworkStatusStyles = {
  active: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
  },

  draft: {
    background: "#fff7ed",
    color: "#9a3412",
    border: "1px solid #fed7aa",
  },

  archived: {
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #cbd5e1",
  },

  unknown: {
    background: "#e2e8f0",
    color: "#475569",
    border: "1px solid #cbd5e1",
  },
};

// --------------------------------------------------
// General helpers
// --------------------------------------------------

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeComparableStatus(value) {
  return normalizeText(value).toLowerCase();
}

function findCanonicalStatus(
  status,
  allowedStatuses
) {
  const normalizedStatus =
    normalizeComparableStatus(status);

  return (
    allowedStatuses.find(
      (allowedStatus) =>
        allowedStatus.toLowerCase() ===
        normalizedStatus
    ) || null
  );
}

// --------------------------------------------------
// Public status normalizers
// --------------------------------------------------

/**
 * Converts a control status into one of the
 * canonical values defined in frameworkConstants.
 *
 * Invalid and unsupported values fall back to
 * "Not Started".
 */
export function normalizeControlStatus(status) {
  return (
    findCanonicalStatus(
      status,
      CONTROL_STATUSES
    ) || DEFAULT_CONTROL_STATUS
  );
}

/**
 * Converts a framework status into one of the
 * canonical framework status values.
 *
 * Invalid values fall back to "Draft".
 */
export function normalizeFrameworkStatus(
  status
) {
  return (
    findCanonicalStatus(
      status,
      FRAMEWORK_STATUSES
    ) || DEFAULT_FRAMEWORK_STATUS
  );
}

// --------------------------------------------------
// Status validation
// --------------------------------------------------

export function isValidControlStatus(status) {
  const normalizedStatus =
    normalizeComparableStatus(status);

  return CONTROL_STATUSES.some(
    (allowedStatus) =>
      allowedStatus.toLowerCase() ===
      normalizedStatus
  );
}

export function isValidFrameworkStatus(
  status
) {
  const normalizedStatus =
    normalizeComparableStatus(status);

  return FRAMEWORK_STATUSES.some(
    (allowedStatus) =>
      allowedStatus.toLowerCase() ===
      normalizedStatus
  );
}

// --------------------------------------------------
// Status badge styles
// --------------------------------------------------

export function getControlStatusStyle(status) {
  const normalizedStatus =
    normalizeComparableStatus(status);

  return {
    ...badgeBaseStyle,
    ...(controlStatusStyles[
      normalizedStatus
    ] || controlStatusStyles.unknown),
  };
}

export function getFrameworkStatusStyle(
  status
) {
  const normalizedStatus =
    normalizeComparableStatus(status);

  return {
    ...frameworkBadgeBaseStyle,
    ...(frameworkStatusStyles[
      normalizedStatus
    ] || frameworkStatusStyles.unknown),
  };
}