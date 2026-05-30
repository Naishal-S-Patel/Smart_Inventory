from __future__ import annotations

from pathlib import Path
from typing import Iterable

import matplotlib
import matplotlib.pyplot as plt


matplotlib.use("Agg")


def save_bar_chart(labels: Iterable[str], values: Iterable[float], title: str, path: Path) -> Path:
    plt.figure(figsize=(10, 5))
    plt.bar(list(labels), list(values))
    plt.title(title)
    plt.xlabel("Category")
    plt.ylabel("Value")
    plt.xticks(rotation=30, ha="right")
    plt.tight_layout()
    path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(path)
    plt.close()
    return path


def save_line_chart(x_values: Iterable[str], y_values: Iterable[float], title: str, path: Path) -> Path:
    plt.figure(figsize=(10, 5))
    plt.plot(list(x_values), list(y_values), marker="o")
    plt.title(title)
    plt.xlabel("Date")
    plt.ylabel("Value")
    plt.xticks(rotation=30, ha="right")
    plt.tight_layout()
    path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(path)
    plt.close()
    return path
