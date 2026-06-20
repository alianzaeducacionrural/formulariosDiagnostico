# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> A detailed companion doc lives in [AGENTS.md](AGENTS.md) — read it for the full endpoint/route tables.

## What this is

Diagnostic survey platform for educational projects (Comité de Cafeteros). Four survey
forms — `escuela_nueva`, `ppp`, `escuela_virtual`, `emprendimiento` — collect strategy
adoption per municipio/institución and compute a "semáforo" (traffic-light) score.

All UI text is in **Spanish**.

## Two architectures coexist

| Target | Stack | Deploy |
|--------|-------|--------|
| **Original** (local dev) | Node.js + Express 4, ExcelJS, `pg` | `npm start` → binds `0.0.0.0:PORT` (default 3000) |
| **New** (production) | Google Apps Script + Google Sheets backend, static HTML/CSS/JS | GitHub Pages |

There is **no build step, no linter, no typechecker, and no tests** for either version.
`npm test` is a failing placeholder.

## Commands

```bash
npm start        # run the Express app (needs .env with DATABASE_URL and PORT)
node index.js    # same thing
```

## Critical quirk: the database is fake

`index.js` imports `./data/localPool` — **not** `db.js`. `localPool` intercepts known SQL
query patterns and reads/writes the local `formulario_*.xlsx` files (repo root) instead of
hitting PostgreSQL. `db.js` (real `pg` Pool) exists but is **unused at runtime**. Excel
loader logic is in `data/excelLoader.js`.

The four Excel sources are: `formulario_escuela_nueva.xlsx`, `formulario_ppp.xlsx`,
`formulario_escuela_virtual.xlsx`, `formulario_emprendimiento.xlsx`.

## Shared data model

Every row has two levels:
- **respuesta**: `municipio`, `institucion`, `semaforo`
- **estrategias**: list of `{ nombre, tipo, estado, valor, observaciones }`

Excel/Sheet column layout: col 1 = Municipio, col 2 = Institución, col 3 = Semáforo,
then strategy/observation pairs from col 4 onward.

### Strategy tipos
- `"aplica"` — toggle "Aplica" / "No aplica" (most strategies)
- `"numero"` — numeric input (only in Emprendimiento: "Dinero existente",
  "Número de proyectos apoyados en el 2025")

### Semáforo
Only `tipo: "aplica"` strategies count toward the percentage:
- `<50%` → Rojo
- `50–74%` → Amarillo
- `≥75%` → Verde

This rule must stay consistent across both the Express backend and `gas/Code.gs`.

## New architecture (GAS + GitHub Pages)

- **Backend**: `gas/Code.gs` — pasted into the Google Sheet's Apps Script editor and
  deployed as a Web App. Exposes `getConfig`, `getFormData`, `getAdminSummary`,
  `getDetalle` via `doGet`, and accepts form submissions via `doPost`
  (`{ form, nombre, municipio, institucion, estrategias }`). The Sheet **is** the database.
- **Frontend**: static files at repo root. Forms are parameterized by query string
  (`formulario.html?tipo=escuela_nueva`). `index.html` is the form selector;
  `admin.html` / `admin-formulario.html` are dashboards that fetch GAS data and render
  client-side.
- **Config**: `js/config.js` holds `GAS_URL` — must be updated after each GAS deploy.

## CSS lives in two places

- Old (Express, served from `public/`): `public/styles-admin.css`, `public/styles-formularios.css`
- New (GitHub Pages): `css/admin.css`, `css/forms.css` — copies of the above

When changing form/admin styling, update the relevant pair for the architecture you're touching.

## Conventions

- `.env` is gitignored.
- No CI/CD, no pre-commit hooks.
- Only the `main` branch.
