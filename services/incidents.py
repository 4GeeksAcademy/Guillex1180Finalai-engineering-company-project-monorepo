"""Reusable TrackFlow incident CSV validation and aggregation logic."""

from __future__ import annotations

import csv
import io
import re
from collections import Counter
from datetime import date
from typing import Any

CATEGORIES = (
    "LOST_PARCEL",
    "DELAYED_DELIVERY",
    "WRONG_ADDRESS",
    "RETURN_REQUEST",
    "DAMAGE",
)
STATUSES = ("OPEN", "CLOSED", "DISCARDED")
COUNTRIES = ("US", "ES")
CARRIERS_BY_COUNTRY = {
    "US": {"UPS", "FEDEX", "DHL_US"},
    "ES": {"MRW", "SEUR", "DHL_ES", "LOCAL_ES"},
}
REQUIRED_COLUMNS = (
    "incident_id", "date", "country", "customer_type", "tracking_number",
    "carrier", "category", "description", "status", "customer_email",
)
ISSUE_LABELS = {
    "tracking_number_invalid": "Invalid tracking number",
    "carrier_country_mismatch": "Carrier/country mismatch",
    "category_invalid": "Invalid or missing category",
    "email_invalid": "Invalid or missing email",
    "closed_without_score": "Closed incident, no score",
    "country_invalid": "Invalid or missing country",
    "incident_id_invalid": "Invalid or missing incident ID",
    "incident_id_duplicate": "Duplicate incident ID",
    "date_invalid": "Invalid or missing date",
    "customer_type_invalid": "Invalid or missing customer type",
    "description_invalid": "Invalid or missing description",
    "status_invalid": "Invalid or missing status",
    "score_invalid": "Invalid satisfaction score",
}


def _clean(value: Any) -> str:
    return "" if value is None else str(value).strip()


def validate_record(row: dict[str, str | None]) -> list[str]:
    """Return violated rule keys without retaining or exposing field values."""
    issues: list[str] = []
    country = _clean(row.get("country"))
    status = _clean(row.get("status"))
    score_text = _clean(row.get("satisfaction_score"))

    if not re.fullmatch(r"TRF-\d{6}", _clean(row.get("incident_id"))):
        issues.append("incident_id_invalid")

    date_text = _clean(row.get("date"))
    try:
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date_text):
            raise ValueError
        date.fromisoformat(date_text)
    except ValueError:
        issues.append("date_invalid")

    if country not in COUNTRIES:
        issues.append("country_invalid")
    if _clean(row.get("customer_type")) not in {"B2B", "B2C"}:
        issues.append("customer_type_invalid")
    if len(_clean(row.get("tracking_number"))) < 8:
        issues.append("tracking_number_invalid")

    carrier = _clean(row.get("carrier"))
    if country not in CARRIERS_BY_COUNTRY or carrier not in CARRIERS_BY_COUNTRY[country]:
        issues.append("carrier_country_mismatch")
    if _clean(row.get("category")) not in CATEGORIES:
        issues.append("category_invalid")
    if len(_clean(row.get("description"))) < 5:
        issues.append("description_invalid")
    if status not in STATUSES:
        issues.append("status_invalid")
    # The briefing defines the email check as presence of '@'; do not include
    # the supplied address in errors, logs, JSON responses, or exports.
    if "@" not in _clean(row.get("customer_email")):
        issues.append("email_invalid")

    if score_text:
        # Comparing against the allowed values avoids converting arbitrarily
        # long input strings to int (which can raise on modern Python).
        if score_text not in {"1", "2", "3", "4", "5"}:
            issues.append("score_invalid")
    elif status == "CLOSED":
        issues.append("closed_without_score")
    return issues


def parse_incident_csv(content: bytes) -> list[dict[str, str | None]]:
    """Decode and parse uploaded UTF-8 CSV content; raise ValueError descriptively."""
    if not content or not content.strip():
        raise ValueError("El fichero CSV está vacío.")
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise ValueError("El fichero debe estar codificado en UTF-8.") from exc

    # CSV exports from spreadsheet apps often use semicolons as their
    # regional delimiter. Choose the supported delimiter whose header
    # contains the most expected column names (comma wins ties).
    header_line = text.splitlines()[0] if text.splitlines() else ""
    delimiter = ","
    best_header_score = -1
    for candidate in (",", ";", "\t"):
        try:
            candidate_headers = next(csv.reader(
                [header_line], delimiter=candidate))
        except (csv.Error, StopIteration):
            continue
        score = len({name.strip()
                    for name in candidate_headers} & set(REQUIRED_COLUMNS))
        if score > best_header_score:
            delimiter = candidate
            best_header_score = score

    try:
        reader = csv.DictReader(
            io.StringIO(text, newline=""), strict=True, delimiter=delimiter)
        if reader.fieldnames is None:
            raise ValueError(
                "El fichero CSV no contiene una fila de encabezados.")
        reader.fieldnames = [name.strip() for name in reader.fieldnames]
        missing = [
            name for name in REQUIRED_COLUMNS if name not in reader.fieldnames]
        if missing:
            raise ValueError(
                "Faltan columnas obligatorias: " + ", ".join(missing))
        records: list[dict[str, str | None]] = []
        for row in reader:
            if row is None:
                continue
            # DictReader stores extra, unheaded cells under a None key.
            if None in row:
                raise ValueError(
                    "El CSV tiene filas con más columnas que el encabezado.")
            records.append(row)
    except csv.Error as exc:
        raise ValueError("No se pudo interpretar el formato CSV.") from exc

    if not records:
        raise ValueError("El CSV no contiene registros para analizar.")
    return records


