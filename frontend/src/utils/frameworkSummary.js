import {
  CONTROL_STATUS_FAILED,
  CONTROL_STATUS_IN_PROGRESS,
  CONTROL_STATUS_NOT_STARTED,
  CONTROL_STATUS_PASSED,
} from "../constants/frameworkConstants";

import {
  normalizeControlStatus,
} from "./statusUtils";

// --------------------------------------------------
// General helpers
// --------------------------------------------------

function normalizeText(value) {
  return String(value ?? "").trim();
}

function getSafeControls(controls) {
  if (!Array.isArray(controls)) {
    return [];
  }

  return controls.filter(
    (control) =>
      control &&
      typeof control === "object" &&
      !Array.isArray(control)
  );
}

function hasEvidence(control) {
  return Boolean(
    normalizeText(
      control?.evidenceUrl ??
        control?.evidence
    )
  );
}

// --------------------------------------------------
// Status counting
// --------------------------------------------------

function countControlsByStatus(
  controls,
  expectedStatus
) {
  return controls.reduce(
    (count, control) => {
      const controlStatus =
        normalizeControlStatus(
          control.status
        );

      return controlStatus ===
        expectedStatus
        ? count + 1
        : count;
    },
    0
  );
}

// --------------------------------------------------
// Percentage helper
// --------------------------------------------------

function calculatePercentage(
  value,
  total
) {
  if (
    !Number.isFinite(value) ||
    !Number.isFinite(total) ||
    total <= 0
  ) {
    return 0;
  }

  return Math.round(
    (value / total) * 100
  );
}

// --------------------------------------------------
// Public summary calculation
// --------------------------------------------------

/**
 * Calculates all summary metrics for a framework.
 *
 * Main compliance:
 * Passed controls divided by all controls.
 *
 * Completion:
 * Controls with a final result, Passed or Failed,
 * divided by all controls.
 *
 * Assessed compliance:
 * Passed controls divided only by controls with a
 * final result.
 */
export function calculateFrameworkSummary(
  controls = []
) {
  const safeControls =
    getSafeControls(controls);

  const total = safeControls.length;

  const passed =
    countControlsByStatus(
      safeControls,
      CONTROL_STATUS_PASSED
    );

  const failed =
    countControlsByStatus(
      safeControls,
      CONTROL_STATUS_FAILED
    );

  const inProgress =
    countControlsByStatus(
      safeControls,
      CONTROL_STATUS_IN_PROGRESS
    );

  const notStarted =
    countControlsByStatus(
      safeControls,
      CONTROL_STATUS_NOT_STARTED
    );

  /*
   * Passed and Failed are the only final statuses.
   */
  const assessed =
    passed + failed;

  const completed =
    assessed;

  const evidenceCount =
    safeControls.filter(
      hasEvidence
    ).length;

  /*
   * Compliance is calculated against all controls.
   *
   * Example:
   * 8 passed controls out of 10 total controls
   * results in 80% compliance.
   */
  const compliance =
    calculatePercentage(
      passed,
      total
    );

  const completion =
    calculatePercentage(
      completed,
      total
    );

  const evidenceCoverage =
    calculatePercentage(
      evidenceCount,
      total
    );

  const assessedCompliance =
    calculatePercentage(
      passed,
      assessed
    );

  return {
    passed,
    failed,
    inProgress,
    notStarted,
    assessed,
    completed,
    evidenceCount,
    total,
    compliance,
    completion,
    evidenceCoverage,
    assessedCompliance,
  };
}