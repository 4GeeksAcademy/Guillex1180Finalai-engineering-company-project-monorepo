"""Authenticated incident CSV analysis endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import Response
from pydantic import BaseModel, ConfigDict

from services.incidents import analyze_records, json_summary, parse_incident_csv, results_csv
from services.api.security import CurrentUser

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


class InvalidIncidentReason(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str
    label: str
    count: int


class SatisfactionSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    scored_closed_count: int
    closed_count: int
    average_score: float | None
    score_counts: dict[str, int]


class IncidentAnalysisResponse(BaseModel):
    """Aggregate-only response; source CSV values and customer PII are excluded."""

    model_config = ConfigDict(extra="forbid")

    total_records: int
    valid_records: int
    invalid_records: int
    invalid_breakdown: list[InvalidIncidentReason]
    category_counts: dict[str, int]
    status_counts: dict[str, int]
    country_counts: dict[str, int]
    satisfaction: SatisfactionSummary


# Keep the latest result per authenticated operator, so one user's export can
# never receive another user's report. Move this mapping to shared storage for
# a multi-worker/production deployment.
_latest_analysis: dict[str, dict[str, object]] = {}


@router.post("/analyze", response_model=IncidentAnalysisResponse)
async def analyze_incidents(
    current_user: CurrentUser,
    file: UploadFile = File(...),
) -> IncidentAnalysisResponse:
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
        # The parser emits controlled validation messages (never source row
        # contents); keep any unexpected ValueError generic at the API edge.
        detail = str(exc) if str(exc) in {
            "El fichero CSV está vacío.",
            "El fichero debe estar codificado en UTF-8.",
            "El fichero CSV no contiene una fila de encabezados.",
            "El CSV no contiene registros para analizar.",
            "No se pudo interpretar el formato CSV.",
            "El CSV tiene filas con más columnas que el encabezado.",
        } or str(exc).startswith("Faltan columnas obligatorias: ") else "No se pudo validar el archivo CSV."
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=detail) from exc
    finally:
        await file.close()

    summary = analyze_records(records)
    global _latest_analysis
    _latest_analysis[current_user["id"]] = summary
    return IncidentAnalysisResponse.model_validate(json_summary(summary))


@router.get(
    "/results/export",
    response_model=None,
    response_class=Response,
    responses={
        200: {
            "description": "CSV with aggregate metrics only; no source-row PII.",
            "content": {"text/csv": {"schema": {"type": "string"}}},
        },
        404: {"description": "No analysis exists for this authenticated user."},
    },
)
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
