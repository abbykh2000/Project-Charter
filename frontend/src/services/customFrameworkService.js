import {
  getAll as getStoredFrameworks,
  saveAll as saveStoredFrameworks,
} from "../adapters/localStorageFrameworkAdapter";

import {
  createFramework,
  updateFramework,
} from "../utils/frameworkFactory";

import {
  validateFrameworkInput,
} from "../utils/frameworkValidation";

import {
  FRAMEWORK_SOURCE_LOCAL,
  FRAMEWORK_SOURCE_GOOGLE_SHEETS,
  INTEGRATION_TYPE_NONE,
  INTEGRATION_TYPE_GOOGLE_SHEETS,
  GOOGLE_SHEET_SYNC_STATUS_SYNCED,
  GOOGLE_SHEET_SYNC_STATUS_ERROR,
} from "../constants/frameworkConstants";

import {
  createGoogleSheetsServiceError,
  fetchGoogleSheetControls,
  hasGoogleSheetConfiguration,
} from "./googleSheetService";

// --------------------------------------------------
// General helpers
// --------------------------------------------------

function cloneData(data) {
  if (data === undefined) {
    return undefined;
  }

  if (typeof structuredClone === "function") {
    return structuredClone(data);
  }

  return JSON.parse(JSON.stringify(data));
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeId(value) {
  return normalizeText(value);
}

function normalizeLowercase(value) {
  return normalizeText(value).toLowerCase();
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

function getSafeFrameworks(frameworks) {
  return Array.isArray(frameworks) ? frameworks : [];
}

function getSafeControls(controls) {
  return Array.isArray(controls) ? controls : [];
}

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

function findFrameworkIndexById(frameworks, frameworkId) {
  const normalizedFrameworkId = normalizeId(frameworkId);

  if (!normalizedFrameworkId) {
    return -1;
  }

  return frameworks.findIndex(
    (framework) =>
      normalizeId(framework?.id) === normalizedFrameworkId
  );
}

// --------------------------------------------------
// Google Sheets helpers
// --------------------------------------------------

function getGoogleSheetConfiguration(framework) {
  const googleSheet = framework?.googleSheet ?? {};
  const legacyGoogleWorkspace =
    framework?.googleWorkspace ?? {};

  return {
    spreadsheetId: normalizeText(
      googleSheet.spreadsheetId ??
        framework?.spreadsheetId ??
        legacyGoogleWorkspace?.spreadsheetId
    ),

    spreadsheetUrl: normalizeText(
      googleSheet.spreadsheetUrl ??
        framework?.spreadsheetUrl ??
        legacyGoogleWorkspace?.spreadsheetUrl
    ),

    sheetName: normalizeText(
      googleSheet.sheetName ??
        framework?.sheetName ??
        legacyGoogleWorkspace?.sheetName
    ),

    headerRow:
      normalizeHeaderRow(
        googleSheet.headerRow ??
          framework?.headerRow ??
          legacyGoogleWorkspace?.headerRow ??
          1
      ),

    defaultCategory: normalizeText(
      googleSheet.defaultCategory ??
        framework?.defaultCategory ??
        "General"
    ),

    lastSyncedAt:
      googleSheet.lastSyncedAt ??
      framework?.lastSyncedAt ??
      legacyGoogleWorkspace?.lastSyncedAt ??
      null,

    syncStatus: normalizeText(
      googleSheet.syncStatus ??
        framework?.syncStatus ??
        legacyGoogleWorkspace?.syncStatus
    ),

    syncError: normalizeText(
      googleSheet.syncError ??
        framework?.syncError
    ),

    columnMapping:
      googleSheet.columnMapping &&
      typeof googleSheet.columnMapping === "object" &&
      !Array.isArray(googleSheet.columnMapping)
        ? cloneData(googleSheet.columnMapping)
        : {},
  };
}

function getFrameworkIntegrationType(framework) {
  const source = normalizeLowercase(
    framework?.sourceType ??
      framework?.source
  );

  const integrationType = normalizeLowercase(
    framework?.integrationType
  );

  if (
    integrationType ===
      normalizeLowercase(
        INTEGRATION_TYPE_GOOGLE_SHEETS
      ) ||
    source ===
      normalizeLowercase(
        FRAMEWORK_SOURCE_GOOGLE_SHEETS
      )
  ) {
    return INTEGRATION_TYPE_GOOGLE_SHEETS;
  }

  return INTEGRATION_TYPE_NONE;
}

function isGoogleSheetsFramework(framework) {
  return (
    getFrameworkIntegrationType(framework) ===
    INTEGRATION_TYPE_GOOGLE_SHEETS
  );
}

function hasValidGoogleSheetsConfiguration(framework) {
  const configuration =
    getGoogleSheetConfiguration(framework);

  return hasGoogleSheetConfiguration({
    spreadsheetId: configuration.spreadsheetId,
    sheetName: configuration.sheetName,
  });
}

function removeLegacyGoogleSheetFields(
  framework
) {
  const canonicalFramework = {
    ...framework,
  };

  delete canonicalFramework.spreadsheetId;
  delete canonicalFramework.spreadsheetUrl;
  delete canonicalFramework.sheetName;
  delete canonicalFramework.headerRow;
  delete canonicalFramework.defaultCategory;
  delete canonicalFramework.lastSyncedAt;
  delete canonicalFramework.syncStatus;
  delete canonicalFramework.syncError;
  delete canonicalFramework.googleWorkspace;
  delete canonicalFramework.googleIntegration;

  return canonicalFramework;
}

function applyGoogleSheetMetadata(
  framework,
  overrides = {}
) {
  const configuration =
    getGoogleSheetConfiguration(framework);

  const usesGoogleSheets =
    isGoogleSheetsFramework({
      ...framework,

      integrationType:
        overrides.integrationType ??
        framework?.integrationType,

      sourceType:
        overrides.sourceType ??
        framework?.sourceType,

      source:
        overrides.source ??
        framework?.source,
    });

  const canonicalFramework =
    removeLegacyGoogleSheetFields({
      ...framework,

      sourceType: usesGoogleSheets
        ? FRAMEWORK_SOURCE_GOOGLE_SHEETS
        : FRAMEWORK_SOURCE_LOCAL,

      source: usesGoogleSheets
        ? FRAMEWORK_SOURCE_GOOGLE_SHEETS
        : FRAMEWORK_SOURCE_LOCAL,

      integrationType: usesGoogleSheets
        ? INTEGRATION_TYPE_GOOGLE_SHEETS
        : INTEGRATION_TYPE_NONE,
    });

  /*
   * Local frameworks do not carry Google Sheets
   * configuration or synchronization metadata.
   */
  if (!usesGoogleSheets) {
    const localFramework = {
      ...canonicalFramework,
    };

    delete localFramework.googleSheet;

    return localFramework;
  }

  const googleSheet = {
    spreadsheetId: normalizeText(
      overrides.spreadsheetId ??
        configuration.spreadsheetId
    ),

    spreadsheetUrl: normalizeText(
      overrides.spreadsheetUrl ??
        configuration.spreadsheetUrl
    ),

    sheetName: normalizeText(
      overrides.sheetName ??
        configuration.sheetName
    ),

    headerRow:
      normalizeHeaderRow(
        overrides.headerRow ??
          configuration.headerRow
      ),

    defaultCategory:
      normalizeText(
        overrides.defaultCategory ??
          configuration.defaultCategory
      ) || "General",

    lastSyncedAt:
      overrides.lastSyncedAt ??
      configuration.lastSyncedAt ??
      null,

    syncStatus: normalizeText(
      overrides.syncStatus ??
        configuration.syncStatus
    ),

    syncError: normalizeText(
      overrides.syncError ??
        configuration.syncError
    ),

    columnMapping: {
      ...cloneData(
        configuration.columnMapping
      ),

      ...(
        overrides.columnMapping &&
        typeof overrides.columnMapping ===
          "object" &&
        !Array.isArray(
          overrides.columnMapping
        )
          ? cloneData(
              overrides.columnMapping
            )
          : {}
      ),
    },
  };

  return {
    ...canonicalFramework,
    googleSheet,
  };
}

// --------------------------------------------------
// Stored framework migration
// --------------------------------------------------

function hasLegacyGoogleSheetFields(
  framework
) {
  if (
    !framework ||
    typeof framework !== "object" ||
    Array.isArray(framework)
  ) {
    return false;
  }

  return Boolean(
    framework.spreadsheetId !==
      undefined ||
      framework.spreadsheetUrl !==
        undefined ||
      framework.sheetName !==
        undefined ||
      framework.headerRow !==
        undefined ||
      framework.defaultCategory !==
        undefined ||
      framework.lastSyncedAt !==
        undefined ||
      framework.syncStatus !==
        undefined ||
      framework.syncError !==
        undefined ||
      framework.googleWorkspace !==
        undefined ||
      framework.googleIntegration !==
        undefined ||
      (
        !isGoogleSheetsFramework(
          framework
        ) &&
        framework.googleSheet !==
          undefined
      )
  );
}

function normalizeStoredFramework(
  framework
) {
  if (
    !framework ||
    typeof framework !== "object" ||
    Array.isArray(framework)
  ) {
    return framework;
  }

  return applyGoogleSheetMetadata(
    framework
  );
}

// --------------------------------------------------
// Duplicate validation
// --------------------------------------------------

function hasConflictingGoogleSheetConfiguration(
  frameworks,
  candidateFramework,
  excludedFrameworkId = ""
) {
  if (!isGoogleSheetsFramework(candidateFramework)) {
    return false;
  }

  const candidateConfiguration =
    getGoogleSheetConfiguration(candidateFramework);

  if (
    !candidateConfiguration.spreadsheetId ||
    !candidateConfiguration.sheetName
  ) {
    return false;
  }

  const excludedId = normalizeId(
    excludedFrameworkId
  );

  return getSafeFrameworks(frameworks).some(
    (framework) => {
      if (
        excludedId &&
        normalizeId(framework?.id) === excludedId
      ) {
        return false;
      }

      if (!isGoogleSheetsFramework(framework)) {
        return false;
      }

      const existingConfiguration =
        getGoogleSheetConfiguration(framework);

      return (
        normalizeLowercase(
          existingConfiguration.spreadsheetId
        ) ===
          normalizeLowercase(
            candidateConfiguration.spreadsheetId
          ) &&
        normalizeLowercase(
          existingConfiguration.sheetName
        ) ===
          normalizeLowercase(
            candidateConfiguration.sheetName
          )
      );
    }
  );
}

function validateFrameworkUniqueness(
  frameworks,
  candidateFramework,
  excludedFrameworkId = ""
) {
  const candidateId = normalizeId(
    candidateFramework?.id
  );

  const excludedId = normalizeId(
    excludedFrameworkId
  );

  const duplicateId = getSafeFrameworks(
    frameworks
  ).some((framework) => {
    const existingId = normalizeId(
      framework?.id
    );

    return (
      existingId === candidateId &&
      existingId !== excludedId
    );
  });

  if (duplicateId) {
    throw new Error(
      "A custom framework with this ID already exists."
    );
  }

  if (
    hasConflictingGoogleSheetConfiguration(
      frameworks,
      candidateFramework,
      excludedFrameworkId
    )
  ) {
    throw new Error(
      "Another custom framework already uses this Google Sheets spreadsheet and sheet name."
    );
  }
}

// --------------------------------------------------
// Storage helpers
// --------------------------------------------------

async function loadFrameworks() {
  const storedFrameworks =
    await getStoredFrameworks();

  const safeFrameworks =
    getSafeFrameworks(
      storedFrameworks
    );

  const requiresMigration =
    safeFrameworks.some(
      hasLegacyGoogleSheetFields
    );

  const normalizedFrameworks =
    safeFrameworks.map(
      normalizeStoredFramework
    );

  /*
   * Persist the canonical structure once so future
   * reads use framework.googleSheet only for Google
   * Sheets frameworks.
   */
  if (requiresMigration) {
    await saveStoredFrameworks(
      cloneData(
        normalizedFrameworks
      )
    );
  }

  return normalizedFrameworks;
}

async function persistFrameworks(frameworks) {
  const safeFrameworks =
    getSafeFrameworks(frameworks);

  await saveStoredFrameworks(
    cloneData(safeFrameworks)
  );
}

// --------------------------------------------------
// Google Sheets control loading
// --------------------------------------------------

async function fetchFrameworkControlsFromGoogleSheet(
  framework
) {
  /*
   * Older imports may contain continuation rows that
   * were stored as standalone controls with no REQ.No.
   * Exclude those cached records before mapping so the
   * mapper can rebuild them as continuations of the
   * preceding requirement.
   */
  const existingControls =
    getSafeControls(
      framework?.controls
    ).filter(
      (control) =>
        Boolean(
          getControlRequirementNumber(
            control
          )
        )
    );

  if (!isGoogleSheetsFramework(framework)) {
    return cloneData(existingControls);
  }

  if (
    !hasValidGoogleSheetsConfiguration(
      framework
    )
  ) {
    return cloneData(existingControls);
  }

  const configuration =
    getGoogleSheetConfiguration(framework);

  const sheetControls =
    await fetchGoogleSheetControls({
      spreadsheetId:
        configuration.spreadsheetId,
      sheetName:
        configuration.sheetName,
      frameworkId: framework.id,
      existingControls,

      headerRow:
        configuration.headerRow,

      columnMapping:
        configuration.columnMapping,
      defaultCategory:
        configuration.defaultCategory,
    });

  return Array.isArray(sheetControls)
    ? cloneData(sheetControls)
    : cloneData(existingControls);
}

// --------------------------------------------------
// Read operations
// --------------------------------------------------

export async function getCustomFrameworks() {
  const frameworks =
    await loadFrameworks();

  return cloneData(frameworks);
}

export async function getCustomFrameworkById(
  id
) {
  const frameworks =
    await loadFrameworks();

  const frameworkIndex =
    findFrameworkIndexById(
      frameworks,
      id
    );

  if (frameworkIndex === -1) {
    return null;
  }

  return cloneData(
    frameworks[frameworkIndex]
  );
}

// --------------------------------------------------
// Create operation
// --------------------------------------------------

export async function createCustomFramework(
  frameworkInput
) {
  if (
    !frameworkInput ||
    typeof frameworkInput !== "object" ||
    Array.isArray(frameworkInput)
  ) {
    throw new Error(
      "Framework data is required."
    );
  }

  const createdFramework =
    createFramework(frameworkInput);

  const inputGoogleSheet =
    frameworkInput.googleSheet ?? {};

  const newFramework =
    applyGoogleSheetMetadata(
      {
        ...createdFramework,

        source:
          frameworkInput.source ??
          createdFramework.source ??
          FRAMEWORK_SOURCE_LOCAL,

        integrationType:
          frameworkInput.integrationType ??
          createdFramework.integrationType ??
          INTEGRATION_TYPE_NONE,

        googleSheet: {
          ...inputGoogleSheet,
        },

        controls: getSafeControls(
          createdFramework.controls
        ),
      },
      inputGoogleSheet
    );

  validateFrameworkInput(
    newFramework
  );

  const frameworks =
    await loadFrameworks();

  validateFrameworkUniqueness(
    frameworks,
    newFramework
  );

  const updatedFrameworks = [
    ...frameworks,
    newFramework,
  ];

  await persistFrameworks(
    updatedFrameworks
  );

  return cloneData(newFramework);
}

// --------------------------------------------------
// Update operation
// --------------------------------------------------

export async function updateCustomFramework(
  id,
  frameworkInput
) {
  if (
    !frameworkInput ||
    typeof frameworkInput !== "object" ||
    Array.isArray(frameworkInput)
  ) {
    throw new Error(
      "Framework data is required."
    );
  }

  const frameworks =
    await loadFrameworks();

  const frameworkIndex =
    findFrameworkIndexById(
      frameworks,
      id
    );

  if (frameworkIndex === -1) {
    throw new Error(
      "Custom framework not found."
    );
  }

  const existingFramework =
    frameworks[frameworkIndex];

  const factoryUpdatedFramework =
    updateFramework(
      existingFramework,
      frameworkInput
    );

  const incomingGoogleSheet =
    frameworkInput.googleSheet ?? {};

  const existingGoogleSheet =
    getGoogleSheetConfiguration(
      existingFramework
    );

  const mergedGoogleSheet = {
    ...existingGoogleSheet,
    ...incomingGoogleSheet,

    columnMapping: {
      ...cloneData(
        existingGoogleSheet.columnMapping
      ),

      ...(
        incomingGoogleSheet.columnMapping &&
        typeof incomingGoogleSheet.columnMapping ===
          "object" &&
        !Array.isArray(
          incomingGoogleSheet.columnMapping
        )
          ? cloneData(
              incomingGoogleSheet.columnMapping
            )
          : {}
      ),
    },
  };

  const updatedFramework =
    applyGoogleSheetMetadata(
      {
        ...existingFramework,
        ...factoryUpdatedFramework,

        id: existingFramework.id,

        source:
          frameworkInput.source ??
          factoryUpdatedFramework.source ??
          existingFramework.source ??
          FRAMEWORK_SOURCE_LOCAL,

        integrationType:
          frameworkInput.integrationType ??
          factoryUpdatedFramework.integrationType ??
          existingFramework.integrationType ??
          INTEGRATION_TYPE_NONE,

        googleSheet:
          mergedGoogleSheet,

        controls: getSafeControls(
          factoryUpdatedFramework.controls
        ),
      },
      mergedGoogleSheet
    );

  validateFrameworkInput(
    updatedFramework
  );

  validateFrameworkUniqueness(
    frameworks,
    updatedFramework,
    existingFramework.id
  );

  const updatedFrameworks = [
    ...frameworks,
  ];

  updatedFrameworks[
    frameworkIndex
  ] = updatedFramework;

  await persistFrameworks(
    updatedFrameworks
  );

  return cloneData(
    updatedFramework
  );
}

// --------------------------------------------------
// Google Sheets refresh operation
// --------------------------------------------------

export async function refreshCustomFrameworkFromGoogleSheet(
  id,
  googleSheetOverrides = null
) {
  const frameworks =
    await loadFrameworks();

  const frameworkIndex =
    findFrameworkIndexById(
      frameworks,
      id
    );

  if (frameworkIndex === -1) {
    throw new Error(
      "Custom framework not found."
    );
  }

  const existingFramework =
    frameworks[frameworkIndex];

  const hasGoogleSheetOverrides =
    googleSheetOverrides &&
    typeof googleSheetOverrides ===
      "object" &&
    !Array.isArray(
      googleSheetOverrides
    );

  /*
   * The Edit page may pass its current Google Sheets
   * configuration directly. This prevents refresh from
   * falling back to an older saved column mapping.
   */
  const frameworkForRefresh =
    hasGoogleSheetOverrides
      ? applyGoogleSheetMetadata(
          existingFramework,
          googleSheetOverrides
        )
      : existingFramework;

  /*
   * Capture the complete configuration once so the
   * same spreadsheet, worksheet, default category and
   * column mappings are preserved throughout the
   * refresh operation.
   */
  const refreshConfiguration =
    getGoogleSheetConfiguration(
      frameworkForRefresh
    );

  if (
    !isGoogleSheetsFramework(
      frameworkForRefresh
    )
  ) {
    throw createGoogleSheetsServiceError(
      "This custom framework is not connected to Google Sheets.",
      {
        code: "GOOGLE_SHEETS_NOT_CONNECTED",
        operation: "refresh framework",
        context: {
          frameworkId:
            existingFramework.id,
        },
      }
    );
  }

  if (
    !hasValidGoogleSheetsConfiguration(
      frameworkForRefresh
    )
  ) {
    throw createGoogleSheetsServiceError(
      "Google Sheets configuration is incomplete.",
      {
        code:
          "GOOGLE_SHEETS_CONFIGURATION_INCOMPLETE",
        operation: "refresh framework",
        context: {
          frameworkId:
            existingFramework.id,
        },
      }
    );
  }

  try {
    const refreshedControls =
      await fetchFrameworkControlsFromGoogleSheet(
        frameworkForRefresh
      );

    /*
     * Existing controls are passed into the mapper so
     * dashboard-managed owner, evidence, comments, and
     * status values remain unchanged while Google Sheets
     * refreshes requirement number, category, and question.
     */
    const normalizedRefreshedFramework =
      updateFramework(
        frameworkForRefresh,
        {
          controls: refreshedControls,

          /*
           * Google Sheets refreshes must preserve the
           * dashboard-managed owner, status, evidence,
           * comments and other operational values.
           */
          preserveDashboardManagedFields:
            true,
        }
      );

    const syncedAt =
      new Date().toISOString();

    const refreshedFramework =
      applyGoogleSheetMetadata(
        normalizedRefreshedFramework,
        {
          spreadsheetId:
            refreshConfiguration.spreadsheetId,

          spreadsheetUrl:
            refreshConfiguration.spreadsheetUrl,

          sheetName:
            refreshConfiguration.sheetName,

          headerRow:
            refreshConfiguration.headerRow,

          defaultCategory:
            refreshConfiguration.defaultCategory,

          columnMapping:
            cloneData(
              refreshConfiguration.columnMapping
            ),

          lastSyncedAt:
            syncedAt,

          syncStatus:
            GOOGLE_SHEET_SYNC_STATUS_SYNCED,

          syncError: "",
        }
      );

    validateFrameworkInput(
      refreshedFramework
    );

    validateFrameworkUniqueness(
      frameworks,
      refreshedFramework,
      existingFramework.id
    );

    const updatedFrameworks = [
      ...frameworks,
    ];

    updatedFrameworks[
      frameworkIndex
    ] = refreshedFramework;

    await persistFrameworks(
      updatedFrameworks
    );

    return cloneData(
      refreshedFramework
    );
  } catch (error) {
    const failedFramework =
      applyGoogleSheetMetadata(
        frameworkForRefresh,
        {
          spreadsheetId:
            refreshConfiguration.spreadsheetId,

          spreadsheetUrl:
            refreshConfiguration.spreadsheetUrl,

          sheetName:
            refreshConfiguration.sheetName,

          headerRow:
            refreshConfiguration.headerRow,

          defaultCategory:
            refreshConfiguration.defaultCategory,

          columnMapping:
            cloneData(
              refreshConfiguration.columnMapping
            ),

          syncStatus:
            GOOGLE_SHEET_SYNC_STATUS_ERROR,

          syncError:
            error instanceof Error
              ? error.message
              : "Google Sheets refresh failed.",
        }
      );

    const updatedFrameworks = [
      ...frameworks,
    ];

    updatedFrameworks[
      frameworkIndex
    ] = failedFramework;

    await persistFrameworks(
      updatedFrameworks
    );

    if (
      error?.name ===
      "GoogleSheetsServiceError"
    ) {
      throw error;
    }

    const message =
      error instanceof Error
        ? error.message
        : "Google Sheets refresh failed.";

    throw createGoogleSheetsServiceError(
      `Unable to refresh Google Sheets: ${message}`,
      {
        code:
          "GOOGLE_SHEETS_REFRESH_FAILED",
        operation: "refresh framework",
        context: {
          frameworkId:
            existingFramework.id,
        },
        cause: error,
      }
    );
  }
}

// --------------------------------------------------
// Delete operation
// --------------------------------------------------

export async function deleteCustomFramework(
  id
) {
  const frameworks =
    await loadFrameworks();

  const frameworkIndex =
    findFrameworkIndexById(
      frameworks,
      id
    );

  if (frameworkIndex === -1) {
    throw new Error(
      "Custom framework not found."
    );
  }

  const updatedFrameworks =
    frameworks.filter(
      (_, index) =>
        index !== frameworkIndex
    );

  await persistFrameworks(
    updatedFrameworks
  );

  return true;
}