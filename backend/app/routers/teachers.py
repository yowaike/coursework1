from fastapi import APIRouter, Depends, HTTPException
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

#функция для удаления учителя
@router.delete("/{teacher_id}")
def delete_teacher(teacher_id: int, db: Session = Depends(get_db)):
    teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Учитель не найден")
    db.delete(teacher)
    db.commit()
    return {"msg": "Учитель удален"}