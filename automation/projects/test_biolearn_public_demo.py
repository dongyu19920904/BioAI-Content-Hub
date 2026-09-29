import math
import unittest

from biolearn_public_demo import UPSTREAM_SHA, build_summary


class BiolearnPublicDemoTest(unittest.TestCase):
    def test_aggregate_only(self):
        result = build_summary(4, [10, 20, math.nan, 30])
        self.assertEqual(result["upstream_commit"], UPSTREAM_SHA)
        self.assertEqual(result["valid_model_outputs"], 3)
        self.assertEqual(result["median_model_output"], 20)
        self.assertEqual(len(result), 8)
        self.assertNotIn("participant_id", result)

    def test_refuses_wrong_shape_or_no_valid_output(self):
        with self.assertRaises(ValueError):
            build_summary(2, [5])
        with self.assertRaises(ValueError):
            build_summary(1, [math.nan])


if __name__ == "__main__":
    unittest.main()
