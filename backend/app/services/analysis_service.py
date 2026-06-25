import numpy as np


def _stats(values: list[float]) -> dict:
    if not values:
        return {"count": 0, "mean": 0.0, "std": 0.0, "min": 0.0, "max": 0.0,
                "q1": 0.0, "median": 0.0, "q3": 0.0}
    a = np.array(values, dtype=float)
    return {
        "count": int(len(a)),
        "mean": float(np.mean(a)),
        "std": float(np.std(a, ddof=1)) if len(a) > 1 else 0.0,
        "min": float(np.min(a)),
        "max": float(np.max(a)),
        "q1": float(np.percentile(a, 25)),
        "median": float(np.median(a)),
        "q3": float(np.percentile(a, 75)),
    }


def analyze_dataset(records: list[dict]) -> dict:
    """Compute KPIs, per-test stats, and return all measurement records."""
    if not records:
        return {
            "total_records": 0,
            "pass_count": 0,
            "fail_count": 0,
            "yield_pct": 0.0,
            "overall_stats": _stats([]),
            "test_stats": [],
            "measurements": [],
        }

    pass_count = sum(1 for r in records if r["result"] == "PASS")
    fail_count = len(records) - pass_count
    yield_pct = round(pass_count / len(records) * 100, 2)

    overall_stats = _stats([r["measurement"] for r in records])

    # Group by test_name
    groups: dict[str, list[dict]] = {}
    for r in records:
        groups.setdefault(r["test_name"], []).append(r)

    test_stats = []
    for name, grp in sorted(groups.items()):
        voltages = [r["measurement"] for r in grp]
        s = _stats(voltages)
        s["test_name"] = name
        s["pass_count"] = sum(1 for r in grp if r["result"] == "PASS")
        s["fail_count"] = sum(1 for r in grp if r["result"] == "FAIL")
        test_stats.append(s)

    return {
        "total_records": len(records),
        "pass_count": pass_count,
        "fail_count": fail_count,
        "yield_pct": yield_pct,
        "overall_stats": overall_stats,
        "test_stats": test_stats,
        "measurements": records,
    }
