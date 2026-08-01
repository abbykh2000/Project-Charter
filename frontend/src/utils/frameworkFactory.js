import {
  CUSTOM_FRAMEWORK_TYPE,
  DEFAULT_CONTROL_CATEGORY,
  DEFAULT_CONTROL_COMMENTS,
  DEFAULT_CONTROL_EVIDENCE_URL,
  DEFAULT_CONTROL_OWNER,
  DEFAULT_CONTROL_STATUS,
  DEFAULT_FRAMEWORK_SOURCE,
  DEFAULT_FRAMEWORK_STATUS,
  DEFAULT_REVIEW_FREQUENCY,
  FRAMEWORK_SOURCE_GOOGLE_SHEETS,
  FRAMEWORK_SOURCE_LOCAL,
  GOOGLE_SHEET_SYNC_STATUS_NOT_CONFIGURED,
  GOOGLE_SHEET_SYNC_STATUS_NOT_SYNCED,
  INTEGRATION_TYPE_GOOGLE_SHEETS,
  INTEGRATION_TYPE_NONE,
  createDefaultGoogleSheetConfig,
} from "../constants/frameworkConstants";

import {
  calculateFrameworkSummary,
} from "./frameworkSummary";

import {
  normalizeControlStatus,
  normalizeFrameworkStatus,
} from "./statusUtils";

// --------------------------------------------------
// General helpers
// --------------------------------------------------

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeLowercase(value) {
  return normalizeText(value).toLowerCase();
}

function isObjectRecord(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
}

function getControlsArray(controls) {
  return Array.isArray(controls)
    ? controls.filter(isObjectRecord)
    : [];
}

function createTimestamp() {
  return new Date().toISOString();
}

function createUniqueId(prefix = "item") {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return (
    `${prefix}-${Date.now()}-` +
    Math.random()
      .toString(36)
      .slice(2, 10)
  );
}

function cloneArray(value) {
  return Array.isArray(value)
    ? value.map((item) =>
        isObjectRecord(item)
          ? { ...item }
          : item
      )
    : [];
}

// --------------------------------------------------
// Framework source helpers
// --------------------------------------------------

function normalizeFrameworkSource(source) {
  const normalizedSource =
    normalizeLowercase(source);

  if (
    normalizedSource ===
      normalizeLowercase(
        FRAMEWORK_SOURCE_GOOGLE_SHEETS
      ) ||
    normalizedSource ===
      normalizeLowercase(
        INTEGRATION_TYPE_GOOGLE_SHEETS
      )
  ) {
    return FRAMEWORK_SOURCE_GOOGLE_SHEETS;
  }

  if (
    normalizedSource ===
    normalizeLowercase(
      FRAMEWORK_SOURCE_LOCAL
    )
  ) {
    return FRAMEWORK_SOURCE_LOCAL;
  }

  return (
    DEFAULT_FRAMEWORK_SOURCE ||
    FRAMEWORK_SOURCE_LOCAL
  );
}

function getFrameworkSource(
  frameworkInput = {}
) {
  if (!isObjectRecord(frameworkInput)) {
    return (
      DEFAULT_FRAMEWORK_SOURCE ||
      FRAMEWORK_SOURCE_LOCAL
    );
  }

  const nestedGoogleSheet =
    isObjectRecord(
      frameworkInput.googleSheet
    )
      ? frameworkInput.googleSheet
      : {};

  const hasGoogleSheetConfiguration =
    Boolean(
      normalizeText(
        nestedGoogleSheet.spreadsheetId ??
          frameworkInput.spreadsheetId
      ) ||
        normalizeText(
          nestedGoogleSheet.spreadsheetUrl ??
            frameworkInput.spreadsheetUrl
        ) ||
        normalizeText(
          nestedGoogleSheet.sheetName ??
            frameworkInput.sheetName
        )
    );

  const configuredSource =
    frameworkInput.sourceType ??
    frameworkInput.source ??
    frameworkInput.integrationType;

  if (
    hasGoogleSheetConfiguration &&
    !normalizeText(configuredSource)
  ) {
    return FRAMEWORK_SOURCE_GOOGLE_SHEETS;
  }

  return normalizeFrameworkSource(
    configuredSource
  );
}

function isGoogleSheetsSource(source) {
  return (
    normalizeFrameworkSource(source) ===
    FRAMEWORK_SOURCE_GOOGLE_SHEETS
  );
}

