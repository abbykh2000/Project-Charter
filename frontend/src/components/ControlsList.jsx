import {
  useMemo,
  useState,
} from "react";

import {
  CONTROL_STATUSES,
  DEFAULT_CONTROL_STATUS,
} from "../constants/frameworkConstants";

import {
  getControlStatusStyle,
} from "../utils/statusUtils";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const SORT_OPTIONS = {
  REQUIREMENT_ASC: "requirement-asc",
  REQUIREMENT_DESC: "requirement-desc",
  CATEGORY_ASC: "category-asc",
  CATEGORY_DESC: "category-desc",
  OWNER_ASC: "owner-asc",
  OWNER_DESC: "owner-desc",
  STATUS_ASC: "status-asc",
  STATUS_DESC: "status-desc",
};

function ControlsList({
  controls = [],
  framework,
}) {
  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [categoryFilter, setCategoryFilter] =
    useState("All");

  const [ownerFilter, setOwnerFilter] =
    useState("All");

  const [evidenceFilter, setEvidenceFilter] =
    useState("All");

  const [sortOption, setSortOption] =
    useState(
      SORT_OPTIONS.REQUIREMENT_ASC
    );

  const [pageSize, setPageSize] =
    useState(10);

  const [currentPage, setCurrentPage] =
    useState(1);

  const normalizedControls = useMemo(() => {
    const sourceControls =
      Array.isArray(controls) &&
      controls.length > 0
        ? controls
        : Array.isArray(
              framework?.controls
            )
          ? framework.controls
          : [];

    return sourceControls.map(
      (item, index) =>
        normalizeControl(item, index)
    );
  }, [controls, framework]);

  const categoryOptions = useMemo(
    () =>
      getUniqueSortedValues(
        normalizedControls.map(
          (item) =>
            item.category ||
            "Uncategorized"
        )
      ),
    [normalizedControls]
  );

  const ownerOptions = useMemo(
    () =>
      getUniqueSortedValues(
        normalizedControls.map(
          (item) =>
            item.owner ||
            "Unassigned"
        )
      ),
    [normalizedControls]
  );

  const filteredControls = useMemo(() => {
    const normalizedSearch =
      searchTerm
        .trim()
        .toLowerCase();

    return normalizedControls.filter(
      (item) => {
        const searchableValues = [
          item.requirementNumber,
          item.category,
          item.question,
          item.owner,
          item.status,
          item.comments,
        ];

        const matchesSearch =
          normalizedSearch.length === 0 ||
          searchableValues.some((value) =>
            String(value ?? "")
              .toLowerCase()
              .includes(normalizedSearch)
          );

        const displayedCategory =
          item.category ||
          "Uncategorized";

        const displayedOwner =
          item.owner ||
          "Unassigned";

        const matchesStatus =
          statusFilter === "All" ||
          item.status === statusFilter;

        const matchesCategory =
          categoryFilter === "All" ||
          displayedCategory ===
            categoryFilter;

        const matchesOwner =
          ownerFilter === "All" ||
          displayedOwner === ownerFilter;

        const hasEvidence =
          Boolean(
            String(
              item.evidenceUrl ?? ""
            ).trim()
          );

        const matchesEvidence =
          evidenceFilter === "All" ||
          (
            evidenceFilter ===
              "With evidence" &&
            hasEvidence
          ) ||
          (
            evidenceFilter ===
              "Without evidence" &&
            !hasEvidence
          );

        return (
          matchesSearch &&
          matchesStatus &&
          matchesCategory &&
          matchesOwner &&
          matchesEvidence
        );
      }
    );
  }, [
    categoryFilter,
    evidenceFilter,
    normalizedControls,
    ownerFilter,
    searchTerm,
    statusFilter,
  ]);

  const sortedControls = useMemo(
    () =>
      sortControls(
        filteredControls,
        sortOption
      ),
    [
      filteredControls,
      sortOption,
    ]
  );

  const totalPages = Math.max(
    1,
    Math.ceil(
      sortedControls.length /
        pageSize
    )
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const visibleControls = useMemo(() => {
    const startIndex =
      (safeCurrentPage - 1) *
      pageSize;

    return sortedControls.slice(
      startIndex,
      startIndex + pageSize
    );
  }, [
    safeCurrentPage,
    pageSize,
    sortedControls,
  ]);

  const rangeStart =
    sortedControls.length === 0
      ? 0
      : (safeCurrentPage - 1) *
          pageSize +
        1;

  const rangeEnd = Math.min(
    safeCurrentPage * pageSize,
    sortedControls.length
  );

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    statusFilter !== "All" ||
    categoryFilter !== "All" ||
    ownerFilter !== "All" ||
    evidenceFilter !== "All";

  function resetToFirstPage() {
    setCurrentPage(1);
  }

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("All");
    setCategoryFilter("All");
    setOwnerFilter("All");
    setEvidenceFilter("All");
    setCurrentPage(1);
  }

  function handleExportCsv() {
    exportControlsToCsv(
      sortedControls,
      framework?.name ||
        "framework-controls"
    );
  }

  return (
    <section style={sectionStyle}>
      <div style={headerRowStyle}>
        <div style={headerCopyStyle}>
          <p style={eyebrowStyle}>
            Control register
          </p>

          <h2 style={titleStyle}>
            Controls
          </h2>

          <p style={subtitleStyle}>
            {normalizedControls.length} total
            controls
            {hasActiveFilters
              ? ` · ${sortedControls.length} visible`
              : ""}
          </p>
        </div>

        <div style={headerActionsStyle}>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={
              sortedControls.length === 0
            }
            style={{
              ...exportButtonStyle,
              ...(sortedControls.length === 0
                ? disabledButtonStyle
                : {}),
            }}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div style={filterPanelStyle}>
        <label style={searchFieldStyle}>
          <span style={fieldLabelStyle}>
            Search controls
          </span>

          <input
            type="search"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(
                event.target.value
              );
              resetToFirstPage();
            }}
            placeholder="Search by requirement, owner, category or question"
            aria-label="Search controls"
            style={searchInputStyle}
          />
        </label>

        <label style={fieldStyle}>
          <span style={fieldLabelStyle}>
            Status
          </span>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(
                event.target.value
              );
              resetToFirstPage();
            }}
            aria-label="Filter controls by status"
            style={filterSelectStyle}
          >
            <option value="All">
              All statuses
            </option>

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
        </label>

        <label style={fieldStyle}>
          <span style={fieldLabelStyle}>
            Category
          </span>

          <select
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(
                event.target.value
              );
              resetToFirstPage();
            }}
            aria-label="Filter controls by category"
            style={filterSelectStyle}
          >
            <option value="All">
              All categories
            </option>

            {categoryOptions.map(
              (category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              )
            )}
          </select>
        </label>

        <label style={fieldStyle}>
          <span style={fieldLabelStyle}>
            Owner
          </span>

          <select
            value={ownerFilter}
            onChange={(event) => {
              setOwnerFilter(
                event.target.value
              );
              resetToFirstPage();
            }}
            aria-label="Filter controls by owner"
            style={filterSelectStyle}
          >
            <option value="All">
              All owners
            </option>

            {ownerOptions.map(
              (owner) => (
                <option
                  key={owner}
                  value={owner}
                >
                  {owner}
                </option>
              )
            )}
          </select>
        </label>

        <label style={fieldStyle}>
          <span style={fieldLabelStyle}>
            Evidence
          </span>

          <select
            value={evidenceFilter}
            onChange={(event) => {
              setEvidenceFilter(
                event.target.value
              );
              resetToFirstPage();
            }}
            aria-label="Filter controls by evidence"
            style={filterSelectStyle}
          >
            <option value="All">
              All evidence
            </option>

            <option value="With evidence">
              With evidence
            </option>

            <option value="Without evidence">
              Without evidence
            </option>
          </select>
        </label>

        <label style={fieldStyle}>
          <span style={fieldLabelStyle}>
            Sort
          </span>

          <select
            value={sortOption}
            onChange={(event) => {
              setSortOption(
                event.target.value
              );
              resetToFirstPage();
            }}
            aria-label="Sort controls"
            style={sortSelectStyle}
          >
            <option
              value={
                SORT_OPTIONS.REQUIREMENT_ASC
              }
            >
              REQ.No A–Z
            </option>

            <option
              value={
                SORT_OPTIONS.REQUIREMENT_DESC
              }
            >
              REQ.No Z–A
            </option>

            <option
              value={
                SORT_OPTIONS.CATEGORY_ASC
              }
            >
              Category A–Z
            </option>

            <option
              value={
                SORT_OPTIONS.CATEGORY_DESC
              }
            >
              Category Z–A
            </option>

            <option
              value={
                SORT_OPTIONS.OWNER_ASC
              }
            >
              Owner A–Z
            </option>

            <option
              value={
                SORT_OPTIONS.OWNER_DESC
              }
            >
              Owner Z–A
            </option>

            <option
              value={
                SORT_OPTIONS.STATUS_ASC
              }
            >
              Status A–Z
            </option>

            <option
              value={
                SORT_OPTIONS.STATUS_DESC
              }
            >
              Status Z–A
            </option>
          </select>
        </label>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            style={clearButtonStyle}
          >
            Clear filters
          </button>
        )}
      </div>

      {normalizedControls.length === 0 ? (
        <EmptyState
          title="No controls available"
          message="This framework does not currently contain any controls."
        />
      ) : sortedControls.length === 0 ? (
        <EmptyState
          title="No matching controls"
          message="Try changing your search or clearing one or more filters."
          actionLabel="Clear filters"
          onAction={clearFilters}
        />
      ) : (
        <>
          <div style={tableFrameStyle}>
            <div style={tableContainerStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th
                      style={{
                        ...headerCellStyle,
                        ...stickyFirstHeaderStyle,
                      }}
                    >
                      REQ.No
                    </th>

                    <th style={headerCellStyle}>
                      Category
                    </th>

                    <th style={questionHeaderStyle}>
                      Question
                    </th>

                    <th style={headerCellStyle}>
                      Owner
                    </th>

                    <th style={headerCellStyle}>
                      Status
                    </th>

                    <th style={headerCellStyle}>
                      Evidence
                    </th>

                    <th style={commentsHeaderStyle}>
                      Comments
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visibleControls.map(
                    (item, index) => (
                      <ControlRow
                        key={item.rowKey}
                        item={item}
                        rowIndex={
                          (safeCurrentPage - 1) *
                            pageSize +
                          index
                        }
                      />
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={paginationStyle}>
            <div style={paginationSummaryStyle}>
              Showing {rangeStart}–{rangeEnd} of{" "}
              {sortedControls.length}
            </div>

            <div style={paginationControlsStyle}>
              <label style={pageSizeFieldStyle}>
                <span style={pageSizeLabelStyle}>
                  Rows
                </span>

                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(
                      Number(
                        event.target.value
                      )
                    );
                    setCurrentPage(1);
                  }}
                  aria-label="Rows per page"
                  style={pageSizeSelectStyle}
                >
                  {PAGE_SIZE_OPTIONS.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    )
                  )}
                </select>
              </label>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.max(
                        1,
                        Math.min(
                          page,
                          totalPages
                        ) - 1
                      )
                  )
                }
                disabled={safeCurrentPage === 1}
                style={{
                  ...paginationButtonStyle,
                  ...(safeCurrentPage === 1
                    ? disabledButtonStyle
                    : {}),
                }}
              >
                Previous
              </button>

              <span style={pageIndicatorStyle}>
                Page {safeCurrentPage} of{" "}
                {totalPages}
              </span>

              <button
                type="button"
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.min(
                        totalPages,
                        Math.min(
                          page,
                          totalPages
                        ) + 1
                      )
                  )
                }
                disabled={
                  safeCurrentPage === totalPages
                }
                style={{
                  ...paginationButtonStyle,
                  ...(safeCurrentPage === totalPages
                    ? disabledButtonStyle
                    : {}),
                }}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function ControlRow({
  item,
  rowIndex,
}) {
  const [hovered, setHovered] =
    useState(false);

  const isAlternate =
    rowIndex % 2 === 1;

  const rowBackground = hovered
    ? "#f1f5f9"
    : isAlternate
      ? "#fbfcfe"
      : "#ffffff";

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...bodyRowStyle,
        background: rowBackground,
      }}
    >
      <td
        style={{
          ...bodyCellStyle,
          ...stickyFirstCellStyle,
          background: rowBackground,
        }}
      >
        <span
          title="Click to copy requirement number"
          style={requirementNumberStyle}
          role="button"
          tabIndex={0}
          onClick={() =>
            copyToClipboard(
              item.requirementNumber
            )
          }
          onKeyDown={(event) => {
            if (
              event.key === "Enter" ||
              event.key === " "
            ) {
              event.preventDefault();
              copyToClipboard(
                item.requirementNumber
              );
            }
          }}
        >
          {item.requirementNumber ||
            "—"}
        </span>
      </td>

      <td style={bodyCellStyle}>
        {item.category ||
          "Uncategorized"}
      </td>

      <td style={questionCellStyle}>
        {item.question ||
          "Unnamed control"}
      </td>

      <td style={bodyCellStyle}>
        {item.owner ||
          "Unassigned"}
      </td>

      <td style={bodyCellStyle}>
        <span
          style={{
            ...getControlStatusStyle(
              item.status
            ),
            display: "inline-flex",
            alignItems: "center",
            padding: "6px 9px",
            borderRadius: "999px",
            fontSize: "11px",
            lineHeight: 1,
            fontWeight: "750",
            letterSpacing: "0.01em",
            whiteSpace: "nowrap",
          }}
        >
          {item.status}
        </span>
      </td>

      <td style={bodyCellStyle}>
        {item.evidenceUrl ? (
          <a
            href={item.evidenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={evidenceLinkStyle}
            aria-label={`Open evidence for ${item.question}`}
          >
            Open evidence
            <span
              aria-hidden="true"
              style={evidenceArrowStyle}
            >
              ↗
            </span>
          </a>
        ) : (
          <span
            style={unavailableTextStyle}
          >
            Not provided
          </span>
        )}
      </td>

      <td style={commentsCellStyle}>
        {item.comments ? (
          <span
            title={item.comments}
            style={commentsTextStyle}
          >
            {item.comments}
          </span>
        ) : (
          <span
            style={{
              ...unavailableTextStyle,
              fontStyle: "italic",
            }}
          >
            No comments available
          </span>
        )}
      </td>
    </tr>
  );
}

