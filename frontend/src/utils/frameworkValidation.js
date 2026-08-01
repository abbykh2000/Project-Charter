import {
  CONTROL_STATUSES,
  DEFAULT_CONTROL_STATUS,
  FRAMEWORK_SOURCE_GOOGLE_SHEETS,
  FRAMEWORK_STATUSES,
  GOOGLE_SHEET_COLUMN_ALIASES,
  INTEGRATION_TYPE_GOOGLE_SHEETS,
  REQUIRED_CONTROL_FIELDS,
  REVIEW_FREQUENCIES,
} from "../constants/frameworkConstants";

import {
  isValidControlStatus as isCanonicalControlStatus,
} from "./statusUtils";

// --------------------------------------------------
// Constants
// --------------------------------------------------

const GOOGLE_SHEET_FIELD_DISPLAY_NAMES = {
  requirementNumber: "REQ.No",
  category: "Category",
  question: "Question",
  owner: "Owner",
  status: "Status",
  evidenceUrl: "Evidence",
  comments: "Comments",
};

const GOOGLE_SHEETS_HOST =
  "docs.google.com";

const GOOGLE_DRIVE_HOST =
  "drive.google.com";

const GOOGLE_SHEET_URL_PREFIX =
  "https://docs.google.com/spreadsheets/d/";

// --------------------------------------------------
// General helpers
// --------------------------------------------------

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeLowercase(value) {
  return normalizeText(
    value
  ).toLowerCase();
}

function normalizeComparableValue(value) {
  return normalizeLowercase(value)
    .replace(/\s+/g, " ");
}

function normalizeColumnHeading(
  heading
) {
  return normalizeLowercase(
    heading
  ).replace(/[^a-z0-9]/g, "");
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
    ? controls.filter(
        (control) =>
          isObjectRecord(control)
      )
    : [];
}

function hasOwnProperty(
  object,
  propertyName
) {
  return Object.prototype.hasOwnProperty.call(
    object,
    propertyName
  );
}

// --------------------------------------------------
// Google Sheets configuration accessors
// --------------------------------------------------

function getGoogleSheetConfiguration(
  frameworkInput
) {
  if (!isObjectRecord(frameworkInput)) {
    return {};
  }

  const nestedConfiguration =
    isObjectRecord(
      frameworkInput.googleSheet
    )
      ? frameworkInput.googleSheet
      : {};

  return {
    spreadsheetId:
      nestedConfiguration.spreadsheetId ??
      frameworkInput.spreadsheetId ??
      "",

    spreadsheetUrl:
      nestedConfiguration.spreadsheetUrl ??
      frameworkInput.spreadsheetUrl ??
      "",

    spreadsheetReference:
      nestedConfiguration.spreadsheetReference ??
      frameworkInput.spreadsheetReference ??
      "",

    sheetName:
      nestedConfiguration.sheetName ??
      frameworkInput.sheetName ??
      "",

    headerRow:
      nestedConfiguration.headerRow ??
      frameworkInput.headerRow ??
      1,

    syncStatus:
      nestedConfiguration.syncStatus ??
      frameworkInput.syncStatus ??
      "",

    lastSyncedAt:
      nestedConfiguration.lastSyncedAt ??
      frameworkInput.lastSyncedAt ??
      null,

    syncError:
      nestedConfiguration.syncError ??
      frameworkInput.syncError ??
      "",
  };
}

// --------------------------------------------------
// Framework source helpers
// --------------------------------------------------

export function isGoogleSheetsFramework(
  frameworkInput
) {
  if (!isObjectRecord(frameworkInput)) {
    return false;
  }

  const sourceType =
    normalizeLowercase(
      frameworkInput.sourceType ??
        frameworkInput.source
    );

  const integrationType =
    normalizeLowercase(
      frameworkInput.integrationType
    );

  const googleSheetConfiguration =
    getGoogleSheetConfiguration(
      frameworkInput
    );

  const hasGoogleSheetConfiguration =
    Boolean(
      normalizeText(
        googleSheetConfiguration.spreadsheetId
      ) ||
        normalizeText(
          googleSheetConfiguration.spreadsheetUrl
        ) ||
        normalizeText(
          googleSheetConfiguration
            .spreadsheetReference
        ) ||
        normalizeText(
          googleSheetConfiguration.sheetName
        )
    );

  return Boolean(
    sourceType ===
      FRAMEWORK_SOURCE_GOOGLE_SHEETS ||
      integrationType ===
        INTEGRATION_TYPE_GOOGLE_SHEETS ||
      hasGoogleSheetConfiguration
  );
}

