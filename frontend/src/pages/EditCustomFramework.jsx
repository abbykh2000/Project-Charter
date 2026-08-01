import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  CONTROL_STATUSES,
  DEFAULT_CONTROL_STATUS,
  DEFAULT_FRAMEWORK_STATUS,
  DEFAULT_REVIEW_FREQUENCY,
  FRAMEWORK_STATUSES,
  FRAMEWORK_SOURCE_GOOGLE_SHEETS,
  INTEGRATION_TYPE_GOOGLE_SHEETS,
  INTEGRATION_TYPE_NONE,
  LOCAL_SOURCE,
  REVIEW_FREQUENCIES,
} from "../constants/frameworkConstants";

import {
  getCustomFrameworkById,
  refreshCustomFrameworkFromGoogleSheet,
  updateCustomFramework,
} from "../services/customFrameworkService";

import {
  getFrameworkValidationError,
} from "../utils/frameworkValidation";

import { useUser } from "../context/useUser";

const GOOGLE_SHEETS_SOURCE = FRAMEWORK_SOURCE_GOOGLE_SHEETS;

function createEmptyControl() {
  return {
    id: "",
    requirementNumber: "",
    category: "",
    question: "",
    owner: "",
    status: DEFAULT_CONTROL_STATUS,
    evidenceUrl: "",
    comments: "",
    description: "",

    // Temporary backward-compatible aliases.
    control: "",
    notes: "",
  };
}

