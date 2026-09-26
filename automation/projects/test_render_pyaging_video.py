import unittest

from render_pyaging_video import RESEARCH_URL, checked_lines, srt_time


class RenderPyagingVideoTest(unittest.TestCase):
    def setUp(self):
        self.summary = {
            "kind": "public_research_demo_not_medical_advice",
            "library": "pyaging", "library_version": "0.5.2", "library_source": RESEARCH_URL,
            "sample_count": 30,
            "clock_results": {"phenoage": {"median": 54.64}, "kdmage": {"median": 42.89}, "homeostaticdysregulation": {"median": 3.28}},
        }

    def test_rejects_unverified_input(self):
        self.summary["sample_count"] = 31
        with self.assertRaises(ValueError):
            checked_lines(self.summary)

    def test_script_distinguishes_research_from_lifespan_effect(self):
        script = "".join(checked_lines(self.summary))
        self.assertIn("不是延长寿命的疗法", script)
        self.assertIn("不是年龄", script)
        self.assertIn("不能证明任何干预有效", script)

    def test_srt_time(self):
        self.assertEqual(srt_time(61.234), "00:01:01,234")


if __name__ == "__main__":
    unittest.main()
