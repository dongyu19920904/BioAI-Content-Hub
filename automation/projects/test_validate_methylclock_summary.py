"""No per-sample data may enter the published methylclock artifact."""

import unittest

from validate_methylclock_summary import UPSTREAM_COMMIT, validate


class MethylclockSummaryTests(unittest.TestCase):
    def setUp(self):
        self.summary = {
            "upstream_repository": "isglobal-brge/methylclock",
            "upstream_commit": UPSTREAM_COMMIT,
            "package_version": "1.99.2",
            "r_version": "4.6.0",
            "sample_source": "bundled methylclock_betas public research subset",
            "input_cpg_rows": 919,
            "public_sample_columns": 16,
            "coverage": [
                {"clock": name, "n_cpgs": 10, "present": 10, "pct_present": 100}
                for name in ("Horvath", "Levine", "Wu")
            ],
            "horvath_finite_outputs": 16,
            "horvath_median_model_output": 42.0,
        }

    def test_accepts_aggregates(self):
        validate(self.summary)

    def test_rejects_sample_rows(self):
        self.summary["individual_estimates"] = [{"id": "sample1", "age": 42}]
        with self.assertRaises(ValueError):
            validate(self.summary)

    def test_rejects_partial_coverage(self):
        self.summary["coverage"][0]["present"] = 9
        with self.assertRaises(ValueError):
            validate(self.summary)

    def test_rejects_wrong_revision(self):
        self.summary["upstream_commit"] = "latest"
        with self.assertRaises(ValueError):
            validate(self.summary)


if __name__ == "__main__":
    unittest.main()
