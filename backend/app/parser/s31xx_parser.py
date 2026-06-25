"""
Parser for 31XX flat-tabular EOL log CSV format.

CSV columns: Serial, Numero_Parte, Prueba, Limit_Inf, Limit_Sup, Salida_Real, Tiempo, Estatus
Unlike MP/DS (hierarchical), every data row is a self-contained measurement.
"""
from pathlib import Path

LINE = "31xx"


def _short_label(prueba: str) -> str:
    """
    Extract a short display label from the full Prueba path.
    Paths use '_' as section separator AND within connector pin refs (e.g. JB2_31).
    Heuristic: if the last segment is a bare number (connector pin), include the parent.
    """
    parts = prueba.split("_")
    last = parts[-1].strip() if parts else prueba
    if last.isdigit() and len(parts) >= 2:
        return f"{parts[-2]}_{last}"
    return last


def parse_31xx_log(file_path: Path, dataset: str, file_index: int) -> list[dict]:
    """Parse one 31XX CSV log file, returning one record per numeric measurement row."""
    try:
        text = file_path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return []

    lines = text.splitlines()
    if len(lines) < 2:
        return []

    records: list[dict] = []

    # Row 0 is the header; iterate from row 1
    for raw in lines[1:]:
        raw = raw.strip()
        if not raw:
            continue

        parts = raw.split(",")
        if len(parts) < 7:
            continue

        serial = parts[0].strip()
        numero_parte = parts[1].strip()
        prueba = parts[2].strip()
        limit_inf_s = parts[3].strip()
        limit_sup_s = parts[4].strip()
        salida_real_s = parts[5].strip()
        tiempo = parts[6].strip()
        estatus = parts[7].strip() if len(parts) > 7 else ""

        # Skip rows with no numeric measurement
        if not salida_real_s:
            continue
        try:
            measurement = float(salida_real_s)
        except ValueError:
            continue

        # Skip shallow setup/config rows (depth < 3 segments) — e.g. "Main_Set Power Supply 1 Current"
        # Real measurements are always nested at least 3 levels deep
        if prueba.count("_") < 2:
            continue

        limit_inf: float | None = None
        limit_sup: float | None = None
        try:
            if limit_inf_s:
                limit_inf = float(limit_inf_s)
        except ValueError:
            pass
        try:
            if limit_sup_s:
                limit_sup = float(limit_sup_s)
        except ValueError:
            pass

        result = "PASS" if estatus in ("Pasa", "Pass", "PASS") else "FAIL"

        records.append(
            {
                "serie": serial,
                "modelo": numero_parte,
                "fecha": "",
                "tiempo_total": 0.0,
                "test_name": prueba,
                "test_label": _short_label(prueba),
                "result": result,
                "measurement": measurement,
                "unit": "v",
                "limit_inf": limit_inf,
                "limit_sup": limit_sup,
                "test_time": tiempo,
                "file_index": file_index,
                "dataset": dataset,
                "line": LINE,
            }
        )

    return records


def parse_dataset(dataset_path: Path, dataset_name: str) -> list[dict]:
    """Parse all CSV files in a 31XX dataset directory."""
    if not dataset_path.exists():
        return []
    all_records: list[dict] = []
    for idx, csv_file in enumerate(sorted(dataset_path.glob("*.csv")), start=1):
        all_records.extend(parse_31xx_log(csv_file, dataset_name, idx))
    return all_records
