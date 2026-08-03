import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  CONTROL_STATUSES,
  DEFAULT_CONTROL_STATUS,
  DEFAULT_FRAMEWORK_SOURCE,
  DEFAULT_FRAMEWORK_STATUS,
  DEFAULT_REVIEW_FREQUENCY,
  FRAMEWORK_SOURCE_GOOGLE_SHEETS,
  FRAMEWORK_SOURCE_LOCAL,
  FRAMEWORK_STATUSES,
  INTEGRATION_TYPE_GOOGLE_SHEETS,
  INTEGRATION_TYPE_NONE,
  REVIEW_FREQUENCIES,
  createDefaultGoogleSheetConfig,
} from "../constants/frameworkConstants";

import {
  createCustomFramework,
} from "../services/customFrameworkService";

import {
  getFrameworkValidationError,
} from "../utils/frameworkValidation";

import { useUser } from "../context/useUser";

// --------------------------------------------------
// Default data
// --------------------------------------------------

function createTemporaryId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  return [
    "temporary-control",
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2),
  ].join("-");
}

function createEmptyControl() {
  return {
    id: createTemporaryId(),
    requirementNumber: "",
    category: "",
    question: "",
    owner: "",
    status: DEFAULT_CONTROL_STATUS,
    evidenceUrl: "",
    comments: "",
    description: "",
  };
}

function getDefaultGoogleSheetConfiguration() {
  const defaultConfiguration =
    typeof createDefaultGoogleSheetConfig ===
    "function"
      ? createDefaultGoogleSheetConfig()
      : {};

  return {
    spreadsheetId:
      defaultConfiguration
        ?.spreadsheetId ?? "",

    spreadsheetUrl:
      defaultConfiguration
        ?.spreadsheetUrl ?? "",

    sheetName:
      defaultConfiguration
        ?.sheetName ?? "",

    defaultCategory:
      defaultConfiguration
        ?.defaultCategory ?? "",

    columnMapping: {
      requirementNumber:
        defaultConfiguration
          ?.columnMapping
          ?.requirementNumber ??
        "REQ.No",

      category:
        defaultConfiguration
          ?.columnMapping
          ?.category ??
        "Category",

      question:
        defaultConfiguration
          ?.columnMapping
          ?.question ??
        "Question",

      owner:
        defaultConfiguration
          ?.columnMapping
          ?.owner ??
        "Owner",

      status:
        defaultConfiguration
          ?.columnMapping
          ?.status ??
        "Status",

      evidenceUrl:
        defaultConfiguration
          ?.columnMapping
          ?.evidenceUrl ??
        "Evidence",

      comments:
        defaultConfiguration
          ?.columnMapping
          ?.comments ??
        "Comments",
    },

    lastSyncedAt: null,
    syncStatus:
      defaultConfiguration
        ?.syncStatus ?? "",
  };
}

function createInitialFormData() {
  return {
    name: "",
    description: "",
    department: "",
    owner: "",

    reviewFrequency:
      DEFAULT_REVIEW_FREQUENCY,

    frameworkStatus:
      DEFAULT_FRAMEWORK_STATUS,

    sourceType:
      DEFAULT_FRAMEWORK_SOURCE ||
      FRAMEWORK_SOURCE_LOCAL,

    integrationType:
      INTEGRATION_TYPE_NONE,

    googleSheet:
      getDefaultGoogleSheetConfiguration(),
  };
}

// --------------------------------------------------
// Normalization helpers
// --------------------------------------------------

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeComparableValue(
  value
) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function isGoogleSheetsSource(
  sourceType
) {
  return (
    normalizeComparableValue(
      sourceType
    ) ===
    normalizeComparableValue(
      FRAMEWORK_SOURCE_GOOGLE_SHEETS
    )
  );
}

function hasMeaningfulControlData(
  control
) {
  return Boolean(
    normalizeText(
      control?.requirementNumber
    ) ||
      normalizeText(
        control?.category
      ) ||
      normalizeText(
        control?.question
      ) ||
      normalizeText(
        control?.owner
      ) ||
      normalizeText(
        control?.evidenceUrl
      ) ||
      normalizeText(
        control?.comments
      ) ||
      normalizeText(
        control?.description
      ) ||
      normalizeComparableValue(
        control?.status
      ) !==
        normalizeComparableValue(
          DEFAULT_CONTROL_STATUS
        )
  );
}