export function extractGoogleSpreadsheetId(
  spreadsheetReference
) {
  const normalizedReference =
    normalizeText(
      spreadsheetReference
    );

  if (!normalizedReference) {
    return "";
  }

  const urlMatch =
    normalizedReference.match(
      /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/
    );

  if (urlMatch?.[1]) {
    return urlMatch[1];
  }

  const rawSpreadsheetIdPattern =
    /^[a-zA-Z0-9_-]+$/;

  return rawSpreadsheetIdPattern.test(
    normalizedReference
  )
    ? normalizedReference
    : "";
}

export function createGoogleSpreadsheetUrl(
  spreadsheetId
) {
  const normalizedSpreadsheetId =
    extractGoogleSpreadsheetId(
      spreadsheetId
    );

  if (!normalizedSpreadsheetId) {
    return "";
  }

  return (
    `${GOOGLE_SHEET_URL_PREFIX}` +
    `${normalizedSpreadsheetId}/edit`
  );
}

export function getFrameworkSpreadsheetId(
  frameworkInput
) {
  const googleSheetConfiguration =
    getGoogleSheetConfiguration(
      frameworkInput
    );

  return extractGoogleSpreadsheetId(
    googleSheetConfiguration.spreadsheetId ||
      googleSheetConfiguration
        .spreadsheetReference ||
      googleSheetConfiguration.spreadsheetUrl
  );
}

export function getFrameworkSpreadsheetUrl(
  frameworkInput
) {
  const googleSheetConfiguration =
    getGoogleSheetConfiguration(
      frameworkInput
    );

  const configuredUrl =
    normalizeText(
      googleSheetConfiguration.spreadsheetUrl
    );

  if (configuredUrl) {
    return configuredUrl;
  }

  return createGoogleSpreadsheetUrl(
    getFrameworkSpreadsheetId(
      frameworkInput
    )
  );
}

export function getFrameworkSheetName(
  frameworkInput
) {
  const googleSheetConfiguration =
    getGoogleSheetConfiguration(
      frameworkInput
    );

  return normalizeText(
    googleSheetConfiguration.sheetName
  );
}

// --------------------------------------------------
// Google Sheet heading helpers
// --------------------------------------------------

function getFieldAliases(fieldName) {
  const configuredAliases =
    GOOGLE_SHEET_COLUMN_ALIASES?.[
      fieldName
    ];

  const aliases =
    Array.isArray(
      configuredAliases
    )
      ? configuredAliases
      : [];

  return Array.from(
    new Set([
      fieldName,
      ...aliases,
    ])
  );
}

function headingMatchesField(
  heading,
  fieldName
) {
  const normalizedHeading =
    normalizeColumnHeading(
      heading
    );

  if (!normalizedHeading) {
    return false;
  }

  return getFieldAliases(
    fieldName
  ).some(
    (alias) =>
      normalizeColumnHeading(
        alias
      ) === normalizedHeading
  );
}

export function getMappedGoogleSheetField(
  heading
) {
  const configuredFieldNames =
    Object.keys(
      GOOGLE_SHEET_COLUMN_ALIASES ??
        {}
    );

  const canonicalFieldNames =
    Array.from(
      new Set([
        ...(Array.isArray(
          REQUIRED_CONTROL_FIELDS
        )
          ? REQUIRED_CONTROL_FIELDS
          : [
              "requirementNumber",
              "category",
              "question",
            ]),
        "owner",
        "status",
        "evidenceUrl",
        "comments",
        ...configuredFieldNames,
      ])
    );

  return (
    canonicalFieldNames.find(
      (fieldName) =>
        headingMatchesField(
          heading,
          fieldName
        )
    ) ?? ""
  );
}

function getControlFieldValue(
  control,
  fieldName
) {
  if (!isObjectRecord(control)) {
    return "";
  }

  if (
    hasOwnProperty(
      control,
      fieldName
    )
  ) {
    return control[fieldName];
  }

  const matchingEntry =
    Object.entries(control).find(
      ([heading]) =>
        headingMatchesField(
          heading,
          fieldName
        )
    );

  return matchingEntry?.[1] ?? "";
}

// --------------------------------------------------
// Control field accessors
// --------------------------------------------------

function getControlRequirementNumber(
  control
) {
  return normalizeText(
    getControlFieldValue(
      control,
      "requirementNumber"
    ) ||
      control?.reqNo ||
      control?.requirementNo ||
      control?.["REQ.No"] ||
      control?.["REQ No"]
  );
}

