from fastapi import APIRouter, Depends, HTTPException
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

#функция для удаления предмета
@router.delete("/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db)):
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Предмет не найден")
    db.delete(subject)
    db.commit()
    return {"msg": "Предмет удален"}