function normalizeText(value) {
  return String(value ?? "").trim();
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

function normalizeControlForEditing(
  control
) {
  const question =
    control?.question ??
    control?.control ??
    "";

  const comments =
    control?.comments ??
    control?.notes ??
    "";

  return {
    ...createEmptyControl(),
    ...control,

    requirementNumber:
      control?.requirementNumber ??
      control?.reqNo ??
      control?.requirementNo ??
      "",

    category:
      control?.category ?? "",

    question,
    comments,

    // Keep aliases until remaining pages migrate.
    control:
      control?.control ?? question,

    notes:
      control?.notes ?? comments,
  };
}

function getGoogleSheetConfiguration(
  framework
) {
  const googleSheet =
    framework?.googleSheet ?? {};

  const legacyGoogleWorkspace =
    framework?.googleWorkspace ?? {};

  const legacyGoogleIntegration =
    framework?.googleIntegration ?? {};

  const columnMapping =
    googleSheet?.columnMapping ?? {};

  return {
    spreadsheetId: normalizeText(
      googleSheet?.spreadsheetId ??
        framework?.spreadsheetId ??
        legacyGoogleWorkspace?.spreadsheetId ??
        legacyGoogleIntegration?.spreadsheetId
    ),

    spreadsheetUrl: normalizeText(
      googleSheet?.spreadsheetUrl ??
        framework?.spreadsheetUrl ??
        legacyGoogleWorkspace?.spreadsheetUrl ??
        legacyGoogleIntegration?.spreadsheetUrl
    ),

    sheetName: normalizeText(
      googleSheet?.sheetName ??
        framework?.sheetName ??
        legacyGoogleWorkspace?.sheetName ??
        legacyGoogleIntegration?.sheetName
    ),

    headerRow:
      normalizeHeaderRow(
        googleSheet?.headerRow ??
          framework?.headerRow ??
          legacyGoogleWorkspace?.headerRow ??
          legacyGoogleIntegration?.headerRow ??
          1
      ),

    defaultCategory: normalizeText(
      googleSheet?.defaultCategory ??
        framework?.defaultCategory ??
        "General"
    ),

    columnMapping: {
      requirementNumber: normalizeText(
        columnMapping?.requirementNumber ??
          "REQ.No"
      ),
      category: normalizeText(
        columnMapping?.category ??
          "Category"
      ),
      question: normalizeText(
        columnMapping?.question ??
          "Question"
      ),
    },

    lastSyncedAt:
      googleSheet?.lastSyncedAt ??
      framework?.lastSyncedAt ??
      legacyGoogleWorkspace?.lastSyncedAt ??
      legacyGoogleIntegration?.lastSyncedAt ??
      null,

    syncStatus: normalizeText(
      googleSheet?.syncStatus ??
        framework?.syncStatus ??
        legacyGoogleWorkspace?.syncStatus ??
        legacyGoogleIntegration?.syncStatus
    ),
  };
}

function getFrameworkIntegrationType(
  framework
) {
  const sourceType =
    normalizeLowercase(
      framework?.sourceType ??
        framework?.source
    );

  const integrationType =
    normalizeLowercase(
      framework?.integrationType
    );

  if (
    sourceType === "google-sheets" ||
    integrationType ===
      "google-sheets" ||
    integrationType ===
      GOOGLE_SHEETS_SOURCE
  ) {
    return INTEGRATION_TYPE_GOOGLE_SHEETS;
  }

  return INTEGRATION_TYPE_NONE;
}

function isValidHttpsUrl(value) {
  const normalizedValue =
    normalizeText(value);

  if (!normalizedValue) {
    return true;
  }

  try {
    const url = new URL(normalizedValue);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function getDuplicateValue(
  controls,
  getValue
) {
  const seenValues = new Set();

  for (const control of controls) {
    const value =
      normalizeLowercase(
        getValue(control)
      );

    if (!value) {
      continue;
    }

    if (seenValues.has(value)) {
      return normalizeText(
        getValue(control)
      );
    }

    seenValues.add(value);
  }

  return "";
}

function getAdditionalValidationError({
  controls,
  integrationType,
  googleSheet,
}) {
  const safeControls =
    Array.isArray(controls)
      ? controls
      : [];

  const duplicateRequirementNumber =
    getDuplicateValue(
      safeControls,
      (control) =>
        control?.requirementNumber
    );

  if (duplicateRequirementNumber) {
    return (
      "Each control must have a unique " +
      `REQ.No. Duplicate value: ${duplicateRequirementNumber}.`
    );
  }

  const invalidEvidenceControl =
    safeControls.find((control) => {
      const evidenceUrl =
        control?.evidenceUrl;

      return (
        normalizeText(evidenceUrl) &&
        !isValidHttpsUrl(
          evidenceUrl
        )
      );
    });

  if (invalidEvidenceControl) {
    const controlName =
      normalizeText(
        invalidEvidenceControl
          .requirementNumber
      ) ||
      normalizeText(
        invalidEvidenceControl
          .question ??
          invalidEvidenceControl.control
      ) ||
      "one of the controls";

    return (
      `The evidence link for ${controlName} ` +
      "must be a valid HTTPS URL."
    );
  }

  if (
    integrationType ===
    INTEGRATION_TYPE_GOOGLE_SHEETS
  ) {
    if (
      !normalizeText(
        googleSheet
          ?.spreadsheetId
      )
    ) {
      return (
        "A Google Sheets spreadsheet ID " +
        "is required when Google Sheets integration is enabled."
      );
    }

    if (
      !normalizeText(
        googleSheet?.sheetName
      )
    ) {
      return (
        "A Google Sheets worksheet name " +
        "is required when Google Sheets integration is enabled."
      );
    }

    const headerRow =
      Number.parseInt(
        String(
          googleSheet?.headerRow ??
            ""
        ),
        10
      );

    if (
      !Number.isInteger(
        headerRow
      ) ||
      headerRow < 1
    ) {
      return (
        "Header Row must be a whole number greater than or equal to 1."
      );
    }

    if (
      normalizeText(
        googleSheet
          ?.spreadsheetUrl
      ) &&
      !isValidHttpsUrl(
        googleSheet
          .spreadsheetUrl
      )
    ) {
      return (
        "The spreadsheet URL must be a " +
        "valid HTTPS URL."
      );
    }

  }

  return "";
}

function formatSyncDate(value) {
  if (!value) {
    return "Not synchronized yet";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Unknown";
  }

  return date.toLocaleString();
}

function EditCustomFramework() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { users, isComplianceManager } = useUser();

  const [formData, setFormData] =
    useState({
      name: "",
      description: "",
      department: "",
      owner: "",

      reviewFrequency:
        DEFAULT_REVIEW_FREQUENCY,

      frameworkStatus:
        DEFAULT_FRAMEWORK_STATUS,
    });

  const [
    integrationType,
    setIntegrationType,
  ] = useState(
    INTEGRATION_TYPE_NONE
  );

  const [
    googleSheet,
    setGoogleSheet,
  ] = useState({
    spreadsheetId: "",
    spreadsheetUrl: "",
    sheetName: "",
    headerRow: 1,
    defaultCategory: "General",
    columnMapping: {
      requirementNumber: "REQ.No",
      category: "Category",
      question: "Question",
    },
    lastSyncedAt: null,
    syncStatus: "",
  });

  const [controls, setControls] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [isDirty, setIsDirty] =
    useState(false);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const isGoogleSheetFramework =
    integrationType ===
    INTEGRATION_TYPE_GOOGLE_SHEETS;

  useEffect(() => {
    let cancelled = false;

    async function loadFramework() {
      try {
        setLoading(true);
        setError("");
        setSuccessMessage("");

        const framework =
          await getCustomFrameworkById(id);

        if (!framework) {
          throw new Error(
            "Custom framework not found."
          );
        }

        if (cancelled) {
          return;
        }

        const loadedIntegrationType =
          getFrameworkIntegrationType(
            framework
          );

        const loadedGoogleSheet =
          getGoogleSheetConfiguration(
            framework
          );

        setIntegrationType(
          loadedIntegrationType
        );

        setGoogleSheet(
          loadedGoogleSheet
        );

        setFormData({
          name: framework.name || "",

          description:
            framework.description || "",

          department:
            framework.department || "",

          owner:
            framework.owner || "",

          reviewFrequency:
            framework.reviewFrequency ||
            DEFAULT_REVIEW_FREQUENCY,

          frameworkStatus:
            framework.frameworkStatus ||
            DEFAULT_FRAMEWORK_STATUS,
        });

        const normalizedControls =
          Array.isArray(
            framework.controls
          )
            ? framework.controls.map(
                normalizeControlForEditing
              )
            : [];

        setControls(
          normalizedControls.length > 0
            ? normalizedControls
            : [createEmptyControl()]
        );

        setIsDirty(false);
      } catch (loadError) {
        console.error(
          "Failed to load framework:",
          loadError
        );

        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load the custom framework."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadFramework();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    function handleBeforeUnload(
      event
    ) {
      if (!isDirty || saving) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );
    };
  }, [isDirty, saving]);

  function markFormChanged() {
    setIsDirty(true);
    setError("");
    setSuccessMessage("");
  }

  function handleFrameworkChange(
    event
  ) {
    const { name, value } =
      event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    markFormChanged();
  }

  function handleIntegrationChange(
    event
  ) {
    setIntegrationType(
      event.target.value
    );

    markFormChanged();
  }

  function handleGoogleSheetChange(
    event
  ) {
    const { name, value } =
      event.target;

    setGoogleSheet((current) => {
      if (name.startsWith("columnMapping.")) {
        const mappingField =
          name.split(".")[1];

        return {
          ...current,
          columnMapping: {
            ...current.columnMapping,
            [mappingField]: value,
          },
        };
      }

      return {
        ...current,
        [name]: value,
      };
    });

    markFormChanged();
  }

  function handleControlChange(
    index,
    event
  ) {
    const { name, value } =
      event.target;

    setControls((current) =>
      current.map(
        (control, controlIndex) => {
          if (
            controlIndex !== index
          ) {
            return control;
          }

          const updatedControl = {
            ...control,
            [name]: value,
          };

          if (name === "question") {
            updatedControl.control =
              value;
          }

          if (name === "comments") {
            updatedControl.notes =
              value;
          }

          return updatedControl;
        }
      )
    );

    markFormChanged();
  }

  function navigateSafely(path) {
    if (
      isDirty &&
      !window.confirm(
        "You have unsaved changes. Leave this page without saving?"
      )
    ) {
      return;
    }

    navigate(path);
  }

  async function handleRefreshFromGoogleSheets() {
    if (
      refreshing ||
      saving
    ) {
      return;
    }

    if (!isComplianceManager) {
      setError(
        "Only a Compliance Manager can refresh Google Sheets controls."
      );

      return;
    }

    if (
      !isGoogleSheetFramework
    ) {
      setError(
        "Enable Google Sheets integration before refreshing from Google Sheets."
      );

      return;
    }

    const configurationError =
      getAdditionalValidationError({
        controls: [],
        integrationType,
        googleSheet,
      });

    if (configurationError) {
      setError(
        configurationError
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    if (isDirty) {
      const shouldContinue =
        window.confirm(
          "Refresh will use and save the current Google Sheets configuration, then replace control definitions with the latest worksheet data. Unsaved Owner, Status, Evidence, Comments, or Description changes may be lost. Continue?"
        );

      if (!shouldContinue) {
        return;
      }
    }

    try {
      setRefreshing(true);
      setError("");
      setSuccessMessage("");

      /*
       * Pass the current Google Sheets configuration
       * directly to the refresh service. This prevents
       * the service from using an older saved mapping,
       * such as the default Question column.
       */
      const refreshedFramework =
        await refreshCustomFrameworkFromGoogleSheet(
          id,
          googleSheet
        );

      if (!refreshedFramework) {
        throw new Error(
          "The custom framework could not be refreshed."
        );
      }

      const refreshedControls =
        Array.isArray(
          refreshedFramework.controls
        )
          ? refreshedFramework.controls.map(
              normalizeControlForEditing
            )
          : [];

      setControls(
        refreshedControls.length > 0
          ? refreshedControls
          : [createEmptyControl()]
      );

      setGoogleSheet(
        getGoogleSheetConfiguration(
          refreshedFramework
        )
      );

      /*
       * Keep current framework-level edits visible.
       * Refresh owns the Google Sheets configuration
       * and imported controls only.
       */
      setFormData((current) => ({
        ...current,

        name:
          refreshedFramework.name ||
          current.name,

        description:
          refreshedFramework.description ??
          current.description,

        department:
          refreshedFramework.department ??
          current.department,

        owner:
          refreshedFramework.owner ??
          current.owner,

        reviewFrequency:
          refreshedFramework.reviewFrequency ||
          current.reviewFrequency ||
          DEFAULT_REVIEW_FREQUENCY,

        frameworkStatus:
          refreshedFramework.frameworkStatus ||
          current.frameworkStatus ||
          DEFAULT_FRAMEWORK_STATUS,
      }));

      setIsDirty(false);

      setSuccessMessage(
        "The framework controls and Google Sheets configuration were refreshed successfully."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (refreshError) {
      console.error(
        "Failed to refresh framework:",
        refreshError
      );

      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Unable to refresh the framework from Google Sheets."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isComplianceManager) {
      setError(
        "Only a Compliance Manager can edit custom frameworks."
      );
      return;
    }

    if (
      saving ||
      refreshing
    ) {
      return;
    }

    const frameworkValidationError =
      getFrameworkValidationError({
        ...formData,
        controls,
      });

    if (frameworkValidationError) {
      setError(
        frameworkValidationError
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    const additionalValidationError =
      getAdditionalValidationError({
        controls,
        integrationType,
        googleSheet,
      });

    if (additionalValidationError) {
      setError(
        additionalValidationError
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const updatedFramework =
        await updateCustomFramework(
          id,
          {
            ...formData,

            sourceType:
              integrationType ===
              INTEGRATION_TYPE_GOOGLE_SHEETS
                ? FRAMEWORK_SOURCE_GOOGLE_SHEETS
                : LOCAL_SOURCE,

            integrationType,

            googleSheet:
              integrationType ===
              INTEGRATION_TYPE_GOOGLE_SHEETS
                ? {
                    ...googleSheet,
                  }
                : {
                    ...googleSheet,
                    syncStatus: "",
                  },
            controls,
          }
        );

      setIsDirty(false);

      navigate(
        `/custom-frameworks/${updatedFramework.id}`
      );
    } catch (saveError) {
      console.error(
        "Failed to update framework:",
        saveError
      );

      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save the framework changes."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <StateCard
          title="Loading framework"
          message="Please wait while the framework information is loaded."
        />
      </PageLayout>
    );
  }

  if (error && !formData.name) {
    return (
      <PageLayout>
        <StateCard
          title="Unable to load framework"
          message={error}
          actionLabel="Back to Custom Frameworks"
          onAction={() =>
            navigate(
              "/custom-frameworks"
            )
          }
        />
      </PageLayout>
    );
  }

  const actionsDisabled =
    saving || refreshing;

  return (
    <PageLayout>
      <form
        onSubmit={handleSubmit}
        style={formStyle}
      >
        <button
          type="button"
          onClick={() =>
            navigateSafely(
              `/custom-frameworks/${id}`
            )
          }
          style={{
            ...backButtonStyle,

            cursor: actionsDisabled
              ? "not-allowed"
              : "pointer",

            opacity:
              actionsDisabled
                ? 0.6
                : 1,
          }}
          disabled={actionsDisabled}
        >
          <span aria-hidden="true">
            ←
          </span>

          Back to Framework
        </button>

        <header style={pageHeaderStyle}>
          <div>
            <span style={eyebrowStyle}>
              Admin Management
            </span>

            <h1 style={pageTitleStyle}>
              Edit Custom Framework
            </h1>

            <p style={pageDescriptionStyle}>
              Update framework details,
              manage controls, configure
              Google Sheets synchronization,
              and maintain supporting evidence.
            </p>
          </div>

          <div style={headerActionsStyle}>
            {isGoogleSheetFramework && (
              <button
                type="button"
                onClick={
                  handleRefreshFromGoogleSheets
                }
                style={{
                  ...integrationButtonStyle,

                  cursor: actionsDisabled
                    ? "not-allowed"
                    : "pointer",

                  opacity:
                    actionsDisabled
                      ? 0.7
                      : 1,
                }}
                disabled={actionsDisabled}
              >
                {refreshing
                  ? "Refreshing..."
                  : "Refresh from Google Sheets"}
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                navigateSafely(
                  `/custom-frameworks/${id}`
                )
              }
              style={{
                ...secondaryButtonStyle,

                cursor: actionsDisabled
                  ? "not-allowed"
                  : "pointer",

                opacity:
                  actionsDisabled
                    ? 0.7
                    : 1,
              }}
              disabled={actionsDisabled}
            >
              Cancel
            </button>

            <button
              type="submit"
              style={{
                ...primaryButtonStyle,

                opacity:
                  actionsDisabled
                    ? 0.7
                    : 1,

                cursor: actionsDisabled
                  ? "not-allowed"
                  : "pointer",
              }}
              disabled={actionsDisabled}
            >
              {saving
                ? "Saving Changes..."
                : "Save Changes"}
            </button>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            style={errorAlertStyle}
          >
            <div style={errorIconStyle}>
              !
            </div>

            <div>
              <strong
                style={errorTitleStyle}
              >
                Unable to complete the request
              </strong>

              <p style={errorMessageStyle}>
                {error}
              </p>
            </div>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            style={successAlertStyle}
          >
            <div style={successIconStyle}>
              ✓
            </div>

            <div>
              <strong
                style={successTitleStyle}
              >
                Synchronization complete
              </strong>

              <p
                style={
                  successMessageStyle
                }
              >
                {successMessage}
              </p>
            </div>
          </div>
        )}

        <section style={sectionCardStyle}>
          <SectionHeader
            eyebrow="Framework Details"
            title="Framework Information"
            description="Manage the framework's identity, ownership, review cycle, and current lifecycle status."
          />

          <div style={formGridStyle}>
            <FormField
              label="Framework Name"
              required
            >
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={
                  handleFrameworkChange
                }
                style={inputStyle}
                placeholder="Enter framework name"
                disabled={actionsDisabled}
                autoComplete="off"
              />
            </FormField>

            <FormField label="Department">
              <input
                type="text"
                name="department"
                value={
                  formData.department
                }
                onChange={
                  handleFrameworkChange
                }
                style={inputStyle}
                placeholder="For example, Information Security"
                disabled={actionsDisabled}
                autoComplete="organization"
              />
            </FormField>

            <FormField label="Compliance Manager">
              <select
                name="owner"
                value={formData.owner}
                onChange={handleFrameworkChange}
                style={selectStyle}
                disabled={actionsDisabled}
              >
                <option value="">Select a manager</option>
                {formData.owner &&
                  !users.some(
                    (user) => user.name === formData.owner
                  ) && (
                    <option value={formData.owner}>
                      {formData.owner} — existing assignment
                    </option>
                  )}
                {users
                  .filter(
                    (user) =>
                      user.role === "compliance-manager"
                  )
                  .map((user) => (
                    <option key={user.id} value={user.name}>
                      {user.name} — {user.email}
                    </option>
                  ))}
              </select>
            </FormField>

            <FormField label="Review Frequency">
              <select
                name="reviewFrequency"
                value={
                  formData.reviewFrequency
                }
                onChange={
                  handleFrameworkChange
                }
                style={selectStyle}
                disabled={actionsDisabled}
              >
                {REVIEW_FREQUENCIES.map(
                  (frequency) => (
                    <option
                      key={frequency}
                      value={frequency}
                    >
                      {frequency}
                    </option>
                  )
                )}
              </select>
            </FormField>

            <FormField label="Framework Status">
              <select
                name="frameworkStatus"
                value={
                  formData.frameworkStatus
                }
                onChange={
                  handleFrameworkChange
                }
                style={selectStyle}
                disabled={actionsDisabled}
              >
                {FRAMEWORK_STATUSES.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  )
                )}
              </select>
            </FormField>

            <div style={descriptionFieldStyle}>
              <FormField label="Description">
                <textarea
                  name="description"
                  value={
                    formData.description
                  }
                  onChange={
                    handleFrameworkChange
                  }
                  style={textareaStyle}
                  placeholder="Describe the purpose and scope of this framework"
                  disabled={actionsDisabled}
                />
              </FormField>
            </div>
          </div>
        </section>

        <section style={sectionCardStyle}>
          <SectionHeader
            eyebrow="Integration"
            title="Google Sheets"
            description="Choose whether this framework remains local or imports control definitions from Google Sheets."
          />

          <div style={formGridStyle}>
            <FormField label="Integration Type">
              <select
                value={integrationType}
                onChange={
                  handleIntegrationChange
                }
                style={selectStyle}
                disabled={actionsDisabled}
              >
                <option
                  value={
                    INTEGRATION_TYPE_NONE
                  }
                >
                  Local Dashboard Framework
                </option>

                <option
                  value={
                    INTEGRATION_TYPE_GOOGLE_SHEETS
                  }
                >
                  Google Sheets Integration
                </option>
              </select>
            </FormField>

            <div
              style={
                integrationStatusCardStyle
              }
            >
              <span
                style={
                  integrationStatusLabelStyle
                }
              >
                Synchronization status
              </span>

              <strong
                style={
                  integrationStatusValueStyle
                }
              >
                {isGoogleSheetFramework
                  ? googleSheet.syncStatus ||
                    "Not synchronized"
                  : "Local framework"}
              </strong>

              <span
                style={
                  integrationStatusDateStyle
                }
              >
                {isGoogleSheetFramework
                  ? `Last synced: ${formatSyncDate(
                      googleSheet.lastSyncedAt
                    )}`
                  : "Controls are stored and managed by the dashboard."}
              </span>
            </div>
          </div>

          {isGoogleSheetFramework && (
            <div
              style={
                googleSheetFieldsStyle
              }
            >
              <FormField
                label="Spreadsheet ID"
                required
              >
                <input
                  type="text"
                  name="spreadsheetId"
                  value={
                    googleSheet
                      .spreadsheetId
                  }
                  onChange={
                    handleGoogleSheetChange
                  }
                  style={inputStyle}
                  placeholder="Enter the Google Sheets spreadsheet ID"
                  disabled={actionsDisabled}
                  autoComplete="off"
                />
              </FormField>

              <FormField
                label="Worksheet Name"
                required
              >
                <input
                  type="text"
                  name="sheetName"
                  value={
                    googleSheet.sheetName
                  }
                  onChange={
                    handleGoogleSheetChange
                  }
                  style={inputStyle}
                  placeholder="For example, Controls"
                  disabled={actionsDisabled}
                  autoComplete="off"
                />
              </FormField>

              <FormField
                label="Header Row"
                required
              >
                <input
                  type="number"
                  name="headerRow"
                  min="1"
                  step="1"
                  value={
                    googleSheet.headerRow
                  }
                  onChange={
                    handleGoogleSheetChange
                  }
                  style={inputStyle}
                  placeholder="1"
                  disabled={actionsDisabled}
                />

                <span style={helperTextStyle}>
                  Enter the worksheet row containing the actual column headings.
                </span>
              </FormField>

              <FormField label="Spreadsheet URL">
                <input
                  type="url"
                  name="spreadsheetUrl"
                  value={
                    googleSheet
                      .spreadsheetUrl
                  }
                  onChange={
                    handleGoogleSheetChange
                  }
                  style={inputStyle}
                  placeholder="https://docs.google.com/spreadsheets/..."
                  disabled={actionsDisabled}
                />
              </FormField>

              <FormField label="Default Category">
                <input
                  type="text"
                  name="defaultCategory"
                  value={
                    googleSheet.defaultCategory
                  }
                  onChange={
                    handleGoogleSheetChange
                  }
                  style={inputStyle}
                  placeholder="General"
                  disabled={actionsDisabled}
                />
              </FormField>

              <FormField label="Requirement Number Column">
                <input
                  type="text"
                  name="columnMapping.requirementNumber"
                  value={
                    googleSheet.columnMapping.requirementNumber
                  }
                  onChange={handleGoogleSheetChange}
                  style={inputStyle}
                  placeholder="REQ.No"
                  disabled={actionsDisabled}
                />
              </FormField>

              <FormField label="Category Column">
                <input
                  type="text"
                  name="columnMapping.category"
                  value={
                    googleSheet.columnMapping.category
                  }
                  onChange={handleGoogleSheetChange}
                  style={inputStyle}
                  placeholder="Category"
                  disabled={actionsDisabled}
                />
              </FormField>

              <FormField label="Question Column">
                <input
                  type="text"
                  name="columnMapping.question"
                  value={
                    googleSheet.columnMapping.question
                  }
                  onChange={handleGoogleSheetChange}
                  style={inputStyle}
                  placeholder="Question"
                  disabled={actionsDisabled}
                />
              </FormField>
            </div>
          )}
        </section>

        <section style={sectionCardStyle}>
          <div style={controlsHeaderRowStyle}>
            <SectionHeader
              eyebrow="Requirements"
              title="Framework Controls"
              description={
                isGoogleSheetFramework
                  ? "Manage controls in the dashboard or explicitly refresh them from Google Sheets. Google Sheets synchronization does not make the framework read-only."
                  : "Add, remove, and update the operational controls maintained by this framework."
              }
              noBorder
            />

            <span style={fixedFieldsNoticeStyle}>
              REQ.No, Category, and Question are fixed.
            </span>
          </div>

          <div style={controlsListStyle}>
            {controls.map(
              (control, index) => (
                <ControlEditor
                  key={
                    control.id ||
                    `control-${index}`
                  }
                  control={control}
                  index={index}
                  disabled={actionsDisabled}
                  users={users}
                  onChange={handleControlChange}
                />
              )
            )}
          </div>
        </section>

        <div style={footerActionsStyle}>
          <button
            type="button"
            onClick={() =>
              navigateSafely(
                `/custom-frameworks/${id}`
              )
            }
            style={{
              ...secondaryButtonStyle,

              cursor: actionsDisabled
                ? "not-allowed"
                : "pointer",

              opacity:
                actionsDisabled
                  ? 0.7
                  : 1,
            }}
            disabled={actionsDisabled}
          >
            Cancel
          </button>

          <button
            type="submit"
            style={{
              ...primaryButtonStyle,

              opacity:
                actionsDisabled
                  ? 0.7
                  : 1,

              cursor: actionsDisabled
                ? "not-allowed"
                : "pointer",
            }}
            disabled={actionsDisabled}
          >
            {saving
              ? "Saving Changes..."
              : "Save Changes"}
          </button>
        </div>
      </form>
    </PageLayout>
  );
}

function ControlEditor({
  control,
  index,
  disabled,
  users,
  onChange,
}) {
  return (
    <article style={controlCardStyle}>
      <div style={controlHeaderStyle}>
        <div style={controlTitleGroupStyle}>
          <div style={controlNumberStyle}>
            {index + 1}
          </div>

          <div style={controlTitleTextStyle}>
            <h3 style={controlTitleStyle}>
              {normalizeText(
                control.question ??
                  control.control
              ) ||
                `Control ${index + 1}`}
            </h3>

            <p style={controlSubtitleStyle}>
              Define the requirement,
              ownership, implementation status,
              evidence, and internal comments.
            </p>
          </div>
        </div>


      </div>

      <div style={controlGridStyle}>
        <FormField label="REQ.No">
          <input
            type="text"
            name="requirementNumber"
            value={
              control.requirementNumber ||
              ""
            }
            style={readOnlyInputStyle}
            placeholder="For example, AC-01"
            readOnly
            aria-readonly="true"
          />
        </FormField>

        <FormField label="Category">
          <input
            type="text"
            name="category"
            value={
              control.category || ""
            }
            style={readOnlyInputStyle}
            placeholder="For example, Access Control"
            readOnly
            aria-readonly="true"
          />
        </FormField>

        <FormField
          label="Question"
          required
        >
          <input
            type="text"
            name="question"
            value={
              control.question ??
              control.control ??
              ""
            }
            style={readOnlyInputStyle}
            placeholder="Enter the control question"
            readOnly
            aria-readonly="true"
          />
        </FormField>

        <FormField label="Owner">
          <select
            name="owner"
            value={control.owner || ""}
            onChange={(event) => onChange(index, event)}
            style={selectStyle}
            disabled={disabled}
          >
            <option value="">Not assigned</option>
            {control.owner &&
              !users.some(
                (user) => user.name === control.owner
              ) && (
                <option value={control.owner}>
                  {control.owner} — existing assignment
                </option>
              )}
            {users
              .filter((user) => user.active)
              .map((user) => (
                <option key={user.id} value={user.name}>
                  {user.name} — {user.department}
                </option>
              ))}
          </select>
        </FormField>

        <FormField label="Status">
          <select
            name="status"
            value={
              control.status ||
              DEFAULT_CONTROL_STATUS
            }
            onChange={(event) =>
              onChange(index, event)
            }
            style={selectStyle}
            disabled={disabled}
          >
            {CONTROL_STATUSES.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              )
            )}
          </select>
        </FormField>
      </div>

      <div style={controlDetailsGridStyle}>
        <FormField label="Description">
          <textarea
            name="description"
            value={
              control.description || ""
            }
            onChange={(event) =>
              onChange(index, event)
            }
            style={compactTextareaStyle}
            placeholder="Describe what this control requires"
            disabled={disabled}
          />
        </FormField>

        <FormField label="Evidence URL">
          <input
            type="url"
            name="evidenceUrl"
            value={
              control.evidenceUrl || ""
            }
            onChange={(event) =>
              onChange(index, event)
            }
            style={inputStyle}
            placeholder="https://example.com/evidence/..."
            disabled={disabled}
          />

          <span style={helperTextStyle}>
            Enter a secure HTTPS link to the supporting evidence.
          </span>
        </FormField>

        <FormField label="Comments">
          <textarea
            name="comments"
            value={
              control.comments ??
              control.notes ??
              ""
            }
            onChange={(event) =>
              onChange(index, event)
            }
            style={compactTextareaStyle}
            placeholder="Add any internal comments"
            disabled={disabled}
          />
        </FormField>
      </div>
    </article>
  );
}

function FormField({
  label,
  required = false,
  children,
}) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>
        {label}

        {required && (
          <span style={requiredStyle}>
            *
          </span>
        )}
      </span>

      {children}
    </label>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  noBorder = false,
}) {
  return (
    <div
      style={{
        ...sectionHeaderStyle,

        borderBottom: noBorder
          ? "none"
          : sectionHeaderStyle.borderBottom,

        paddingBottom: noBorder
          ? 0
          : sectionHeaderStyle.paddingBottom,

        marginBottom: noBorder
          ? 0
          : sectionHeaderStyle.marginBottom,
      }}
    >
      <span style={sectionEyebrowStyle}>
        {eyebrow}
      </span>

      <h2 style={sectionTitleStyle}>
        {title}
      </h2>

      <p style={sectionDescriptionStyle}>
        {description}
      </p>
    </div>
  );
}

function PageLayout({ children }) {
  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        {children}
      </div>
    </main>
  );
}

function StateCard({
  title,
  message,
  actionLabel,
  onAction,
}) {
  return (
    <section style={stateCardStyle}>
      <h1 style={stateTitleStyle}>
        {title}
      </h1>

      <p style={stateMessageStyle}>
        {message}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={primaryButtonStyle}
        >
          {actionLabel}
        </button>
      )}
    </section>
  );
}

