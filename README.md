# EOL Log Analyzer

Statistical dashboard for End-of-Line (EOL) electrical test analysis in automotive manufacturing. Compares measurement distributions between busbar configurations across production lines to support process validation and change control decisions.

**Live demo:** [eologs-analyzer.up.railway.app](https://eologs-analyzer.up.railway.app)

---

## Context

In automotive electronics manufacturing, EOL tests are performed on every unit before shipment. Each unit goes through hundreds of voltage drop and continuity measurements. When a process change is introduced — such as replacing a busbar component — engineering must statistically validate that the new configuration performs within specification and that its variation is comparable to or better than the baseline.

This tool automates that comparison. It ingests raw EOL log files (CSV exports from test stations), computes per-test statistics, and renders interactive charts so engineers can identify regressions, outliers, and spec limit violations at a glance.

---

## Features

- **Multi-line support** — MP, DS, and 31XX production lines, each with its own CSV format
- **Dataset comparison** — side-by-side analysis of *busbar anterior* (baseline) vs *busbar nuevo* (proposed change)
- **5 chart types:**
  - Voltage Trend — individual measurement values over time with spec limit reference lines
  - Box Plot — quartile distribution comparison per test
  - Std Dev Chart — variability ranking across all tests (highlights outliers)
  - Pass/Fail Rate — per-test yield comparison
  - Histogram — measurement distribution shape (normal vs skewed)
- **Test search & filter** — searchable dropdown for navigating 430+ unique tests in the 31XX line
- **Spec limit overlay** — Limit Inferior / Limit Superior rendered as reference lines when a test is selected
- **CSV upload** — load new log files at runtime without redeployment

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + Uvicorn (Python 3.11) |
| Data processing | NumPy, pandas-free custom parsers |
| Frontend | Next.js 14 (App Router) + TypeScript |
| Charts | Recharts + custom SVG box plot |
| Styling | Tailwind CSS v3 (dark theme) |
| Deployment | Railway (two services from one repo) |

---

## Supported Log Formats

### MP / DS lines — hierarchical format
CSV exports with metadata header rows and measurement rows in the form `value,X.XXX v`. The parser extracts voltage readings grouped by serial number and test sequence.

### 31XX line — flat tabular format
```
Serial,Numero_Parte,Prueba,Limit_Inf,Limit_Sup,Salida_Real,Tiempo,Estatus
261661593,W16ZZZZ0002AA,Main_Voltage Drop_JB2_31,,,0.00123,0.045,Pasa
```
Each row is a self-contained measurement. The `Prueba` field encodes the full test path using `_` as a separator. A short-label heuristic resolves ambiguous connector pin references (e.g. `JB2_31`).

---

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app, routes, background data loader
│   │   ├── parser/
│   │   │   ├── mp_parser.py         # MP line CSV parser
│   │   │   ├── ds_parser.py         # DS line CSV parser
│   │   │   └── s31xx_parser.py      # 31XX line flat-tabular parser
│   │   └── services/
│   │       └── analysis_service.py  # NumPy statistics (mean, std, quartiles, cpk)
│   ├── data/raw/                    # Pre-loaded CSV files (git-tracked)
│   │   ├── mp/{busbar_anterior,busbar_nuevo}/
│   │   ├── ds/{busbar_anterior,busbar_nuevo}/
│   │   └── 31xx/{busbar_anterior,busbar_nuevo}/
│   ├── requirements.txt
│   ├── runtime.txt                  # Pins Python 3.11 for Railway/nixpacks
│   └── railway.toml
├── frontend/
│   ├── src/
│   │   ├── app/page.tsx             # Line selector + main layout
│   │   ├── components/
│   │   │   ├── Dashboard.tsx        # Chart orchestration, test filter, stats table
│   │   │   └── charts/              # Individual Recharts components
│   │   ├── services/api.ts          # Typed fetch wrappers
│   │   └── types/index.ts           # Shared TypeScript interfaces
│   └── railway.toml
└── README.md
```

---

## Local Development

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
# API available at http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
# App available at http://localhost:3000
```

---

## API Reference

| Endpoint | Description |
|---|---|
| `GET /api/health` | Service health + loaded record counts |
| `GET /api/{line}/analysis` | Full statistical analysis for both datasets |
| `GET /api/{line}/measurements/{dataset}` | Raw measurement records (optional `?test_name=` filter) |
| `POST /api/{line}/upload/{dataset}` | Upload new CSV files to replace dataset |

`{line}` is one of `mp`, `ds`, `31xx`. `{dataset}` is `busbar_anterior` or `busbar_nuevo`.

---

## Railway Deployment

Two services from the same GitHub repository, each with a different root directory:

| Service | Root directory | Environment variable |
|---|---|---|
| Backend | `backend/` | `DATA_PATH=/app/data/raw` |
| Frontend | `frontend/` | `NEXT_PUBLIC_API_URL=https://<backend-domain>` |

The backend data loader runs as an asyncio background task so uvicorn reaches `Application startup complete` immediately, satisfying Railway's health check before CSV parsing finishes.
