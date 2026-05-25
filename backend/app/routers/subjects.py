from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..dependencies import require_role
from ..schemas import SubjectCreate

router = APIRouter()

# получить все предметы (только завуч)
@router.get("/")
async def get_subjects(db: Session = Depends(get_db), user: dict = Depends(require_role("admin"))):
    subjects = db.query(models.Subject).all()
    return [
        {
            "id": subject.id,
            "name": subject.name,
            "description": subject.description
        }
        for subject in subjects
    ]

# создать предмет (только завуч)
@router.post("/")
async def create_subject(data: SubjectCreate, db: Session = Depends(get_db), user: dict = Depends(require_role("admin"))):
    new_subject = models.Subject(**data.dict())
    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)
    return {
        "id": new_subject.id,
        "name": new_subject.name,
        "description": new_subject.description
    }

# удалить предмет (только завуч)
@router.delete("/{subject_id}")
async def delete_subject(subject_id: int, db: Session = Depends(get_db), user: dict = Depends(require_role("admin"))):
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Предмет не найден")
    db.delete(subject)
    db.commit()
    return {"message": "Предмет удален"}