function prepareControlsForSave(
  controls
) {
  if (!Array.isArray(controls)) {
    return [];
  }

  return controls
    .filter(hasMeaningfulControlData)
    .map((control) => ({
      id: normalizeText(control.id),

      requirementNumber:
        normalizeText(
          control.requirementNumber
        ),

      category:
        normalizeText(
          control.category
        ),

      question:
        normalizeText(
          control.question
        ),

      owner:
        normalizeText(control.owner),

      status:
        control.status ||
        DEFAULT_CONTROL_STATUS,

      evidenceUrl:
        normalizeText(
          control.evidenceUrl
        ),

      comments:
        normalizeText(
          control.comments
        ),

      description:
        normalizeText(
          control.description
        ),
    }));
}

function createComparableSnapshot({
  formData,
  controls,
}) {
  return JSON.stringify({
    formData,
    controls,
  });
}

// --------------------------------------------------
// Component
// --------------------------------------------------

function CreateCustomFramework() {
  const navigate = useNavigate();
  const { users } = useUser();

  const [formData, setFormData] =
    useState(
      createInitialFormData
    );

  const [controls, setControls] =
    useState([
      createEmptyControl(),
    ]);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [allowNavigation, setAllowNavigation] =
    useState(false);

  const initialSnapshot =
    useMemo(
      () =>
        createComparableSnapshot({
          formData:
            createInitialFormData(),

          controls: [
            {
              ...createEmptyControl(),
              id: "",
            },
          ],
        }),
      []
    );

  const currentSnapshot =
    useMemo(
      () =>
        createComparableSnapshot({
          formData,

          controls:
            controls.map(
              (control) => ({
                ...control,
                id: "",
              })
            ),
        }),
      [formData, controls]
    );

  const hasUnsavedChanges =
    currentSnapshot !==
    initialSnapshot;

  const googleSheetsEnabled =
    isGoogleSheetsSource(
      formData.sourceType
    );

  // --------------------------------------------------
  // Unsaved-change protection
  // --------------------------------------------------

  useEffect(() => {
    function handleBeforeUnload(
      event
    ) {
      if (
        !hasUnsavedChanges ||
        saving ||
        allowNavigation
      ) {
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
  }, [
    allowNavigation,
    hasUnsavedChanges,
    saving,
  ]);

  // --------------------------------------------------
  // Framework handlers
  // --------------------------------------------------

  function handleFrameworkChange(
    event
  ) {
    const { name, value } =
      event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  }

  function handleSourceChange(
    event
  ) {
    const nextSource =
      event.target.value;

    const usingGoogleSheets =
      isGoogleSheetsSource(
        nextSource
      );

    setFormData((current) => ({
      ...current,

      sourceType: nextSource,

      integrationType:
        usingGoogleSheets
          ? INTEGRATION_TYPE_GOOGLE_SHEETS
          : INTEGRATION_TYPE_NONE,

      googleSheet:
        current.googleSheet ||
        getDefaultGoogleSheetConfiguration(),
    }));

    setError("");
  }

  function handleGoogleSheetChange(
    event
  ) {
    const { name, value } =
      event.target;

    setFormData((current) => ({
      ...current,

      googleSheet: {
        ...current.googleSheet,
        [name]: value,
      },
    }));

    setError("");
  }

  function handleColumnMappingChange(
    event
  ) {
    const { name, value } =
      event.target;

    setFormData((current) => ({
      ...current,

      googleSheet: {
        ...current.googleSheet,

        columnMapping: {
          ...current
            .googleSheet
            .columnMapping,

          [name]: value,
        },
      },
    }));

    setError("");
  }

  // --------------------------------------------------
  // Control handlers
  // --------------------------------------------------

  function handleControlChange(
    index,
    event
  ) {
    const { name, value } =
      event.target;

    setControls((current) =>
      current.map(
        (
          control,
          controlIndex
        ) =>
          controlIndex === index
            ? {
                ...control,
                [name]: value,
              }
            : control
      )
    );

    setError("");
  }

  function addControl() {
    setControls((current) => [
      ...current,
      createEmptyControl(),
    ]);

    setError("");
  }

  function removeControl(index) {
    setControls((current) => {
      if (current.length <= 1) {
        return current;
      }

      return current.filter(
        (_, controlIndex) =>
          controlIndex !== index
      );
    });

    setError("");
  }

  // --------------------------------------------------
  // Navigation
  // --------------------------------------------------

  function navigateBack() {
    if (
      saving
    ) {
      return;
    }

    if (
      hasUnsavedChanges &&
      !window.confirm(
        "You have unsaved changes. Leave this page without creating the framework?"
      )
    ) {
      return;
    }

    setAllowNavigation(true);

    navigate(
      "/custom-frameworks"
    );
  }

  // --------------------------------------------------
  // Submission
  // --------------------------------------------------

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const preparedControls =
      prepareControlsForSave(
        controls
      );

    const frameworkInput = {
      name:
        normalizeText(
          formData.name
        ),

      description:
        normalizeText(
          formData.description
        ),

      department:
        normalizeText(
          formData.department
        ),

      owner:
        normalizeText(
          formData.owner
        ),

      reviewFrequency:
        formData.reviewFrequency,

      frameworkStatus:
        formData.frameworkStatus,

      sourceType:
        googleSheetsEnabled
          ? FRAMEWORK_SOURCE_GOOGLE_SHEETS
          : FRAMEWORK_SOURCE_LOCAL,

      integrationType:
        googleSheetsEnabled
          ? INTEGRATION_TYPE_GOOGLE_SHEETS
          : INTEGRATION_TYPE_NONE,

      controls:
        googleSheetsEnabled
          ? []
          : preparedControls,

      googleSheet:
        googleSheetsEnabled
          ? {
              spreadsheetId:
                normalizeText(
                  formData
                    .googleSheet
                    .spreadsheetId
                ),

              spreadsheetUrl:
                normalizeText(
                  formData
                    .googleSheet
                    .spreadsheetUrl
                ),

              sheetName:
                normalizeText(
                  formData
                    .googleSheet
                    .sheetName
                ),

              defaultCategory:
                normalizeText(
                  formData
                    .googleSheet
                    .defaultCategory
                ),

              columnMapping: {
                requirementNumber:
                  normalizeText(
                    formData
                      .googleSheet
                      .columnMapping
                      .requirementNumber
                  ) ||
                  "REQ.No",

                category:
                  normalizeText(
                    formData
                      .googleSheet
                      .columnMapping
                      .category
                  ),

                question:
                  normalizeText(
                    formData
                      .googleSheet
                      .columnMapping
                      .question
                  ) ||
                  "Question",

                owner:
                  normalizeText(
                    formData.googleSheet.columnMapping.owner
                  ) || "Owner",

                status:
                  normalizeText(
                    formData.googleSheet.columnMapping.status
                  ) || "Status",

                evidenceUrl:
                  normalizeText(
                    formData.googleSheet.columnMapping.evidenceUrl
                  ) || "Evidence",

                comments:
                  normalizeText(
                    formData.googleSheet.columnMapping.comments
                  ) || "Comments",
              },

              lastSyncedAt: null,
              syncStatus:
                formData
                  .googleSheet
                  .syncStatus ||
                "",
            }
          : getDefaultGoogleSheetConfiguration(),
    };

    const validationError =
      getFrameworkValidationError(
        frameworkInput
      );

    if (validationError) {
      setError(validationError);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    try {
      setSaving(true);
      setError("");

      const createdFramework =
        await createCustomFramework(
          frameworkInput
        );

      setAllowNavigation(true);

      navigate(
        `/custom-frameworks/${createdFramework.id}`
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to create the custom framework."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageLayout>
      <form
        onSubmit={handleSubmit}
        style={formStyle}
      >
        <button
          type="button"
          onClick={navigateBack}
          style={{
            ...backButtonStyle,

            cursor: saving
              ? "not-allowed"
              : "pointer",

            opacity:
              saving ? 0.6 : 1,
          }}
          disabled={saving}
        >
          <span aria-hidden="true">
            ←
          </span>

          Back to Custom Frameworks
        </button>

        <header style={pageHeaderStyle}>
          <div>
            <span style={eyebrowStyle}>
              Custom Framework
            </span>

            <h1 style={pageTitleStyle}>
              Create Custom Framework
            </h1>

            <p style={pageDescriptionStyle}>
              Build a local compliance
              framework or connect a Google
              Sheet containing your
              requirements. Google Sheets
              controls are read-only and all
              displayed values come from the
              source worksheet.
            </p>
          </div>

          <div style={headerActionsStyle}>
            <button
              type="button"
              onClick={navigateBack}
              style={{
                ...secondaryButtonStyle,

                cursor: saving
                  ? "not-allowed"
                  : "pointer",

                opacity:
                  saving ? 0.7 : 1,
              }}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              style={{
                ...primaryButtonStyle,

                opacity:
                  saving ? 0.7 : 1,

                cursor: saving
                  ? "not-allowed"
                  : "pointer",
              }}
              disabled={saving}
            >
              {saving
                ? "Creating Framework..."
                : "Create Framework"}
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
                Unable to create framework
              </strong>

              <p style={errorMessageStyle}>
                {error}
              </p>
            </div>
          </div>
        )}

        <section style={sectionCardStyle}>
          <SectionHeader
            eyebrow="Framework Details"
            title="Framework Information"
            description="Define the framework's identity, ownership, review cycle, and lifecycle status."
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
                disabled={saving}
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
                disabled={saving}
                autoComplete="organization"
              />
            </FormField>

            <FormField label="Compliance Manager">
              <select
                name="owner"
                value={formData.owner}
                onChange={handleFrameworkChange}
                style={selectStyle}
                disabled={saving}
              >
                <option value="">Select a manager</option>
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
                disabled={saving}
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
                disabled={saving}
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

            <FormField
              label="Framework Source"
              required
            >
              <select
                name="sourceType"
                value={
                  formData.sourceType
                }
                onChange={
                  handleSourceChange
                }
                style={selectStyle}
                disabled={saving}
              >
                <option
                  value={
                    FRAMEWORK_SOURCE_LOCAL
                  }
                >
                  Local Dashboard
                </option>

                <option
                  value={
                    FRAMEWORK_SOURCE_GOOGLE_SHEETS
                  }
                >
                  Google Sheets
                </option>
              </select>

              <span style={helperTextStyle}>
                Select whether requirements
                are entered manually or
                refreshed from a Google
                Sheet.
              </span>
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
                  disabled={saving}
                />
              </FormField>
            </div>
          </div>
        </section>

        {googleSheetsEnabled && (
          <section style={sectionCardStyle}>
            <SectionHeader
              eyebrow="Integration"
              title="Google Sheets Configuration"
              description="Connect the worksheet containing the requirement number, category, and question fields."
            />

            <div style={integrationNoticeStyle}>
              <strong
                style={integrationNoticeTitleStyle}
              >
                Requirements are synchronized
                from Google Sheets
              </strong>

              <p
                style={integrationNoticeTextStyle}
              >
                Requirement numbers,
                categories, and questions can
                be refreshed from the
                spreadsheet. Owners,
                statuses, evidence URLs, and
                comments remain managed in
                the dashboard.
              </p>
            </div>

            <div style={formGridStyle}>
              <FormField
                label="Spreadsheet ID"
                required
              >
                <input
                  type="text"
                  name="spreadsheetId"
                  value={
                    formData
                      .googleSheet
                      .spreadsheetId
                  }
                  onChange={
                    handleGoogleSheetChange
                  }
                  style={inputStyle}
                  placeholder="Enter the Google Sheets spreadsheet ID"
                  disabled={saving}
                  autoComplete="off"
                />

                <span style={helperTextStyle}>
                  The spreadsheet ID is the
                  value between
                  “/spreadsheets/d/” and
                  “/edit” in the URL.
                </span>
              </FormField>

              <FormField
                label="Worksheet Name"
                required
              >
                <input
                  type="text"
                  name="sheetName"
                  value={
                    formData
                      .googleSheet
                      .sheetName
                  }
                  onChange={
                    handleGoogleSheetChange
                  }
                  style={inputStyle}
                  placeholder="For example, Controls"
                  disabled={saving}
                  autoComplete="off"
                />
              </FormField>

              <FormField label="Spreadsheet URL">
                <input
                  type="url"
                  name="spreadsheetUrl"
                  value={
                    formData
                      .googleSheet
                      .spreadsheetUrl
                  }
                  onChange={
                    handleGoogleSheetChange
                  }
                  style={inputStyle}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  disabled={saving}
                  autoComplete="url"
                />

                <span style={helperTextStyle}>
                  Optional link used to open
                  the source spreadsheet from
                  the dashboard.
                </span>
              </FormField>

              <FormField label="Default Category">
                <input
                  type="text"
                  name="defaultCategory"
                  value={
                    formData
                      .googleSheet
                      .defaultCategory
                  }
                  onChange={
                    handleGoogleSheetChange
                  }
                  style={inputStyle}
                  placeholder="Used when the sheet has no category column"
                  disabled={saving}
                  autoComplete="off"
                />
              </FormField>
            </div>

            <div style={mappingDividerStyle} />

            <div style={mappingHeaderStyle}>
              <h3 style={mappingTitleStyle}>
                Column Mapping
              </h3>

              <p
                style={mappingDescriptionStyle}
              >
                Enter the exact worksheet
                headings used for the
                required fields. Matching is
                case-insensitive and ignores
                spaces and punctuation.
              </p>
            </div>

            <div style={formGridStyle}>
              <FormField
                label="Requirement Number Column"
                required
              >
                <input
                  type="text"
                  name="requirementNumber"
                  value={
                    formData
                      .googleSheet
                      .columnMapping
                      .requirementNumber
                  }
                  onChange={
                    handleColumnMappingChange
                  }
                  style={inputStyle}
                  placeholder="REQ.No"
                  disabled={saving}
                  autoComplete="off"
                />
              </FormField>

              <FormField label="Category Column">
                <input
                  type="text"
                  name="category"
                  value={
                    formData
                      .googleSheet
                      .columnMapping
                      .category
                  }
                  onChange={
                    handleColumnMappingChange
                  }
                  style={inputStyle}
                  placeholder="Category"
                  disabled={saving}
                  autoComplete="off"
                />

                <span style={helperTextStyle}>
                  This may be left blank when
                  a default category is
                  supplied.
                </span>
              </FormField>

              <FormField
                label="Question Column"
                required
              >
                <input
                  type="text"
                  name="question"
                  value={
                    formData
                      .googleSheet
                      .columnMapping
                      .question
                  }
                  onChange={
                    handleColumnMappingChange
                  }
                  style={inputStyle}
                  placeholder="Question"
                  disabled={saving}
                  autoComplete="off"
                />
              </FormField>

              <FormField label="Owner Column">
                <input
                  type="text"
                  name="owner"
                  value={formData.googleSheet.columnMapping.owner}
                  onChange={handleColumnMappingChange}
                  style={inputStyle}
                  placeholder="Owner FY25"
                  disabled={saving}
                  autoComplete="off"
                />
              </FormField>

              <FormField label="Status Column">
                <input
                  type="text"
                  name="status"
                  value={formData.googleSheet.columnMapping.status}
                  onChange={handleColumnMappingChange}
                  style={inputStyle}
                  placeholder="Company AI Status"
                  disabled={saving}
                  autoComplete="off"
                />
              </FormField>

              <FormField label="Evidence Column">
                <input
                  type="text"
                  name="evidenceUrl"
                  value={formData.googleSheet.columnMapping.evidenceUrl}
                  onChange={handleColumnMappingChange}
                  style={inputStyle}
                  placeholder="Evidence"
                  disabled={saving}
                  autoComplete="off"
                />
              </FormField>

              <FormField label="Comments Column">
                <input
                  type="text"
                  name="comments"
                  value={formData.googleSheet.columnMapping.comments}
                  onChange={handleColumnMappingChange}
                  style={inputStyle}
                  placeholder="Comments"
                  disabled={saving}
                  autoComplete="off"
                />
              </FormField>
            </div>
          </section>
        )}

        <section style={sectionCardStyle}>
          <div style={controlsHeaderRowStyle}>
            <SectionHeader
              eyebrow={
                googleSheetsEnabled
                  ? "Initial Requirements"
                  : "Requirements"
              }
              title="Framework Controls"
              description={
                googleSheetsEnabled
                  ? "Controls are imported from Google Sheets after the framework is created."
                  : "Add the controls that will be tracked as part of this custom framework."
              }
              noBorder
            />

            {!googleSheetsEnabled && (
            <button
              type="button"
              onClick={addControl}
              style={{
                ...addControlButtonStyle,

                cursor: saving
                  ? "not-allowed"
                  : "pointer",

                opacity:
                  saving ? 0.7 : 1,
              }}
              disabled={saving}
            >
              <span
                style={plusIconStyle}
                aria-hidden="true"
              >
                +
              </span>

              Add Control
            </button>
            )}
          </div>

          {googleSheetsEnabled && (
            <div
              style={
                controlsGuidanceStyle
              }
            >
              Create the framework, then use
              Refresh from Google Sheets to
              import all read-only control
              fields from the worksheet.
            </div>
          )}

          {!googleSheetsEnabled && (
          <div style={controlsListStyle}>
            {controls.map(
              (control, index) => (
                <ControlEditor
                  key={control.id}
                  control={control}
                  index={index}
                  canRemove={
                    controls.length > 1
                  }
                  disabled={saving}
                  users={users}
                  onChange={
                    handleControlChange
                  }
                  onRemove={
                    removeControl
                  }
                />
              )
            )}
          </div>
          )}
        </section>

        <div style={footerActionsStyle}>
          <button
            type="button"
            onClick={navigateBack}
            style={{
              ...secondaryButtonStyle,

              cursor: saving
                ? "not-allowed"
                : "pointer",

              opacity:
                saving ? 0.7 : 1,
            }}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            style={{
              ...primaryButtonStyle,

              opacity:
                saving ? 0.7 : 1,

              cursor: saving
                ? "not-allowed"
                : "pointer",
            }}
            disabled={saving}
          >
            {saving
              ? "Creating Framework..."
              : "Create Framework"}
          </button>
        </div>
      </form>
    </PageLayout>
  );
}

// --------------------------------------------------
// Control editor
// --------------------------------------------------

function ControlEditor({
  control,
  index,
  canRemove,
  disabled,
  users,
  onChange,
  onRemove,
}) {
  const controlTitle =
    normalizeText(
      control.question
    ) ||
    normalizeText(
      control.requirementNumber
    ) ||
    `Control ${index + 1}`;

  return (
    <article style={controlCardStyle}>
      <div style={controlHeaderStyle}>
        <div style={controlTitleGroupStyle}>
          <div style={controlNumberStyle}>
            {index + 1}
          </div>

          <div>
            <h3 style={controlTitleStyle}>
              {controlTitle}
            </h3>

            <p style={controlSubtitleStyle}>
              Define the requirement,
              ownership, status, and
              supporting evidence.
            </p>
          </div>
        </div>

        {canRemove && (
          <button
            type="button"
            onClick={() =>
              onRemove(index)
            }
            style={{
              ...removeButtonStyle,

              cursor: disabled
                ? "not-allowed"
                : "pointer",

              opacity:
                disabled ? 0.6 : 1,
            }}
            disabled={disabled}
          >
            Remove Control
          </button>
        )}
      </div>

      <div style={controlGridStyle}>
        <FormField
          label="Requirement Number"
          required
        >
          <input
            type="text"
            name="requirementNumber"
            value={
              control
                .requirementNumber ||
              ""
            }
            onChange={(event) =>
              onChange(index, event)
            }
            style={inputStyle}
            placeholder="For example, AC-01"
            disabled={disabled}
            autoComplete="off"
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
              control.question || ""
            }
            onChange={(event) =>
              onChange(index, event)
            }
            style={inputStyle}
            placeholder="Enter the control question"
            disabled={disabled}
            autoComplete="off"
          />
        </FormField>

        <FormField label="Category">
          <input
            type="text"
            name="category"
            value={
              control.category || ""
            }
            onChange={(event) =>
              onChange(index, event)
            }
            style={inputStyle}
            placeholder="For example, Access Control"
            disabled={disabled}
            autoComplete="off"
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
            placeholder="https://example.com/evidence"
            disabled={disabled}
            autoComplete="url"
          />

          <span style={helperTextStyle}>
            Enter a valid HTTPS link to
            supporting evidence. The evidence
            may be stored in Google Drive,
            Google Docs, or another approved
            system.
          </span>
        </FormField>

        <FormField label="Comments">
          <textarea
            name="comments"
            value={
              control.comments || ""
            }
            onChange={(event) =>
              onChange(index, event)
            }
            style={compactTextareaStyle}
            placeholder="Add internal comments"
            disabled={disabled}
          />
        </FormField>
      </div>
    </article>
  );
}

// --------------------------------------------------
// Shared UI components
// --------------------------------------------------

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
          : sectionHeaderStyle
              .borderBottom,

        paddingBottom: noBorder
          ? 0
          : sectionHeaderStyle
              .paddingBottom,

        marginBottom: noBorder
          ? 0
          : sectionHeaderStyle
              .marginBottom,
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

// --------------------------------------------------
// Styles
// --------------------------------------------------

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
};

const pageHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "28px",
  marginBottom: "30px",
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
  fontSize:
    "clamp(32px, 4vw, 44px)",
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
  flexWrap: "wrap",
  gap: "12px",
  flexShrink: 0,
  paddingTop: "12px",
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
  borderBottom:
    "1px solid #e2e8f0",
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

const inputStyle = {
  width: "100%",
  minHeight: "44px",
  padding: "10px 12px",
  border:
    "1px solid #cbd5e1",
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

const integrationNoticeStyle = {
  marginBottom: "24px",
  padding: "15px 17px",
  border:
    "1px solid #bfdbfe",
  borderRadius: "11px",
  background: "#eff6ff",
};

const integrationNoticeTitleStyle = {
  display: "block",
  marginBottom: "5px",
  color: "#1e40af",
  fontSize: "14px",
};

const integrationNoticeTextStyle = {
  margin: 0,
  color: "#1d4ed8",
  fontSize: "13px",
  lineHeight: 1.6,
};

const mappingDividerStyle = {
  height: "1px",
  margin: "28px 0",
  background: "#e2e8f0",
};

const mappingHeaderStyle = {
  marginBottom: "20px",
};

const mappingTitleStyle = {
  margin: "0 0 6px",
  color: "#0f172a",
  fontSize: "17px",
  fontWeight: "700",
};

const mappingDescriptionStyle = {
  maxWidth: "760px",
  margin: 0,
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.6,
};

const controlsHeaderRowStyle = {
  display: "flex",
  justifyContent:
    "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: "24px",
  paddingBottom: "24px",
  marginBottom: "24px",
  borderBottom:
    "1px solid #e2e8f0",
};

const controlsGuidanceStyle = {
  marginBottom: "20px",
  padding: "12px 14px",
  border:
    "1px solid #e2e8f0",
  borderRadius: "9px",
  background: "#f8fafc",
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.55,
};

const addControlButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  minHeight: "42px",
  padding: "10px 16px",
  border:
    "1px solid #bfdbfe",
  borderRadius: "9px",
  background: "#eff6ff",
  color: "#1d4ed8",
  fontFamily,
  fontSize: "14px",
  fontWeight: "700",
  whiteSpace: "nowrap",
};

