#!/usr/bin/env python3
"""Command-line entry point for TrackFlow incident CSV analysis.

Usage from the repository root:
    python scripts/analyze.py incidents-trackflow.csv
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

# Make the repository root importable when this file is run directly by path.
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.incidents import (  # noqa: E402
    CATEGORIES,
    COUNTRIES,
    ISSUE_LABELS,
    STATUSES,
    analyze_records,
    parse_incident_csv,
    results_csv,
)


def print_report(summary: dict[str, Any], source_name: str) -> None:
    """Print aggregate results only; never emit individual incident data."""
    width = 60
    print("=" * width)
    print("  TRACKFLOW — INCIDENT REPORT ANALYSIS")
    print(f"  Source file: {source_name}")
    print("=" * width)
    print(f"TOTAL RECORDS IN FILE .......... {summary['total_records']}")
    print(f"  ├─ Valid records ................ {summary['valid_records']}")
    print(f"  └─ Invalid / incomplete .......... {summary['invalid_records']}")

    print("\nINVALID RECORDS BREAKDOWN")
    for issue_code, label in ISSUE_LABELS.items():
        print(
            f"  ├─ {label:.<34} {summary['issue_counts'].get(issue_code, 0)}")

    valid_total = summary["valid_records"]
    print("\nBREAKDOWN BY CATEGORY (valid records)")
    for category in CATEGORIES:
        count = summary["category_counts"].get(category, 0)
        percentage = count / valid_total * 100 if valid_total else 0
        print(f"  ├─ {category:.<28} {count:>3}  ({percentage:.1f}%)")

    print("\nBREAKDOWN BY STATUS (valid records)")
    for order_status in STATUSES:
        count = summary["status_counts"].get(order_status, 0)
        percentage = count / valid_total * 100 if valid_total else 0
        print(f"  ├─ {order_status:.<28} {count:>3}  ({percentage:.1f}%)")

    print("\nBREAKDOWN BY COUNTRY (valid records) — recomendado")
    for country in COUNTRIES:
        count = summary["country_counts"].get(country, 0)
        percentage = count / valid_total * 100 if valid_total else 0
        print(f"  ├─ {country:.<28} {count:>3}  ({percentage:.1f}%)")

    print("\nSATISFACTION INDEX (closed incidents)")
    closed_count = summary["status_counts"].get("CLOSED", 0)
    print(
        f"  Scored incidents: {summary['scored_closed_count']} of {closed_count}")
    average = summary["average_score"]
    print(
        f"  Average score: {average:.2f} / 5.00" if average is not None else "  Average score: N/A")
    score_labels = {1: "Very dissatisfied", 2: "Dissatisfied",
                    3: "Neutral", 4: "Satisfied", 5: "Very satisfied"}
    for score, label in score_labels.items():
        print(
            f"  ├─ Score {score} ({label}) ... {summary['score_counts'].get(str(score), 0)}")
    print("\n" + "=" * width)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Valida y resume un CSV de incidencias de TrackFlow.")
    parser.add_argument("csv_file", type=Path,
                        help="Ruta al fichero CSV de incidencias")
    args = parser.parse_args()

    try:
        records = parse_incident_csv(args.csv_file.read_bytes())
        summary = analyze_records(records)
    except (OSError, ValueError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 2

    print_report(summary, args.csv_file.name)
    try:
        answer = input(
            "¿Deseas exportar los resultados a CSV? [s / n]: ").strip().lower()
    except EOFError:
        print("\nSin entrada interactiva; no se exportaron resultados.")
        return 0

    if answer in {"s", "sí", "si"}:
        try:
            Path("results.csv").write_text(results_csv(
                summary), encoding="utf-8", newline="")
        except OSError as exc:
            print(f"No se pudo guardar results.csv: {exc}", file=sys.stderr)
            return 1
        print("Resultados exportados a results.csv")
    elif answer not in {"n", "no"}:
        print("Respuesta no reconocida; no se exportaron resultados.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
