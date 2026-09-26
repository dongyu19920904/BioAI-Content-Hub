"""Run a public-data aging-clock smoke test; never ingest personal health data."""

import json
import math
from pathlib import Path

import pandas as pd
import pyaging as pya


OUTPUT = Path("automation/runs/pyaging-public-demo/summary.json")
CLOCKS = ("phenoage", "kdmage", "homeostaticdysregulation")


def main() -> None:
    example_path = Path(pya.data.download_example_data("blood_chemistry_example"))
    frame = pd.read_pickle(example_path)
    if frame.shape[0] != 30 or "age" not in frame.columns:
        raise RuntimeError("Unexpected public example dataset; stop rather than improvise")

    samples = pya.preprocess.df_to_adata(frame)
    pya.pred.predict_age(samples, list(CLOCKS))
    results = {}
    for name in CLOCKS:
        values = pd.to_numeric(samples.obs[name], errors="raise")
        if len(values) != len(frame) or not all(math.isfinite(float(value)) for value in values):
            raise RuntimeError(f"Non-finite or incomplete {name} predictions")
        results[name] = {"median": round(float(values.median()), 2)}

    summary = {
        "kind": "public_research_demo_not_medical_advice",
        "library": "pyaging",
        "library_version": "0.5.2",
        "library_source": "https://github.com/lucascamillomd/pyaging/tree/v0.5.2",
        "example_data": "blood_chemistry_example (30 public NHANES IV records via pyaging/BioAge)",
        "sample_count": len(frame),
        "clock_results": results,
        "limitations_zh": "仅为公开样本的可复现软件试跑。时钟分数不是寿命、诊断或个人干预效果；不得用于个人医疗建议。",
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": "ok", "sample_count": len(frame), "clocks": list(results)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