const plusIconStyle = {
  fontSize: "19px",
  lineHeight: 1,
};

const controlsListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

const controlCardStyle = {
  padding: "24px",
  border:
    "1px solid #e2e8f0",
  borderRadius: "14px",
  background: "#f8fafc",
};

const controlHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent:
    "space-between",
  flexWrap: "wrap",
  gap: "20px",
  paddingBottom: "20px",
  marginBottom: "22px",
  borderBottom:
    "1px solid #e2e8f0",
};

const controlTitleGroupStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "13px",
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
  overflowWrap: "anywhere",
};

const controlSubtitleStyle = {
  margin: 0,
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.5,
};

const removeButtonStyle = {
  padding: "7px 10px",
  border: "none",
  background: "transparent",
  color: "#dc2626",
  fontFamily,
  fontSize: "13px",
  fontWeight: "700",
  whiteSpace: "nowrap",
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
  color: "#64748b",
  fontSize: "12px",
  lineHeight: 1.5,
};

const primaryButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "42px",
  padding: "10px 18px",
  border:
    "1px solid #2563eb",
  borderRadius: "9px",
  background: "#2563eb",
  color: "#ffffff",
  fontFamily,
  fontSize: "14px",
  fontWeight: "700",
  boxShadow:
    "0 4px 10px rgba(37, 99, 235, 0.18)",
};

const secondaryButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "42px",
  padding: "10px 18px",
  border:
    "1px solid #cbd5e1",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#334155",
  fontFamily,
  fontSize: "14px",
  fontWeight: "700",
};

const footerActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  flexWrap: "wrap",
  gap: "12px",
  padding: "6px 0 12px",
};

const errorAlertStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "13px",
  padding: "16px 18px",
  marginBottom: "24px",
  border:
    "1px solid #fecaca",
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

export default CreateCustomFramework;