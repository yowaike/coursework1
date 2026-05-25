from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..dependencies import get_current_user
from ..schemas import NoteCreate

router = APIRouter()

# получить заметки (для завуча - все, для ученика - только свои)
@router.get("/")
async def get_notes(
    student_id: int = Query(None),
    request: Request = None,
    db: Session = Depends(get_db)
):
    user = await get_current_user(request)
    query = db.query(models.Note)
    
    if user["role"] == "student":
        # Ученик может видеть только свои заметки
        student = db.query(models.Student).join(models.User).filter(
            models.User.email == user["email"]
        ).first()
        if student:
            query = query.filter(models.Note.student_id == student.id)
    elif student_id:
        # Завуч может фильтровать по student_id
        query = query.filter(models.Note.student_id == student_id)
    
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

# создать заметку (ученик для себя, завуч для кого угодно)
@router.post("/")
async def add_note(
    data: NoteCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    user = await get_current_user(request)
    
    if user["role"] == "student":
        # Ученик может создавать заметки только для себя
        student = db.query(models.Student).join(models.User).filter(
            models.User.email == user["email"]
        ).first()
        if not student or student.id != data.student_id:
            raise HTTPException(status_code=403, detail="Вы можете создавать заметки только для себя")
    
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
