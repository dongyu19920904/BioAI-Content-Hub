"""Small privacy and identity checks for the BioAge summary contract."""

import unittest

from validate_bioage_summary import EXPECTED_COMMIT, validate


class BioAgeSummaryTests(unittest.TestCase):
    def setUp(self):
        self.summary = {
            "upstream_repository": "dayoonkwon/BioAge",
            "upstream_commit": EXPECTED_COMMIT,
            "sample_source": "bundled public NHANES III and NHANES IV",
            "nhanes3_rows": 100,
            "nhanes4_rows": 200,
            "biomarker_count": 9,
            "valid_model_outputs": 150,
            "median_model_output": 42.0,
        }

    def test_valid_aggregate(self):
        validate(self.summary)

    def test_rejects_row_data(self):
        self.summary["participant_rows"] = [{"id": 1}]
        with self.assertRaises(ValueError):
            validate(self.summary)

    def test_rejects_wrong_revision(self):
        self.summary["upstream_commit"] = "latest"
        with self.assertRaises(ValueError):
            validate(self.summary)

    def test_rejects_invalid_count(self):
        self.summary["valid_model_outputs"] = 201
        with self.assertRaises(ValueError):
            validate(self.summary)


if __name__ == "__main__":
    unittest.main()
