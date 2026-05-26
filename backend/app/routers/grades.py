from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from .. import models
from ..dependencies import get_current_user, require_role, require_roles
from ..schemas import GradeCreate, GradeUpdate

router = APIRouter()


def _get_teacher(db: Session, email: str):
    return db.query(models.Teacher).join(models.User).filter(
        models.User.email == email
    ).first()


def _teacher_class_ids(db: Session, teacher_id: int) -> set[int]:
    rows = db.query(models.Schedule.class_id).filter(
        models.Schedule.teacher_id == teacher_id
    ).distinct().all()
    return {r[0] for r in rows}


def _teacher_teaches_student(db: Session, teacher_id: int, student_id: int) -> bool:
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        return False
    return student.class_id in _teacher_class_ids(db, teacher_id)


def _validate_grade_for_role(role: str, grade_type: str, work_type: str):
    if role == "teacher":
        if grade_type != models.GRADE_TYPE_CURRENT:
            raise HTTPException(
                status_code=403,
                detail="Учитель может выставлять только текущие оценки",
            )
        if work_type not in models.WORK_TYPES_TEACHER:
            raise HTTPException(
                status_code=400,
                detail=f"Допустимые виды работ: {', '.join(models.WORK_TYPES_TEACHER)}",
            )
    elif role == "admin":
        if grade_type == models.GRADE_TYPE_CURRENT:
            raise HTTPException(
                status_code=403,
                detail="Завуч выставляет только четвертные оценки",
            )
        if grade_type == models.GRADE_TYPE_QUARTER and work_type != models.WORK_TYPE_QUARTER:
            raise HTTPException(
                status_code=400,
                detail=f"Для четвертной оценки вид работы должен быть {models.WORK_TYPE_QUARTER}",
            )


def _grade_to_dict(grade: models.Grade) -> dict:
    return {
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
        "date": str(grade.date),
    }


@router.get("/")
async def get_grades(
    student_id: int = Query(None),
    class_id: int = Query(None),
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles(["admin", "teacher"])),
):
    query = db.query(models.Grade)

    if user["role"] == "teacher":
        teacher = _get_teacher(db, user["email"])
        if not teacher:
            raise HTTPException(status_code=404, detail="Профиль учителя не найден")
        query = query.filter(models.Grade.teacher_id == teacher.id)

    if student_id:
        query = query.filter(models.Grade.student_id == student_id)

    if class_id:
        query = query.join(models.Grade.student).filter(models.Student.class_id == class_id)

    grades = query.options(
        joinedload(models.Grade.student).joinedload(models.Student.user),
        joinedload(models.Grade.subject),
    ).all()
    return [_grade_to_dict(grade) for grade in grades]


@router.get("/my")
async def get_my_grades(
    db: Session = Depends(get_db),
    user: dict = Depends(require_role("student")),
):
    student = db.query(models.Student).join(models.User).filter(
        models.User.email == user["email"]
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Профиль ученика не найден")
    grades = (
        db.query(models.Grade)
        .options(joinedload(models.Grade.subject))
        .filter(models.Grade.student_id == student.id)
        .all()
    )
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
            "date": str(grade.date),
        }
        for grade in grades
    ]


