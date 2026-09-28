import unittest

from render_scageclock_video import checked_lines


class RenderScAgeClockVideoTest(unittest.TestCase):
    def setUp(self):
        self.summary = {
            "project": "gangcai/scageclock",
            "upstream_commit": "d4ce49daa85b959b537053f35e811017373ec096",
            "sample": "upstream Fold1 public 500-cell training/validation example",
            "sample_cell_count": 500,
            "median_model_output": 66.14,
            "result_scope": "software execution on upstream example; not independent validation",
            "clinical_interpretation": "none; not a personal biological-age or lifespan result",
        }

    def test_script_retains_uncertainty_and_source_scope(self):
        script = "".join(checked_lines(self.summary))
        self.assertIn("不是独立测试集", script)
        self.assertIn("不是任何人的生物年龄", script)
        self.assertIn("不能证明干预有效", script)
        self.assertIn("66.14", script)

    def test_rejects_wrong_revision_or_personal_interpretation(self):
        self.summary["upstream_commit"] = "not-the-pinned-version"
        with self.assertRaises(ValueError):
            checked_lines(self.summary)
        self.summary["upstream_commit"] = "d4ce49daa85b959b537053f35e811017373ec096"
        self.summary["clinical_interpretation"] = "personal age prediction"
        with self.assertRaises(ValueError):
            checked_lines(self.summary)

    def test_rejects_nonfinite_aggregate(self):
        self.summary["median_model_output"] = float("nan")
        with self.assertRaises(ValueError):
            checked_lines(self.summary)


if __name__ == "__main__":
    unittest.main()
