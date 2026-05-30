from __future__ import annotations

from io import StringIO
from typing import Iterable

import pandas as pd
from fastapi.responses import Response


def dataframe_to_csv_response(df: pd.DataFrame, filename: str) -> Response:
    buffer = StringIO()
    df.to_csv(buffer, index=False)
    return Response(
        content=buffer.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


def records_to_dataframe(records: Iterable[dict]) -> pd.DataFrame:
    return pd.DataFrame(list(records))
