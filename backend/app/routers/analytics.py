from fastapi import APIRouter, Depends
from sqlalchemy import func, select, distinct
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..dependencies import require_role

router = APIRouter()

# функция для подсчёта неуспевающих учеников (оценка < 3)
@router.get("/failing")
def get_failing_count(
    db: Session = Depends(get_db),
    user: dict = Depends(require_role("admin"))
):
    count = db.query(func.count(distinct(models.Grade.student_id))).filter(
        models.Grade.grade_value < 3
    ).scalar() or 0
    return {"failing_count": count}

# функция для средней оценки по всем классам
@router.get("/classes_avg")
def get_classes_avg(
    db: Session = Depends(get_db),
    user: dict = Depends(require_role("admin"))
):
    query = select(
        models.Class.name.label("class_name"),
        func.avg(models.Grade.grade_value).label("avg_grade")
    ).select_from(models.Class).join(
        models.Student, models.Student.class_id == models.Class.id
    ).join(
        models.Grade, models.Grade.student_id == models.Student.id
    ).group_by(models.Class.id, models.Class.name).order_by(
        func.avg(models.Grade.grade_value).desc()
    )
    
    result = db.execute(query).all()
    output = []
    for row in result:
        avg_val = float(row.avg_grade) if row.avg_grade else 0.0
        output.append({
            "class": row.class_name,
            "avg": round(avg_val, 2)
        })
    return output

# функция для поиска лучшего и худшего класса
@router.get("/best_worst_class")
def get_extreme_classes(
    db: Session = Depends(get_db),
    user: dict = Depends(require_role("admin"))
):
    query = select(
        models.Class.name.label("class_name"),
        func.avg(models.Grade.grade_value).label("avg_grade")
    ).select_from(models.Class).join(
        models.Student, models.Student.class_id == models.Class.id
    ).join(
        models.Grade, models.Grade.student_id == models.Student.id
    ).group_by(models.Class.id, models.Class.name)
    
    result = db.execute(query).all()
    if not result:
        return {"best": None, "worst": None}
    
    classes_list = []
    for row in result:
        avg_val = float(row.avg_grade) if row.avg_grade else 0.0
        classes_list.append({
            "class": row.class_name,
            "avg": round(avg_val, 2)
        })
    
    best = max(classes_list, key=lambda x: x["avg"])
    worst = min(classes_list, key=lambda x: x["avg"])
    return {"best": best, "worst": worst}

# функция для получения успеваемости по заданному предмету
@router.get("/subject/{subject_id}")
def get_subject_analytics(
    subject_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_role("admin"))
):
    avg = db.query(func.avg(models.Grade.grade_value)).filter(
        models.Grade.subject_id == subject_id
    ).scalar()
    avg_val = float(avg) if avg else 0.0
    return {"subject_id": subject_id, "average": round(avg_val, 2)}

# функция для поиска учителя с самой низкой успеваемостью учеников
@router.get("/worst_teacher")
def get_worst_teacher(
    db: Session = Depends(get_db),
    user: dict = Depends(require_role("admin"))
):
    query = select(
        models.Teacher.id.label("teacher_id"),
        models.User.full_name.label("teacher_name"),
        func.avg(models.Grade.grade_value).label("avg_grade")
    ).select_from(models.Teacher).join(
        models.User, models.User.id == models.Teacher.user_id
    ).join(
        models.Grade, models.Grade.teacher_id == models.Teacher.id
    ).group_by(models.Teacher.id, models.User.full_name).order_by(
        func.avg(models.Grade.grade_value).asc()
    ).limit(1)
    
    result = db.execute(query).first()
    if result:
        avg_val = float(result.avg_grade) if result.avg_grade else 0.0
        return {
            "teacher": result.teacher_name,
            "avg_grade": round(avg_val, 2)
        }
    return {"teacher": None, "avg_grade": None}