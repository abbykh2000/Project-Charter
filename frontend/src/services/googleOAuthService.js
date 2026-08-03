// --------------------------------------------------
// Google OAuth configuration
// --------------------------------------------------

const GOOGLE_OAUTH_CLIENT_ID_ENV_NAME =
  "VITE_GOOGLE_OAUTH_CLIENT_ID";

const GOOGLE_SHEETS_READONLY_SCOPE =
  "https://www.googleapis.com/auth/spreadsheets.readonly";

const GOOGLE_IDENTITY_LOAD_TIMEOUT_MS = 10_000;
const TOKEN_EXPIRY_BUFFER_MS = 60_000;

let tokenClient = null;
let accessToken = "";
let accessTokenExpiresAt = 0;
let pendingTokenRequest = null;
let activeTokenRequestReject = null;

function normalizeText(value) {
  return String(value ?? "").trim();
}

function getGoogleOAuthClientId() {
  return normalizeText(
    import.meta.env[
      GOOGLE_OAUTH_CLIENT_ID_ENV_NAME
    ]
  );
}

function createGoogleOAuthError(
  message,
  code,
  cause
) {
  const error = new Error(message);

  error.name = "GoogleOAuthError";
  error.code = code;

  if (cause !== undefined) {
    error.cause = cause;
  }

  return error;
}

function hasValidCachedToken() {
  return Boolean(
    accessToken &&
      Date.now() <
        accessTokenExpiresAt -
          TOKEN_EXPIRY_BUFFER_MS
  );
}

function waitForGoogleIdentityServices() {
  if (
    window.google?.accounts?.oauth2
  ) {
    return Promise.resolve();
  }

  return new Promise(
    (resolve, reject) => {
      const startedAt = Date.now();

      const intervalId =
        window.setInterval(() => {
          if (
            window.google?.accounts
              ?.oauth2
          ) {
            window.clearInterval(
              intervalId
            );

            resolve();
            return;
          }

          if (
            Date.now() - startedAt >=
            GOOGLE_IDENTITY_LOAD_TIMEOUT_MS
          ) {
            window.clearInterval(
              intervalId
            );

            reject(
              createGoogleOAuthError(
                "Google Identity Services could not be loaded. Check your internet connection and try again.",
                "GOOGLE_OAUTH_LIBRARY_UNAVAILABLE"
              )
            );
          }
        }, 100);
    }
  );
}

function getTokenClient() {
  if (tokenClient) {
    return tokenClient;
  }

  const clientId =
    getGoogleOAuthClientId();

  if (!clientId) {
    throw createGoogleOAuthError(
      `Google OAuth is missing ${GOOGLE_OAUTH_CLIENT_ID_ENV_NAME}.`,
      "GOOGLE_OAUTH_NOT_CONFIGURED"
    );
  }

  tokenClient =
    window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope:
        GOOGLE_SHEETS_READONLY_SCOPE,
      callback: () => {},
      error_callback: (error) => {
        if (activeTokenRequestReject) {
          activeTokenRequestReject(
            createGoogleOAuthError(
              getOAuthFailureMessage(error),
              "GOOGLE_OAUTH_POPUP_ERROR",
              error
            )
          );
        }
      },
    });

  return tokenClient;
}

function getOAuthFailureMessage(error) {
  const errorType =
    normalizeText(error?.type);

  if (
    errorType === "popup_closed"
  ) {
    return "Google authorization was cancelled before it completed.";
  }

  if (
    errorType ===
    "popup_failed_to_open"
  ) {
    return "Google authorization could not open. Allow pop-ups for this dashboard and try again.";
  }

  return (
    normalizeText(error?.message) ||
    "Google authorization could not be completed."
  );
}

export function isGoogleOAuthConfigured() {
  return Boolean(
    getGoogleOAuthClientId()
  );
}

export async function requestGoogleSheetsAccessToken({
  forceAccountSelection = false,
} = {}) {
  if (pendingTokenRequest) {
    return pendingTokenRequest;
  }

  pendingTokenRequest =
    (async () => {
      await waitForGoogleIdentityServices();

      return new Promise(
        (resolve, reject) => {
          let client;

          try {
            client = getTokenClient();
          } catch (error) {
            reject(error);
            return;
          }

          client.callback =
            (response) => {
              if (
                response?.error
              ) {
                reject(
                  createGoogleOAuthError(
                    response.error_description ||
                      response.error,
                    "GOOGLE_OAUTH_TOKEN_ERROR",
                    response
                  )
                );
                return;
              }

              const token =
                normalizeText(
                  response?.access_token
                );

              if (!token) {
                reject(
                  createGoogleOAuthError(
                    "Google authorization did not return an access token.",
                    "GOOGLE_OAUTH_TOKEN_MISSING"
                  )
                );
                return;
              }

              const expiresInSeconds =
                Number(
                  response?.expires_in
                ) || 3600;

              accessToken = token;
              accessTokenExpiresAt =
                Date.now() +
                expiresInSeconds * 1000;

              resolve(accessToken);
            };

          activeTokenRequestReject =
            reject;

          client.requestAccessToken({
            prompt:
              forceAccountSelection
                ? "select_account"
                : "",
          });
        }
      );
    })();

  try {
    return await pendingTokenRequest;
  } finally {
    pendingTokenRequest = null;
    activeTokenRequestReject = null;
  }
}

export async function getGoogleSheetsAccessToken() {
  if (hasValidCachedToken()) {
    return accessToken;
  }

  return requestGoogleSheetsAccessToken();
}

export function clearGoogleSheetsAccessToken() {
  if (
    accessToken &&
    window.google?.accounts?.oauth2
  ) {
    window.google.accounts.oauth2.revoke(
      accessToken,
      () => {}
    );
  }

  accessToken = "";
  accessTokenExpiresAt = 0;
  tokenClient = null;
}
