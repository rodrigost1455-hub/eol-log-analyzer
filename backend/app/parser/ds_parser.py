from pathlib import Path
from .base_parser import parse_log, parse_dataset as _parse_dataset

LINE = "DS"

# DS logs use English column headers in the metadata section
_META_KEYS = {
    "serie": "Serial",   # value is typically "Nest 1", "Nest 2", etc.
    "modelo": "Model",
    "fecha": "Date",
    "tiempo_total": "Time",
}


def parse_ds_log(file_path: Path, dataset: str, file_index: int) -> list[dict]:
    return parse_log(file_path, dataset, file_index, _META_KEYS, LINE)


def parse_dataset(dataset_path: Path, dataset_name: str) -> list[dict]:
    return _parse_dataset(dataset_path, dataset_name, _META_KEYS, LINE)
