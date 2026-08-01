import {
  mapGoogleSheetRowsToControls,
} from "../adapters/googleSheetMapper";

import {
  getGoogleSheetColumnValidationError,
  getGoogleSheetRowWarnings,
  validateGoogleSheetColumns,
} from "../utils/frameworkValidation";

// --------------------------------------------------
// Constants
// --------------------------------------------------

const GOOGLE_SHEETS_API_BASE_URL =
  "https://sheets.googleapis.com/v4/spreadsheets";

const GOOGLE_SHEETS_API_KEY_ENV_NAME =
  "VITE_GOOGLE_SHEETS_API_KEY";

export const CANONICAL_COLUMNS =
  Object.freeze({
    REQUIREMENT_NUMBER: "REQ.No",
    CATEGORY: "Category",
    QUESTION: "Question",
  });

export const DEFAULT_COLUMN_MAPPING =
  Object.freeze({
    requirementNumber:
      CANONICAL_COLUMNS.REQUIREMENT_NUMBER,

    category:
      CANONICAL_COLUMNS.CATEGORY,

    question:
      CANONICAL_COLUMNS.QUESTION,
  });

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

function normalizeHeaderRow(value) {
  const parsedValue =
    Number.parseInt(
      String(value ?? ""),
      10
    );

  return Number.isInteger(
    parsedValue
  ) &&
    parsedValue >= 1
    ? parsedValue
    : 1;
}

/**
 * Produces a comparison-safe column heading.
 *
 * This allows headings to match even when Google
 * Sheets contains different punctuation, brackets,
 * line breaks, spacing, or capitalization.
 */
