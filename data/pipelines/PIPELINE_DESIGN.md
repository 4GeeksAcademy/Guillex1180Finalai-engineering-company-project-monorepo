# Pipeline Design — Business Performance Weekly Report (HITO 19)

## Overview

TrackFlow's weekly business performance pipeline reads telemetry events and
produces one row per `(warehouse, client_id, week_start)` with four business
KPIs defined in the company BRIEFING.

This pipeline is built with **Prefect 3** for resilience (retries, caching,
partial-failure tolerance) and is designed to run either as a CLI script or
triggered via the REST API.

## Stakeholders

- **Thomas (CEO)** — needs a Monday-morning report without calling anyone.
- **Ana (Head of Warehouse Operations)** — uses throughput and stockout data
  to plan warehouse capacity.

## Frequency

The pipeline is designed for a **weekly** cadence, fresh Monday morning UTC.
It can also be triggered manually on demand via the API or CLI.

**Execution command:**

```bash
python data/pipelines/pipeline.py
```

Optional date range:

```bash
python data/pipelines/pipeline.py --start-date 2026-07-13 --end-date 2026-07-20
```

## Stages

### 1. Extract (`extract_business_events`)

- Reads from `telemetry_events` (read-only).
- Filters to business event types: `inbound_order_created`,
  `outbound_order_created`, `stock_threshold_triggered`,
  `inventory_discrepancy_detected`.
- Accepts `start_date` / `end_date` parameters.

### 2. Transform (`transform_aggregate_kpis`)

- Parses `tags` JSON to extract `warehouse` and `client_id`.
- Resolves `client_id` via `inventoryclient` and `sku` tables.
- Computes ISO week start (Monday) from `timestamp`.
- Aggregates 4 KPIs per `(warehouse, client_id, week_start)`:
  - `inbound_units_count` — sum of quantity from inbound events
  - `outbound_orders_count` — count of outbound events
  - `stockout_events_count` — count of stockout events
  - `discrepancy_rate` — discrepancy_count / total_business_events × 100
- **Cached** for 1 hour based on the date range and client_map hash.

### 3. Load (`load_upsert_results`)

- UPSERT into `reporting.weekly_warehouse_client_performance`.
- Uses `ON CONFLICT (warehouse, client_id, week_start) DO UPDATE`.
- Idempotent: running twice on the same data produces identical results.

### 4. Notify (optional / non-critical) (`notify_pipeline_complete`)

- Logs a summary of the run.
- If this task fails, the pipeline continues (uses `return_state=True`).

## Resilience Strategy

| Concern                 | Mechanism                                                                   |
| ----------------------- | --------------------------------------------------------------------------- |
| DB connection flakiness | `retries=3, retry_delay_seconds=10` on extract & load tasks                 |
| Expensive transform     | `cache_key_fn`, `cache_expiration=3600` (1 hour)                            |
| Partial failure         | Notify task uses `return_state=True` — failure doesn't block ETL            |
| Idempotency             | `UPSERT` via `INSERT … ON CONFLICT DO UPDATE`                               |
| Run metadata            | `pipeline_run_log` table with 5 fields: start, end, records, status, errors |

## Entities

| Table                                 | Schema             | Purpose                                                  |
| ------------------------------------- | ------------------ | -------------------------------------------------------- |
| `telemetry_events`                    | public (read-only) | Source of business events                                |
| `weekly_warehouse_client_performance` | reporting          | Destination for weekly KPI rows                          |
| `pipeline_run_log`                    | reporting          | Execution metadata (start, end, records, status, errors) |

## Data Flow

```
telemetry_events ──→ extract ──→ transform (cache) ──→ load (upsert) ──→ reporting table
                                               ↓
                                        notify (optional)
```
