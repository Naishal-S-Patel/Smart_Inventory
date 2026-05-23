import json
import logging
import logging.config
from datetime import datetime, timezone
from typing import Any


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            log["exc_info"] = self.formatException(record.exc_info)
        if record.stack_info:
            log["stack_info"] = record.stack_info
        for key, value in record.__dict__.items():
            if key.startswith("_"):
                continue
            if key in {"args", "msg", "levelname", "levelno", "name", "exc_info"}:
                continue
            if key in log:
                continue
            log[key] = value
        return json.dumps(log, ensure_ascii=True)


def configure_logging(log_level: str) -> None:
    logging.config.dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "json": {"()": JsonFormatter},
            },
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "formatter": "json",
                }
            },
            "root": {"handlers": ["console"], "level": log_level},
        }
    )
