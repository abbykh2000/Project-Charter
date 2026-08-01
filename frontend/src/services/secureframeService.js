const DEFAULT_PAGE_SIZE = 100;

function normalizeText(value) {
  return String(value ?? "").trim();
}

function cloneData(data) {
  if (typeof structuredClone === "function") {
    return structuredClone(data);
  }

  return JSON.parse(JSON.stringify(data));
}

function getProxyBaseUrl() {
  return normalizeText(
    import.meta.env.VITE_SECUREFRAME_PROXY_URL
  ).replace(/\/$/, "");
}

export function hasSecureframeConfiguration() {
  return Boolean(getProxyBaseUrl());
}

function createSecureframeError(message, options = {}) {
  const error = new Error(message);
  error.name = "SecureframeServiceError";
  error.code = options.code || "SECUREFRAME_ERROR";

  if (options.status !== undefined) {
    error.status = options.status;
  }

  if (options.cause !== undefined) {
    error.cause = options.cause;
  }

  return error;
}

async function requestSecureframeProxy(
  path,
  { signal, query = {} } = {}
) {
  const baseUrl = getProxyBaseUrl();

  if (!baseUrl) {
    throw createSecureframeError(
      "Secureframe integration is not configured. Set VITE_SECUREFRAME_PROXY_URL to a backend endpoint that securely stores the Secureframe API key and secret.",
      { code: "SECUREFRAME_NOT_CONFIGURED" }
    );
  }

  const url = new URL(`${baseUrl}/${path.replace(/^\//, "")}`);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  let response;

  try {
    response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal,
    });
  } catch (cause) {
    throw createSecureframeError(
      "Unable to connect to the Secureframe integration service.",
      {
        code: "SECUREFRAME_NETWORK_ERROR",
        cause,
      }
    );
  }

  const payload = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    const apiMessage = normalizeText(
      payload?.error?.message ??
        payload?.message ??
        payload?.errors?.[0]?.detail
    );

    throw createSecureframeError(
      apiMessage ||
        `Secureframe request failed with status ${response.status}.`,
      {
        code: "SECUREFRAME_API_ERROR",
        status: response.status,
      }
    );
  }

  return payload;
}

function getResourceAttributes(resource) {
  return resource?.attributes &&
    typeof resource.attributes === "object"
    ? resource.attributes
    : resource ?? {};
}

function getResourceList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.frameworks)) {
    return payload.frameworks;
  }

  if (Array.isArray(payload?.controls)) {
    return payload.controls;
  }

  if (Array.isArray(payload?.users)) {
    return payload.users;
  }

  return [];
}

function normalizeControl(resource, frameworkId, index) {
  const attributes = getResourceAttributes(resource);

  return {
    id: normalizeText(resource?.id ?? attributes.id) ||
      `secureframe-control-${frameworkId}-${index + 1}`,
    frameworkId,
    requirementNumber: normalizeText(
      attributes.requirement_number ??
        attributes.reference ??
        attributes.code
    ),
    category: normalizeText(
      attributes.category ?? attributes.domain
    ) || "General",
    control: normalizeText(
      attributes.name ?? attributes.title
    ),
    question: normalizeText(
      attributes.question ??
        attributes.description ??
        attributes.name
    ),
    owner: normalizeText(
      attributes.owner_name ?? attributes.owner
    ),
    status: normalizeText(
      attributes.status ?? attributes.compliance_status
    ) || "Not Started",
    evidenceUrl: normalizeText(
      attributes.evidence_url ?? attributes.url
    ),
    comments: normalizeText(
      attributes.comments ?? attributes.notes
    ),
    description: normalizeText(attributes.description),
    source: "secureframe",
  };
}

function normalizeFramework(resource, index) {
  const attributes = getResourceAttributes(resource);
  const id = normalizeText(resource?.id ?? attributes.id) ||
    `secureframe-framework-${index + 1}`;

  const controls = Array.isArray(attributes.controls)
    ? attributes.controls.map((control, controlIndex) =>
        normalizeControl(control, id, controlIndex)
      )
    : [];

  const passed = controls.filter(
    (control) => control.status.toLowerCase() === "passed"
  ).length;

  const total = controls.length;

  return {
    id,
    name: normalizeText(
      attributes.name ?? attributes.title
    ) || `Secureframe Framework ${index + 1}`,
    status: normalizeText(
      attributes.status ?? attributes.health
    ) || "Warning",
    description: normalizeText(attributes.description),
    owner: normalizeText(
      attributes.owner_name ?? attributes.owner
    ),
    lastUpdated: normalizeText(
      attributes.updated_at ?? attributes.last_updated
    ),
    source: "secureframe",
    controls,
    total,
    passed,
    failed: controls.filter(
      (control) => control.status.toLowerCase() === "failed"
    ).length,
    inProgress: controls.filter(
      (control) =>
        control.status.toLowerCase() === "in progress"
    ).length,
    notStarted: controls.filter(
      (control) =>
        control.status.toLowerCase() === "not started"
    ).length,
    compliance:
      total > 0 ? Math.round((passed / total) * 100) : 0,
    trend: Array.isArray(attributes.trend)
      ? cloneData(attributes.trend)
      : [],
  };
}

export async function fetchSecureframeFrameworks({ signal } = {}) {
  const payload = await requestSecureframeProxy("frameworks", {
    signal,
  });

  return getResourceList(payload).map(normalizeFramework);
}

export async function fetchSecureframeControls({
  frameworkId,
  signal,
} = {}) {
  const payload = await requestSecureframeProxy("controls", {
    signal,
    query: {
      framework_id: frameworkId,
      per_page: DEFAULT_PAGE_SIZE,
      page: 1,
    },
  });

  return getResourceList(payload).map((control, index) =>
    normalizeControl(control, frameworkId, index)
  );
}

export async function fetchSecureframeUsers({ signal } = {}) {
  const allUsers = [];
  let page = 1;

  while (true) {
    const payload = await requestSecureframeProxy("users", {
      signal,
      query: {
        per_page: DEFAULT_PAGE_SIZE,
        page,
      },
    });

    const pageUsers = getResourceList(payload);
    allUsers.push(...pageUsers);

    if (pageUsers.length < DEFAULT_PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  return allUsers.map((resource) => {
    const attributes = getResourceAttributes(resource);

    return {
      id: normalizeText(resource?.id ?? attributes.id),
      name: normalizeText(
        attributes.name ??
          `${attributes.first_name ?? ""} ${
            attributes.last_name ?? ""
          }`
      ),
      email: normalizeText(attributes.email),
      role: normalizeText(
        attributes.role ?? attributes.access_role
      ),
      department: normalizeText(attributes.department),
      active: attributes.active !== false,
      source: "secureframe",
    };
  });
}
