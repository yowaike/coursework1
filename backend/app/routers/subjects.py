from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models

router = APIRouter()

#функция для получения предметов
@router.get("/")
def read_subjects(db: Session = Depends(get_db)):
    return db.query(models.Subject).all()

#функция для добавления предмета
@router.post("/")
def add_subject(item: dict, db: Session = Depends(get_db)):
    obj = models.Subject(**item)
    db.add(obj)
    db.commit()
    return obj