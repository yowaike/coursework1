from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..dependencies import get_current_user, require_role
from ..schemas import TeacherCreate

router = APIRouter()

# получить всех учителей (только завуч)
@router.get("/")
async def get_teachers(db: Session = Depends(get_db), user: dict = Depends(require_role("admin"))):
    teachers = db.query(models.Teacher).all()
    return [
        {
            "id": teacher.id,
            "user_id": teacher.user_id,
            "subject_id": teacher.subject_id,
            "full_name": teacher.user.full_name if teacher.user else None,
            "email": teacher.user.email if teacher.user else None,
            "subject_name": teacher.subject.name if teacher.subject else None,
            "room_number": teacher.room_number
        }
        for teacher in teachers
    ]

# получить профиль текущего учителя
@router.get("/me")
async def get_my_profile(request: Request, db: Session = Depends(get_db)):
    user = await get_current_user(request)
    if user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Только для учителей")
    teacher = db.query(models.Teacher).join(models.User).filter(
        models.User.email == user["email"]
    ).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Профиль учителя не найден")
    return {
        "id": teacher.id,
        "user_id": teacher.user_id,
        "subject_id": teacher.subject_id,
        "full_name": teacher.user.full_name,
        "email": teacher.user.email,
        "subject_name": teacher.subject.name if teacher.subject else None,
        "room_number": teacher.room_number
    }

# создать учителя (только завуч)
@router.post("/")
async def create_teacher(data: TeacherCreate, db: Session = Depends(get_db), user: dict = Depends(require_role("admin"))):
    new_teacher = models.Teacher(**data.dict())
    db.add(new_teacher)
    db.commit()
    db.refresh(new_teacher)
    return {
        "id": new_teacher.id,
        "user_id": new_teacher.user_id,
        "subject_id": new_teacher.subject_id
    }

# удалить учителя (только завуч)
@router.delete("/{teacher_id}")
async def delete_teacher(teacher_id: int, db: Session = Depends(get_db), user: dict = Depends(require_role("admin"))):
    teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Учитель не найден")
    db.delete(teacher)
    db.commit()
    return {"message": "Учитель удален"}
