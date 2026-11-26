"""Check database more thoroughly - including Railway's telemetry data."""
from __future__ import annotations
from sqlmodel import Session, text
from services.api.database import engine

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


with Session(engine) as s:
    # List all tables in all schemas
    result = s.exec(text("""
        SELECT table_schema, table_name
        FROM information_schema.tables
        WHERE table_type = 'BASE TABLE'
        ORDER BY table_schema, table_name
    """))
    print("=== ALL tables ===")
    tables_found = False
    for r in result:
        tables_found = True
        print(f"  {r.table_schema}.{r.table_name}")
    if not tables_found:
        print("  (none found via information_schema)")

    # Try pg_tables
    result = s.exec(text("""
        SELECT schemaname, tablename
        FROM pg_catalog.pg_tables
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
        ORDER BY schemaname, tablename
    """))
    print("\n=== pg_tables (non-system) ===")
    pg_found = False
    for r in result:
        pg_found = True
        print(f"  {r.schemaname}.{r.tablename}")
    if not pg_found:
        print("  (none or pg_tables not available)")

    # Check current schema
    result = s.exec(text("SELECT current_schema()"))
    print(f"\nCurrent schema: {result.first()[0]}")

    # Check search_path
    result = s.exec(text("SHOW search_path"))
    print(f"search_path: {result.first()[0]}")

    # Try to SELECT from telemetry_events directly (will error if not exists)
    try:
        result = s.exec(text("SELECT COUNT(*) FROM telemetry_events"))
        print(f"\ntelemetry_events COUNT: {result.first()[0]}")
    except Exception as e:
        print(f"\ntelemetry_events: {e}")

    # Try telemetryevent (TelemetryEvent model)
    try:
        result = s.exec(text("SELECT COUNT(*) FROM telemetryevent"))
        print(f"\ntelemetryevent COUNT: {result.first()[0]}")
    except Exception as e:
        print(f"\ntelemetryevent: {e}")

    # Try telemetry_record
    try:
        result = s.exec(text("SELECT COUNT(*) FROM telemetry_record"))
        print(f"\ntelemetry_record COUNT: {result.first()[0]}")
    except Exception as e:
        print(f"\ntelemetry_record: {e}")
