from fastapi import APIRouter, Depends, HTTPException
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

#функция для удаления ученика
@router.delete("/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Ученик не найден")
    db.delete(student)
    db.commit()
    return {"msg": "Ученик удален"}