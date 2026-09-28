"""Turn the verified public scAgeClock run into a bounded Chinese video pack."""

import hashlib
import json
import math
from pathlib import Path

from render_pyaging_video import SAMPLE_RATE, make_voice, srt_time


SUMMARY = Path("automation/runs/scageclock-public-demo/summary.json")
OUTPUT = Path("automation/runs/scageclock-public-video")
SOURCE = "https://github.com/gangcai/scageclock/tree/d4ce49daa85b959b537053f35e811017373ec096"
PAGE = "https://life.aivora.cn/projects/scageclock-public-demo/"
PROJECT_ID = "project_" + hashlib.sha256(b"scageclock-public-demo-v1").hexdigest()[:16]


def checked_lines(summary):
    if (summary.get("project") != "gangcai/scageclock" or summary.get("upstream_commit") != "d4ce49daa85b959b537053f35e811017373ec096"):
        raise ValueError("Unexpected software or upstream revision")
    if summary.get("sample_cell_count") != 500 or summary.get("sample") != "upstream Fold1 public 500-cell training/validation example":
        raise ValueError("Unexpected public example")
    if summary.get("result_scope") != "software execution on upstream example; not independent validation":
        raise ValueError("Independent validation cannot be inferred")
    if summary.get("clinical_interpretation") != "none; not a personal biological-age or lifespan result":
        raise ValueError("Clinical interpretation is not allowed")
    value = summary.get("median_model_output")
    if not isinstance(value, (int, float)) or not math.isfinite(value) or not 0 <= value < 150:
        raise ValueError("Invalid aggregate model output")
    return [
        "今天试跑第二个开源研究工具，单细胞时钟 scAgeClock。我们只使用原仓库公开的五百个细胞示例。",
        "这批示例来自训练和验证目录，并不是独立测试集。软件跑通，不等于模型得到临床验证。",
        f"这次模型输出的中位数是 {value:.2f}。它只是这批公开样本的聚合数值。",
        "它不是任何人的生物年龄或寿命预测，也不能证明干预有效。我们没有上传个人健康数据。",
        "源码、复跑按钮和局限说明都在视频简介里的项目页。欢迎核对，不要据此做医疗决定。",
    ]


def main():
    summary = json.loads(SUMMARY.read_text(encoding="utf-8"))
    lines = checked_lines(summary)
    clips = make_voice(lines)
    import numpy as np
    import soundfile as sf

    OUTPUT.mkdir(parents=True, exist_ok=True)
    gap = np.zeros(round(SAMPLE_RATE * 0.35), dtype="float32")
    scenes, subtitles, audio = [], [], []
    current = 0.0
    for index, (line, clip) in enumerate(zip(lines, clips, strict=True), 1):
        duration = (len(clip) + len(gap)) / SAMPLE_RATE
        if duration < 1 or duration > 25:
            raise RuntimeError("A narration scene has an implausible duration")
        scenes.append({"seconds": round(duration, 3), "text": line})
        subtitles.append(f"{index}\n{srt_time(current)} --> {srt_time(current + duration)}\n{line}\n")
        audio.extend((clip, gap))
        current += duration
    if current > 90:
        raise RuntimeError("Video exceeds the 90-second renderer limit")
    sf.write(OUTPUT / "narration.wav", np.concatenate(audio), SAMPLE_RATE)
    (OUTPUT / "storyboard.json").write_text(json.dumps({"opportunity_id": PROJECT_ID, "scenes": scenes}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUTPUT / "subtitles.srt").write_text("\n".join(subtitles), encoding="utf-8")
    (OUTPUT / "bilibili-description.md").write_text(
        "# 公开样本试跑 scAgeClock：软件复现，不是个人检测\n\n"
        "本视频展示 scAgeClock 在原仓库 500 细胞训练/验证示例上的运行。模型输出中位数只是聚合数值，"
        "不是独立验证、个人生物年龄或延寿证据。没有上传个人健康数据。\n\n"
        f"项目说明与复跑入口：{PAGE}?utm_source=bilibili&utm_medium=video&utm_campaign={PROJECT_ID}\n\n"
        f"上游开源项目：{SOURCE}\n\n"
        "仅作科研软件演示，非医疗建议。\n",
        encoding="utf-8",
    )
    (OUTPUT / "manifest.json").write_text(json.dumps({
        "kind": "unpublished_public_research_video_pilot",
        "project_id": PROJECT_ID,
        "source": SOURCE,
        "project_page": PAGE,
        "model": "hexgrad/Kokoro-82M-v1.1-zh",
        "model_license": "Apache-2.0 (per model card; recheck before commercial release)",
        "sample_count": 500,
        "median_model_output": summary["median_model_output"],
        "duration_seconds": round(current, 3),
        "channel_status": "not_published",
        "claim_status": "bounded_public_software_demo_not_medical_advice",
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": "assets_ready", "duration_seconds": round(current, 3), "project_id": PROJECT_ID}, ensure_ascii=False))


if __name__ == "__main__":
    main()
