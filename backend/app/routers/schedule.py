from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models

router = APIRouter()

#функция для получения расписания
@router.get("/")
def read_schedule(db: Session = Depends(get_db)):
    return db.query(models.Schedule).all()

#функция для добавления урока в расписание
@router.post("/")
def add_schedule_item(item: dict, db: Session = Depends(get_db)):
    obj = models.Schedule(**item)
    db.add(obj)
    db.commit()
    return obj