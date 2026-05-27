from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..dependencies import get_current_user, require_role
from ..schemas import SubjectCreate, SubjectUpdate

router = APIRouter()

# получить предметы (роль-зависимая выборка)
@router.get("/")
async def get_subjects(
    db: Session = Depends(get_db),
    request: Request = None,
):
    user = await get_current_user(request)

    if user["role"] == "admin":
        subjects = db.query(models.Subject).all()
    elif user["role"] == "teacher":
        teacher = (
            db.query(models.Teacher)
            .join(models.User)
            .filter(models.User.email == user["email"])
            .first()
        )
        if not teacher:
            return []
        subjects = db.query(models.Subject).filter(models.Subject.id == teacher.subject_id).all()
    elif user["role"] == "student":
        student = (
            db.query(models.Student)
            .join(models.User)
            .filter(models.User.email == user["email"])
            .first()
        )
        if not student:
            return []
        subject_ids = [
            r[0]
            for r in (
                db.query(models.Schedule.subject_id)
                .filter(models.Schedule.class_id == student.class_id)
                .distinct()
                .all()
            )
        ]
        if not subject_ids:
            return []
        subjects = db.query(models.Subject).filter(models.Subject.id.in_(subject_ids)).all()
    else:
        raise HTTPException(status_code=403, detail="Недостаточно прав")

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

# редактировать предмет (только завуч)
@router.put("/{subject_id}")
async def update_subject(
    subject_id: int,
    data: SubjectUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_role("admin")),
):
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Предмет не найден")
    if data.name is not None:
        subject.name = data.name
    if data.description is not None:
        subject.description = data.description
    db.commit()
    db.refresh(subject)
    return {"id": subject.id, "name": subject.name, "description": subject.description}

# удалить предмет (только завуч)
@router.delete("/{subject_id}")
async def delete_subject(subject_id: int, db: Session = Depends(get_db), user: dict = Depends(require_role("admin"))):
    subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Предмет не найден")
    db.delete(subject)
    db.commit()
    return {"message": "Предмет удален"}
