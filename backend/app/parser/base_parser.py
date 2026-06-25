"""
Generic End-of-Line log parser.
Handles the hierarchical CSV format used by all production lines.
Each line supplies a meta_keys dict to map its specific header names.
"""
import re
from pathlib import Path
from datetime import datetime

_DATE_FORMATS = [
    "%m/%d/%Y %I:%M:%S %p",
    "%m/%d/%Y %H:%M:%S",
    "%d/%m/%Y %H:%M:%S",
]


def _parse_date(raw: str) -> str:
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(raw.strip(), fmt).isoformat()
        except ValueError:
            continue
    return raw.strip()


def parse_log(
    file_path: Path,
    dataset: str,
    file_index: int,
    meta_keys: dict[str, str],
    line: str,
) -> list[dict]:
    """
    Parse a single EOL log CSV file.

    meta_keys maps internal field names → CSV row labels, e.g.:
        {"serie": "Serial", "modelo": "Model", "fecha": "Date", "tiempo_total": "Time"}
    """
    try:
        text = file_path.read_text(encoding="utf-8", errors="replace")
        lines = text.splitlines()
    except Exception:
        return []

    if len(lines) < 6:
        return []

    # --- Metadata (rows 0-3) ---
    raw_meta: dict[str, str] = {}
    for row in lines[:4]:
        parts = row.split(",")
        if len(parts) >= 2:
            raw_meta[parts[0].strip()] = parts[1].strip()

    serie = raw_meta.get(meta_keys.get("serie", "Serie"), "")
    modelo = raw_meta.get(meta_keys.get("modelo", "Modelo"), "")
    fecha = _parse_date(raw_meta.get(meta_keys.get("fecha", "Fecha"), ""))
    try:
        tiempo_total = float(raw_meta.get(meta_keys.get("tiempo_total", "Tiempo"), 0))
    except ValueError:
        tiempo_total = 0.0

    # --- Test data (row 5 onward; row 4 is column header) ---
    records: list[dict] = []
    current_test: str | None = None
    current_result: str | None = None
    current_test_time: float = 0.0

    for row in lines[5:]:
        parts = row.split(",")
        if not parts:
            continue

        desc = parts[0]
        valor = parts[1].strip() if len(parts) > 1 else ""
        resultado = parts[2].strip() if len(parts) > 2 else ""
        tiempo = parts[3].strip() if len(parts) > 3 else ""

        desc_stripped = desc.strip().lower()

        if desc_stripped == "value":
            # Capture voltage measurements only (unit "v")
            if "v" in valor.lower() and current_test is not None:
                num = re.search(r"[-+]?[\d.]+(?:e[-+]?\d+)?", valor)
                if num:
                    try:
                        records.append(
                            {
                                "serie": serie,
                                "modelo": modelo,
                                "fecha": fecha,
                                "tiempo_total": tiempo_total,
                                "test_name": current_test,
                                "result": "PASS" if current_result == "P" else "FAIL",
                                "measurement": float(num.group()),
                                "unit": "v",
                                "test_time": current_test_time,
                                "file_index": file_index,
                                "dataset": dataset,
                                "line": line,
                            }
                        )
                    except ValueError:
                        pass
        elif resultado in ("P", "F"):
            current_test = desc.strip()
            current_result = resultado
            tm = re.search(r"[\d.]+", tiempo)
            current_test_time = float(tm.group()) if tm else 0.0

    return records


def parse_dataset(
    dataset_path: Path,
    dataset_name: str,
    meta_keys: dict[str, str],
    line: str,
) -> list[dict]:
    """Parse all CSV files in a dataset directory."""
    if not dataset_path.exists():
        return []
    all_records: list[dict] = []
    for idx, csv_file in enumerate(sorted(dataset_path.glob("*.csv")), start=1):
        all_records.extend(parse_log(csv_file, dataset_name, idx, meta_keys, line))
    return all_records
