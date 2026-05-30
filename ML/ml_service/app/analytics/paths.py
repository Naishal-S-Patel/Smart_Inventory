from __future__ import annotations

from pathlib import Path

from app.core.config import settings


BASE_DIR = Path(__file__).resolve().parents[2]
REPORTS_DIR = (BASE_DIR / settings.analytics_report_dir).resolve()
CHARTS_DIR = REPORTS_DIR / "charts"
EXPORTS_DIR = REPORTS_DIR / "exports"


def ensure_report_dirs() -> None:
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    CHARTS_DIR.mkdir(parents=True, exist_ok=True)
    EXPORTS_DIR.mkdir(parents=True, exist_ok=True)
