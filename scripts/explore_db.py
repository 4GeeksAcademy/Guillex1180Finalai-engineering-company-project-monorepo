"""Explore database to understand available tables and telemetry data."""
from __future__ import annotations
from sqlmodel import Session, text
from services.api.database import engine

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


with Session(engine) as s:
    # List tables
    result = s.exec(text("""
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
    """))
    print("=== Tables ===")
    tables = [r[0] for r in result]
    for t in tables:
        print(f"  {t}")

    # Check telemetry_events columns
    if 'telemetry_events' in tables:
        result = s.exec(text("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'telemetry_events'
            ORDER BY ordinal_position
        """))
        print("\n=== telemetry_events columns ===")
        for r in result:
            print(
                f"  {r.column_name:20s} {r.data_type:20s} nullable={r.is_nullable}")

        # Count
        result = s.exec(text("SELECT COUNT(*) FROM telemetry_events"))
        count = result.first()[0]
        print(f"\nTotal rows: {count}")

        if count > 0:
            # Event types
            result = s.exec(text("""
                SELECT event_type, level, COUNT(*) as cnt
                FROM telemetry_events
                GROUP BY event_type, level
                ORDER BY cnt DESC
                LIMIT 30
            """))
            print("\n=== Event types ===")
            for r in result:
                print(f"  {r.event_type:40s} level={r.level:6s} count={r.cnt}")

            # Date range
            result = s.exec(text("""
                SELECT MIN(timestamp) as min_ts, MAX(timestamp) as max_ts
                FROM telemetry_events
            """))
            r = result.first()
            print(f"\nDate range: {r.min_ts} to {r.max_ts}")

            # Sample
            result = s.exec(text("""
                SELECT id, timestamp, event_type, level, value, message, tags
                FROM telemetry_events
                ORDER BY timestamp DESC
                LIMIT 3
            """))
            print("\n=== Sample rows ===")
            for r in result:
                tags_str = json.dumps(r.tags)[:300] if r.tags else "{}"
                print(
                    f"  id={str(r.id)[:16]}... ts={str(r.timestamp)[:22]} type={r.event_type:30s} level={r.level:6s} value={r.value}")
                print(f"    tags={tags_str}")

            # Auth events
            result = s.exec(text("""
                SELECT event_type, COUNT(*) as cnt
                FROM telemetry_events
                WHERE event_type LIKE '%auth%' OR event_type LIKE '%login%'
                GROUP BY event_type
            """))
            print("\n=== Auth events ===")
            auth_count = 0
            for r in result:
                print(f"  {r.event_type:40s} count={r.cnt}")
                auth_count += r.cnt
            if auth_count == 0:
                print("  (none)")

            # Latency events
            result = s.exec(text("""
                SELECT event_type, COUNT(*) as cnt
                FROM telemetry_events
                WHERE event_type LIKE '%latency%' OR event_type LIKE '%api_%'
                GROUP BY event_type
            """))
            print("\n=== API/performance events ===")
            lat_count = 0
            for r in result:
                print(f"  {r.event_type:40s} count={r.cnt}")
                lat_count += r.cnt
            if lat_count == 0:
                print("  (none)")
    else:
        print("\nNOTE: telemetry_events table does not exist on Supabase yet.")
        print("The table is created by SQLModel.metadata.create_all() on app startup.")
        print("Let's check what the TelemetryRecord model expects...")

        # Check what other tables exist
        if 'telemetryevent' in tables:
            print(
                "\nFound 'telemetryevent' table (TelemetryEvent model, not TelemetryRecord)")
            result = s.exec(text("""
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'telemetryevent'
                ORDER BY ordinal_position
            """))
            for r in result:
                print(f"  {r.column_name:20s} {r.data_type:20s}")
