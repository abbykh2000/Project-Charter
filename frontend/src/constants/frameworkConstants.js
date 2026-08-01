// --------------------------------------------------
// Control statuses
// --------------------------------------------------

export const CONTROL_STATUS_NOT_STARTED =
  "Not Started";

export const CONTROL_STATUS_IN_PROGRESS =
  "In Progress";

export const CONTROL_STATUS_PASSED =
  "Passed";

export const CONTROL_STATUS_FAILED =
  "Failed";

export const CONTROL_STATUSES = [
  CONTROL_STATUS_NOT_STARTED,
  CONTROL_STATUS_IN_PROGRESS,
  CONTROL_STATUS_PASSED,
  CONTROL_STATUS_FAILED,
];

export const DEFAULT_CONTROL_STATUS =
  CONTROL_STATUS_NOT_STARTED;

// --------------------------------------------------
// Framework statuses
// --------------------------------------------------

export const FRAMEWORK_STATUS_DRAFT =
  "Draft";

export const FRAMEWORK_STATUS_ACTIVE =
  "Active";

export const FRAMEWORK_STATUS_ARCHIVED =
  "Archived";

export const FRAMEWORK_STATUSES = [
  FRAMEWORK_STATUS_DRAFT,
  FRAMEWORK_STATUS_ACTIVE,
  FRAMEWORK_STATUS_ARCHIVED,
];

export const DEFAULT_FRAMEWORK_STATUS =
  FRAMEWORK_STATUS_DRAFT;

// --------------------------------------------------
// Review frequencies
// --------------------------------------------------

export const REVIEW_FREQUENCY_MONTHLY =
  "Monthly";

export const REVIEW_FREQUENCY_QUARTERLY =
  "Quarterly";

export const REVIEW_FREQUENCY_BIANNUALLY =
  "Biannually";

export const REVIEW_FREQUENCY_ANNUALLY =
  "Annually";

export const REVIEW_FREQUENCIES = [
  REVIEW_FREQUENCY_MONTHLY,
  REVIEW_FREQUENCY_QUARTERLY,
  REVIEW_FREQUENCY_BIANNUALLY,
  REVIEW_FREQUENCY_ANNUALLY,
];

export const DEFAULT_REVIEW_FREQUENCY =
  REVIEW_FREQUENCY_ANNUALLY;

// --------------------------------------------------
// Control field configuration
// --------------------------------------------------

/**
 * Fields that define the compliance requirement.
 *
 * For local frameworks, these fields are managed in
 * the dashboard. For Google Sheets frameworks, these
 * fields are refreshed from the source spreadsheet.
 */
export const REQUIREMENT_CONTROL_FIELDS = [
  "requirementNumber",
  "category",
  "question",
];

/**
 * Dashboard-managed operational fields.
 *
 * These values must be preserved when controls are
 * refreshed from Google Sheets.
 */
export const OPERATIONAL_CONTROL_FIELDS = [
  "owner",
  "status",
  "evidenceUrl",
  "comments",
];

/**
 * All control fields that may be edited through the
 * dashboard where the framework source permits it.
 */
export const EDITABLE_CONTROL_FIELDS = [
  ...REQUIREMENT_CONTROL_FIELDS,
  ...OPERATIONAL_CONTROL_FIELDS,
];

/**
 * Fields required for a valid control.
 */
export const REQUIRED_CONTROL_FIELDS = [
  "requirementNumber",
  "category",
  "question",
];

/**
 * Compatibility export for older components.
 *
 * New code should use REQUIREMENT_CONTROL_FIELDS and
 * OPERATIONAL_CONTROL_FIELDS.
 */
export const FIXED_CONTROL_FIELDS = [
  ...REQUIREMENT_CONTROL_FIELDS,
];

// --------------------------------------------------
// Google Sheets column configuration
// --------------------------------------------------

/**
 * Maps worksheet headings to dashboard control fields.
 */
export const GOOGLE_SHEET_COLUMN_MAPPING = {
  "REQ.No": "requirementNumber",
  Category: "category",
  Question: "question",
  Owner: "owner",
  Status: "status",
  Evidence: "evidenceUrl",
  Comments: "comments",
};

/**
 * Canonical column order used by Google Sheets-related
 * operations.
 */
export const GOOGLE_SHEET_COLUMNS =
  Object.keys(
    GOOGLE_SHEET_COLUMN_MAPPING
  );

/**
 * Default field-to-heading mapping used by the Google
 * Sheets service.
 *
 * This direction matches the columnMapping object
 * stored inside framework.googleSheet.
 */
export const DEFAULT_GOOGLE_SHEET_COLUMN_MAPPING =
  Object.freeze({
    requirementNumber: "REQ.No",
    category: "Category",
    question: "Question",
  });

/**
 * Common worksheet headings that may represent each
 * canonical control field.
 *
 * Column matching is case-insensitive and ignores
 * spaces and punctuation.
 */
export const GOOGLE_SHEET_COLUMN_ALIASES = {
  requirementNumber: [
    "REQ.No",
    "REQ No",
    "Req.No",
    "Req No",
    "Req Number",
    "Requirement No",
    "Requirement Number",
    "requirementNumber",
  ],

  category: [
    "Category",
    "Control Category",
    "Domain",
    "Section",
    "category",
  ],

  question: [
    "Question",
    "Control",
    "Requirement",
    "Requirement Question",
    "Control Question",
    "Inquiry / aspects to consider in assessing cyber security risks",
    "question",
  ],

  owner: [
    "Owner",
    "Assignee",
    "Responsible Owner",
    "owner",
  ],

  status: [
    "Status",
    "Control Status",
    "Assessment Status",
    "status",
  ],

  evidenceUrl: [
    "Evidence",
    "Evidence URL",
    "Evidence Link",
    "Evidence Document",
    "evidenceUrl",
  ],

  comments: [
    "Comment",
    "Comments",
    "Note",
    "Notes",
    "comments",
  ],
};

