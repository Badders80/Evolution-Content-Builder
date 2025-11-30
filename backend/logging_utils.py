import json
import logging
import sys
from typing import Any


def setup_logging(level: int = logging.INFO) -> logging.Logger:
    logger = logging.getLogger("evo")
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter("%(message)s")
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    logger.setLevel(level)
    return logger


def log_event(event: str, **kwargs: Any):
    logger = logging.getLogger("evo")
    payload = {"event": event, **kwargs}
    try:
        logger.info(json.dumps(payload))
    except Exception:
        logger.info({"event": event, **kwargs})

