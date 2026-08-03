import {
  DEFAULT_CONTROL_CATEGORY,
  DEFAULT_CONTROL_COMMENTS,
  DEFAULT_CONTROL_EVIDENCE_URL,
  DEFAULT_CONTROL_OWNER,
  DEFAULT_CONTROL_STATUS,
  GOOGLE_SHEET_COLUMN_ALIASES,
} from "../constants/frameworkConstants";

import {
  createControl,
} from "../utils/frameworkFactory";

import {
  normalizeControlStatus,
} from "../utils/statusUtils";

// --------------------------------------------------
// General helpers
// --------------------------------------------------

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeComparableValue(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function isObjectRecord(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
}

function getSafeRows(rows) {
  return Array.isArray(rows)
    ? rows.filter(isObjectRecord)
    : [];
}

function getSafeControls(controls) {
  return Array.isArray(controls)
    ? controls.filter(isObjectRecord)
    : [];
}

// --------------------------------------------------
// Column helpers
// --------------------------------------------------

/**
 * Normalizes a Google Sheets column heading so that
 * capitalization, spacing and punctuation do not
 * prevent the heading from being recognized.
 */
function normalizeColumnName(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Returns all accepted Google Sheets aliases for a
 * canonical control field.
 */
function getFieldAliases(fieldName) {
  const configuredAliases =
    GOOGLE_SHEET_COLUMN_ALIASES?.[
      fieldName
    ];

  const aliases =
    Array.isArray(configuredAliases)
      ? configuredAliases
      : [];

  return Array.from(
    new Set([
      fieldName,
      ...aliases,
    ])
  );
}

/**
 * Finds a spreadsheet value using all accepted
 * aliases for a canonical control field.
 */
function getValueFromAliases(
  row,
  aliases = []
) {
  if (!isObjectRecord(row)) {
    return "";
  }

  const normalizedAliases =
    new Set(
      aliases
        .map(normalizeColumnName)
        .filter(Boolean)
    );

  const matchingEntry =
    Object.entries(row).find(
      ([columnName]) =>
        normalizedAliases.has(
          normalizeColumnName(
            columnName
          )
        )
    );

  return matchingEntry?.[1] ?? "";
}

function getRowFieldValue(
  row,
  fieldName
) {
  return normalizeText(
    getValueFromAliases(
      row,
      getFieldAliases(fieldName)
    )
  );
}

// --------------------------------------------------
// Row content checks
// --------------------------------------------------

function hasMappedRowContent(row) {
  if (!isObjectRecord(row)) {
    return false;
  }

  const mappedFields = [
    "requirementNumber",
    "category",
    "question",
    "owner",
    "status",
    "evidenceUrl",
    "comments",
  ];

  return mappedFields.some(
    (fieldName) =>
      Boolean(
        getRowFieldValue(
          row,
          fieldName
        )
      )
  );
}

// --------------------------------------------------
// Existing-control field helpers
// --------------------------------------------------

function getControlRequirementNumber(
  control
) {
  return normalizeText(
    control?.requirementNumber ??
      control?.reqNo ??
      control?.requirementNo ??
      control?.["REQ.No"] ??
      control?.["REQ No"]
  );
}

function getControlQuestion(control) {
  return normalizeText(
    control?.question ??
      control?.control ??
      control?.requirement ??
      control?.name
  );
}

function getControlOwner(control) {
  return normalizeText(
    control?.owner
  );
}

function getControlEvidenceUrl(
  control
) {
  return normalizeText(
    control?.evidenceUrl ??
      control?.evidence
  );
}

function getControlComments(control) {
  return normalizeText(
    control?.comments ??
      control?.notes
  );
}

// --------------------------------------------------
// Existing-control matching
// --------------------------------------------------

/**
 * Matches a Google Sheets row with an existing
 * dashboard control.
 *
 * Matching priority:
 * 1. Requirement number
 * 2. Question
 *
 * Requirement number is preferred because it should
 * remain stable even when the question text changes.
 */
function findMatchingExistingControl(
  existingControls,
  requirementNumber,
  question
) {
  const safeExistingControls =
    getSafeControls(
      existingControls
    );

  const comparableRequirementNumber =
    normalizeComparableValue(
      requirementNumber
    );

  if (comparableRequirementNumber) {
    const requirementMatch =
      safeExistingControls.find(
        (control) =>
          normalizeComparableValue(
            getControlRequirementNumber(
              control
            )
          ) ===
          comparableRequirementNumber
      );

    if (requirementMatch) {
      return requirementMatch;
    }
  }

  const comparableQuestion =
    normalizeComparableValue(
      question
    );

  if (!comparableQuestion) {
    return undefined;
  }

  return safeExistingControls.find(
    (control) =>
      normalizeComparableValue(
        getControlQuestion(control)
      ) === comparableQuestion
  );
}

// --------------------------------------------------
// Stable control ID generation
// --------------------------------------------------

function createGoogleSheetControlId(
  requirementNumber,
  question,
  index
) {
  const identifier =
    normalizeText(
      requirementNumber
    ) ||
    normalizeText(question) ||
    `row-${index + 1}`;

  const normalizedIdentifier =
    identifier
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );

  return (
    "sheet-control-" +
    (normalizedIdentifier ||
      `row-${index + 1}`)
  );
}

// --------------------------------------------------
// Google Sheets row to control
// --------------------------------------------------

/**
 * Converts one Google Sheets row into the canonical
 * control model used by the dashboard.
 *
 * All displayed control data is refreshed from Google
 * Sheets. Existing controls are used only to preserve
 * stable identifiers and creation metadata.
 */
export function mapGoogleSheetRowToControl(
  row,
  options = {}
) {
  const safeRow =
    isObjectRecord(row)
      ? row
      : {};

  const safeOptions =
    isObjectRecord(options)
      ? options
      : {};

  const existingControl =
    isObjectRecord(
      safeOptions.existingControl
    )
      ? safeOptions.existingControl
      : null;

  const index =
    Number.isInteger(
      safeOptions.index
    ) &&
    safeOptions.index >= 0
      ? safeOptions.index
      : 0;

  const frameworkId =
    normalizeText(
      safeOptions.frameworkId
    ) ||
    normalizeText(
      existingControl?.frameworkId
    );

  const requirementNumber =
    getRowFieldValue(
      safeRow,
      "requirementNumber"
    );

  const category =
    getRowFieldValue(
      safeRow,
      "category"
    );

  const question =
    getRowFieldValue(
      safeRow,
      "question"
    );

  const sheetOwner =
    getRowFieldValue(
      safeRow,
      "owner"
    );

  const sheetStatus =
    getRowFieldValue(
      safeRow,
      "status"
    );

  const sheetEvidenceUrl =
    getRowFieldValue(
      safeRow,
      "evidenceUrl"
    );

  const sheetComments =
    getRowFieldValue(
      safeRow,
      "comments"
    );

  const controlInput = {
    id:
      normalizeText(
        existingControl?.id
      ) ||
      createGoogleSheetControlId(
        requirementNumber,
        question,
        index
      ),

    frameworkId,

    requirementNumber:
      requirementNumber ||
      getControlRequirementNumber(
        existingControl
      ),

    category:
      category ||
      normalizeText(
        existingControl?.category
      ) ||
      DEFAULT_CONTROL_CATEGORY,

    question:
      question ||
      getControlQuestion(
        existingControl
      ),

    owner:
      sheetOwner ||
      DEFAULT_CONTROL_OWNER,

    status:
      normalizeControlStatus(
        sheetStatus ||
          DEFAULT_CONTROL_STATUS
      ),

    evidenceUrl:
      sheetEvidenceUrl ||
      DEFAULT_CONTROL_EVIDENCE_URL,

    comments:
      sheetComments ||
      DEFAULT_CONTROL_COMMENTS,

    description:
      normalizeText(
        existingControl?.description
      ),

    sourceRowNumber:
      Number.isFinite(
        Number(
          safeOptions.sourceRowNumber
        )
      )
        ? Number(
            safeOptions.sourceRowNumber
          )
        : index + 2,

    createdAt:
      normalizeText(
        existingControl?.createdAt
      ),
  };

  return createControl(
    controlInput,
    frameworkId,
    index
  );
}

/**
 * Converts multiple Google Sheets rows into canonical
 * controls.
 *
 * Empty spreadsheet rows are ignored. Stable existing
 * control IDs are preserved whenever a matching control
 * is found.
 */
export function mapGoogleSheetRowsToControls(
  rows = [],
  existingControls = [],
  frameworkId = ""
) {
  const safeRows =
    getSafeRows(rows);

  const safeExistingControls =
    getSafeControls(
      existingControls
    );

  const normalizedFrameworkId =
    normalizeText(frameworkId);

  return safeRows.reduce(
    (
      mappedControls,
      row,
      rowIndex
    ) => {
      if (
        !hasMappedRowContent(row)
      ) {
        return mappedControls;
      }

      const requirementNumber =
        getRowFieldValue(
          row,
          "requirementNumber"
        );

      const question =
        getRowFieldValue(
          row,
          "question"
        );

      const existingControl =
        findMatchingExistingControl(
          safeExistingControls,
          requirementNumber,
          question
        );

      const mappedControl =
        mapGoogleSheetRowToControl(
          row,
          {
            existingControl,

            frameworkId:
              normalizedFrameworkId ||
              normalizeText(
                existingControl
                  ?.frameworkId
              ),

            index:
              mappedControls.length,

            sourceRowNumber:
              rowIndex + 2,
          }
        );

      mappedControls.push(
        mappedControl
      );

      return mappedControls;
    },
    []
  );
}

// --------------------------------------------------
// Control to Google Sheets row
// --------------------------------------------------

/**
 * Converts a canonical dashboard control into the
 * standard Google Sheets row structure.
 */
export function mapControlToGoogleSheetRow(
  control = {}
) {
  const safeControl =
    isObjectRecord(control)
      ? control
      : {};

  return {
    "REQ.No":
      getControlRequirementNumber(
        safeControl
      ),

    Category:
      normalizeText(
        safeControl.category
      ),

    Question:
      getControlQuestion(
        safeControl
      ),

    Owner:
      getControlOwner(
        safeControl
      ) ||
      DEFAULT_CONTROL_OWNER,

    Status:
      normalizeControlStatus(
        safeControl.status ||
          DEFAULT_CONTROL_STATUS
      ),

    Evidence:
      getControlEvidenceUrl(
        safeControl
      ) ||
      DEFAULT_CONTROL_EVIDENCE_URL,

    Comments:
      getControlComments(
        safeControl
      ) ||
      DEFAULT_CONTROL_COMMENTS,
  };
}

/**
 * Converts multiple canonical controls into Google
 * Sheets rows.
 */
export function mapControlsToGoogleSheetRows(
  controls = []
) {
  return getSafeControls(
    controls
  ).map(
    mapControlToGoogleSheetRow
  );
}