from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models
from ..dependencies import get_current_user

router = APIRouter()


@router.get("/my")
async def my_notifications(request: Request, db: Session = Depends(get_db)):
    u = await get_current_user(request)
    db_user = db.query(models.User).filter(models.User.email == u["email"]).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    rows = db.query(models.Notification).filter(models.Notification.user_id == db_user.id).order_by(models.Notification.id.desc()).limit(200).all()
    return [
        {
            "id": n.id,
            "type": n.type,
            "payload_json": n.payload_json,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in rows
    ]


@router.post("/{notification_id}/read")
async def mark_read(notification_id: int, request: Request, db: Session = Depends(get_db)):
    u = await get_current_user(request)
    db_user = db.query(models.User).filter(models.User.email == u["email"]).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    n = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if not n or n.user_id != db_user.id:
        raise HTTPException(status_code=404, detail="Уведомление не найдено")
    n.is_read = True
    db.commit()
    return {"msg": "ok"}