const fontFamily =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const pageStyle = {
  minHeight: "100vh",
  padding: "36px 24px 64px",
  background: "#f5f7fb",
  color: "#0f172a",
  fontFamily,
};

const containerStyle = {
  width: "100%",
  maxWidth: "1240px",
  margin: "0 auto",
};

const formStyle = {
  width: "100%",
};

const backButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "30px",
  padding: 0,
  border: "none",
  background: "transparent",
  color: "#475569",
  fontFamily,
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
};

const pageHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "28px",
  marginBottom: "30px",
  flexWrap: "wrap",
};

const eyebrowStyle = {
  display: "inline-block",
  marginBottom: "10px",
  color: "#2563eb",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};

const pageTitleStyle = {
  margin: "0 0 10px",
  color: "#0f172a",
  fontSize: "clamp(32px, 4vw, 44px)",
  lineHeight: 1.1,
  fontWeight: "750",
  letterSpacing: "-0.035em",
};

const pageDescriptionStyle = {
  maxWidth: "720px",
  margin: 0,
  color: "#64748b",
  fontSize: "15px",
  lineHeight: 1.65,
};

const headerActionsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexShrink: 0,
  paddingTop: "12px",
  flexWrap: "wrap",
};

const sectionCardStyle = {
  marginBottom: "24px",
  padding: "28px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  boxShadow:
    "0 8px 26px rgba(15, 23, 42, 0.05)",
};

