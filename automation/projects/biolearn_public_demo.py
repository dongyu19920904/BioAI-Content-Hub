"""Run Biolearn's pinned NHANES example and export aggregate software output only."""

import json
import math
import subprocess
from pathlib import Path
from statistics import median


UPSTREAM_SHA = "2bc00d55bac6eac2f95600e4d118103942a98277"
UPSTREAM = Path("upstream-biolearn")
OUTPUT = Path("automation/runs/biolearn-public-demo/summary.json")


def build_summary(row_count, predictions):
    """Exclude respondent rows, NHANES IDs and individual predictions."""
    if not isinstance(row_count, int) or row_count < 1 or len(predictions) != row_count:
        raise ValueError("Unexpected public NHANES output shape")
    valid = []
    for value in predictions:
        try:
            number = float(value)
        except (TypeError, ValueError):
            continue
        if math.isfinite(number):
            valid.append(number)
    if not valid:
        raise ValueError("No finite model outputs")
    return {
        "project": "bio-learn/biolearn",
        "upstream_commit": UPSTREAM_SHA,
        "sample": "upstream load_nhanes(2010), public US NHANES linked data",
        "sample_rows_after_upstream_filtering": row_count,
        "valid_model_outputs": len(valid),
        "median_model_output": round(median(valid), 2),
        "result_scope": "software execution on historical public data; not an intervention study",
        "clinical_interpretation": "none; not a personal diagnosis or lifespan result",
    }


def main():
    actual_sha = subprocess.check_output(
        ["git", "-C", str(UPSTREAM), "rev-parse", "HEAD"], text=True
    ).strip()
    if actual_sha != UPSTREAM_SHA:
        raise ValueError("Upstream commit changed")

    from biolearn.hematology import phenotypic_age
    from biolearn.load import load_nhanes

    data = load_nhanes(2010)
    if "age" not in data.columns:
        raise ValueError("Expected public NHANES age column missing")
    predictions = phenotypic_age(data)
    summary = build_summary(len(data), list(predictions))
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
