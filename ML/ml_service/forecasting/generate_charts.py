from __future__ import annotations

import logging
from pathlib import Path

import pandas as pd
import plotly.graph_objects as go


logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parents[1]
FORECAST_DIR = BASE_DIR / "reports" / "forecasts"
CHARTS_DIR = BASE_DIR / "reports" / "charts"
REQUIRED_COLUMNS = {"ds", "yhat", "yhat_lower", "yhat_upper"}


def _load_forecast_csvs() -> list[Path]:
    if not FORECAST_DIR.exists():
        return []
    return sorted(path for path in FORECAST_DIR.glob("*_forecast.csv") if path.is_file())


def _validate_columns(df: pd.DataFrame, path: Path) -> bool:
    missing = REQUIRED_COLUMNS.difference(df.columns)
    if missing:
        logger.warning("forecast_missing_columns", extra={"path": str(path), "missing": list(missing)})
        return False
    return True


def _build_forecast_chart(df: pd.DataFrame, product_id: str) -> go.Figure:
    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=df["ds"],
            y=df["yhat"],
            mode="lines",
            name="forecast",
            line=dict(color="#1f77b4", width=2),
        )
    )
    fig.add_trace(
        go.Scatter(
            x=df["ds"],
            y=df["yhat_upper"],
            mode="lines",
            line=dict(width=0),
            showlegend=False,
            hoverinfo="skip",
        )
    )
    fig.add_trace(
        go.Scatter(
            x=df["ds"],
            y=df["yhat_lower"],
            mode="lines",
            line=dict(width=0),
            fill="tonexty",
            fillcolor="rgba(31, 119, 180, 0.2)",
            name="confidence interval",
        )
    )
    fig.update_layout(
        title=f"Demand Forecast - {product_id}",
        xaxis_title="Date",
        yaxis_title="Units",
        template="plotly_white",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        margin=dict(l=40, r=20, t=60, b=40),
    )
    fig.update_xaxes(tickformat="%Y-%m-%d")
    return fig


def _build_trend_chart(df: pd.DataFrame, product_id: str) -> go.Figure:
    rolling = df["yhat"].rolling(window=7, min_periods=1).mean()
    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=df["ds"],
            y=rolling,
            mode="lines",
            name="7-day trend",
            line=dict(color="#2ca02c", width=2),
        )
    )
    fig.update_layout(
        title=f"Forecast Trend - {product_id}",
        xaxis_title="Date",
        yaxis_title="Units",
        template="plotly_white",
        margin=dict(l=40, r=20, t=60, b=40),
    )
    fig.update_xaxes(tickformat="%Y-%m-%d")
    return fig


def _build_confidence_chart(df: pd.DataFrame, product_id: str) -> go.Figure:
    band_width = df["yhat_upper"] - df["yhat_lower"]
    fig = go.Figure()
    fig.add_trace(
        go.Scatter(
            x=df["ds"],
            y=band_width,
            mode="lines",
            name="confidence band width",
            line=dict(color="#ff7f0e", width=2),
        )
    )
    fig.update_layout(
        title=f"Confidence Interval Width - {product_id}",
        xaxis_title="Date",
        yaxis_title="Units",
        template="plotly_white",
        margin=dict(l=40, r=20, t=60, b=40),
    )
    fig.update_xaxes(tickformat="%Y-%m-%d")
    return fig


def _write_chart(fig: go.Figure, output_path: Path) -> None:
    CHARTS_DIR.mkdir(parents=True, exist_ok=True)
    fig.write_image(str(output_path))
    print(f"Saved chart: {output_path}")


def generate_charts() -> None:
    charts_dir = CHARTS_DIR
    charts_dir.mkdir(parents=True, exist_ok=True)

    forecast_files = _load_forecast_csvs()
    if not forecast_files:
        print(f"No forecast CSVs found in {FORECAST_DIR}")
        return

    for path in forecast_files:
        df = pd.read_csv(path)
        if not _validate_columns(df, path):
            continue
        df = df.copy()
        df["ds"] = pd.to_datetime(df["ds"], errors="coerce")
        df = df.dropna(subset=["ds"])
        product_id = path.stem.replace("_forecast", "")

        forecast_fig = _build_forecast_chart(df, product_id)
        trend_fig = _build_trend_chart(df, product_id)
        confidence_fig = _build_confidence_chart(df, product_id)

        _write_chart(forecast_fig, charts_dir / f"{product_id}_forecast.png")
        _write_chart(trend_fig, charts_dir / f"{product_id}_trend.png")
        _write_chart(confidence_fig, charts_dir / f"{product_id}_confidence.png")


def main() -> None:
    generate_charts()


if __name__ == "__main__":
    main()
