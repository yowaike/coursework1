from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models

router = APIRouter()

#функция для получения учителей
@router.get("/")
def read_teachers(db: Session = Depends(get_db)):
    return db.query(models.Teacher).all()

#функция для создания учителя
@router.post("/")
def create_teacher(item: dict, db: Session = Depends(get_db)):
    obj = models.Teacher(**item)
    db.add(obj)
    db.commit()
    return obj