"""Run the pinned scAgeClock research example without exporting cell-level data."""

import json
import math
import subprocess
from pathlib import Path


UPSTREAM_SHA = "d4ce49daa85b959b537053f35e811017373ec096"
UPSTREAM = Path("upstream-scageclock")
MODEL = UPSTREAM / "data/trained_models/scAgeClock_GMA_model_state_dict.pth"
SAMPLE_DIR = UPSTREAM / "data/pytest_data/k_fold_mode/train_val/Fold1"
OUTPUT = Path("automation/runs/scageclock-public-demo/summary.json")


def build_summary(results):
    """Keep only aggregate software output, never the upstream cell IDs/rows."""
    if len(results) != 500 or not {"cell_age_true", "cell_age_predicted"} <= set(results.columns):
        raise ValueError("Unexpected public example output shape")
    predictions = [float(value) for value in results["cell_age_predicted"]]
    if not all(math.isfinite(value) for value in predictions):
        raise ValueError("Non-finite model output")
    from statistics import median

    return {
        "project": "gangcai/scageclock",
        "upstream_commit": UPSTREAM_SHA,
        "sample": "upstream Fold1 public 500-cell training/validation example",
        "sample_cell_count": len(predictions),
        "median_model_output": round(median(predictions), 2),
        "result_scope": "software execution on upstream example; not independent validation",
        "clinical_interpretation": "none; not a personal biological-age or lifespan result",
    }


def main():
    actual_sha = subprocess.check_output(
        ["git", "-C", str(UPSTREAM), "rev-parse", "HEAD"], text=True
    ).strip()
    if actual_sha != UPSTREAM_SHA:
        raise ValueError("Upstream commit changed")
    if not MODEL.is_file() or not list(SAMPLE_DIR.glob("*.h5ad")):
        raise FileNotFoundError("Pinned public model or example missing")

    from scageclock.evaluation import prediction

    results = prediction(model_file=str(MODEL), h5ad_dir=str(SAMPLE_DIR))
    summary = build_summary(results)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
