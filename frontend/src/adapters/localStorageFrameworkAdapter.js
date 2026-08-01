const STORAGE_KEY =
  "customComplianceFrameworks";

// --------------------------------------------------
// General helpers
// --------------------------------------------------

function isObjectRecord(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value)
  );
}

function cloneData(data) {
  if (
    typeof structuredClone ===
    "function"
  ) {
    return structuredClone(data);
  }

  if (data === undefined) {
    return undefined;
  }

  return JSON.parse(
    JSON.stringify(data)
  );
}

function getStorage() {
  if (
    typeof window === "undefined" ||
    !window.localStorage
  ) {
    throw new Error(
      "Browser local storage is unavailable."
    );
  }

  return window.localStorage;
}

function getSafeFrameworkArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    isObjectRecord
  );
}

function createStorageError(
  message,
  cause
) {
  const error =
    new Error(message);

  if (cause !== undefined) {
    error.cause = cause;
  }

  return error;
}

// --------------------------------------------------
// Storage data parsing
// --------------------------------------------------

function parseStoredFrameworks(
  storedValue
) {
  if (!storedValue) {
    return [];
  }

  let parsedValue;

  try {
    parsedValue =
      JSON.parse(storedValue);
  } catch {
    /*
     * Corrupted JSON is treated as unavailable data
     * so it cannot crash the application.
     */
    return [];
  }

  return getSafeFrameworkArray(
    parsedValue
  );
}

// --------------------------------------------------
// Read operation
// --------------------------------------------------

/**
 * Reads all custom frameworks from browser storage.
 *
 * The adapter returns cloned data so callers cannot
 * accidentally mutate the stored representation.
 */
export async function getAll() {
  let storage;

  try {
    storage = getStorage();
  } catch {
    /*
     * The dashboard may be rendered in a non-browser
     * environment during development or testing.
     */
    return [];
  }

  try {
    const storedValue =
      storage.getItem(
        STORAGE_KEY
      );

    const frameworks =
      parseStoredFrameworks(
        storedValue
      );

    return cloneData(
      frameworks
    );
  } catch {
    /*
     * Storage access may be blocked by browser privacy
     * settings. Returning an empty collection prevents
     * the dashboard from crashing during a read.
     */
    return [];
  }
}

// --------------------------------------------------
// Save operation
// --------------------------------------------------

/**
 * Replaces all stored custom frameworks.
 *
 * Invalid entries are rejected rather than silently
 * removed because silently dropping them could result
 * in accidental data loss.
 */
export async function saveAll(
  frameworks
) {
  if (!Array.isArray(frameworks)) {
    throw new TypeError(
      "Framework storage data must be an array."
    );
  }

  const safeFrameworks =
    getSafeFrameworkArray(
      frameworks
    );

  if (
    safeFrameworks.length !==
    frameworks.length
  ) {
    throw new TypeError(
      "One or more frameworks contain invalid storage data."
    );
  }

  try {
    const storage =
      getStorage();

    const serializedFrameworks =
      JSON.stringify(
        cloneData(
          safeFrameworks
        )
      );

    storage.setItem(
      STORAGE_KEY,
      serializedFrameworks
    );

    return cloneData(
      safeFrameworks
    );
  } catch (error) {
    throw createStorageError(
      "Unable to save custom framework data.",
      error
    );
  }
}

// --------------------------------------------------
// Clear operation
// --------------------------------------------------

/**
 * Removes all custom framework data from browser
 * storage.
 */
export async function clearAll() {
  try {
    const storage =
      getStorage();

    storage.removeItem(
      STORAGE_KEY
    );

    return true;
  } catch (error) {
    throw createStorageError(
      "Unable to clear custom framework data.",
      error
    );
  }
}

// --------------------------------------------------
// Storage information
// --------------------------------------------------

/**
 * Exposes the storage key for diagnostics and tests
 * without allowing it to be modified.
 */
export function getStorageKey() {
  return STORAGE_KEY;
}