// --------------------------------------------------
// Control field helpers
// --------------------------------------------------

function getRequirementNumber(control) {
  return normalizeText(
    control?.requirementNumber ??
      control?.reqNo ??
      control?.requirementNo ??
      control?.["REQ.No"] ??
      control?.["REQ No"] ??
      control?.["Req.No"] ??
      control?.["Req No"]
  );
}

function getCategory(control) {
  return normalizeText(
    control?.category
  );
}

function getQuestion(control) {
  return normalizeText(
    control?.question ??
      control?.control ??
      control?.requirement
  );
}

function getOwner(control) {
  return normalizeText(
    control?.owner
  );
}

function getEvidenceUrl(control) {
  return normalizeText(
    control?.evidenceUrl ??
      control?.evidence
  );
}

function getComments(control) {
  return normalizeText(
    control?.comments ??
      control?.notes
  );
}

function createControlIdentityKey(
  control
) {
  const requirementNumber =
    normalizeLowercase(
      getRequirementNumber(control)
    );

  if (requirementNumber) {
    return `requirement:${requirementNumber}`;
  }

  const question =
    normalizeLowercase(
      getQuestion(control)
    ).replace(/\s+/g, " ");

  if (question) {
    return `question:${question}`;
  }

  return "";
}

// --------------------------------------------------
// Existing-control matching
// --------------------------------------------------

function findExistingControl(
  existingControls,
  incomingControl
) {
  const safeExistingControls =
    getControlsArray(existingControls);

  const incomingId =
    normalizeText(
      incomingControl?.id
    );

  if (incomingId) {
    const idMatch =
      safeExistingControls.find(
        (control) =>
          normalizeText(control.id) ===
          incomingId
      );

    if (idMatch) {
      return idMatch;
    }
  }

  const identityKey =
    createControlIdentityKey(
      incomingControl
    );

  if (!identityKey) {
    return null;
  }

  return (
    safeExistingControls.find(
      (control) =>
        createControlIdentityKey(
          control
        ) === identityKey
    ) ?? null
  );
}

// --------------------------------------------------
// Control factory
// --------------------------------------------------

function normalizeControl(
  controlInput = {},
  frameworkId = "",
  index = 0
) {
  const control =
    isObjectRecord(controlInput)
      ? controlInput
      : {};

  const requirementNumber =
    getRequirementNumber(control);

  const category =
    getCategory(control) ||
    DEFAULT_CONTROL_CATEGORY;

  const question =
    getQuestion(control);

  const owner =
    getOwner(control) ||
    DEFAULT_CONTROL_OWNER;

  const evidenceUrl =
    getEvidenceUrl(control) ||
    DEFAULT_CONTROL_EVIDENCE_URL;

  const comments =
    getComments(control) ||
    DEFAULT_CONTROL_COMMENTS;

  const resolvedFrameworkId =
    normalizeText(frameworkId) ||
    normalizeText(
      control.frameworkId
    );

  return {
    id:
      normalizeText(control.id) ||
      createUniqueId(
        `control-${index + 1}`
      ),

    frameworkId:
      resolvedFrameworkId,

    requirementNumber,
    category,
    question,

    owner,

    status:
      normalizeControlStatus(
        control.status ||
          DEFAULT_CONTROL_STATUS
      ),

    evidenceUrl,
    comments,

    description:
      normalizeText(
        control.description
      ),

    sourceRowNumber:
      Number.isFinite(
        Number(control.sourceRowNumber)
      )
        ? Number(control.sourceRowNumber)
        : null,

    createdAt:
      normalizeText(
        control.createdAt
      ) || createTimestamp(),

    lastUpdated:
      normalizeText(
        control.lastUpdated
      ) || createTimestamp(),

    /*
     * Compatibility aliases for components that have
     * not yet migrated to the canonical field names.
     */
    control: question,
    evidence: evidenceUrl,
    notes: comments,
  };
}

export function createControl(
  controlInput = {},
  frameworkId = "",
  index = 0
) {
  return normalizeControl(
    controlInput,
    frameworkId,
    index
  );
}

function normalizeNewControls(
  controls,
  frameworkId
) {
  return getControlsArray(controls).map(
    (control, index) =>
      createControl(
        control,
        frameworkId,
        index
      )
  );
}

