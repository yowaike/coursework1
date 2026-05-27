import json
from typing import Any

from sqlalchemy.orm import Session

from . import models


def log_audit(
    db: Session,
    actor_user_id: int,
    action: str,
    entity_type: str,
    entity_id: int,
    before: Any | None = None,
    after: Any | None = None,
):
    row = models.AuditLog(
        actor_user_id=actor_user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        before_json=json.dumps(before, ensure_ascii=False) if before is not None else None,
        after_json=json.dumps(after, ensure_ascii=False) if after is not None else None,
    )
    db.add(row)