const sectionHeaderStyle = {
  paddingBottom: "22px",
  marginBottom: "26px",
  borderBottom: "1px solid #e2e8f0",
};

const sectionEyebrowStyle = {
  display: "block",
  marginBottom: "6px",
  color: "#2563eb",
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "0.09em",
  textTransform: "uppercase",
};

const sectionTitleStyle = {
  margin: "0 0 7px",
  color: "#0f172a",
  fontSize: "22px",
  lineHeight: 1.25,
  fontWeight: "700",
  letterSpacing: "-0.02em",
};

const sectionDescriptionStyle = {
  maxWidth: "760px",
  margin: 0,
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.6,
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "22px",
};

const googleSheetFieldsStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "22px",
  paddingTop: "24px",
  marginTop: "24px",
  borderTop: "1px solid #e2e8f0",
};

const descriptionFieldStyle = {
  gridColumn: "1 / -1",
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  minWidth: 0,
};

const labelStyle = {
  color: "#334155",
  fontSize: "13px",
  fontWeight: "700",
};

const requiredStyle = {
  marginLeft: "4px",
  color: "#dc2626",
};

const readOnlyInputStyle = {
  width: "100%",
  minHeight: "44px",
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  background: "#f1f5f9",
  color: "#475569",
  fontFamily,
  fontSize: "14px",
  lineHeight: 1.5,
  boxSizing: "border-box",
  cursor: "not-allowed",
};

const fixedFieldsNoticeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "#f1f5f9",
  color: "#475569",
  fontSize: "12px",
  fontWeight: "700",
};

const inputStyle = {
  width: "100%",
  minHeight: "44px",
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#0f172a",
  fontFamily,
  fontSize: "14px",
  lineHeight: 1.5,
  outline: "none",
  boxSizing: "border-box",
};

const selectStyle = {
  ...inputStyle,
  appearance: "auto",
};

const textareaStyle = {
  ...inputStyle,
  minHeight: "120px",
  resize: "vertical",
};

const compactTextareaStyle = {
  ...inputStyle,
  minHeight: "96px",
  resize: "vertical",
};

const integrationStatusCardStyle = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: "5px",
  minHeight: "78px",
  padding: "14px 16px",
  border: "1px solid #dbeafe",
  borderRadius: "10px",
  background: "#eff6ff",
};

const integrationStatusLabelStyle = {
  color: "#64748b",
  fontSize: "12px",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const integrationStatusValueStyle = {
  color: "#1d4ed8",
  fontSize: "15px",
  textTransform: "capitalize",
};

const integrationStatusDateStyle = {
  color: "#64748b",
  fontSize: "12px",
  lineHeight: 1.45,
};

const controlsHeaderRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "24px",
  paddingBottom: "24px",
  marginBottom: "24px",
  borderBottom: "1px solid #e2e8f0",
  flexWrap: "wrap",
};





const controlsListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

const controlCardStyle = {
  padding: "24px",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  background: "#f8fafc",
};

const controlHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "20px",
  paddingBottom: "20px",
  marginBottom: "22px",
  borderBottom: "1px solid #e2e8f0",
  flexWrap: "nowrap",
};

const controlTitleGroupStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  flex: 1,
  minWidth: 0,
};

const controlTitleTextStyle = {
  flex: 1,
  minWidth: 0,
};

const controlNumberStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: "34px",
  height: "34px",
  borderRadius: "9px",
  background: "#dbeafe",
  color: "#1d4ed8",
  fontSize: "14px",
  fontWeight: "800",
};

const controlTitleStyle = {
  margin: "0 0 5px",
  color: "#0f172a",
  fontSize: "17px",
  lineHeight: 1.3,
  fontWeight: "700",
};

const controlSubtitleStyle = {
  margin: 0,
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.5,
};



const controlGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "20px",
  marginBottom: "20px",
};

const controlDetailsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "20px",
};

const helperTextStyle = {
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: 1.5,
};

const primaryButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "42px",
  padding: "10px 18px",
  border: "1px solid #2563eb",
  borderRadius: "9px",
  background: "#2563eb",
  color: "#ffffff",
  fontFamily,
  fontSize: "14px",
  fontWeight: "700",
  cursor: "pointer",
  boxShadow:
    "0 4px 10px rgba(37, 99, 235, 0.18)",
};