function normalizeControl(
  item,
  index
) {
  const question =
    item?.question ??
    item?.control ??
    item?.name ??
    "";

  const comments =
    item?.comments ??
    item?.notes ??
    "";

  const requirementNumber =
    item?.requirementNumber ??
    item?.reqNo ??
    item?.requirementNo ??
    "";

  return {
    ...item,
    requirementNumber,
    category: item?.category ?? "",
    question,
    owner: item?.owner ?? "",
    status:
      item?.status ||
      DEFAULT_CONTROL_STATUS,
    evidenceUrl:
      item?.evidenceUrl ?? "",
    comments,
    rowKey:
      item?.id ??
      `${requirementNumber}-${question}-${index}`,
  };
}

function getUniqueSortedValues(
  values
) {
  return Array.from(
    new Set(
      values
        .map((value) =>
          String(value ?? "").trim()
        )
        .filter(Boolean)
    )
  ).sort((first, second) =>
    first.localeCompare(
      second,
      undefined,
      {
        sensitivity: "base",
        numeric: true,
      }
    )
  );
}

function sortControls(
  controls,
  sortOption
) {
  const safeControls =
    Array.isArray(controls)
      ? [...controls]
      : [];

  const getSortValue = (item) => {
    switch (sortOption) {
      case SORT_OPTIONS.CATEGORY_ASC:
      case SORT_OPTIONS.CATEGORY_DESC:
        return item.category ||
          "Uncategorized";

      case SORT_OPTIONS.OWNER_ASC:
      case SORT_OPTIONS.OWNER_DESC:
        return item.owner ||
          "Unassigned";

      case SORT_OPTIONS.STATUS_ASC:
      case SORT_OPTIONS.STATUS_DESC:
        return item.status || "";

      default:
        return item.requirementNumber ||
          "";
    }
  };

  const descending = [
    SORT_OPTIONS.REQUIREMENT_DESC,
    SORT_OPTIONS.CATEGORY_DESC,
    SORT_OPTIONS.OWNER_DESC,
    SORT_OPTIONS.STATUS_DESC,
  ].includes(sortOption);

  return safeControls.sort(
    (first, second) => {
      const comparison =
        String(
          getSortValue(first)
        ).localeCompare(
          String(
            getSortValue(second)
          ),
          undefined,
          {
            sensitivity: "base",
            numeric: true,
          }
        );

      return descending
        ? -comparison
        : comparison;
    }
  );
}

