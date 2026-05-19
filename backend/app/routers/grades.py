from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models

router = APIRouter()

#функция для просмотра всех оценок
@router.get("/")
def get_grades(db: Session = Depends(get_db)):
    return db.query(models.Grade).all()

#функция для выставления оценки
@router.post("/")
def add_grade(data: dict, db: Session = Depends(get_db)):
    new_grade = models.Grade(**data)
    db.add(new_grade)
    db.commit()
    return new_grade