@router.post("/")
async def add_grade(
    data: GradeCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles(["admin", "teacher"])),
):
    grade_data = data.dict()
    student = db.query(models.Student).filter(
        models.Student.id == grade_data["student_id"]
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Ученик не найден")

    _validate_grade_for_role(
        user["role"], grade_data["grade_type"], grade_data["work_type"]
    )

    if user["role"] == "teacher":
        teacher = _get_teacher(db, user["email"])
        if not teacher:
            raise HTTPException(status_code=404, detail="Профиль учителя не найден")
        if not _teacher_teaches_student(db, teacher.id, student.id):
            raise HTTPException(
                status_code=403,
                detail="Ученик не из ваших классов",
            )
        grade_data["teacher_id"] = teacher.id
        grade_data["subject_id"] = teacher.subject_id
    else:
        if not grade_data.get("subject_id"):
            raise HTTPException(status_code=400, detail="Предмет обязателен")
        if not grade_data.get("teacher_id"):
            raise HTTPException(status_code=400, detail="Учитель обязателен")
        teacher = db.query(models.Teacher).filter(
            models.Teacher.id == grade_data["teacher_id"]
        ).first()
        if not teacher:
            raise HTTPException(status_code=404, detail="Учитель не найден")
        if teacher.subject_id != grade_data["subject_id"]:
            raise HTTPException(status_code=400, detail="Учитель не ведёт выбранный предмет")

    subject = db.query(models.Subject).filter(
        models.Subject.id == grade_data["subject_id"]
    ).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Предмет не найден")

    new_grade = models.Grade(**grade_data)
    db.add(new_grade)
    db.commit()
    db.refresh(new_grade)
    return _grade_to_dict(new_grade)


@router.put("/{grade_id}")
async def update_grade(
    grade_id: int,
    data: GradeUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles(["admin", "teacher"])),
):
    grade = (
        db.query(models.Grade)
        .options(joinedload(models.Grade.student).joinedload(models.Student.user))
        .filter(models.Grade.id == grade_id)
        .first()
    )
    if not grade:
        raise HTTPException(status_code=404, detail="Оценка не найдена")

    if user["role"] == "teacher":
        teacher = _get_teacher(db, user["email"])
        if not teacher:
            raise HTTPException(status_code=404, detail="Профиль учителя не найден")
        if grade.teacher_id != teacher.id:
            raise HTTPException(status_code=403, detail="Нет доступа к этой оценке")
        if grade.grade_type == models.GRADE_TYPE_QUARTER:
            raise HTTPException(
                status_code=403,
                detail="Четвертные оценки может изменять только завуч",
            )

    new_type = data.grade_type if data.grade_type is not None else grade.grade_type
    new_work = data.work_type if data.work_type is not None else grade.work_type

    if user["role"] == "teacher":
        _validate_grade_for_role(user["role"], new_type, new_work)
    elif data.grade_type == models.GRADE_TYPE_CURRENT:
        raise HTTPException(
            status_code=403,
            detail="Завуч не может назначать тип «текущая»",
        )
    elif new_type == models.GRADE_TYPE_QUARTER and new_work != models.WORK_TYPE_QUARTER:
        raise HTTPException(
            status_code=400,
            detail=f"Для четвертной оценки вид работы должен быть {models.WORK_TYPE_QUARTER}",
        )

    if data.subject_id is not None:
        subject = db.query(models.Subject).filter(models.Subject.id == data.subject_id).first()
        if not subject:
            raise HTTPException(status_code=404, detail="Предмет не найден")
        grade.subject_id = data.subject_id

    if data.teacher_id is not None and user["role"] == "admin":
        teacher = db.query(models.Teacher).filter(models.Teacher.id == data.teacher_id).first()
        if not teacher:
            raise HTTPException(status_code=404, detail="Учитель не найден")
        subject_id = data.subject_id if data.subject_id is not None else grade.subject_id
        if teacher.subject_id != subject_id:
            raise HTTPException(status_code=400, detail="Учитель не ведёт выбранный предмет")
        grade.teacher_id = data.teacher_id
        if data.subject_id is None:
            grade.subject_id = teacher.subject_id

    if data.grade_type is not None:
        grade.grade_type = data.grade_type
    if data.grade_value is not None:
        grade.grade_value = data.grade_value
    if data.work_type is not None:
        grade.work_type = data.work_type
    if data.quarter is not None:
        grade.quarter = data.quarter
    if data.date is not None:
        grade.date = data.date

    db.commit()
    db.refresh(grade)
    return {"msg": "Оценка обновлена", "id": grade.id}


@router.delete("/{grade_id}")
async def delete_grade(
    grade_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles(["admin", "teacher"])),
):
    grade = db.query(models.Grade).filter(models.Grade.id == grade_id).first()
    if not grade:
        raise HTTPException(status_code=404, detail="Оценка не найдена")

    if user["role"] == "teacher":
        teacher = _get_teacher(db, user["email"])
        if not teacher:
            raise HTTPException(status_code=404, detail="Профиль учителя не найден")
        if grade.teacher_id != teacher.id:
            raise HTTPException(status_code=403, detail="Нет доступа к этой оценке")

    db.delete(grade)
    db.commit()
    return {"msg": "Оценка удалена"}
