"""Verify pipeline idempotency: run twice and check no duplicates."""
from sqlmodel import Session
from sqlalchemy import text as sa_text
from services.api.database import engine
import subprocess
import sys
import os

# Run pipeline once
print("=== Run 1 ===")
r1 = subprocess.run(
    [sys.executable, "services/reporting/pipeline_v2.py"],
    capture_output=True, text=True, env={**os.environ, "SUPABASE_DATABASE_URL": "", "INVENTORY_DATABASE_URL": "sqlite:///./data/trackflow_inventory.db"}
)
print(r1.stdout[-500:] if len(r1.stdout) > 500 else r1.stdout)

# Run pipeline again
print("\n=== Run 2 ===")
r2 = subprocess.run(
    [sys.executable, "services/reporting/pipeline_v2.py"],
    capture_output=True, text=True, env={**os.environ, "SUPABASE_DATABASE_URL": "", "INVENTORY_DATABASE_URL": "sqlite:///./data/trackflow_inventory.db"}
)
print(r2.stdout[-500:] if len(r2.stdout) > 500 else r2.stdout)

# Check for duplicates

with Session(engine) as session:
    count = session.execute(
        sa_text("SELECT COUNT(*) FROM weekly_warehouse_client_performance")).scalar()
    print(f"\nTotal KPI rows: {count}")

    dups = session.execute(sa_text("""
        SELECT warehouse, client_id, week_start, COUNT(*) as cnt
        FROM weekly_warehouse_client_performance
        GROUP BY warehouse, client_id, week_start
        HAVING cnt > 1
    """)).fetchall()

    if dups:
        print(f"❌ DUPLICATES FOUND: {dups}")
        sys.exit(1)
    else:
        print("✅ Idempotency verified: no duplicates after two runs")
        sys.exit(0)
