import json
from typing import Any

from sqlalchemy.orm import Session

from . import models


def create_notification(db: Session, user_id: int, type_: str, payload: Any | None = None):
    n = models.Notification(
        user_id=user_id,
        type=type_,
        payload_json=json.dumps(payload, ensure_ascii=False) if payload is not None else None,
        is_read=False,
    )
    db.add(n)