def analyze_records(records: list[dict[str, str | None]]) -> dict[str, Any]:
    """Return aggregate analysis; every distribution uses valid records only."""
    issue_counts: Counter[str] = Counter()
    valid_records: list[dict[str, str | None]] = []
    id_counts = Counter(_clean(row.get("incident_id")) for row in records)
    for row in records:
        issues = validate_record(row)
        incident_id = _clean(row.get("incident_id"))
        if incident_id and id_counts[incident_id] > 1:
            issues.append("incident_id_duplicate")
        if issues:
            # A row can violate multiple rules, but is counted as one invalid row.
            issue_counts.update(issues)
        else:
            valid_records.append(row)

    category_counts = Counter(_clean(row.get("category"))
                              for row in valid_records)
    status_counts = Counter(_clean(row.get("status")) for row in valid_records)
    country_counts = Counter(_clean(row.get("country"))
                             for row in valid_records)
    closed_scores = [
        int(_clean(row.get("satisfaction_score")))
        for row in valid_records
        if _clean(row.get("status")) == "CLOSED" and _clean(row.get("satisfaction_score"))
    ]
    score_counts = Counter(closed_scores)
    average_score = sum(closed_scores) / \
        len(closed_scores) if closed_scores else None

    return {
        "total_records": len(records),
        "valid_records": len(valid_records),
        "invalid_records": len(records) - len(valid_records),
        "issue_counts": dict(issue_counts),
        "category_counts": {key: category_counts.get(key, 0) for key in CATEGORIES},
        "status_counts": {key: status_counts.get(key, 0) for key in STATUSES},
        "country_counts": {key: country_counts.get(key, 0) for key in COUNTRIES},
        "scored_closed_count": len(closed_scores),
        "average_score": average_score,
        "score_counts": {str(score): score_counts.get(score, 0) for score in range(1, 6)},
    }


def results_csv(summary: dict[str, Any]) -> str:
    """Serialize only aggregate metrics, one metric per CSV row."""
    output = io.StringIO(newline="")
    writer = csv.writer(output)
    writer.writerow(("metric", "dimension", "value"))
    writer.writerow(("total_records", "all", summary["total_records"]))
    writer.writerow(("valid_records", "valid", summary["valid_records"]))
    writer.writerow(("invalid_records", "invalid", summary["invalid_records"]))
    for key, label in ISSUE_LABELS.items():
        writer.writerow(
            ("invalid_reason", label, summary["issue_counts"].get(key, 0)))
    for category in CATEGORIES:
        writer.writerow(("category_count", category,
                        summary["category_counts"].get(category, 0)))
    for status in STATUSES:
        writer.writerow(
            ("status_count", status, summary["status_counts"].get(status, 0)))
    for country in COUNTRIES:
        writer.writerow(("country_count", country,
                        summary["country_counts"].get(country, 0)))
    writer.writerow(("closed_scored_count", "CLOSED",
                    summary["scored_closed_count"]))
    average = summary["average_score"]
    writer.writerow(("average_satisfaction", "CLOSED",
                    f"{average:.2f}" if average is not None else ""))
    for score in range(1, 6):
        writer.writerow(("satisfaction_score_count", str(
            score), summary["score_counts"].get(str(score), 0)))
    return output.getvalue()


def json_summary(summary: dict[str, Any]) -> dict[str, Any]:
    """Shape the summary for a stable API response with human-readable issue labels."""
    return {
        "total_records": summary["total_records"],
        "valid_records": summary["valid_records"],
        "invalid_records": summary["invalid_records"],
        "invalid_breakdown": [
            {"code": code, "label": label,
                "count": summary["issue_counts"].get(code, 0)}
            for code, label in ISSUE_LABELS.items()
        ],
        "category_counts": summary["category_counts"],
        "status_counts": summary["status_counts"],
        "country_counts": summary["country_counts"],
        "satisfaction": {
            "scored_closed_count": summary["scored_closed_count"],
            "closed_count": summary["status_counts"].get("CLOSED", 0),
            "average_score": round(summary["average_score"], 2) if summary["average_score"] is not None else None,
            "score_counts": summary["score_counts"],
        },
    }
