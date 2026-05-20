from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models

router = APIRouter()

#функция для просмотра классов
@router.get("/")
def get_classes(db: Session = Depends(get_db)):
    return db.query(models.Class).all()

#функция для добавления класса
@router.post("/")
def add_class(item: dict, db: Session = Depends(get_db)):
    new_cls = models.Class(**item)
    db.add(new_cls)
    db.commit()
    return new_cls

#функция для удаления класса
@router.delete("/{class_id}")
def delete_class(class_id: int, db: Session = Depends(get_db)):
    cls = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Класс не найден")
    db.delete(cls)
    db.commit()
    return {"msg": "Класс удален"}