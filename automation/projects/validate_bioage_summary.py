"""Check that the public BioAge artifact is a bounded aggregate, not row data."""

import json
import math
import sys
from pathlib import Path

EXPECTED_COMMIT = "b1f9fc02f086cd4aa74185f2335ab1366082e7fe"
EXPECTED_KEYS = {
    "upstream_repository",
    "upstream_commit",
    "sample_source",
    "nhanes3_rows",
    "nhanes4_rows",
    "biomarker_count",
    "valid_model_outputs",
    "median_model_output",
}


def validate(result: dict) -> None:
    if set(result) != EXPECTED_KEYS:
        raise ValueError("unexpected or missing fields")
    if result["upstream_repository"] != "dayoonkwon/BioAge":
        raise ValueError("wrong upstream repository")
    if result["upstream_commit"] != EXPECTED_COMMIT:
        raise ValueError("wrong upstream commit")
    if result["sample_source"] != "bundled public NHANES III and NHANES IV":
        raise ValueError("wrong sample source")
    for field in ("nhanes3_rows", "nhanes4_rows", "biomarker_count", "valid_model_outputs"):
        if type(result[field]) is not int or result[field] <= 0:
            raise ValueError(f"invalid {field}")
    if result["biomarker_count"] != 9:
        raise ValueError("wrong biomarker count")
    if result["valid_model_outputs"] > result["nhanes4_rows"]:
        raise ValueError("outputs exceed public sample rows")
    value = result["median_model_output"]
    if type(value) not in (int, float) or not math.isfinite(value):
        raise ValueError("median is not finite")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: validate_bioage_summary.py path/to/summary.json")
    validate(json.loads(Path(sys.argv[1]).read_text(encoding="utf-8")))
