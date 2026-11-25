"""Unit tests for the shared TrackFlow incident CSV analyzer."""

from __future__ import annotations

import unittest

from services.incidents import (
    analyze_records,
    json_summary,
    parse_incident_csv,
    results_csv,
    validate_record,
)


HEADERS = (
    "incident_id,date,country,customer_type,tracking_number,carrier,category,"
    "description,status,customer_email,satisfaction_score"
)


def record(**changes: str) -> dict[str, str]:
    row = {
        "incident_id": "TRF-000001",
        "date": "2026-11-21",
        "country": "US",
        "customer_type": "B2C",
        "tracking_number": "TRACK1234",
        "carrier": "UPS",
        "category": "DELAYED_DELIVERY",
        "description": "Package delayed",
        "status": "OPEN",
        "customer_email": "private@example.com",
        "satisfaction_score": "",
    }
    row.update(changes)
    return row


class IncidentAnalyzerTests(unittest.TestCase):
    def test_parses_utf8_bom_csv_and_validates(self) -> None:
        content = ("\ufeff" + HEADERS + "\n" +
                   "TRF-000001,2026-11-21,US,B2C,TRACK1234,UPS,DELAYED_DELIVERY,"
                   "Package delayed,OPEN,private@example.com,\n").encode()
        parsed = parse_incident_csv(content)
        self.assertEqual(len(parsed), 1)
        self.assertEqual(validate_record(parsed[0]), [])

    def test_parses_semicolon_delimited_csv_with_spaced_headers(self) -> None:
        headers = HEADERS.replace(",", ";")
        row = (
            "TRF-000001;2026-11-21;US;B2C;TRACK1234;UPS;DELAYED_DELIVERY;"
            "Package delayed;OPEN;private@example.com;"
        )
        parsed = parse_incident_csv(
            ("  " + headers + "  \n" + row + "\n").encode())
        self.assertEqual(len(parsed), 1)
        self.assertEqual(validate_record(parsed[0]), [])

    def test_rejects_missing_headers_and_empty_csv(self) -> None:
        with self.assertRaisesRegex(ValueError, "vacío"):
            parse_incident_csv(b" \n")
        with self.assertRaisesRegex(ValueError, "Faltan columnas"):
            parse_incident_csv(b"wrong,header\na,b\n")

    def test_rejects_unclosed_csv_quote(self) -> None:
        content = (HEADERS + "\n" +
                   'TRF-000001,2026-11-21,US,B2C,TRACK1234,UPS,DELAYED_DELIVERY,"unfinished,OPEN,private@example.com,\n').encode()
        with self.assertRaisesRegex(ValueError, "interpretar"):
            parse_incident_csv(content)

    def test_closed_requires_score_and_score_must_be_in_range(self) -> None:
        missing = validate_record(record(status="CLOSED"))
        self.assertIn("closed_without_score", missing)
        invalid = validate_record(
            record(status="CLOSED", satisfaction_score="9"))
        self.assertIn("score_invalid", invalid)
        huge = validate_record(record(satisfaction_score="9" * 5000))
        self.assertIn("score_invalid", huge)

    def test_duplicate_incident_ids_are_invalid(self) -> None:
        summary = analyze_records([record(), record(category="DAMAGE")])
        self.assertEqual(summary["invalid_records"], 2)
        self.assertEqual(summary["issue_counts"]["incident_id_duplicate"], 2)
        self.assertEqual(summary["valid_records"], 0)

    def test_valid_rows_are_aggregated_and_pii_is_not_exported(self) -> None:
        summary = analyze_records([
            record(status="CLOSED", satisfaction_score="4"),
            record(incident_id="TRF-000002", category="DAMAGE",
                   status="CLOSED", satisfaction_score="2"),
        ])
        self.assertEqual(summary["valid_records"], 2)
        self.assertEqual(summary["category_counts"]["DAMAGE"], 1)
        self.assertEqual(summary["status_counts"]["CLOSED"], 2)
        self.assertEqual(summary["average_score"], 3)
        self.assertEqual(json_summary(summary)[
                         "satisfaction"]["average_score"], 3)
        self.assertNotIn("private@example.com", results_csv(summary))


if __name__ == "__main__":
    unittest.main()
