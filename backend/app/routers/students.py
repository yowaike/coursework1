from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..dependencies import get_current_user, require_role
from ..schemas import StudentCreate

router = APIRouter()

# получить всех учеников (только завуч)
@router.get("/")
async def get_students(db: Session = Depends(get_db), user: dict = Depends(require_role("admin"))):
    students = db.query(models.Student).all()
    return [
        {
            "id": student.id,
            "user_id": student.user_id,
            "class_id": student.class_id,
            "full_name": student.user.full_name if student.user else None,
            "email": student.user.email if student.user else None,
            "class_name": student.class_.name if student.class_ else None
        }
        for student in students
    ]

# получить профиль текущего ученика
@router.get("/me")
async def get_my_profile(request: Request, db: Session = Depends(get_db)):
    user = await get_current_user(request)
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Только для учеников")
    student = db.query(models.Student).join(models.User).filter(
        models.User.email == user["email"]
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Профиль ученика не найден")
    return {
        "id": student.id,
        "user_id": student.user_id,
        "class_id": student.class_id,
        "full_name": student.user.full_name,
        "email": student.user.email,
        "class_name": student.class_.name if student.class_ else None
    }

# создать ученика (только завуч)
@router.post("/")
async def create_student(data: StudentCreate, db: Session = Depends(get_db), user: dict = Depends(require_role("admin"))):
    new_student = models.Student(**data.dict())
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return {
        "id": new_student.id,
        "user_id": new_student.user_id,
        "class_id": new_student.class_id
    }

# удалить ученика (только завуч)
@router.delete("/{student_id}")
async def delete_student(student_id: int, db: Session = Depends(get_db), user: dict = Depends(require_role("admin"))):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Ученик не найден")
    db.delete(student)
    db.commit()
    return {"message": "Ученик удален"}