// --------------------------------------------------
// Updated control normalization
// --------------------------------------------------

function mergeLocalControl(
  incomingControl,
  existingControl
) {
  if (!existingControl) {
    return {
      ...incomingControl,
    };
  }

  return {
    ...existingControl,
    ...incomingControl,

    id:
      normalizeText(
        existingControl.id
      ) ||
      normalizeText(
        incomingControl.id
      ),

    /*
     * Requirement definition fields are immutable
     * after creation. Only operational fields may be
     * changed from the custom-framework edit page.
     */
    requirementNumber:
      getRequirementNumber(existingControl),

    category:
      getCategory(existingControl) ||
      DEFAULT_CONTROL_CATEGORY,

    question:
      getQuestion(existingControl),

    control:
      getQuestion(existingControl),

    createdAt:
      normalizeText(
        existingControl.createdAt
      ) ||
      normalizeText(
        incomingControl.createdAt
      ),

    lastUpdated:
      createTimestamp(),
  };
}

/**
 * During a Google Sheets refresh, requirement data
 * comes from the sheet while dashboard-managed
 * operational values remain intact.
 *
 * Requirement data:
 * - requirementNumber
 * - category
 * - question
 * - description
 * - sourceRowNumber
 *
 * Dashboard-managed operational data:
 * - owner
 * - status
 * - evidenceUrl
 * - comments
 */
function mergeGoogleSheetControl(
  incomingControl,
  existingControl
) {
  if (!existingControl) {
    return {
      ...incomingControl,
    };
  }

  const incomingRequirementNumber =
    getRequirementNumber(
      incomingControl
    );

  const incomingCategory =
    getCategory(incomingControl);

  const incomingQuestion =
    getQuestion(incomingControl);

  const incomingDescription =
    normalizeText(
      incomingControl.description
    );

  return {
    ...incomingControl,

    id:
      normalizeText(
        existingControl.id
      ) ||
      normalizeText(
        incomingControl.id
      ),

    frameworkId:
      normalizeText(
        existingControl.frameworkId
      ) ||
      normalizeText(
        incomingControl.frameworkId
      ),

    requirementNumber:
      incomingRequirementNumber,

    category:
      incomingCategory ||
      DEFAULT_CONTROL_CATEGORY,

    question:
      incomingQuestion,

    description:
      incomingDescription,

    sourceRowNumber:
      incomingControl.sourceRowNumber ??
      existingControl.sourceRowNumber ??
      null,

    owner:
      getOwner(existingControl) ||
      getOwner(incomingControl) ||
      DEFAULT_CONTROL_OWNER,

    status:
      normalizeControlStatus(
        existingControl.status ??
          incomingControl.status
      ),

    evidenceUrl:
      getEvidenceUrl(
        existingControl
      ) ||
      getEvidenceUrl(
        incomingControl
      ) ||
      DEFAULT_CONTROL_EVIDENCE_URL,

    comments:
      getComments(existingControl) ||
      getComments(incomingControl) ||
      DEFAULT_CONTROL_COMMENTS,

    createdAt:
      normalizeText(
        existingControl.createdAt
      ) ||
      normalizeText(
        incomingControl.createdAt
      ),

    lastUpdated:
      createTimestamp(),
  };
}

function normalizeUpdatedControls({
  incomingControls,
  existingControls,
  frameworkId,
  source,
}) {
  const safeIncomingControls =
    getControlsArray(
      incomingControls
    );

  const safeExistingControls =
    getControlsArray(
      existingControls
    );

  return safeIncomingControls.map(
    (incomingControl, index) => {
      const existingControl =
        findExistingControl(
          safeExistingControls,
          incomingControl
        );

      const mergedControl =
        isGoogleSheetsSource(source)
          ? mergeGoogleSheetControl(
              incomingControl,
              existingControl
            )
          : mergeLocalControl(
              incomingControl,
              existingControl
            );

      return createControl(
        mergedControl,
        frameworkId,
        index
      );
    }
  );
}

// --------------------------------------------------
// Framework summary fields
// --------------------------------------------------

