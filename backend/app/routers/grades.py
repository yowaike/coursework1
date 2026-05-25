from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..dependencies import get_current_user, require_role
from ..schemas import GradeCreate

router = APIRouter()

# функция для просмотра всех оценок (только завуч)
@router.get("/")
async def get_grades(
    student_id: int = Query(None),
    request: Request = None,
    db: Session = Depends(get_db),
    user: dict = Depends(require_role("admin"))
):
    query = db.query(models.Grade)
    if student_id:
        query = query.filter(models.Grade.student_id == student_id)
    grades = query.all()
    return [
        {
            "id": grade.id,
            "student_id": grade.student_id,
            "student_name": grade.student.user.full_name if grade.student and grade.student.user else None,
            "class_id": grade.student.class_id if grade.student else None,
            "subject_id": grade.subject_id,
            "subject_name": grade.subject.name if grade.subject else None,
            "teacher_id": grade.teacher_id,
            "grade_type": grade.grade_type,
            "grade_value": grade.grade_value,
            "work_type": grade.work_type,
            "quarter": grade.quarter,
            "date": str(grade.date)
        }
        for grade in grades
    ]

# функция для получения оценок текущего ученика
@router.get("/my")
async def get_my_grades(request: Request, db: Session = Depends(get_db)):
    user = await get_current_user(request)
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Только для учеников")
    student = db.query(models.Student).join(models.User).filter(
        models.User.email == user["email"]
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Профиль ученика не найден")
    grades = db.query(models.Grade).filter(models.Grade.student_id == student.id).all()
    return [
        {
            "id": grade.id,
            "student_id": grade.student_id,
            "subject_id": grade.subject_id,
            "subject_name": grade.subject.name if grade.subject else None,
            "teacher_id": grade.teacher_id,
            "grade_type": grade.grade_type,
            "grade_value": grade.grade_value,
            "work_type": grade.work_type,
            "quarter": grade.quarter,
            "date": str(grade.date)
        }
        for grade in grades
    ]

# функция для выставления оценки (только завуч)
@router.post("/")
async def add_grade(
    data: GradeCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: dict = Depends(require_role("admin"))
):
    new_grade = models.Grade(**data.dict())
    db.add(new_grade)
    db.commit()
    db.refresh(new_grade)
    return {
        "id": new_grade.id,
        "student_id": new_grade.student_id,
        "subject_id": new_grade.subject_id,
        "teacher_id": new_grade.teacher_id,
        "grade_type": new_grade.grade_type,
        "grade_value": new_grade.grade_value,
        "work_type": new_grade.work_type,
        "quarter": new_grade.quarter,
        "date": str(new_grade.date)
    }