function escapeCsvValue(value) {
  const stringValue =
    String(value ?? "");

  return `"${stringValue.replace(
    /"/g,
    '""'
  )}"`;
}

function createCsvFilename(
  frameworkName
) {
  const safeName =
    String(
      frameworkName ??
      "framework-controls"
    )
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      ) ||
    "framework-controls";

  return `${safeName}-controls.csv`;
}

function exportControlsToCsv(
  controls,
  frameworkName
) {
  const header = [
    "REQ.No",
    "Category",
    "Question",
    "Owner",
    "Status",
    "Evidence",
    "Comments",
  ];

  const rows = controls.map(
    (item) => [
      item.requirementNumber,
      item.category ||
        "Uncategorized",
      item.question,
      item.owner ||
        "Unassigned",
      item.status,
      item.evidenceUrl,
      item.comments,
    ]
  );

  const csvContent = [
    header,
    ...rows,
  ]
    .map((row) =>
      row
        .map(escapeCsvValue)
        .join(",")
    )
    .join("\r\n");

  const blob = new Blob(
    [
      "\uFEFF",
      csvContent,
    ],
    {
      type:
        "text/csv;charset=utf-8",
    }
  );

  const objectUrl =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = objectUrl;
  link.download =
    createCsvFilename(
      frameworkName
    );

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(
    objectUrl
  );
}

