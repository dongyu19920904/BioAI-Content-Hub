"""Require a fixed methylclock sample and only aggregate public output."""

import json
import math
import sys
from pathlib import Path

UPSTREAM_COMMIT = "30be0284066fda7d2f81ec4bf427da56f0f89d1b"
EXPECTED_KEYS = {
    "upstream_repository",
    "upstream_commit",
    "package_version",
    "r_version",
    "sample_source",
    "input_cpg_rows",
    "public_sample_columns",
    "coverage",
    "horvath_finite_outputs",
    "horvath_median_model_output",
}


def validate(result: dict) -> None:
    if set(result) != EXPECTED_KEYS:
        raise ValueError("unexpected or missing fields")
    if result["upstream_repository"] != "isglobal-brge/methylclock":
        raise ValueError("wrong repository")
    if result["upstream_commit"] != UPSTREAM_COMMIT:
        raise ValueError("wrong upstream commit")
    if result["package_version"] != "1.99.2":
        raise ValueError("wrong package version")
    if result["sample_source"] != "bundled methylclock_betas public research subset":
        raise ValueError("wrong sample")
    if not isinstance(result["r_version"], str) or not result["r_version"].startswith("4.6."):
        raise ValueError("wrong R version")
    if result["input_cpg_rows"] != 919 or result["public_sample_columns"] != 16:
        raise ValueError("wrong public sample dimensions")
    coverage = result["coverage"]
    if not isinstance(coverage, list) or len(coverage) != 3:
        raise ValueError("missing coverage rows")
    for row, name in zip(coverage, ("Horvath", "Levine", "Wu")):
        if set(row) != {"clock", "n_cpgs", "present", "pct_present"} or row["clock"] != name:
            raise ValueError("wrong coverage clock or fields")
        if type(row["n_cpgs"]) is not int or row["n_cpgs"] <= 0:
            raise ValueError("invalid CpG count")
        if type(row["present"]) is not int or row["present"] != row["n_cpgs"]:
            raise ValueError("incomplete CpG coverage")
        if type(row["pct_present"]) not in (int, float) or row["pct_present"] != 100:
            raise ValueError("wrong coverage percent")
    count = result["horvath_finite_outputs"]
    if type(count) is not int or count != 16:
        raise ValueError("invalid finite output count")
    value = result["horvath_median_model_output"]
    if type(value) not in (int, float) or not math.isfinite(value):
        raise ValueError("invalid median")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: validate_methylclock_summary.py summary.json")
    validate(json.loads(Path(sys.argv[1]).read_text(encoding="utf-8")))
