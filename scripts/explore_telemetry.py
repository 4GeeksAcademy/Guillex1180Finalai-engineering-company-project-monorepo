"""Explore telemetry_events table to understand available data for HITO 18."""
from __future__ import annotations
from sqlmodel import Session, text
from services.api.database import engine

import json
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


with Session(engine) as s:
    # Check if telemetry_events exists
    try:
        result = s.exec(text("SELECT to_regclass('telemetry_events')"))
        row = result.first()
        print(f"Table exists (to_regclass): {row[0] if row else None}")
    except Exception as e:
        print(f"to_regclass error: {e}")
        # SQLite fallback
        result = s.exec(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='telemetry_events'"))
        row = result.first()
        print(f"Table exists (sqlite_master): {row[0] if row else None}")

    # Count rows
    result = s.exec(text("SELECT COUNT(*) FROM telemetry_events"))
    count = result.first()[0]
    print(f"\nTotal rows: {count}")

    if count == 0:
        print("\nNo data in telemetry_events. Need to seed or use Railway data.")
        sys.exit(0)

    # Show event types
    result = s.exec(text("""
        SELECT event_type, level, COUNT(*) as cnt
        FROM telemetry_events
        GROUP BY event_type, level
        ORDER BY cnt DESC
        LIMIT 30
    """))
    print("\n=== Event types by count ===")
    for r in result:
        print(f"  {r.event_type:40s} level={r.level:6s} count={r.cnt}")

    # Date range
    result = s.exec(text("""
        SELECT MIN(timestamp) as min_ts, MAX(timestamp) as max_ts
        FROM telemetry_events
    """))
    r = result.first()
    print(f"\nDate range: {r.min_ts} to {r.max_ts}")

    # Sample rows
    result = s.exec(text("""
        SELECT id, timestamp, event_type, level, value, message, service, tags
        FROM telemetry_events
        ORDER BY timestamp DESC
        LIMIT 5
    """))
    print("\n=== Sample rows (most recent) ===")
    for r in result:
        tags_str = json.dumps(r.tags)[:300] if r.tags else "{}"
        print(
            f"  id={r.id[:16]}... ts={str(r.timestamp)[:22]} type={r.event_type:30s} level={r.level:6s} value={r.value} msg={r.message}")
        print(f"    tags={tags_str}")

    # Check auth events specifically
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

    # Check latency events
    result = s.exec(text("""
        SELECT event_type, COUNT(*) as cnt
        FROM telemetry_events
        WHERE event_type LIKE '%latency%' OR event_type LIKE '%api_%'
        GROUP BY event_type
    """))
    print("\n=== API performance events ===")
    lat_count = 0
    for r in result:
        print(f"  {r.event_type:40s} count={r.cnt}")
        lat_count += r.cnt
    if lat_count == 0:
        print("  (none)")
