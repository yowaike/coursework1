from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models

router = APIRouter()

#функция для просмотра списка учеников
@router.get("/")
def get_students(db: Session = Depends(get_db)):
    return db.query(models.Student).all()

#функция для добавления ученика
@router.post("/")
def add_student(data: dict, db: Session = Depends(get_db)):
    new_st = models.Student(**data)
    db.add(new_st)
    db.commit()
    return new_st