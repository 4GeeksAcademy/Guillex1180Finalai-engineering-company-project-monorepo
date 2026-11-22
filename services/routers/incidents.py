"""Authenticated incident CSV analysis endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import Response

from services.incidents import analyze_records, json_summary, parse_incident_csv, results_csv
from services.api.security import CurrentUser

router = APIRouter(prefix="/api/incidents", tags=["incidents"])

# Keep the latest result per authenticated operator, so one user's export can
# never receive another user's report. Move this mapping to shared storage for
# a multi-worker/production deployment.
_latest_analysis: dict[str, dict[str, object]] = {}


@router.post("/analyze")
async def analyze_incidents(
    current_user: CurrentUser,
    file: UploadFile = File(...),
) -> dict[str, object]:
    """Accept and analyze an incident CSV uploaded as multipart/form-data."""
    if file.content_type not in {"text/csv", "text/plain", "application/vnd.ms-excel", "application/octet-stream"}:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="El archivo debe ser un CSV (text/csv).",
        )
    try:
        content = await file.read()
        records = parse_incident_csv(content)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    finally:
        await file.close()

    summary = analyze_records(records)
    global _latest_analysis
    _latest_analysis[current_user["id"]] = summary
    return json_summary(summary)


@router.get("/results/export")
def export_latest_analysis(current_user: CurrentUser) -> Response:
    """Download the latest aggregate analysis as CSV (no source PII)."""
    summary = _latest_analysis.get(current_user["id"])
    if summary is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todavía no hay un análisis disponible para exportar.",
        )
    return Response(
        content=results_csv(summary),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": 'attachment; filename="incidents-results.csv"'},
    )
