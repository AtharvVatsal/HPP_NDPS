# NDPS Financial Investigation · Letters Generator

A single-page web tool for the **Himachal Pradesh Police** to generate the twelve standard statutory letters required during a Chapter VA NDPS Act financial investigation — under § 94 of the Bharatiya Nagarik Suraksha Sanhita, 2023.

Every officer types their own letterhead (station name, district, address, phone, email), FIR particulars, accused / suspects / relatives, and the tool produces print-ready A4 letters with the HPP emblem and an editable letterhead.

## What it does

- One IO fills the form once → all twelve letters are generated automatically:
  - L1 Banks & Post Offices · L2 Income Tax · L3 Town & Country Planner / Municipal Committee
  - L4 Electricity Dept · L5 RTO / Registering Authority · L6 Tehsildar / Sub-Registrar
  - L7 Patwari · L8 Deputy Commissioner · L9 Director, Land Records
  - L10 Sub-Registrar (Valuation) · L11 IRDAI · L12 Bureau of Immigration
  - L13 Annexure — Master Relative Details Form (18 relations)
- Per-letter despatch log (mark sent, date, despatch number)
- Auto-fill blank addressee templates for empty slot fields
- One-click print to PDF (any letter, all letters, or only unsent letters)
- Form data autosaves to the browser's localStorage; share via URL hash for cross-device access

## Run locally

Requirements: **Node.js ≥ 18**, npm.

```bash
npm install
npm run dev      # http://localhost:5173
```

## Build for deployment

```bash
npm run build
```

The static site is emitted to `dist/`. Drop the folder on any static host — Netlify, Vercel, Cloudflare Pages, GitHub Pages — and the app is live.

```bash
npm run preview  # serve dist/ at http://localhost:4173 to verify before deploying
```

## Stack

- React 18 (no global state library; the form lives in a single component tree with localStorage autosave)
- Vite for the build + dev server
- HPP emblem stored at `public/HPP.png`; replace this single file to swap the logo

## Project structure

```
index.html              # entry HTML, all CSS lives here (Tailwind-free)
main.jsx                # mounts <LettersApp />
letters-app.jsx         # the form UI (StationStep, FirStep, PersonsStep, RelativesStep, AuthoritiesStep, LettersPopup)
letters-templates.jsx   # twelve letter templates (LetterPage, LetterHead, ParticularsTable, etc.)
letters-data.js         # AUTHORITIES (12 letters' metadata + slot fields), RELATIONS (18), § 94 BNSS preamble
branding.jsx            # HPP colours, name strings, motto
public/HPP.png          # HP Police emblem (used in letter header & body watermark)
scraps/                 # archived earlier experiments (Excel dashboard, dossier views) — not built
```

## Security note

The form stores everything in the browser's `localStorage` — no server, no upload, no telemetry. If you deploy this to a public URL, enable your host's password protection (Netlify, Cloudflare Pages, etc.) before anyone enters real case data.
