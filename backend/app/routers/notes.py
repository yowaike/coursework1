from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models

router = APIRouter()

#функция для получения заметок
@router.get("/")
def get_notes(db: Session = Depends(get_db)):
    return db.query(models.Note).all()

#функция для добавления заметки
@router.post("/")
def add_note(data: dict, db: Session = Depends(get_db)):
    new_note = models.Note(**data)
    db.add(new_note)
    db.commit()
    return new_note