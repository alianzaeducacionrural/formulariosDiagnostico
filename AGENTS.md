# AGENTS.md — Encuestas Diagnóstico Proyectos

## Stack (two architectures coexist)

| Target | Stack | Deploy |
|--------|-------|--------|
| **Original** (local dev) | Node.js, Express 4, ExcelJS, PostgreSQL (`pg`) | `npm start` (binds `0.0.0.0:PORT`) |
| **New** (production) | Google Apps Script + Google Sheets backend, static HTML/CSS/JS frontend | GitHub Pages |

No tests, no linter, no typechecker, no build step for either version.

## Architecture: new (GAS + GitHub Pages)

### Google Sheet
- URL: `https://docs.google.com/spreadsheets/d/14y78QfazSSccf-LSA2DLcAWz5bGA7ohAVzYytSjTFlU/edit`
- Sheet names: `Escuela Nueva`, `PPP`, `Escuela Virtual`, `Emprendimiento`
- Column structure: col 1 = Municipio, 2 = Institución, 3 = Semáforo, then strategy/observation pairs
- The sheet is the database — no other persistence layer

### GAS backend (`gas/Code.gs`)
- Deploy as Web App (Anyone with link → access)
- API endpoints via `doGet` / `doPost`:

| action | Params | Returns |
|--------|--------|---------|
| `getConfig` | none | forms catalog, strategies per form (from sheet headers), municipios list |
| `getFormData` | `form={slug}` | all rows from sheet with computed semáforo |
| `getAdminSummary` | none | response count per form |
| `getDetalle` | `id={n}` | one row's detail with strategies |

`doPost` receives JSON body `{ form, nombre, municipio, institucion, estrategias }` and appends to the correct sheet.

### Frontend (GitHub Pages)
- Pure static files — no build step, no server
- HTML forms are parameterized via `?tipo=escuela_nueva` (see `formulario.html`)
- Admin dashboard uses JS to fetch GAS data and render KPIs/rankings/insights client-side
- JS config file is `js/config.js` — must set `GAS_URL` after deploying the GAS web app

### File layout (new files)

| File | Purpose |
|------|---------|
| `gas/Code.gs` | GAS backend — paste into Google Apps Script editor |
| `js/config.js` | GAS URL (set after deploy) |
| `js/formulario.js` | Form render + submission logic |
| `js/admin.js` | Admin dashboard JS |
| `index.html` | Landing page (form selector) |
| `formulario.html` | Dynamic form (`?tipo=`) |
| `admin.html` | Admin overview |
| `admin-formulario.html` | Per-form dashboard |
| `gracias.html` | Success page |
| `css/forms.css` | Form styles (copy of `public/styles-formularios.css`) |
| `css/admin.css` | Admin styles (copy of `public/styles-admin.css`) |

### Setup

1. Open the Google Sheet → Extensions → Apps Script
2. Paste `gas/Code.gs` → Deploy → New deployment → Web app
3. Copy the deployment URL into `js/config.js` as `GAS_URL`
4. Push the frontend to a GitHub Pages repo (files at root)

---

## Architecture: old (Node.js, still usable for local dev)

Requires `.env` with `DATABASE_URL` and `PORT` (default 3000).

### Quirk: localPool replaces PostgreSQL

The app imports `data/localPool` — **not** `db.js`.  
`localPool` intercepts known SQL query patterns and reads from local `formulario_*.xlsx` files instead of PostgreSQL. `db.js` exists but is unused at runtime.

Excel sources (at repo root):
- `formulario_escuela_nueva.xlsx`
- `formulario_ppp.xlsx`
- `formulario_escuela_virtual.xlsx`
- `formulario_emprendimiento.xlsx`

Loader logic in `data/excelLoader.js` — reads col 1 (municipio), 2 (institución), 3 (semáforo), then strategy/observation pairs from cols 4+.

### Routes (Express)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | Escuela Nueva form |
| GET | `/ppp` | PPP form |
| GET | `/escuela-virtual` | Escuela Virtual form |
| GET | `/emprendimiento` | Emprendimiento form |
| POST | `/enviar/{slug}` | Save form data |
| GET | `/admin` | Admin overview |
| GET | `/admin/formulario/:nombre` | Per-form dashboard |
| GET | `/admin/formulario/:nombre/export` | Download as `.xlsx` |
| GET | `/admin/detalle/:id` | Modal detail |

Form slugs: `escuela_nueva`, `ppp`, `escuela_virtual`, `emprendimiento`.

---

## Data model (shared)

Two levels per row:
- **respuesta**: municipio, institucion, semaforo
- **estrategias**: list of `{nombre, tipo, estado, valor, observaciones}`

### Semáforo
Only `tipo: "aplica"` strategies count:
- <50% = Rojo
- 50–74% = Amarillo
- ≥75% = Verde

### Strategy tipos
- `"aplica"` — toggle "Aplica" / "No aplica" (most strategies)
- `"numero"` — numeric input (only in Emprendimiento: "Dinero existente", "Número de proyectos apoyados en el 2025")

## Conventions

- All UI text in **Spanish**.
- Old CSS: `public/styles-admin.css`, `public/styles-formularios.css`
- New CSS (GitHub Pages): `css/admin.css`, `css/forms.css`
- No tests (`npm test` is a no-op placeholder).
- No CI/CD, no pre-commit hooks, no lint config.
- `.env` is gitignored.
- Only the `main` branch.