function createSummaryFields(controls) {
  const summary =
    calculateFrameworkSummary(
      controls
    );

  return {
    compliance:
      summary.compliance,

    completion:
      summary.completion,

    evidenceCoverage:
      summary.evidenceCoverage,

    assessedCompliance:
      summary.assessedCompliance,

    evidenceCount:
      summary.evidenceCount,

    assessed:
      summary.assessed,

    completed:
      summary.completed,

    passed:
      summary.passed,

    failed:
      summary.failed,

    inProgress:
      summary.inProgress,

    notStarted:
      summary.notStarted,

    total:
      summary.total,
  };
}

// --------------------------------------------------
// Editable framework fields
// --------------------------------------------------

function createEditableFields(
  frameworkInput = {}
) {
  return {
    name:
      normalizeText(
        frameworkInput.name
      ),

    description:
      normalizeText(
        frameworkInput.description
      ),

    department:
      normalizeText(
        frameworkInput.department
      ),

    owner:
      normalizeText(
        frameworkInput.owner
      ),

    reviewFrequency:
      normalizeText(
        frameworkInput.reviewFrequency
      ) ||
      DEFAULT_REVIEW_FREQUENCY,

    frameworkStatus:
      normalizeFrameworkStatus(
        frameworkInput.frameworkStatus ||
          DEFAULT_FRAMEWORK_STATUS
      ),
  };
}

// --------------------------------------------------
// Google Sheets configuration
// --------------------------------------------------

function getGoogleSheetInput(
  frameworkInput = {}
) {
  const nestedConfiguration =
    isObjectRecord(
      frameworkInput.googleSheet
    )
      ? frameworkInput.googleSheet
      : {};

  return {
    ...createDefaultGoogleSheetConfig(),

    ...nestedConfiguration,

    spreadsheetId:
      normalizeText(
        nestedConfiguration.spreadsheetId ??
          frameworkInput.spreadsheetId
      ),

    spreadsheetUrl:
      normalizeText(
        nestedConfiguration.spreadsheetUrl ??
          frameworkInput.spreadsheetUrl
      ),

    sheetName:
      normalizeText(
        nestedConfiguration.sheetName ??
          frameworkInput.sheetName
      ),

    syncStatus:
      normalizeText(
        nestedConfiguration.syncStatus ??
          frameworkInput.syncStatus
      ),

    lastSyncedAt:
      normalizeText(
        nestedConfiguration.lastSyncedAt ??
          frameworkInput.lastSyncedAt
      ),

    syncError:
      normalizeText(
        nestedConfiguration.syncError ??
          frameworkInput.syncError
      ),
  };
}

function createGoogleSheetFields(
  frameworkInput,
  source
) {
  if (!isGoogleSheetsSource(source)) {
    const emptyConfiguration =
      createDefaultGoogleSheetConfig();

    return {
      integrationType:
        INTEGRATION_TYPE_NONE,

      googleSheet: {
        ...emptyConfiguration,
        syncStatus:
          GOOGLE_SHEET_SYNC_STATUS_NOT_CONFIGURED,
      },

      /*
       * Compatibility aliases.
       */
      spreadsheetId: "",
      spreadsheetUrl: "",
      sheetName: "",
      syncStatus:
        GOOGLE_SHEET_SYNC_STATUS_NOT_CONFIGURED,
      lastSyncedAt: "",
      syncError: "",
    };
  }

  const configuration =
    getGoogleSheetInput(
      frameworkInput
    );

  const hasConfiguration =
    Boolean(
      configuration.spreadsheetId &&
      configuration.sheetName
    );

  const syncStatus =
    configuration.syncStatus ||
    (hasConfiguration
      ? GOOGLE_SHEET_SYNC_STATUS_NOT_SYNCED
      : GOOGLE_SHEET_SYNC_STATUS_NOT_CONFIGURED);

  const googleSheet = {
    spreadsheetId:
      configuration.spreadsheetId,

    spreadsheetUrl:
      configuration.spreadsheetUrl,

    sheetName:
      configuration.sheetName,

    syncStatus,

    lastSyncedAt:
      configuration.lastSyncedAt || "",

    syncError:
      configuration.syncError || "",
  };

  return {
    integrationType:
      INTEGRATION_TYPE_GOOGLE_SHEETS,

    googleSheet,

    /*
     * Compatibility aliases for existing components.
     */
    spreadsheetId:
      googleSheet.spreadsheetId,

    spreadsheetUrl:
      googleSheet.spreadsheetUrl,

    sheetName:
      googleSheet.sheetName,

    syncStatus:
      googleSheet.syncStatus,

    lastSyncedAt:
      googleSheet.lastSyncedAt,

    syncError:
      googleSheet.syncError,
  };
}