const integrationButtonStyle = {
  ...primaryButtonStyle,
  border: "1px solid #0f766e",
  background: "#0f766e",
  boxShadow:
    "0 4px 10px rgba(15, 118, 110, 0.18)",
};

const secondaryButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "42px",
  padding: "10px 18px",
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#334155",
  fontFamily,
  fontSize: "14px",
  fontWeight: "700",
  cursor: "pointer",
};

const footerActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
  padding: "6px 0 12px",
  flexWrap: "wrap",
};

const errorAlertStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "13px",
  padding: "16px 18px",
  marginBottom: "24px",
  border: "1px solid #fecaca",
  borderRadius: "12px",
  background: "#fef2f2",
};

const errorIconStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: "26px",
  height: "26px",
  borderRadius: "50%",
  background: "#fee2e2",
  color: "#b91c1c",
  fontWeight: "800",
};

const errorTitleStyle = {
  display: "block",
  marginBottom: "3px",
  color: "#991b1b",
  fontSize: "14px",
};

const errorMessageStyle = {
  margin: 0,
  color: "#b91c1c",
  fontSize: "13px",
  lineHeight: 1.5,
};

const successAlertStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "13px",
  padding: "16px 18px",
  marginBottom: "24px",
  border: "1px solid #bbf7d0",
  borderRadius: "12px",
  background: "#f0fdf4",
};

const successIconStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: "26px",
  height: "26px",
  borderRadius: "50%",
  background: "#dcfce7",
  color: "#15803d",
  fontWeight: "800",
};

const successTitleStyle = {
  display: "block",
  marginBottom: "3px",
  color: "#166534",
  fontSize: "14px",
};

const successMessageStyle = {
  margin: 0,
  color: "#15803d",
  fontSize: "13px",
  lineHeight: 1.5,
};

const stateCardStyle = {
  maxWidth: "600px",
  margin: "100px auto 0",
  padding: "48px 30px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  boxShadow:
    "0 12px 35px rgba(15, 23, 42, 0.06)",
  textAlign: "center",
};

const stateTitleStyle = {
  margin: "0 0 10px",
  color: "#0f172a",
  fontSize: "24px",
};

const stateMessageStyle = {
  margin: "0 auto 22px",
  color: "#64748b",
  fontSize: "15px",
  lineHeight: 1.6,
};

export default EditCustomFramework;