function getControlCategory(control) {
  return normalizeText(
    getControlFieldValue(
      control,
      "category"
    )
  );
}

function getControlQuestion(control) {
  return normalizeText(
    getControlFieldValue(
      control,
      "question"
    ) ||
      control?.control ||
      control?.requirement
  );
}

function getControlStatus(control) {
  return normalizeText(
    getControlFieldValue(
      control,
      "status"
    )
  );
}

function getControlEvidenceUrl(
  control
) {
  return normalizeText(
    getControlFieldValue(
      control,
      "evidenceUrl"
    ) ||
      control?.evidence
  );
}

// --------------------------------------------------
// Status validation
// --------------------------------------------------

export function isValidControlStatus(
  status
) {
  const resolvedStatus =
    normalizeText(status) ||
    DEFAULT_CONTROL_STATUS;

  return Boolean(
    isCanonicalControlStatus(
      resolvedStatus
    )
  );
}

// --------------------------------------------------
// URL validation
// --------------------------------------------------

function isValidHttpsUrl(value) {
  const normalizedValue =
    normalizeText(value);

  if (!normalizedValue) {
    return true;
  }

  try {
    const url =
      new URL(normalizedValue);

    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidGoogleEvidenceUrl(
  value
) {
  const normalizedValue =
    normalizeText(value);

  if (!normalizedValue) {
    return true;
  }

  try {
    const url =
      new URL(normalizedValue);

    const hostname =
      url.hostname.toLowerCase();

    return Boolean(
      url.protocol === "https:" &&
        [
          GOOGLE_DRIVE_HOST,
          GOOGLE_SHEETS_HOST,
        ].includes(hostname)
    );
  } catch {
    return false;
  }
}

export function isValidGoogleSheetUrl(
  value
) {
  const normalizedValue =
    normalizeText(value);

  if (!normalizedValue) {
    return true;
  }

  try {
    const url =
      new URL(normalizedValue);

    return Boolean(
      url.protocol === "https:" &&
        url.hostname.toLowerCase() ===
          GOOGLE_SHEETS_HOST &&
        extractGoogleSpreadsheetId(
          normalizedValue
        )
    );
  } catch {
    return false;
  }
}

// --------------------------------------------------
// Google Sheet configuration validation
// --------------------------------------------------

export function getGoogleSheetConfigurationError(
  frameworkInput
) {
  if (!isObjectRecord(frameworkInput)) {
    return (
      "Google Sheets configuration " +
      "is required."
    );
  }

  const googleSheetConfiguration =
    getGoogleSheetConfiguration(
      frameworkInput
    );

  const spreadsheetId =
    getFrameworkSpreadsheetId(
      frameworkInput
    );

  if (!spreadsheetId) {
    return (
      "Enter a valid Google Sheets URL " +
      "or spreadsheet ID."
    );
  }

  const configuredSpreadsheetUrl =
    normalizeText(
      googleSheetConfiguration.spreadsheetUrl
    );

  if (
    configuredSpreadsheetUrl &&
    !isValidGoogleSheetUrl(
      configuredSpreadsheetUrl
    )
  ) {
    return (
      "The Google Sheets URL must be a valid " +
      "HTTPS docs.google.com spreadsheet URL."
    );
  }

  const sheetName =
    getFrameworkSheetName(
      frameworkInput
    );

  if (!sheetName) {
    return (
      "Enter the name of the worksheet tab " +
      "that contains the framework controls."
    );
  }

  return "";
}

// --------------------------------------------------
// Google Sheet column validation
// --------------------------------------------------

export function getMissingGoogleSheetFields(
  headings
) {
  const safeHeadings =
    Array.isArray(headings)
      ? headings
      : [];

  const requiredFields =
    Array.isArray(
      REQUIRED_CONTROL_FIELDS
    )
      ? REQUIRED_CONTROL_FIELDS
      : [
          "requirementNumber",
          "category",
          "question",
        ];

  const mappedFields =
    new Set(
      safeHeadings
        .map(
          getMappedGoogleSheetField
        )
        .filter(Boolean)
    );

  return requiredFields.filter(
    (fieldName) =>
      !mappedFields.has(
        fieldName
      )
  );
}

export function getGoogleSheetColumnValidationError(
  headings
) {
  if (
    !Array.isArray(headings) ||
    headings.length === 0
  ) {
    return (
      "The worksheet does not contain " +
      "a valid header row."
    );
  }

  const nonEmptyHeadings =
    headings.filter(
      (heading) =>
        normalizeText(heading)
    );

  if (nonEmptyHeadings.length === 0) {
    return (
      "The worksheet does not contain " +
      "a valid header row."
    );
  }

  const missingFields =
    getMissingGoogleSheetFields(
      nonEmptyHeadings
    );

  if (
    missingFields.length === 0
  ) {
    return "";
  }

  const missingColumnNames =
    missingFields.map(
      (fieldName) =>
        GOOGLE_SHEET_FIELD_DISPLAY_NAMES[
          fieldName
        ] ?? fieldName
    );

  return (
    "The worksheet is missing the " +
    "following required columns: " +
    missingColumnNames.join(", ") +
    "."
  );
}

export function validateGoogleSheetColumns(
  headings
) {
  return (
    getGoogleSheetColumnValidationError(
      headings
    ) === ""
  );
}

// --------------------------------------------------
// Duplicate control validation
// --------------------------------------------------

function findDuplicateControlValue(
  controls,
  getValue
) {
  const encounteredValues =
    new Map();

  for (
    let index = 0;
    index < controls.length;
    index += 1
  ) {
    const originalValue =
      normalizeText(
        getValue(controls[index])
      );

    const comparableValue =
      normalizeComparableValue(
        originalValue
      );

    if (!comparableValue) {
      continue;
    }

    if (
      encounteredValues.has(
        comparableValue
      )
    ) {
      return {
        value: originalValue,
        firstIndex:
          encounteredValues.get(
            comparableValue
          ),
        duplicateIndex: index,
      };
    }

    encounteredValues.set(
      comparableValue,
      index
    );
  }

  return null;
}

export function getDuplicateControlError(
  controls
) {
  const safeControls =
    getControlsArray(controls);

  const duplicateRequirementNumber =
    findDuplicateControlValue(
      safeControls,
      getControlRequirementNumber
    );

  if (duplicateRequirementNumber) {
    return (
      "Requirement number " +
      `"${duplicateRequirementNumber.value}" ` +
      "is used more than once. Each control " +
      "must have a unique requirement number."
    );
  }

  return "";
}
// --------------------------------------------------
// Individual control validation
// --------------------------------------------------

export function getControlValidationError(
  control,
  index = 0
) {
  const controlNumber =
    index + 1;

  if (!isObjectRecord(control)) {
    return (
      `Control ${controlNumber} ` +
      "contains invalid data."
    );
  }

  const requirementNumber =
    getControlRequirementNumber(
      control
    );

  if (!requirementNumber) {
    return (
      `Control ${controlNumber} ` +
      "must have a requirement number."
    );
  }

  const category =
    getControlCategory(
      control
    );

  if (!category) {
    return (
      `Control ${controlNumber} ` +
      "must have a category."
    );
  }

  const question =
    getControlQuestion(control);

  if (!question) {
    return (
      `Control ${controlNumber} ` +
      "must have a question."
    );
  }

  const status =
    getControlStatus(control) ||
    DEFAULT_CONTROL_STATUS;

  if (
    !isValidControlStatus(
      status
    )
  ) {
    return (
      `Control ${controlNumber} ` +
      "has an invalid status. Valid statuses are: " +
      `${CONTROL_STATUSES.join(", ")}.`
    );
  }

  const evidenceUrl =
    getControlEvidenceUrl(
      control
    );

  if (
    evidenceUrl &&
    !isValidHttpsUrl(
      evidenceUrl
    )
  ) {
    return (
      `Control ${controlNumber} ` +
      "must use a valid HTTPS evidence URL."
    );
  }

  if (
    evidenceUrl &&
    !isValidGoogleEvidenceUrl(
      evidenceUrl
    )
  ) {
    return (
      `Control ${controlNumber} ` +
      "must use a valid HTTPS Google Drive " +
      "or Google Docs evidence link."
    );
  }

  return "";
}

// --------------------------------------------------
// Framework validation
// --------------------------------------------------

function isValidConfiguredValue(
  value,
  allowedValues
) {
  if (!normalizeText(value)) {
    return true;
  }

  const normalizedValue =
    normalizeLowercase(value);

  return allowedValues.some(
    (allowedValue) =>
      normalizeLowercase(
        allowedValue
      ) === normalizedValue
  );
}

export function getFrameworkValidationError(
  frameworkInput
) {
  if (!isObjectRecord(frameworkInput)) {
    return (
      "Framework data is required."
    );
  }

  if (
    !normalizeText(
      frameworkInput.name
    )
  ) {
    return (
      "Framework name is required."
    );
  }

  if (
    !isValidConfiguredValue(
      frameworkInput.frameworkStatus,
      FRAMEWORK_STATUSES
    )
  ) {
    return (
      "Framework status is invalid. Valid statuses " +
      `are: ${FRAMEWORK_STATUSES.join(", ")}.`
    );
  }

  if (
    !isValidConfiguredValue(
      frameworkInput.reviewFrequency,
      REVIEW_FREQUENCIES
    )
  ) {
    return (
      "Review frequency is invalid. Valid review " +
      `frequencies are: ${REVIEW_FREQUENCIES.join(
        ", "
      )}.`
    );
  }

  if (
    isGoogleSheetsFramework(
      frameworkInput
    )
  ) {
    const configurationError =
      getGoogleSheetConfigurationError(
        frameworkInput
      );

    if (configurationError) {
      return configurationError;
    }
  }

  const controls =
    getControlsArray(
      frameworkInput.controls
    );

  /*
   * Google Sheets frameworks may be created before
   * their initial worksheet fetch completes.
   *
   * Local frameworks require at least one control.
   */
  if (
    controls.length === 0 &&
    !isGoogleSheetsFramework(
      frameworkInput
    )
  ) {
    return (
      "At least one control is required."
    );
  }

  for (
    let index = 0;
    index < controls.length;
    index += 1
  ) {
    const controlError =
      getControlValidationError(
        controls[index],
        index
      );

    if (controlError) {
      return controlError;
    }
  }

  /*
   * Local frameworks require unique requirement
   * numbers because the dashboard owns their control
   * definitions.
   *
   * Google Sheets frameworks may legitimately contain
   * several rows under the same parent requirement
   * reference. Those rows remain separate imported
   * controls, so duplicate REQ.No values are allowed.
   */
  if (
    !isGoogleSheetsFramework(
      frameworkInput
    )
  ) {
    const duplicateControlError =
      getDuplicateControlError(
        controls
      );

    if (duplicateControlError) {
      return duplicateControlError;
    }
  }

  return "";
}

export function validateFrameworkInput(
  frameworkInput
) {
  const validationError =
    getFrameworkValidationError(
      frameworkInput
    );

  if (validationError) {
    throw new Error(
      validationError
    );
  }

  return true;
}

// --------------------------------------------------
// Row-level spreadsheet warnings
// --------------------------------------------------

export function getGoogleSheetRowWarnings(
  control,
  rowIndex = 0,
  headerRow = 1
) {
  const normalizedHeaderRow =
    Number.isInteger(
      Number(headerRow)
    ) &&
    Number(headerRow) >= 1
      ? Number(headerRow)
      : 1;

  const spreadsheetRowNumber =
    rowIndex +
    normalizedHeaderRow +
    1;

  if (!isObjectRecord(control)) {
    return [
      `Row ${spreadsheetRowNumber}: ` +
        "The row contains invalid data.",
    ];
  }

  const warnings = [];

  const requirementNumber =
    getControlRequirementNumber(
      control
    );

  const category =
    getControlCategory(
      control
    );

  const question =
    getControlQuestion(
      control
    );

  const status =
    getControlStatus(
      control
    );

  const evidenceUrl =
    getControlEvidenceUrl(
      control
    );

  if (!requirementNumber) {
    warnings.push(
      `Row ${spreadsheetRowNumber}: ` +
        "REQ.No is empty."
    );
  }

  if (!category) {
    warnings.push(
      `Row ${spreadsheetRowNumber}: ` +
        "Category is empty."
    );
  }

  if (!question) {
    warnings.push(
      `Row ${spreadsheetRowNumber}: ` +
        "Question is empty."
    );
  }

  if (
    status &&
    !isValidControlStatus(
      status
    )
  ) {
    warnings.push(
      `Row ${spreadsheetRowNumber}: ` +
        "Status is invalid and will use " +
        `"${DEFAULT_CONTROL_STATUS}".`
    );
  }

  if (
    evidenceUrl &&
    !isValidGoogleEvidenceUrl(
      evidenceUrl
    )
  ) {
    warnings.push(
      `Row ${spreadsheetRowNumber}: ` +
        "Evidence must be a valid HTTPS " +
        "Google Drive or Google Docs link."
    );
  }

  return warnings;
}