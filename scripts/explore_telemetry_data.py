"""Check what tables exist and explore telemetry data on Supabase."""
from __future__ import annotations
import json
import pandas as pd
from sqlmodel import Session, text
from services.api.database import engine

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


with Session(engine) as s:
    # List tables in public
    result = s.exec(text("""
        SELECT tablename FROM pg_catalog.pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
    """))
    print("=== Tables in public ===")
    for r in result:
        print(f"  {r[0]}")

    # Check telemetry_events
    try:
        df = pd.read_sql(
            "SELECT COUNT(*) as cnt FROM telemetry_events", s.connection())
        print(f"\ntelemetry_events count: {df['cnt'].iloc[0]}")

        # Get event types
        df = pd.read_sql("""
            SELECT event_type, level, COUNT(*) as cnt
            FROM telemetry_events
            GROUP BY event_type, level
            ORDER BY cnt DESC
        """, s.connection())
        print(f"\n=== Event types ({len(df)} types) ===")
        for _, row in df.iterrows():
            print(
                f"  {row['event_type']:40s} level={str(row['level']):6s} count={row['cnt']}")

        # Date range
        df = pd.read_sql(
            "SELECT MIN(timestamp) as min_ts, MAX(timestamp) as max_ts FROM telemetry_events", s.connection())
        print(
            f"\nDate range: {df['min_ts'].iloc[0]} to {df['max_ts'].iloc[0]}")

        # Sample rows
        df = pd.read_sql("""
            SELECT id, timestamp, event_type, level, value, message, service, tags
            FROM telemetry_events
            ORDER BY timestamp DESC
            LIMIT 5
        """, s.connection())
        print(f"\n=== Sample rows ({len(df)}) ===")
        for _, row in df.iterrows():
            ts = str(row['timestamp'])[:22]
            tags_str = json.dumps(row['tags'])[:300] if row['tags'] else "{}"
            print(
                f"  id={str(row['id'])[:16]}... ts={ts} type={row['event_type']:30s} level={str(row['level']):6s} value={row['value']}")
            print(f"    tags={tags_str}")

        # Auth events
        df = pd.read_sql("""
            SELECT event_type, COUNT(*) as cnt
            FROM telemetry_events
            WHERE event_type LIKE '%%auth%%' OR event_type LIKE '%%login%%'
            GROUP BY event_type
        """, s.connection())
        print(f"\n=== Auth events ===")
        if len(df) > 0:
            for _, row in df.iterrows():
                print(f"  {row['event_type']:40s} count={row['cnt']}")
        else:
            print("  (none)")

        # API events
        df = pd.read_sql("""
            SELECT event_type, COUNT(*) as cnt
            FROM telemetry_events
            WHERE event_type LIKE '%%latency%%' OR event_type LIKE '%%api_%%' OR event_type LIKE '%%error%%'
            GROUP BY event_type
        """, s.connection())
        print(f"\n=== API/performance/error events ===")
        if len(df) > 0:
            for _, row in df.iterrows():
                print(f"  {row['event_type']:40s} count={row['cnt']}")
        else:
            print("  (none)")

        # Level distribution
        df = pd.read_sql("""
            SELECT level, COUNT(*) as cnt
            FROM telemetry_events
            GROUP BY level
            ORDER BY cnt DESC
        """, s.connection())
        print(f"\n=== Level distribution ===")
        for _, row in df.iterrows():
            print(f"  {row['level']:10s} count={row['cnt']}")

    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
