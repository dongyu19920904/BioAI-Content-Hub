"""Create a sourced Chinese project-demo narration and timed video assets.

This is an unpublished research-software demonstration, not a clinical claim.
"""

import hashlib
import json
import math
from pathlib import Path


SUMMARY = Path("automation/runs/pyaging-public-demo/summary.json")
OUTPUT = Path("automation/runs/pyaging-public-video")
SAMPLE_RATE = 24000
RESEARCH_URL = "https://github.com/lucascamillomd/pyaging/tree/v0.5.2"
PROJECT_ID = "project_" + hashlib.sha256(b"pyaging-public-demo-v1").hexdigest()[:16]


def checked_lines(summary):
    if summary.get("kind") != "public_research_demo_not_medical_advice":
        raise ValueError("Refuse an unreviewed research summary")
    if summary.get("library") != "pyaging" or summary.get("library_version") != "0.5.2":
        raise ValueError("Unexpected library version")
    if summary.get("library_source") != RESEARCH_URL or summary.get("sample_count") != 30:
        raise ValueError("Unexpected source or sample count")
    clocks = summary.get("clock_results", {})
    if set(clocks) != {"phenoage", "kdmage", "homeostaticdysregulation"}:
        raise ValueError("Unexpected clock outputs")
    values = [clocks[key].get("median") for key in ("phenoage", "kdmage", "homeostaticdysregulation")]
    if not all(isinstance(value, (float, int)) and math.isfinite(value) and 0 <= value < 150 for value in values):
        raise ValueError("Invalid aggregate values")
    pheno, kdm, dysreg = values
    return [
        "今天试跑一个开源科研工具，叫 pyaging。它研究生物年龄指标，不是延长寿命的疗法。",
        "我们只用了工具自带的三十条公开示例数据，没有上传任何人的病历。",
        f"这次试跑得到的聚合中位数是：PhenoAge {pheno:.2f}，KDM Age {kdm:.2f}。",
        f"第三个指标，稳态失调，是 {dysreg:.2f}。它不是年龄，不能读成多少岁。",
        "这些是软件在样本上的输出，不代表个人寿命、疾病诊断，也不能证明任何干预有效。",
        "项目源码和复现步骤在视频说明中。欢迎核查方法和局限，不要据此自行用药或改变治疗。",
    ]


def srt_time(seconds):
    milliseconds = round(seconds * 1000)
    hours, milliseconds = divmod(milliseconds, 3600000)
    minutes, milliseconds = divmod(milliseconds, 60000)
    secs, milliseconds = divmod(milliseconds, 1000)
    return f"{hours:02}:{minutes:02}:{secs:02},{milliseconds:03}"


def make_voice(texts):
    import numpy as np
    from kokoro import KPipeline

    pipeline = KPipeline(lang_code="z", repo_id="hexgrad/Kokoro-82M-v1.1-zh")
    clips = []
    for text in texts:
        pieces = [result.audio.cpu().numpy() for result in pipeline(text, voice="zf_001", speed=1.0)]
        if not pieces:
            raise RuntimeError("Kokoro generated no audio")
        clip = np.concatenate(pieces).astype("float32")
        if clip.size == 0 or not np.isfinite(clip).all():
            raise RuntimeError("Kokoro generated invalid audio")
        clips.append(clip)
    return clips


def main():
    summary = json.loads(SUMMARY.read_text(encoding="utf-8"))
    lines = checked_lines(summary)
    clips = make_voice(lines)
    import numpy as np
    import soundfile as sf

    OUTPUT.mkdir(parents=True, exist_ok=True)
    gap = np.zeros(round(SAMPLE_RATE * 0.35), dtype="float32")
    scenes = []
    subtitles = []
    audio = []
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
    (OUTPUT / "manifest.json").write_text(json.dumps({
        "kind": "unpublished_public_research_video_pilot",
        "project_id": PROJECT_ID,
        "source": RESEARCH_URL,
        "model": "hexgrad/Kokoro-82M-v1.1-zh",
        "model_license": "Apache-2.0 (per model card; recheck before commercial release)",
        "sample_count": 30,
        "duration_seconds": round(current, 3),
        "channel_status": "not_published",
        "claim_status": "bounded_public_software_demo_not_medical_advice",
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": "assets_ready", "duration_seconds": round(current, 3), "project_id": PROJECT_ID}, ensure_ascii=False))


if __name__ == "__main__":
    main()
