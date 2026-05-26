from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..dependencies import get_current_user, require_roles
from ..schemas import NoteCreate

router = APIRouter()

# функция для получения заметок (ученик — свои, завуч — все)
@router.get("/")
async def get_notes(
    request: Request,
    student_id: int = Query(None),
    db: Session = Depends(get_db)
):
    user = await get_current_user(request)
    query = db.query(models.Note)
    
    if user["role"] == "student":
        # ученик видит только свои заметки
        student = db.query(models.Student).join(models.User).filter(
            models.User.email == user["email"]
        ).first()
        if student:
            query = query.filter(models.Note.student_id == student.id)
        else:
            return []
    elif user["role"] == "admin":
        # завуч может фильтровать по student_id
        if student_id:
            query = query.filter(models.Note.student_id == student_id)
    else:
        # учитель — пока пустой список
        return []
    
    notes = query.all()
    return [
        {
            "id": note.id,
            "student_id": note.student_id,
            "student_name": note.student.user.full_name if note.student and note.student.user else None,
            "text": note.text,
            "date": str(note.date)
        }
        for note in notes
    ]

# функция для создания заметки (ученик — себе, завуч — любому)
@router.post("/")
async def add_note(
    data: NoteCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    user = await get_current_user(request)
    
    if user["role"] == "student":
        # ученик может создавать заметки только для себя
        student = db.query(models.Student).join(models.User).filter(
            models.User.email == user["email"]
        ).first()
        if not student:
            raise HTTPException(status_code=404, detail="Профиль ученика не найден")
        if student.id != data.student_id:
            raise HTTPException(status_code=403, detail="Вы можете создавать заметки только для себя")
    elif user["role"] == "admin":
        # завуч может создавать заметки для любого ученика
        pass
    else:
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    new_note = models.Note(**data.dict())
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return {
        "id": new_note.id,
        "student_id": new_note.student_id,
        "text": new_note.text,
        "date": str(new_note.date)
    }