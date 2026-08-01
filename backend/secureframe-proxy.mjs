import http from "node:http";

const PORT = Number(process.env.PORT || 8787);
const API_BASE_URL = String(
  process.env.SECUREFRAME_API_BASE_URL ||
    "https://api.secureframe.com"
).replace(/\/$/, "");
const API_KEY = String(
  process.env.SECUREFRAME_API_KEY || ""
).trim();
const API_SECRET = String(
  process.env.SECUREFRAME_API_SECRET || ""
).trim();
const ALLOWED_ORIGIN = String(
  process.env.DASHBOARD_ORIGIN ||
    "http://localhost:5173"
).trim();

const ALLOWED_RESOURCES = new Set([
  "frameworks",
  "controls",
  "tests",
  "evidences",
  "users",
]);

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    Vary: "Origin",
  });
  response.end(JSON.stringify(payload));
}

function getResourceName(pathname) {
  return pathname.split("/").filter(Boolean)[0] || "";
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method !== "GET") {
    sendJson(response, 405, {
      message: "Only GET requests are supported.",
    });
    return;
  }

  if (!API_KEY || !API_SECRET) {
    sendJson(response, 503, {
      message:
        "Secureframe credentials are not configured on the proxy server.",
    });
    return;
  }

  const incomingUrl = new URL(
    request.url || "/",
    `http://${request.headers.host || "localhost"}`
  );
  const resourceName = getResourceName(incomingUrl.pathname);

  if (!ALLOWED_RESOURCES.has(resourceName)) {
    sendJson(response, 404, {
      message: "The requested Secureframe resource is not allowed.",
    });
    return;
  }

  const upstreamUrl = new URL(
    `${API_BASE_URL}${incomingUrl.pathname}`
  );
  incomingUrl.searchParams.forEach((value, key) => {
    upstreamUrl.searchParams.append(key, value);
  });

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `${API_KEY} ${API_SECRET}`,
      },
    });

    const responseText = await upstreamResponse.text();
    let payload;

    try {
      payload = responseText ? JSON.parse(responseText) : {};
    } catch {
      payload = { message: responseText };
    }

    sendJson(response, upstreamResponse.status, payload);
  } catch (error) {
    sendJson(response, 502, {
      message: "Unable to connect to Secureframe.",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

server.listen(PORT, () => {
  console.log(
    `Secureframe proxy listening on http://localhost:${PORT}`
  );
});
