import {
  frameworks as fallbackFrameworks,
  controls as fallbackControls,
} from "../data/complianceData";

import {
  fetchSecureframeControls,
  fetchSecureframeFrameworks,
  hasSecureframeConfiguration,
} from "./secureframeService";

const DEFAULT_DELAY = 250;

// --------------------------------------------------
// Configuration
// --------------------------------------------------

function isSecureframeEnabled() {
  return (
    String(
      import.meta.env
        .VITE_ENABLE_SECUREFRAME ??
        ""
    )
      .trim()
      .toLowerCase() === "true"
  );
}

function canUseSecureframe() {
  return (
    isSecureframeEnabled() &&
    hasSecureframeConfiguration()
  );
}

// --------------------------------------------------
// General helpers
// --------------------------------------------------

function delay(
  milliseconds = DEFAULT_DELAY
) {
  return new Promise((resolve) => {
    window.setTimeout(
      resolve,
      milliseconds
    );
  });
}

function cloneData(data) {
  if (
    typeof structuredClone ===
    "function"
  ) {
    return structuredClone(data);
  }

  return JSON.parse(
    JSON.stringify(data)
  );
}

function normalizeId(id) {
  return String(id ?? "").trim();
}

async function getFallbackFrameworks() {
  await delay();

  return cloneData(
    fallbackFrameworks
  );
}

// --------------------------------------------------
// Framework loading
// --------------------------------------------------

export async function getFrameworks() {
  if (!canUseSecureframe()) {
    return getFallbackFrameworks();
  }

  try {
    const frameworks =
      await fetchSecureframeFrameworks();

    return frameworks.length > 0
      ? frameworks
      : getFallbackFrameworks();
  } catch (error) {
    console.warn(
      "Secureframe data could not be loaded. Fallback data is being used.",
      error
    );

    return getFallbackFrameworks();
  }
}

export async function getFrameworkById(
  id
) {
  const normalizedId =
    normalizeId(id);

  const frameworks =
    await getFrameworks();

  const framework =
    frameworks.find(
      (item) =>
        normalizeId(item.id) ===
        normalizedId
    );

  if (!framework) {
    return null;
  }

  if (
    framework.source ===
      "secureframe" &&
    canUseSecureframe() &&
    (
      !Array.isArray(
        framework.controls
      ) ||
      framework.controls.length === 0
    )
  ) {
    try {
      const controls =
        await fetchSecureframeControls({
          frameworkId:
            framework.id,
        });

      return cloneData({
        ...framework,
        controls,
      });
    } catch (error) {
      console.warn(
        "Secureframe controls could not be loaded. Existing framework data is being used.",
        error
      );
    }
  }

  const controls =
    Array.isArray(
      framework.controls
    )
      ? framework.controls
      : fallbackControls.filter(
          (control) =>
            normalizeId(
              control.frameworkId
            ) === normalizedId
        );

  return cloneData({
    ...framework,
    controls,
  });
}

// --------------------------------------------------
// Refresh
// --------------------------------------------------

export async function refreshComplianceData() {
  const frameworks =
    await getFrameworks();

  return {
    frameworks:
      cloneData(frameworks),

    refreshedAt:
      new Date().toISOString(),

    source:
      canUseSecureframe()
        ? "secureframe"
        : "fallback",
  };
}