function normalizeColumnHeading(value) {
  return normalizeLowercase(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function isObjectRecord(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
}

function cloneObject(value) {
  if (!isObjectRecord(value)) {
    return {};
  }

  return {
    ...value,
  };
}

function getGoogleSheetsApiKey() {
  return normalizeText(
    import.meta.env[
      GOOGLE_SHEETS_API_KEY_ENV_NAME
    ]
  );
}

function escapeSheetName(sheetName) {
  return normalizeText(
    sheetName
  ).replace(/'/g, "''");
}

function createWorksheetRange(
  sheetName
) {
  const escapedSheetName =
    escapeSheetName(sheetName);

  return `'${escapedSheetName}'`;
}

function createValuesApiUrl({
  spreadsheetId,
  sheetName,
  apiKey,
}) {
  const range =
    createWorksheetRange(
      sheetName
    );

  const encodedSpreadsheetId =
    encodeURIComponent(
      spreadsheetId
    );

  const encodedRange =
    encodeURIComponent(range);

  const encodedApiKey =
    encodeURIComponent(apiKey);

  return (
    `${GOOGLE_SHEETS_API_BASE_URL}/` +
    `${encodedSpreadsheetId}/values/` +
    `${encodedRange}` +
    `?majorDimension=ROWS` +
    `&key=${encodedApiKey}`
  );
}

export function createGoogleSheetsServiceError(
  message,
  {
    name =
      "GoogleSheetsServiceError",

    code =
      "GOOGLE_SHEETS_ERROR",

    operation = "",
    context,
    cause,
  } = {}
) {
  const error =
    new Error(message);

  error.name = name;
  error.code = code;

  if (operation) {
    error.operation = operation;
  }

  if (context !== undefined) {
    error.context = context;
  }

  if (cause !== undefined) {
    error.cause = cause;
  }

  return error;
}

/*
 * Temporary compatibility alias.
 *
 * This prevents older imports from breaking while the
 * application moves to the clearer service-helper name.
 */
export const createServiceError =
  createGoogleSheetsServiceError;

// --------------------------------------------------
// Column-mapping helpers
// --------------------------------------------------

function normalizeColumnMapping(
  columnMapping
) {
  const safeMapping =
    isObjectRecord(columnMapping)
      ? columnMapping
      : {};

  return {
    requirementNumber:
      normalizeText(
        safeMapping.requirementNumber
      ) ||
      DEFAULT_COLUMN_MAPPING
        .requirementNumber,

    category:
      normalizeText(
        safeMapping.category
      ),

    question:
      normalizeText(
        safeMapping.question
      ) ||
      DEFAULT_COLUMN_MAPPING
        .question,
  };
}

/**
 * Finds the actual worksheet heading using a
 * punctuation-insensitive and case-insensitive
 * comparison.
 */
function findMatchingColumn(
  columns,
  requestedColumn
) {
  const normalizedRequestedColumn =
    normalizeColumnHeading(
      requestedColumn
    );

  if (
    !normalizedRequestedColumn ||
    !Array.isArray(columns)
  ) {
    return "";
  }

  return (
    columns.find(
      (column) =>
        normalizeColumnHeading(
          column
        ) ===
        normalizedRequestedColumn
    ) ?? ""
  );
}

function getMappedColumnConfiguration({
  columns,
  columnMapping,
  defaultCategory,
}) {
  const normalizedMapping =
    normalizeColumnMapping(
      columnMapping
    );

  const requirementNumberColumn =
    findMatchingColumn(
      columns,
      normalizedMapping
        .requirementNumber
    );

  const questionColumn =
    findMatchingColumn(
      columns,
      normalizedMapping.question
    );

  const categoryColumn =
    normalizedMapping.category
      ? findMatchingColumn(
          columns,
          normalizedMapping.category
        )
      : "";

  return {
    requirementNumberColumn,
    questionColumn,
    categoryColumn,

    configuredRequirementNumberColumn:
      normalizedMapping
        .requirementNumber,

    configuredQuestionColumn:
      normalizedMapping.question,

    configuredCategoryColumn:
      normalizedMapping.category,

    defaultCategory:
      normalizeText(
        defaultCategory
      ),
  };
}

function validateMappedColumns({
  columns,
  columnMapping,
  defaultCategory,
}) {
  const configuration =
    getMappedColumnConfiguration({
      columns,
      columnMapping,
      defaultCategory,
    });

  const missingColumns = [];

  if (
    !configuration
      .requirementNumberColumn
  ) {
    missingColumns.push(
      configuration
        .configuredRequirementNumberColumn
    );
  }

  if (
    !configuration.questionColumn
  ) {
    missingColumns.push(
      configuration
        .configuredQuestionColumn
    );
  }

  const categoryIsConfigured =
    Boolean(
      configuration
        .configuredCategoryColumn
    );

  const categoryColumnExists =
    Boolean(
      configuration.categoryColumn
    );

  const hasDefaultCategory =
    Boolean(
      configuration.defaultCategory
    );

  if (
    categoryIsConfigured &&
    !categoryColumnExists &&
    !hasDefaultCategory
  ) {
    missingColumns.push(
      configuration
        .configuredCategoryColumn
    );
  }

  if (
    !categoryIsConfigured &&
    !hasDefaultCategory
  ) {
    throw createServiceError(
      "A category column or default dashboard category is required.",
      {
        code:
          "GOOGLE_SHEETS_CATEGORY_MAPPING_REQUIRED",

        context: {
          columns,
          columnMapping:
            normalizeColumnMapping(
              columnMapping
            ),
        },
      }
    );
  }

  if (missingColumns.length > 0) {
    throw createServiceError(
      `The Google Sheet does not contain the mapped column${
        missingColumns.length === 1
          ? ""
          : "s"
      }: ${missingColumns.join(", ")}.`,
      {
        code:
          "GOOGLE_SHEETS_MAPPED_COLUMNS_MISSING",

        context: {
          availableColumns:
            columns,

          missingColumns,

          columnMapping:
            normalizeColumnMapping(
              columnMapping
            ),
        },
      }
    );
  }

  return configuration;
}

function mapRowsToCanonicalSchema({
  rows,
  columnConfiguration,
}) {
  return rows.map((row) => {
    const safeRow =
      cloneObject(row);

    const requirementNumber =
      safeRow[
        columnConfiguration
          .requirementNumberColumn
      ];

    const question =
      safeRow[
        columnConfiguration
          .questionColumn
      ];

    const categoryFromSheet =
      columnConfiguration.categoryColumn
        ? safeRow[
            columnConfiguration
              .categoryColumn
          ]
        : "";

    const category =
      normalizeText(
        categoryFromSheet
      ) ||
      columnConfiguration
        .defaultCategory;

    return {
      ...safeRow,

      [CANONICAL_COLUMNS
        .REQUIREMENT_NUMBER]:
        requirementNumber ?? "",

      [CANONICAL_COLUMNS.CATEGORY]:
        category,

      [CANONICAL_COLUMNS.QUESTION]:
        question ?? "",
    };
  });
}

// --------------------------------------------------
// Read operations
// --------------------------------------------------

export async function fetchGoogleSheetControls({
  spreadsheetId,
  sheetName,
  existingControls = [],
  frameworkId = "",
  columnMapping =
    DEFAULT_COLUMN_MAPPING,
  defaultCategory = "",
  headerRow = 1,
  signal,
} = {}) {

  validateGoogleSheetConfiguration({
    spreadsheetId,
    sheetName,
  });

  validateExistingControls(
    existingControls
  );

  const apiKey =
    getGoogleSheetsApiKey();

  if (!apiKey) {
    throw createServiceError(
      `Google Sheets integration is missing ${GOOGLE_SHEETS_API_KEY_ENV_NAME}.`,
      {
        name:
          "GoogleSheetsNotConfiguredError",

        code:
          "GOOGLE_SHEETS_NOT_CONFIGURED",

        operation:
          "fetch controls",

        context: {
          spreadsheetId,
          sheetName,
          frameworkId,
        },
      }
    );
  }

  const values =
    await fetchGoogleSheetValues({
      spreadsheetId:
        normalizeText(
          spreadsheetId
        ),

      sheetName:
        normalizeText(
          sheetName
        ),

      apiKey,
      signal,
    });

  const normalizedHeaderRow =
    normalizeHeaderRow(
      headerRow
    );

  const rows =
    convertValuesToRows(
      values,
      normalizedHeaderRow
    );

  const result =
    processGoogleSheetRows({
      rows,
      existingControls,
      frameworkId,
      columnMapping,
      defaultCategory,

      headerRow:
        normalizedHeaderRow,
    });

  return result.controls;
}

export async function fetchGoogleSheetControlResult({
  spreadsheetId,
  sheetName,
  existingControls = [],
  frameworkId = "",
  columnMapping =
    DEFAULT_COLUMN_MAPPING,
  defaultCategory = "",
  headerRow = 1,
  signal,
} = {}) {
  
  validateGoogleSheetConfiguration({
    spreadsheetId,
    sheetName,
  });

  validateExistingControls(
    existingControls
  );

  const apiKey =
    getGoogleSheetsApiKey();

  if (!apiKey) {
    throw createServiceError(
      `Google Sheets integration is missing ${GOOGLE_SHEETS_API_KEY_ENV_NAME}.`,
      {
        name:
          "GoogleSheetsNotConfiguredError",

        code:
          "GOOGLE_SHEETS_NOT_CONFIGURED",

        operation:
          "fetch control result",

        context: {
          spreadsheetId,
          sheetName,
          frameworkId,
        },
      }
    );
  }

  const values =
    await fetchGoogleSheetValues({
      spreadsheetId:
        normalizeText(
          spreadsheetId
        ),

      sheetName:
        normalizeText(
          sheetName
        ),

      apiKey,
      signal,
    });

  const normalizedHeaderRow =
    normalizeHeaderRow(
      headerRow
    );

  const rows =
    convertValuesToRows(
      values,
      normalizedHeaderRow
    );

  return processGoogleSheetRows({
    rows,
    existingControls,
    frameworkId,
    columnMapping,
    defaultCategory,

    headerRow:
      normalizedHeaderRow,
  });
}

// --------------------------------------------------
// API request
// --------------------------------------------------

async function fetchGoogleSheetValues({
  spreadsheetId,
  sheetName,
  apiKey,
  signal,
}) {

  const requestUrl =
    createValuesApiUrl({
      spreadsheetId,
      sheetName,
      apiKey,
    });

  let response;

  try {
    response = await fetch(
      requestUrl,
      {
        method: "GET",

        headers: {
          Accept:
            "application/json",
        },

        signal,
      }
    );

  } catch (error) {
    if (
      typeof DOMException !==
        "undefined" &&
      error instanceof DOMException &&
      error.name ===
        "AbortError"
    ) {
      throw createServiceError(
        "The Google Sheets request was cancelled.",
        {
          name:
            "GoogleSheetsRequestCancelledError",

          code:
            "GOOGLE_SHEETS_REQUEST_CANCELLED",

          cause: error,
        }
      );
    }

    throw createServiceError(
      "Unable to connect to Google Sheets.",
      {
        code:
          "GOOGLE_SHEETS_NETWORK_ERROR",

        cause: error,

        context: {
          spreadsheetId,
          sheetName,
        },
      }
    );
  }

  const responseData =
    await readResponseBody(
      response
    );

  if (!response.ok) {
    throw createGoogleSheetsApiError({
      response,
      responseData,
      spreadsheetId,
      sheetName,
    });
  }

  const values =
    responseData?.values;

  return Array.isArray(values)
    ? values
    : [];
}

async function readResponseBody(
  response
) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function createGoogleSheetsApiError({
  response,
  responseData,
  spreadsheetId,
  sheetName,
}) {
  const apiMessage =
    normalizeText(
      responseData?.error?.message
    );

  let message =
    apiMessage ||
    "Google Sheets returned an unexpected error.";

  let code =
    "GOOGLE_SHEETS_API_ERROR";

  if (
    response.status === 400
  ) {
    message =
      apiMessage ||
      "The spreadsheet ID or worksheet tab name is invalid.";

    code =
      "GOOGLE_SHEETS_INVALID_REQUEST";
  }

  if (
    response.status === 403
  ) {
    message =
      apiMessage ||
      "The spreadsheet is not accessible with the configured Google Sheets API key.";

    code =
      "GOOGLE_SHEETS_ACCESS_DENIED";
  }

  if (
    response.status === 404
  ) {
    message =
      apiMessage ||
      "The spreadsheet or worksheet tab could not be found.";

    code =
      "GOOGLE_SHEETS_NOT_FOUND";
  }

  if (
    response.status === 429
  ) {
    message =
      apiMessage ||
      "The Google Sheets request limit has been reached. Try again later.";

    code =
      "GOOGLE_SHEETS_RATE_LIMITED";
  }

  return createServiceError(
    message,
    {
      code,

      context: {
        status:
          response.status,

        spreadsheetId,
        sheetName,
      },
    }
  );
}

// --------------------------------------------------
// Values conversion
// --------------------------------------------------

export function convertValuesToRows(
  values = [],
  headerRow = 1
) {
  if (!Array.isArray(values)) {
    throw createGoogleSheetsServiceError(
      "Google Sheets values must be provided as an array.",
      {
        code:
          "GOOGLE_SHEETS_VALUES_INVALID",
        operation:
          "convert values to rows",
      }
    );
  }

  if (values.length === 0) {
    return [];
  }

  const normalizedHeaderRow =
    normalizeHeaderRow(
      headerRow
    );

  const headerIndex =
    normalizedHeaderRow - 1;

  if (
    headerIndex >=
    values.length
  ) {
    throw createGoogleSheetsServiceError(
      `Header row ${normalizedHeaderRow} is outside the worksheet data range.`,
      {
        code:
          "GOOGLE_SHEETS_HEADER_ROW_OUT_OF_RANGE",

        operation:
          "convert values to rows",

        context: {
          headerRow:
            normalizedHeaderRow,

          availableRows:
            values.length,
        },
      }
    );
  }

  const headerValues =
    Array.isArray(
      values[headerIndex]
    )
      ? values[headerIndex]
      : [];

  const headings =
    headerValues.map(
      normalizeText
    );

  const hasAtLeastOneHeading =
    headings.some(Boolean);

  if (!hasAtLeastOneHeading) {
    throw createGoogleSheetsServiceError(
      "The worksheet does not contain a valid header row.",
      {
        code:
          "GOOGLE_SHEETS_HEADER_ROW_INVALID",
        operation:
          "convert values to rows",
      }
    );
  }

  return values
    .slice(
      headerIndex + 1
    )
    .filter(
      (row) =>
        Array.isArray(row) &&
        row.some(
          (value) =>
            normalizeText(value)
        )
    )
    .map((row) => {
      const rowObject = {};

      headings.forEach(
        (heading, index) => {
          if (!heading) {
            return;
          }

          rowObject[heading] =
            normalizeText(row[index]);
        }
      );

      return rowObject;
    });
}

// --------------------------------------------------
// Update operations
// --------------------------------------------------

export async function updateGoogleSheetControl() {
  throw createServiceError(
    "Google Sheets controls are read-only in the dashboard. Update the source spreadsheet and refresh the framework instead.",
    {
      name:
        "GoogleSheetsReadOnlyError",

      code:
        "GOOGLE_SHEETS_READ_ONLY",
    }
  );
}

// --------------------------------------------------
// Row processing
// --------------------------------------------------

export function processGoogleSheetRows({
  rows = [],
  existingControls = [],
  frameworkId = "",
  columnMapping =
    DEFAULT_COLUMN_MAPPING,
  defaultCategory = "",
  headerRow = 1,
} = {}) {
  if (!Array.isArray(rows)) {
    throw createGoogleSheetsServiceError(
      "Google Sheets rows must be provided as an array.",
      {
        code:
          "GOOGLE_SHEETS_ROWS_INVALID",
        operation:
          "process rows",
      }
    );
  }

  validateExistingControls(
    existingControls
  );

  if (rows.length === 0) {
    return {
      controls: [],
      warnings: [],
      columns: [],
      mappedColumns: {
        requirementNumber: "",
        category: "",
        question: "",
      },
    };
  }

  const columns =
    getGoogleSheetColumns(rows);

  const columnConfiguration =
    validateMappedColumns({
      columns,
      columnMapping,
      defaultCategory,
    });

  const canonicalRows =
    mapRowsToCanonicalSchema({
      rows,
      columnConfiguration,
    });

  const canonicalColumns =
    getGoogleSheetColumns(
      canonicalRows
    );

  const columnsAreValid =
    validateGoogleSheetColumns(
      canonicalColumns
    );

  if (!columnsAreValid) {
    const validationError =
      getGoogleSheetColumnValidationError(
        canonicalColumns
      );

    throw createServiceError(
      validationError ||
        "The mapped Google Sheet data does not contain the required dashboard fields.",
      {
        code:
          "GOOGLE_SHEETS_CANONICAL_COLUMNS_INVALID",

        context: {
          sourceColumns:
            columns,

          canonicalColumns,

          columnMapping:
            normalizeColumnMapping(
              columnMapping
            ),
        },
      }
    );
  }

  const warnings =
    canonicalRows.flatMap(
      (row, index) => {
        const rowWarnings =
          getGoogleSheetRowWarnings(
            row,
            index
          );

        return Array.isArray(
          rowWarnings
        )
          ? rowWarnings
          : [];
      }
    );

  const controls =
    mapGoogleSheetRowsToControls(
      canonicalRows,
      existingControls,
      frameworkId,
      {
        sourceRowOffset:
          normalizeHeaderRow(
            headerRow
          ),
      }
    );

  return {
    controls:
      Array.isArray(controls)
        ? controls
        : [],

    warnings,

    columns,

    mappedColumns: {
      requirementNumber:
        columnConfiguration
          .requirementNumberColumn,

      category:
        columnConfiguration
          .categoryColumn,

      question:
        columnConfiguration
          .questionColumn,

      defaultCategory:
        columnConfiguration
          .defaultCategory,
    },
  };
}

// --------------------------------------------------
// Column helpers
// --------------------------------------------------

export function getGoogleSheetColumns(
  rows = []
) {
  if (!Array.isArray(rows)) {
    return [];
  }

  const firstValidRow =
    rows.find(
      isObjectRecord
    );

  return firstValidRow
    ? Object.keys(firstValidRow)
    : [];
}

// --------------------------------------------------
// Configuration
// --------------------------------------------------

export function hasGoogleSheetConfiguration({
  spreadsheetId,
  sheetName,
} = {}) {
  return Boolean(
    normalizeText(
      spreadsheetId
    ) &&
      normalizeText(
        sheetName
      )
  );
}

export function validateGoogleSheetConfiguration({
  spreadsheetId,
  sheetName,
} = {}) {
  if (
    !normalizeText(
      spreadsheetId
    )
  ) {
    throw createGoogleSheetsServiceError(
      "A Google Sheets spreadsheet ID is required.",
      {
        code:
          "GOOGLE_SHEETS_SPREADSHEET_ID_REQUIRED",
        operation:
          "validate configuration",
      }
    );
  }

  if (
    !normalizeText(
      sheetName
    )
  ) {
    throw createGoogleSheetsServiceError(
      "A Google Sheets sheet name is required.",
      {
        code:
          "GOOGLE_SHEETS_SHEET_NAME_REQUIRED",
        operation:
          "validate configuration",
      }
    );
  }

  return true;
}

export function hasGoogleSheetsApiKey() {
  return Boolean(
    getGoogleSheetsApiKey()
  );
}

// --------------------------------------------------
// Internal validation
// --------------------------------------------------

function validateExistingControls(
  existingControls
) {
  if (
    !Array.isArray(
      existingControls
    )
  ) {
    throw createGoogleSheetsServiceError(
      "Existing controls must be provided as an array.",
      {
        code:
          "GOOGLE_SHEETS_EXISTING_CONTROLS_INVALID",
        operation:
          "validate existing controls",
      }
    );
  }

  return true;
}