function createSourceFields(
  frameworkInput = {}
) {
  const source =
    getFrameworkSource(
      frameworkInput
    );

  return {
    sourceType: source,

    /*
     * Compatibility alias.
     */
    source,

    ...createGoogleSheetFields(
      frameworkInput,
      source
    ),
  };
}

// --------------------------------------------------
// Refresh metadata
// --------------------------------------------------

function createRefreshFields(
  frameworkInput = {}
) {
  return {
    lastRefreshAttempt:
      normalizeText(
        frameworkInput.lastRefreshAttempt
      ),

    lastSuccessfulRefresh:
      normalizeText(
        frameworkInput.lastSuccessfulRefresh
      ),

    refreshError:
      normalizeText(
        frameworkInput.refreshError
      ),

    isStale:
      Boolean(
        frameworkInput.isStale
      ),
  };
}

// --------------------------------------------------
// Public framework factory
// --------------------------------------------------

export function createFramework(
  frameworkInput = {}
) {
  const safeFrameworkInput =
    isObjectRecord(frameworkInput)
      ? frameworkInput
      : {};

  const timestamp =
    createTimestamp();

  const frameworkId =
    normalizeText(
      safeFrameworkInput.id
    ) ||
    createUniqueId("custom");

  const controls =
    normalizeNewControls(
      safeFrameworkInput.controls,
      frameworkId
    );

  return {
    id: frameworkId,

    type:
      normalizeText(
        safeFrameworkInput.type
      ) ||
      CUSTOM_FRAMEWORK_TYPE,

    ...createSourceFields(
      safeFrameworkInput
    ),

    ...createEditableFields(
      safeFrameworkInput
    ),

    controls,

    ...createSummaryFields(
      controls
    ),

    createdAt:
      normalizeText(
        safeFrameworkInput.createdAt
      ) || timestamp,

    lastUpdated:
      normalizeText(
        safeFrameworkInput.lastUpdated
      ) || timestamp,

    trend:
      cloneArray(
        safeFrameworkInput.trend
      ),

    ...createRefreshFields(
      safeFrameworkInput
    ),
  };
}

// --------------------------------------------------
// Public framework update factory
// --------------------------------------------------

export function updateFramework(
  existingFramework,
  frameworkInput = {}
) {
  if (
    !isObjectRecord(
      existingFramework
    )
  ) {
    throw new Error(
      "An existing framework is required."
    );
  }

  const safeFrameworkInput =
    isObjectRecord(frameworkInput)
      ? frameworkInput
      : {};

  const mergedFrameworkInput = {
    ...existingFramework,
    ...safeFrameworkInput,

    googleSheet: {
      ...(
        isObjectRecord(
          existingFramework.googleSheet
        )
          ? existingFramework.googleSheet
          : {}
      ),

      ...(
        isObjectRecord(
          safeFrameworkInput.googleSheet
        )
          ? safeFrameworkInput.googleSheet
          : {}
      ),
    },
  };

  const source =
    getFrameworkSource(
      mergedFrameworkInput
    );

  const controlsWereProvided =
    Array.isArray(
      safeFrameworkInput.controls
    );

  const incomingControls =
    controlsWereProvided
      ? safeFrameworkInput.controls
      : existingFramework.controls;

  const controls =
    normalizeUpdatedControls({
      incomingControls,

      existingControls:
        existingFramework.controls,

      frameworkId:
        existingFramework.id,

      source,
    });

  const timestamp =
    createTimestamp();

  return {
    ...existingFramework,

    id:
      normalizeText(
        existingFramework.id
      ),

    type:
      normalizeText(
        mergedFrameworkInput.type
      ) ||
      CUSTOM_FRAMEWORK_TYPE,

    ...createSourceFields(
      mergedFrameworkInput
    ),

    ...createEditableFields(
      mergedFrameworkInput
    ),

    controls,

    ...createSummaryFields(
      controls
    ),

    createdAt:
      normalizeText(
        existingFramework.createdAt
      ) || timestamp,

    lastUpdated:
      timestamp,

    trend:
      cloneArray(
        mergedFrameworkInput.trend
      ),

    ...createRefreshFields(
      mergedFrameworkInput
    ),
  };
}