async function copyToClipboard(
  value
) {
  const normalizedValue =
    String(value ?? "").trim();

  if (!normalizedValue) {
    return;
  }

  try {
    await navigator.clipboard.writeText(
      normalizedValue
    );
  } catch {
    const textarea =
      document.createElement(
        "textarea"
      );

    textarea.value =
      normalizedValue;

    textarea.setAttribute(
      "readonly",
      ""
    );

    textarea.style.position =
      "fixed";

    textarea.style.opacity =
      "0";

    document.body.appendChild(
      textarea
    );

    textarea.select();

    document.execCommand(
      "copy"
    );

    textarea.remove();
  }
}

function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}) {
  return (
    <div style={emptyStateStyle}>
      <div
        aria-hidden="true"
        style={emptyIconStyle}
      >
        CL
      </div>

      <h3 style={emptyTitleStyle}>
        {title}
      </h3>

      <p style={emptyMessageStyle}>
        {message}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          style={emptyActionStyle}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

const fontFamily =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const sectionStyle = {
  marginBottom: "24px",
  padding: "26px",
  background: "#ffffff",
  border: "1px solid #dfe5ec",
  borderRadius: "14px",
  boxShadow:
    "0 6px 22px rgba(15, 23, 42, 0.045)",
  fontFamily,
};

const headerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: "24px",
  flexWrap: "wrap",
  marginBottom: "22px",
};

const headerCopyStyle = {
  minWidth: "220px",
};

const headerActionsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};

