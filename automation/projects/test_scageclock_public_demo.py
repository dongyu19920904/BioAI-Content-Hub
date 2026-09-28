import math
import unittest

from scageclock_public_demo import build_summary


class FakeFrame:
    def __init__(self, values):
        self.columns = {"cell_id", "cell_age_true", "cell_age_predicted"}
        self.values = values

    def __len__(self):
        return len(self.values)

    def __getitem__(self, key):
        if key == "cell_age_predicted":
            return self.values
        raise KeyError(key)


class SummaryTests(unittest.TestCase):
    def test_only_aggregate_fields_are_exported(self):
        result = build_summary(FakeFrame([42.0] * 500))
        self.assertEqual(result["sample_cell_count"], 500)
        self.assertEqual(result["median_model_output"], 42.0)
        self.assertNotIn("cell_id", result)
        self.assertNotIn("cell_age_predicted", result)

    def test_rejects_changed_sample_size_and_invalid_output(self):
        with self.assertRaises(ValueError):
            build_summary(FakeFrame([42.0] * 499))
        with self.assertRaises(ValueError):
            build_summary(FakeFrame([math.nan] * 500))


if __name__ == "__main__":
    unittest.main()
