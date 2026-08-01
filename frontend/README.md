# Compliance Dashboard

A React and Vite compliance dashboard for viewing Secureframe-backed framework data and managing independent custom frameworks.

## Current scope

- Secureframe-compatible framework overview with ISO/IEC 42001 and ISO/IEC 27001 fallback data.
- Custom framework creation, viewing, editing, deletion, and Google Sheets refresh.
- User directory integration with local fallback users and optional Secureframe users.
- Role-based access control: only a Compliance Manager can create, edit, delete, or refresh custom frameworks.
- Fixed control-definition fields after creation: `REQ.No`, `Category`, and `Question`.
- Editable operational fields: Owner, Status, Evidence URL, Comments, and Description.

## Frontend setup

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

Copy `.env.example` to `.env.local` and configure values as needed. Never commit `.env.local`.

```env
VITE_GOOGLE_SHEETS_API_KEY=
VITE_SECUREFRAME_PROXY_URL=http://localhost:8787
VITE_CURRENT_USER_ID=user-compliance-manager
VITE_STALE_AFTER_HOURS=24
```

## Secureframe proxy

Secureframe credentials must remain on the backend. From the project root:

```bash
cp backend/.env.example backend/.env
# Fill in the API key and secret, then load the variables in your shell.
node backend/secureframe-proxy.mjs
```

The Secureframe API base URL is region-dependent. Use `https://api.secureframe.com` for the default US region or the URL supplied for the company account.

The dashboard falls back to ISO/IEC 42001 and ISO/IEC 27001 sample data when the proxy is not configured or the Secureframe request fails.

## Validation

```bash
npm run lint
npm run build
```

See `../IMPLEMENTATION_NOTES.md` for the implemented manager feedback, architecture decisions, and remaining live-integration requirements.
