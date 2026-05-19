from fastapi import APIRouter, Depends
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