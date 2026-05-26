from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from .. import models
from ..dependencies import get_current_user
from ..schemas import NoteCreate, NoteUpdate

router = APIRouter()


def _get_user(db: Session, email: str) -> models.User | None:
    return db.query(models.User).filter(models.User.email == email).first()


def _get_teacher(db: Session, email: str) -> models.Teacher | None:
    return db.query(models.Teacher).join(models.User).filter(
        models.User.email == email
    ).first()


def _teacher_student_ids(db: Session, teacher_id: int) -> set[int]:
    class_ids = {
        row[0]
        for row in db.query(models.Schedule.class_id)
        .filter(models.Schedule.teacher_id == teacher_id)
        .distinct()
        .all()
    }
    if not class_ids:
        return set()
    rows = db.query(models.Student.id).filter(
        models.Student.class_id.in_(class_ids)
    ).all()
    return {r[0] for r in rows}


def _teacher_can_access_student(db: Session, teacher_id: int, student_id: int) -> bool:
    return student_id in _teacher_student_ids(db, teacher_id)


def _note_to_dict(note: models.Note, current_user_id: int | None = None) -> dict:
    can_edit = current_user_id is not None and note.author_id == current_user_id
    return {
        "id": note.id,
        "student_id": note.student_id,
        "student_name": note.student.user.full_name if note.student and note.student.user else None,
        "author_id": note.author_id,
        "author_name": note.author.full_name if note.author else None,
        "author_role": note.author.role if note.author else None,
        "text": note.text,
        "date": str(note.date),
        "can_edit": can_edit,
    }


@router.get("/")
async def get_notes(
    request: Request,
    student_id: int = Query(None),
    db: Session = Depends(get_db),
):
    user = await get_current_user(request)
    db_user = _get_user(db, user["email"])
    query = db.query(models.Note).options(
        joinedload(models.Note.student).joinedload(models.Student.user),
        joinedload(models.Note.author),
    )

    if user["role"] == "student":
        student = db.query(models.Student).join(models.User).filter(
            models.User.email == user["email"]
        ).first()
        if not student:
            return []
        query = query.filter(models.Note.student_id == student.id)
    elif user["role"] == "admin":
        if student_id:
            query = query.filter(models.Note.student_id == student_id)
    elif user["role"] == "teacher":
        teacher = _get_teacher(db, user["email"])
        if not teacher:
            return []
        allowed_ids = _teacher_student_ids(db, teacher.id)
        if not allowed_ids:
            return []
        query = query.filter(models.Note.student_id.in_(allowed_ids))
        if student_id:
            if student_id not in allowed_ids:
                raise HTTPException(status_code=403, detail="Нет доступа к этому ученику")
            query = query.filter(models.Note.student_id == student_id)
    else:
        raise HTTPException(status_code=403, detail="Недостаточно прав")

    notes = query.all()
    uid = db_user.id if db_user else None
    return [_note_to_dict(note, uid) for note in notes]


@router.post("/")
async def add_note(
    data: NoteCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    user = await get_current_user(request)
    db_user = _get_user(db, user["email"])
    if not db_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    target = db.query(models.Student).filter(models.Student.id == data.student_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Ученик не найден")

    if user["role"] == "student":
        student = db.query(models.Student).join(models.User).filter(
            models.User.email == user["email"]
        ).first()
        if not student:
            raise HTTPException(status_code=404, detail="Профиль ученика не найден")
        if student.id != data.student_id:
            raise HTTPException(
                status_code=403,
                detail="Вы можете создавать заметки только для себя",
            )
    elif user["role"] == "teacher":
        teacher = _get_teacher(db, user["email"])
        if not teacher:
            raise HTTPException(status_code=404, detail="Профиль учителя не найден")
        if not _teacher_can_access_student(db, teacher.id, data.student_id):
            raise HTTPException(
                status_code=403,
                detail="Заметку можно добавить только своему ученику",
            )
    elif user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Недостаточно прав")

    new_note = models.Note(
        student_id=data.student_id,
        author_id=db_user.id,
        text=data.text,
        date=data.date,
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return _note_to_dict(new_note, db_user.id)


@router.put("/{note_id}")
async def update_note(
    note_id: int,
    data: NoteUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    user = await get_current_user(request)
    db_user = _get_user(db, user["email"])
    if not db_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    note = (
        db.query(models.Note)
        .options(
            joinedload(models.Note.student).joinedload(models.Student.user),
            joinedload(models.Note.author),
        )
        .filter(models.Note.id == note_id)
        .first()
    )
    if not note:
        raise HTTPException(status_code=404, detail="Заметка не найдена")

    if user["role"] == "admin":
        pass
    elif note.author_id != db_user.id:
        raise HTTPException(status_code=403, detail="Можно редактировать только свои заметки")
    elif user["role"] == "teacher":
        teacher = _get_teacher(db, user["email"])
        if not teacher or not _teacher_can_access_student(db, teacher.id, note.student_id):
            raise HTTPException(status_code=403, detail="Нет доступа к этой заметке")

    if data.text is not None:
        note.text = data.text
    if data.date is not None:
        note.date = data.date

    db.commit()
    db.refresh(note)
    return _note_to_dict(note, db_user.id)


@router.delete("/{note_id}")
async def delete_note(
    note_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    user = await get_current_user(request)
    db_user = _get_user(db, user["email"])
    if not db_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Заметка не найдена")

    if user["role"] == "admin":
        pass
    elif note.author_id != db_user.id:
        raise HTTPException(status_code=403, detail="Можно удалять только свои заметки")
    elif user["role"] == "teacher":
        teacher = _get_teacher(db, user["email"])
        if not teacher or not _teacher_can_access_student(db, teacher.id, note.student_id):
            raise HTTPException(status_code=403, detail="Нет доступа к этой заметке")

    db.delete(note)
    db.commit()
    return {"msg": "Заметка удалена"}
