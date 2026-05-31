from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from .. import models
from ..dependencies import require_role

router = APIRouter()


def _assignment_to_dict(a: models.TeacherAssignment) -> dict:
    return {
        "id": a.id,
        "teacher_id": a.teacher_id,
        "teacher_name": a.teacher.user.full_name if a.teacher and a.teacher.user else None,
        "class_id": a.class_id,
        "class_name": a.class_group.name if a.class_group else None,
        "subject_id": a.subject_id,
        "subject_name": a.subject.name if a.subject else None,
        "academic_year_id": a.academic_year_id,
    }


@router.get("/", dependencies=[Depends(require_role("admin"))])
def list_assignments(db: Session = Depends(get_db)):
    rows = (
        db.query(models.TeacherAssignment)
        .options(
            joinedload(models.TeacherAssignment.teacher).joinedload(models.Teacher.user),
            joinedload(models.TeacherAssignment.class_group),
            joinedload(models.TeacherAssignment.subject),
        )
        .all()
    )
    return [_assignment_to_dict(a) for a in rows]


@router.post("/", dependencies=[Depends(require_role("admin"))])
def create_assignment(payload: dict, db: Session = Depends(get_db)):
    teacher_id = payload.get("teacher_id")
    class_id = payload.get("class_id")
    subject_id = payload.get("subject_id")
    academic_year_id = payload.get("academic_year_id")
    if not teacher_id or not class_id or not subject_id:
        raise HTTPException(status_code=400, detail="teacher_id, class_id, subject_id обязательны")

    teacher = db.query(models.Teacher).filter(models.Teacher.id == int(teacher_id)).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Учитель не найден")
    if teacher.subject_id != int(subject_id):
        raise HTTPException(status_code=400, detail="Учитель не ведёт выбранный предмет")

    existing = db.query(models.TeacherAssignment).filter(
        models.TeacherAssignment.teacher_id == int(teacher_id),
        models.TeacherAssignment.class_id == int(class_id),
        models.TeacherAssignment.subject_id == int(subject_id),
        models.TeacherAssignment.academic_year_id == (int(academic_year_id) if academic_year_id is not None else None),
    ).first()
    if existing:
        return _assignment_to_dict(existing)

    a = models.TeacherAssignment(
        teacher_id=int(teacher_id),
        class_id=int(class_id),
        subject_id=int(subject_id),
        academic_year_id=int(academic_year_id) if academic_year_id is not None else None,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return _assignment_to_dict(a)


@router.delete("/{assignment_id}", dependencies=[Depends(require_role("admin"))])
def delete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    a = db.query(models.TeacherAssignment).filter(models.TeacherAssignment.id == assignment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Назначение не найдено")
    db.delete(a)
    db.commit()
    return {"msg": "Назначение удалено"}

