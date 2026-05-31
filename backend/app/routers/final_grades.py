from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from .. import models
from ..dependencies import require_role, require_roles

router = APIRouter()


def _active_year_id(db: Session) -> int:
    y = db.query(models.AcademicYear).filter(models.AcademicYear.is_active == True).first()  # noqa: E712
    if not y:
        raise HTTPException(status_code=500, detail="Активный учебный год не настроен")
    return y.id


def recalculate_final_grade(db: Session, student_id: int, subject_id: int, academic_year_id: int) -> models.FinalGrade:
    avg_val = db.query(func.avg(models.Grade.grade_value)).filter(
        models.Grade.student_id == student_id,
        models.Grade.subject_id == subject_id,
        models.Grade.academic_year_id == academic_year_id,
        models.Grade.grade_type == models.GRADE_TYPE_QUARTER,
    ).scalar()

    if avg_val is None:
        raise HTTPException(status_code=404, detail="Нет четвертных оценок для расчёта годовой")

    calculated = int(round(float(avg_val)))

    fg = db.query(models.FinalGrade).filter(
        models.FinalGrade.student_id == student_id,
        models.FinalGrade.subject_id == subject_id,
        models.FinalGrade.academic_year_id == academic_year_id,
    ).first()

    if fg and fg.is_override:
        fg.calculated_from_term_avg = calculated
        db.commit()
        db.refresh(fg)
        return fg

    if not fg:
        fg = models.FinalGrade(
            student_id=student_id,
            subject_id=subject_id,
            academic_year_id=academic_year_id,
            value=calculated,
            is_override=False,
            override_by_user_id=None,
            calculated_from_term_avg=calculated,
        )
        db.add(fg)
    else:
        fg.value = calculated
        fg.is_override = False
        fg.override_by_user_id = None
        fg.calculated_from_term_avg = calculated

    db.commit()
    db.refresh(fg)
    return fg


@router.get("/", dependencies=[Depends(require_roles(["admin", "student"]))])
def get_final_grades(
    student_id: int | None = None,
    year_id: int | None = None,
    db: Session = Depends(get_db),
):
    academic_year_id = year_id or _active_year_id(db)
    q = db.query(models.FinalGrade).filter(models.FinalGrade.academic_year_id == academic_year_id)
    if student_id is not None:
        q = q.filter(models.FinalGrade.student_id == student_id)
    rows = q.all()
    return [
        {
            "id": r.id,
            "student_id": r.student_id,
            "subject_id": r.subject_id,
            "academic_year_id": r.academic_year_id,
            "value": r.value,
            "is_override": r.is_override,
            "override_by_user_id": r.override_by_user_id,
            "calculated_from_term_avg": r.calculated_from_term_avg,
        }
        for r in rows
    ]


@router.put("/{final_grade_id}", dependencies=[Depends(require_role("admin"))])
def override_final_grade(
    final_grade_id: int,
    payload: dict,
    db: Session = Depends(get_db),
):
    value = payload.get("value")
    actor_user_id = payload.get("actor_user_id")  # optional: can be filled later from JWT
    if value is None:
        raise HTTPException(status_code=400, detail="value обязателен")
    fg = db.query(models.FinalGrade).filter(models.FinalGrade.id == final_grade_id).first()
    if not fg:
        raise HTTPException(status_code=404, detail="Годовая оценка не найдена")
    fg.value = int(value)
    fg.is_override = True
    if actor_user_id is not None:
        fg.override_by_user_id = int(actor_user_id)
    db.commit()
    db.refresh(fg)
    return {"msg": "Годовая переопределена", "id": fg.id, "value": fg.value}