/**
 * Google Sheets fields required before a framework can
 * be synchronized.
 */
export const REQUIRED_GOOGLE_SHEET_FIELDS = [
  "spreadsheetId",
  "sheetName",
];

// --------------------------------------------------
// Default control values
// --------------------------------------------------

export const DEFAULT_CONTROL_CATEGORY =
  "General";

export const DEFAULT_CONTROL_OWNER = "";

export const DEFAULT_CONTROL_EVIDENCE_URL =
  "";

export const DEFAULT_CONTROL_COMMENTS = "";

// --------------------------------------------------
// Framework type
// --------------------------------------------------

export const CUSTOM_FRAMEWORK_TYPE =
  "custom";

// --------------------------------------------------
// Framework source types
// --------------------------------------------------

export const FRAMEWORK_SOURCE_LOCAL =
  "local";

export const FRAMEWORK_SOURCE_GOOGLE_SHEETS =
  "google-sheets";

export const FRAMEWORK_SOURCES = [
  FRAMEWORK_SOURCE_LOCAL,
  FRAMEWORK_SOURCE_GOOGLE_SHEETS,
];

export const DEFAULT_FRAMEWORK_SOURCE =
  FRAMEWORK_SOURCE_LOCAL;

/**
 * Compatibility alias used by existing files.
 *
 * New code should use FRAMEWORK_SOURCE_LOCAL.
 */
export const LOCAL_SOURCE =
  FRAMEWORK_SOURCE_LOCAL;

// --------------------------------------------------
// Integration types
// --------------------------------------------------

export const INTEGRATION_TYPE_NONE =
  "none";

export const INTEGRATION_TYPE_GOOGLE_SHEETS =
  "google-sheets";

export const INTEGRATION_TYPES = [
  INTEGRATION_TYPE_NONE,
  INTEGRATION_TYPE_GOOGLE_SHEETS,
];

export const DEFAULT_INTEGRATION_TYPE =
  INTEGRATION_TYPE_NONE;

// --------------------------------------------------
// Google Sheets synchronization statuses
// --------------------------------------------------

export const GOOGLE_SHEET_SYNC_STATUS_NOT_CONFIGURED =
  "Not Configured";

export const GOOGLE_SHEET_SYNC_STATUS_NOT_SYNCED =
  "Not Synced";

export const GOOGLE_SHEET_SYNC_STATUS_SYNCING =
  "Syncing";

/**
 * Canonical success status used by the service layer.
 */
export const GOOGLE_SHEET_SYNC_STATUS_SYNCED =
  "Up to Date";

/**
 * Compatibility alias for existing UI components.
 *
 * New service code should use
 * GOOGLE_SHEET_SYNC_STATUS_SYNCED.
 */
export const GOOGLE_SHEET_SYNC_STATUS_UP_TO_DATE =
  GOOGLE_SHEET_SYNC_STATUS_SYNCED;

export const GOOGLE_SHEET_SYNC_STATUS_ERROR =
  "Error";

export const GOOGLE_SHEET_SYNC_STATUSES = [
  GOOGLE_SHEET_SYNC_STATUS_NOT_CONFIGURED,
  GOOGLE_SHEET_SYNC_STATUS_NOT_SYNCED,
  GOOGLE_SHEET_SYNC_STATUS_SYNCING,
  GOOGLE_SHEET_SYNC_STATUS_SYNCED,
  GOOGLE_SHEET_SYNC_STATUS_ERROR,
];

export const DEFAULT_GOOGLE_SHEET_SYNC_STATUS =
  GOOGLE_SHEET_SYNC_STATUS_NOT_CONFIGURED;

// --------------------------------------------------
// Google Sheets defaults
// --------------------------------------------------

export const DEFAULT_GOOGLE_SHEET_ID =
  "";

export const DEFAULT_GOOGLE_SHEET_URL =
  "";

export const DEFAULT_GOOGLE_SHEET_NAME =
  "";

export const DEFAULT_GOOGLE_SHEET_LAST_SYNCED_AT =
  null;

export const DEFAULT_GOOGLE_SHEET_SYNC_ERROR =
  "";

// --------------------------------------------------
// Canonical Google Sheets configuration
// --------------------------------------------------

/**
 * Creates an independent empty Google Sheets
 * configuration for each framework.
 */
export function createDefaultGoogleSheetConfig() {
  return {
    spreadsheetId:
      DEFAULT_GOOGLE_SHEET_ID,

    spreadsheetUrl:
      DEFAULT_GOOGLE_SHEET_URL,

    sheetName:
      DEFAULT_GOOGLE_SHEET_NAME,

    lastSyncedAt:
      DEFAULT_GOOGLE_SHEET_LAST_SYNCED_AT,

    syncStatus:
      DEFAULT_GOOGLE_SHEET_SYNC_STATUS,

    columnMapping: {
      ...DEFAULT_GOOGLE_SHEET_COLUMN_MAPPING,
    },
  };
}