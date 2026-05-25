from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from .. import models
from ..dependencies import require_role

router = APIRouter()

# 1. Успеваемость по предмету (только завуч)
@router.get("/subject/{subject_id}")
def get_subject_stats(subject_id: int, db: Session = Depends(get_db), user: dict = Depends(require_role("admin"))):
    avg_val = db.query(func.avg(models.Grade.grade_value)).filter(
        models.Grade.subject_id == subject_id
    ).scalar()
    return {"subject_id": subject_id, "avg_grade": round(float(avg_val), 2) if avg_val else 0}

# 2. Количество неуспевающих (<3) по всем классам (только завуч)
@router.get("/failing")
def get_failing_students(db: Session = Depends(get_db), user: dict = Depends(require_role("admin"))):
    # берём оценки ниже 3, считаем уникальных учеников
    count = db.query(func.count(func.distinct(models.Grade.student_id))).filter(
        models.Grade.grade_value < 3
    ).scalar()
    return {"failing_count": int(count) if count else 0}

# 3. Учитель с самой низкой успеваемостью (только завуч)
@router.get("/worst_teacher")
def get_worst_teacher(db: Session = Depends(get_db), user: dict = Depends(require_role("admin"))):
    # группируем по teacher_id, берём среднюю, сортируем по avg asc, берём первого
    result = db.query(
        models.Teacher.id,
        func.avg(models.Grade.grade_value).label("avg_grade")
    ).join(models.Grade, models.Teacher.id == models.Grade.teacher_id).group_by(
        models.Teacher.id
    ).order_by("avg_grade").first()
    
    if result:
        teacher_id, avg_val = result
        teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
        if teacher and teacher.user:
            return {"teacher_id": teacher_id, "teacher_name": teacher.user.full_name, "avg_grade": round(float(avg_val), 2)}
    return None

# 4. Средняя оценка по классам (только завуч)
@router.get("/classes_avg")
def get_classes_avg(db: Session = Depends(get_db), user: dict = Depends(require_role("admin"))):
    data = db.query(
        models.Class.id,
        models.Class.name,
        func.avg(models.Grade.grade_value).label("avg_grade")
    ).join(models.Student).join(models.Grade).group_by(
        models.Class.id, models.Class.name
    ).all()
    return [
        {"class_id": cls_id, "class_name": cls_name, "avg_grade": round(float(avg), 2)}
        for cls_id, cls_name, avg in data
    ]

# 5. Лучший и худший класс (только завуч)
@router.get("/best_worst_class")
def get_extreme_classes(db: Session = Depends(get_db), user: dict = Depends(require_role("admin"))):
    data = db.query(
        models.Class.id,
        models.Class.name,
        func.avg(models.Grade.grade_value).label("avg_grade")
    ).join(models.Student).join(models.Grade).group_by(
        models.Class.id, models.Class.name
    ).all()
    
    if not data:
        return {}
    
    best_row = max(data, key=lambda x: x[2])
    worst_row = min(data, key=lambda x: x[2])
    
    return {
        "best": {"class_id": best_row[0], "class_name": best_row[1], "avg_grade": round(float(best_row[2]), 2)},
        "worst": {"class_id": worst_row[0], "class_name": worst_row[1], "avg_grade": round(float(worst_row[2]), 2)}
    }
