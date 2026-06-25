from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import os
import shutil
import tempfile

from app.parser.mp_parser import parse_dataset as parse_mp_dataset, parse_mp_log
from app.parser.ds_parser import parse_dataset as parse_ds_dataset, parse_ds_log
from app.parser.s31xx_parser import parse_dataset as parse_31xx_dataset, parse_31xx_log
from app.services.analysis_service import analyze_dataset

app = FastAPI(title="EOL Log Analyzer API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_VALID_DATASETS = ("busbar_anterior", "busbar_nuevo")
_VALID_LINES = ("mp", "ds", "31xx")

# Per-line, per-dataset record store
_store: dict[str, dict[str, list[dict]]] = {
    line: {ds: [] for ds in _VALID_DATASETS} for line in _VALID_LINES
}

# DATA_PATH env var lets Railway (or any server) override the default local path
BASE_DATA = Path(os.environ.get("DATA_PATH", str(Path(__file__).resolve().parents[2] / "data" / "raw")))

# Maps line name → (bulk_parser_fn, single_file_parser_fn)
_PARSERS = {
    "mp":   (parse_mp_dataset,    parse_mp_log),
    "ds":   (parse_ds_dataset,    parse_ds_log),
    "31xx": (parse_31xx_dataset,  parse_31xx_log),
}


@app.on_event("startup")
async def _load_preexisting():
    """Auto-load CSV files from data/raw/{line}/{dataset}/ on startup."""
    for line in _VALID_LINES:
        parse_ds_fn, _ = _PARSERS[line]
        for ds in _VALID_DATASETS:
            path = BASE_DATA / line / ds
            records = parse_ds_fn(path, ds)
            _store[line][ds] = records
            print(f"[startup] {line}/{ds}: {len(records)} voltage records")


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "records": {
            line: {ds: len(recs) for ds, recs in datasets.items()}
            for line, datasets in _store.items()
        },
    }


# ── Upload ────────────────────────────────────────────────────────────────────

@app.post("/api/{line}/upload/{dataset_type}")
async def upload(line: str, dataset_type: str, files: list[UploadFile] = File(...)):
    if line not in _VALID_LINES:
        raise HTTPException(400, f"line must be one of {_VALID_LINES}")
    if dataset_type not in _VALID_DATASETS:
        raise HTTPException(400, f"dataset_type must be one of {_VALID_DATASETS}")

    _, parse_single = _PARSERS[line]
    records: list[dict] = []

    with tempfile.TemporaryDirectory() as tmp:
        for idx, f in enumerate(files, start=1):
            if not (f.filename or "").endswith(".csv"):
                continue
            dest = Path(tmp) / (f.filename or f"file_{idx}.csv")
            with dest.open("wb") as out:
                shutil.copyfileobj(f.file, out)
            records.extend(parse_single(dest, dataset_type, idx))

    _store[line][dataset_type] = records
    return {"message": "ok", "count": len(records)}


# ── Analysis ──────────────────────────────────────────────────────────────────

@app.get("/api/{line}/analysis")
def analysis(line: str):
    if line not in _VALID_LINES:
        raise HTTPException(400, f"line must be one of {_VALID_LINES}")
    return {
        "busbar_anterior": analyze_dataset(_store[line]["busbar_anterior"]),
        "busbar_nuevo": analyze_dataset(_store[line]["busbar_nuevo"]),
    }


@app.get("/api/{line}/measurements/{dataset_type}")
def measurements(line: str, dataset_type: str, test_name: str | None = None):
    if line not in _VALID_LINES:
        raise HTTPException(400, f"line must be one of {_VALID_LINES}")
    if dataset_type not in _store[line]:
        raise HTTPException(404, "Dataset not found")
    recs = _store[line][dataset_type]
    if test_name:
        recs = [r for r in recs if r["test_name"] == test_name]
    return recs
