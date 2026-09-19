# Firmware Landing Page

React + Vite single-page validation landing page for Firmware.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Important

The pre-registration form is intentionally front-end only for validation. `submit()` in `src/main.jsx` currently shows a success state without sending data anywhere.

To collect real registrations, connect the form to your backend, Supabase, Formspree, Google Apps Script, or another endpoint and replace the `submit()` handler.
