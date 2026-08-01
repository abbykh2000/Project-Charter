# Final change summary

## Access control

- Added a user context with Compliance Manager, Control Owner, and Viewer roles.
- Protected custom-framework create/edit routes.
- Restricted create, edit, delete, and Google Sheets refresh actions to the Compliance Manager.
- Kept a temporary current-user selector for testing role behavior.

## User integration

- Added a reusable user directory with names, emails, departments, active status, and roles.
- Replaced free-text framework manager and control owner fields with directory-backed selectors.
- Added optional paginated Secureframe user loading with a local fallback directory.
- Added directory source and fallback status feedback on the Custom Frameworks page.

## Custom framework editing

- Made `REQ.No`, `Category`, and `Question` read-only after creation.
- Preserved those fields in the factory/service layer even if a client attempts to change them.
- Kept Owner, Status, Evidence URL, Comments, and Description editable.
- Removed duplicate-question validation; repeated question wording is allowed while requirement numbers remain unique.

## Google Sheets

- Corrected the Edit page so refresh calls the real Google Sheets refresh service.
- Preserved dashboard-managed operational values during worksheet refresh.
- Recalculated summary metrics after refresh.
- Persisted sync status, last sync time, sync errors, default category, and column mappings.
- Retained backward-compatible metadata reads for older saved frameworks.

## Framework portfolio

- Removed SOC 2 and PCI DSS fallback data.
- Added ISO/IEC 42001 and retained ISO/IEC 27001.

## Secureframe

- Added a frontend Secureframe service for frameworks, controls, and paginated users.
- Added a backend proxy so API key and secret never enter the React bundle.
- Added regional API-base configuration and fallback behavior when live integration is unavailable.

## Documentation and safety

- Replaced the generic Vite README with project setup and integration instructions.
- Updated implementation notes with delivered requirements and live-API limitations.
- Removed `.env.local` and stale nested archives from the delivery package so secrets and unnecessary dependencies are not shipped.

## Validation

- ESLint passes.
- Backend proxy syntax check passes.
- Local imports resolve with exact casing.
- Production build requires a fresh platform-local `npm install` because the uploaded dependency archive contained a non-Linux Rolldown native binding.