const eyebrowStyle = {
  margin: "0 0 8px",
  color: "#2563eb",
  fontSize: "11px",
  fontWeight: "750",
  letterSpacing: "0.09em",
  textTransform: "uppercase",
};

const titleStyle = {
  margin: "0 0 7px",
  color: "#0f172a",
  fontSize: "22px",
  lineHeight: 1.25,
  fontWeight: "740",
  letterSpacing: "-0.025em",
};

const subtitleStyle = {
  margin: 0,
  color: "#64748b",
  fontSize: "13px",
};

const filterPanelStyle = {
  display: "flex",
  alignItems: "flex-end",
  gap: "10px",
  flexWrap: "wrap",
  marginBottom: "22px",
};

const fieldStyle = {
  display: "grid",
  gap: "6px",
};

const searchFieldStyle = {
  ...fieldStyle,
  flex: "1 1 320px",
};

const fieldLabelStyle = {
  color: "#64748b",
  fontSize: "10.5px",
  fontWeight: "700",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};

const searchInputStyle = {
  width: "100%",
  minHeight: "42px",
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#0f172a",
  fontFamily,
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
};

const filterSelectStyle = {
  minWidth: "155px",
  maxWidth: "220px",
  minHeight: "42px",
  padding: "10px 34px 10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#334155",
  cursor: "pointer",
  fontFamily,
  fontSize: "13px",
  boxSizing: "border-box",
};

const sortSelectStyle = {
  ...filterSelectStyle,
  minWidth: "170px",
};

const clearButtonStyle = {
  minHeight: "42px",
  padding: "10px 13px",
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  background: "#f8fafc",
  color: "#475569",
  cursor: "pointer",
  fontFamily,
  fontSize: "12px",
  fontWeight: "700",
  whiteSpace: "nowrap",
};

const exportButtonStyle = {
  minHeight: "40px",
  padding: "9px 14px",
  border: "1px solid #0f172a",
  borderRadius: "9px",
  background: "#0f172a",
  color: "#ffffff",
  cursor: "pointer",
  fontFamily,
  fontSize: "12px",
  fontWeight: "700",
  whiteSpace: "nowrap",
};

const tableFrameStyle = {
  overflow: "hidden",
  border: "1px solid #dfe5ec",
  borderRadius: "11px",
};

const tableContainerStyle = {
  maxHeight: "680px",
  overflow: "auto",
};

const tableStyle = {
  width: "100%",
  minWidth: "1180px",
  borderCollapse: "separate",
  borderSpacing: 0,
};

