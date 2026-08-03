# Compliance Dashboard implementation notes

- Only the Compliance Manager role can create, edit, delete, or refresh custom frameworks.
- Direct access to custom-framework create and edit routes is protected.
- Framework managers and control owners are selected from the dashboard user directory.
- `REQ.No`, `Category`, and `Question` are read-only after framework creation.
- The factory/service layer also preserves those three fields during normal dashboard updates, so direct UI bypasses cannot alter them.
- Owner, Status, Evidence URL, Comments, and supporting Description remain editable.
- Google Sheets refresh now calls the real refresh service, recalculates framework summaries, records sync timestamps/errors, and preserves operational fields.
- A Secureframe client and credential-safe backend proxy are included.

## User integration

The project includes a local fallback user directory and a current-user selector on the Custom Frameworks page. When the Secureframe proxy is configured, the user provider loads paginated Secureframe users and merges them into the assignment directory.

The current-user selector is a development/testing mechanism, not production authentication. Replace it with the organization’s SSO identity before production use. Secureframe users do not silently override the explicitly configured local Compliance Manager role.

## Secureframe setup and limitations

The React frontend never stores the Secureframe API key or secret. Run the backend proxy with `SECUREFRAME_API_KEY` and `SECUREFRAME_API_SECRET`, then set `VITE_SECUREFRAME_PROXY_URL` in the frontend.

Secureframe authentication uses an `Authorization` header containing both the API key and secret. The API supports regional base URLs and paginated resources; the user loader requests up to 100 records per page and continues until the final page.

The exact framework/control endpoint availability and response relationships must be confirmed against the company’s Secureframe Developer Portal. Until credentials and account-specific API access are available, the dashboard safely uses ISO fallback data.

## Google Sheets behavior

- Google Sheets supplies control-definition fields during refresh: requirement number, category, and question.
- Dashboard-managed fields are preserved: owner, status, evidence URL, and comments.
- Spreadsheet ID, worksheet name, optional URL, default category, column mapping, sync status, last sync time, and sync errors are retained in the nested `googleSheet` configuration.

## Validation performed in this environment

- `npm run lint` passes after the final changes.
- All local imports resolve with exact Linux-sensitive casing.
- The backend proxy passes Node syntax validation.

