from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from .. import models
from ..dependencies import require_role

router = APIRouter()


@router.get("/", dependencies=[Depends(require_role("admin"))])
def list_audit_logs(
    entity_type: str | None = Query(None),
    actor_user_id: int | None = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    q = db.query(models.AuditLog).options(joinedload(models.AuditLog.actor)).order_by(models.AuditLog.id.desc())
    if entity_type:
        q = q.filter(models.AuditLog.entity_type == entity_type)
    if actor_user_id:
        q = q.filter(models.AuditLog.actor_user_id == actor_user_id)
    rows = q.limit(limit).all()
    return [
        {
            "id": r.id,
            "actor_user_id": r.actor_user_id,
            "actor_name": r.actor.full_name if r.actor else None,
            "action": r.action,
            "entity_type": r.entity_type,
            "entity_id": r.entity_id,
            "before_json": r.before_json,
            "after_json": r.after_json,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]