const headerCellStyle = {
  position: "sticky",
  top: 0,
  zIndex: 3,
  padding: "13px 16px",
  background: "#f8fafc",
  borderBottom: "1px solid #dfe5ec",
  color: "#475569",
  fontSize: "11px",
  fontWeight: "750",
  letterSpacing: "0.05em",
  textAlign: "left",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const stickyFirstHeaderStyle = {
  left: 0,
  zIndex: 5,
  boxShadow:
    "1px 0 0 #dfe5ec",
};

const questionHeaderStyle = {
  ...headerCellStyle,
  minWidth: "320px",
};

const commentsHeaderStyle = {
  ...headerCellStyle,
  minWidth: "240px",
};

const bodyRowStyle = {
  transition:
    "background 140ms ease",
};

const bodyCellStyle = {
  padding: "17px 16px",
  borderBottom: "1px solid #edf1f5",
  color: "#475569",
  fontSize: "13px",
  lineHeight: 1.55,
  verticalAlign: "top",
};

const stickyFirstCellStyle = {
  position: "sticky",
  left: 0,
  zIndex: 2,
  boxShadow:
    "1px 0 0 #e8edf3",
  transition:
    "background 140ms ease",
};

const questionCellStyle = {
  ...bodyCellStyle,
  minWidth: "320px",
  color: "#1e293b",
  fontWeight: "650",
};

const commentsCellStyle = {
  ...bodyCellStyle,
  minWidth: "240px",
  maxWidth: "360px",
  overflowWrap: "anywhere",
};

const commentsTextStyle = {
  display: "-webkit-box",
  overflow: "hidden",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 3,
};

const requirementNumberStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "5px 8px",
  border: "1px solid #dfe5ec",
  borderRadius: "6px",
  background: "#f8fafc",
  color: "#475569",
  cursor: "copy",
  fontSize: "11px",
  fontWeight: "750",
  whiteSpace: "nowrap",
};

const evidenceLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  color: "#1d4ed8",
  fontSize: "12px",
  fontWeight: "750",
  textDecoration: "none",
  whiteSpace: "nowrap",
};

const evidenceArrowStyle = {
  fontSize: "13px",
  lineHeight: 1,
};

const unavailableTextStyle = {
  color: "#94a3b8",
  fontSize: "12px",
};

const paginationStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "18px",
  flexWrap: "wrap",
  marginTop: "18px",
};

const paginationSummaryStyle = {
  color: "#64748b",
  fontSize: "12px",
};

const paginationControlsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
  flexWrap: "wrap",
};

const pageSizeFieldStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  marginRight: "5px",
};

const pageSizeLabelStyle = {
  color: "#64748b",
  fontSize: "11px",
  fontWeight: "650",
};

const pageSizeSelectStyle = {
  minHeight: "36px",
  padding: "7px 28px 7px 9px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#334155",
  cursor: "pointer",
  fontFamily,
  fontSize: "12px",
};

const paginationButtonStyle = {
  minHeight: "36px",
  padding: "8px 11px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#334155",
  cursor: "pointer",
  fontFamily,
  fontSize: "12px",
  fontWeight: "700",
};

const disabledButtonStyle = {
  opacity: 0.45,
  cursor: "not-allowed",
};

const pageIndicatorStyle = {
  minWidth: "88px",
  color: "#475569",
  fontSize: "12px",
  fontWeight: "650",
  textAlign: "center",
};

const emptyStateStyle = {
  padding: "48px 24px",
  background: "#f8fafc",
  border: "1px dashed #cbd5e1",
  borderRadius: "11px",
  textAlign: "center",
};

const emptyIconStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "42px",
  height: "42px",
  marginBottom: "16px",
  background: "#0f172a",
  borderRadius: "9px",
  color: "#ffffff",
  fontSize: "10px",
  fontWeight: "800",
  letterSpacing: "0.05em",
};

const emptyTitleStyle = {
  margin: "0 0 8px",
  color: "#0f172a",
  fontSize: "18px",
  fontWeight: "730",
};

const emptyMessageStyle = {
  maxWidth: "480px",
  margin: "0 auto",
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.6,
};

const emptyActionStyle = {
  minHeight: "38px",
  marginTop: "18px",
  padding: "8px 13px",
  border: "1px solid #0f172a",
  borderRadius: "8px",
  background: "#0f172a",
  color: "#ffffff",
  cursor: "pointer",
  fontFamily,
  fontSize: "12px",
  fontWeight: "700",
};

export default ControlsList;