from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from ..database import get_db
from .. import models

router = APIRouter()

#функция для получения успеваемости по предмету
@router.get("/subject/{subject_id}")
def get_subject_stats(subject_id: int, db: Session = Depends(get_db)):
    res = db.query(func.avg(models.Grade.grade_value)).filter(
        models.Grade.subject_id == subject_id
    ).scalar()
    return {"avg_grade": round(res, 2) if res else 0}

#функция для подсчёта неуспевающих учеников
@router.get("/failing")
def get_failing_students(db: Session = Depends(get_db)):
    count = db.query(models.Grade).filter(
        and_(models.Grade.grade_value < 3, models.Grade.quarter == 4)
    ).distinct(models.Grade.student_id).count()
    return {"failing_count": count}

#функция для поиска учителя с самой низкой успеваемостью
@router.get("/worst_teacher")
def get_worst_teacher(db: Session = Depends(get_db)):
    res = db.query(
        models.Teacher.id,
        func.avg(models.Grade.grade_value).label("avg")
    ).join(models.Grade).group_by(models.Teacher.id).order_by("avg").first()
    if res:
        teacher = db.query(models.Teacher).filter(models.Teacher.id == res.id).first()
        return {"teacher": teacher.user.full_name, "avg_grade": round(res.avg, 2)}
    return None

#функция для средней оценки по классам
@router.get("/classes_avg")
def get_classes_avg(db: Session = Depends(get_db)):
    data = db.query(
        models.Class.name,
        func.avg(models.Grade.grade_value)
    ).join(models.Student).join(models.Grade).group_by(models.Class.id).all()
    return [{"class": name, "avg": round(avg, 2)} for name, avg in data]

#функция для поиска лучшего и худшего класса
@router.get("/best_worst_class")
def get_extreme_classes(db: Session = Depends(get_db)):
    stats = db.query(
        models.Class.name,
        func.avg(models.Grade.grade_value).label("avg")
    ).join(models.Student).join(models.Grade).group_by(models.Class.id).all()
    if not stats:
        return {}
    best = max(stats, key=lambda x: x.avg)
    worst = min(stats, key=lambda x: x.avg)
    return {
        "best": {"class": best.name, "avg": round(best.avg, 2)},
        "worst": {"class": worst.name, "avg": round(worst.avg, 2)}
    }