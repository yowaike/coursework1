from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from .. import models
from ..dependencies import get_current_user, require_role
from ..auth import get_password_hash
from ..schemas import StudentUpdate
from ..audit import log_audit

router = APIRouter()


def _check_class_capacity(db: Session, class_id: int, exclude_student_id: int | None = None):
    cls = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Класс не найден")
    query = db.query(models.Student).filter(models.Student.class_id == class_id)
    if exclude_student_id is not None:
        query = query.filter(models.Student.id != exclude_student_id)
    if query.count() >= cls.max_students:
        raise HTTPException(
            status_code=400,
            detail=f"Класс {cls.name} заполнен (максимум {cls.max_students} учеников)",
        )


@router.get("/")
def get_students(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    students = db.query(models.Student).options(
        joinedload(models.Student.user),
        joinedload(models.Student.class_group)
    ).all()
    
    result = []
    for s in students:
        result.append({
            "id": s.id,
            "user": {
                "full_name": s.user.full_name if s.user else None,
                "email": s.user.email if s.user else None
            } if s.user else None,
            "class_id": s.class_id,
            "class_name": s.class_group.name if s.class_group else None
        })
    return result


@router.get("/my")
async def get_my_students(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    if user["role"] == "admin":
        students = db.query(models.Student).options(
            joinedload(models.Student.user),
            joinedload(models.Student.class_group)
        ).all()
    elif user["role"] == "teacher":
        teacher = db.query(models.Teacher).join(models.User).filter(models.User.email == user["email"]).first()
        if not teacher:
            raise HTTPException(status_code=404, detail="Профиль учителя не найден")
        class_ids = [r[0] for r in db.query(models.TeacherAssignment.class_id).filter(models.TeacherAssignment.teacher_id == teacher.id).distinct().all()]
        if not class_ids:
            class_ids = [item.class_id for item in db.query(models.Schedule).filter(models.Schedule.teacher_id == teacher.id).all()]
        if not class_ids:
            return []
        students = db.query(models.Student).options(
            joinedload(models.Student.user),
            joinedload(models.Student.class_group)
        ).filter(models.Student.class_id.in_(class_ids)).all()
        
        # Дедупликация по email пользователя (решает проблему дублей с разными user_id)
        seen_emails = set()
        unique_students = []
        for s in students:
            email = s.user.email if s.user else None
            if email and email not in seen_emails:
                seen_emails.add(email)
                unique_students.append(s)
        students = unique_students
    elif user["role"] == "student":
        student = db.query(models.Student).join(models.User).filter(models.User.email == user["email"]).first()
        if not student:
            raise HTTPException(status_code=404, detail="Профиль ученика не найден")
        students = [student]
    else:
        raise HTTPException(status_code=403, detail="Недостаточно прав")

    result = []
    for s in students:
        result.append({
            "id": s.id,
            "user": {
                "full_name": s.user.full_name if s.user else None,
                "email": s.user.email if s.user else None
            } if s.user else None,
            "class_id": s.class_id,
            "class_name": s.class_group.name if s.class_group else None
        })
    return result


@router.get("/me")
async def get_my_student_profile(
    request: Request,
    db: Session = Depends(get_db)
):
    user = await get_current_user(request)
    if user["role"] != "student":
        raise HTTPException(status_code=403, detail="Только для учеников")
    student = db.query(models.Student).options(
        joinedload(models.Student.user),
        joinedload(models.Student.class_group)
    ).join(models.User).filter(
        models.User.email == user["email"]
    ).first()
    if not student:
        raise HTTPException(status_code=404, detail="Профиль ученика не найден")
    return {
        "id": student.id,
        "user": {
            "full_name": student.user.full_name if student.user else None,
            "email": student.user.email if student.user else None
        } if student.user else None,
        "class_id": student.class_id,
        "class_name": student.class_group.name if student.class_group else None
    }


@router.post("/")
def create_student(data: dict, db: Session = Depends(get_db), current_user: dict = Depends(require_role("admin"))):
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email обязателен")
    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email уже используется")

    try:
        user = models.User(
            full_name=data.get("full_name", "Новый ученик"),
            email=email,
            hashed_password=get_password_hash(data.get("password", "student123")),
            role="student"
        )
        db.add(user)
        db.flush()

        class_id = data.get("class_id", 1)
        _check_class_capacity(db, class_id)
        student = models.Student(user_id=user.id, class_id=class_id)
        db.add(student)
        db.commit()
        db.refresh(student)
        actor = db.query(models.User).filter(models.User.email == current_user["email"]).first()
        if actor:
            log_audit(db, actor_user_id=actor.id, action="create", entity_type="student", entity_id=student.id, before=None, after={"student_id": student.id, "user_id": user.id, "class_id": student.class_id})
            db.commit()
        return {"id": student.id, "msg": "Ученик создан"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db), current_user: dict = Depends(require_role("admin"))):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Ученик не найден")
    actor = db.query(models.User).filter(models.User.email == current_user["email"]).first()
    before = {"student_id": student.id, "user_id": student.user_id, "class_id": student.class_id}
    
    try:
        # удаляем связанные данные ученика
        db.query(models.Grade).filter(models.Grade.student_id == student.id).delete()
        db.query(models.FinalGrade).filter(models.FinalGrade.student_id == student.id).delete()
        db.query(models.Note).filter(models.Note.student_id == student.id).delete()
        user_id = student.user_id
        db.delete(student)
        db.flush()

        user = db.query(models.User).filter(models.User.id == user_id).first()
        if user and user.role == 'student':
            db.delete(user)

        db.commit()
        if actor:
            log_audit(db, actor_user_id=actor.id, action="delete", entity_type="student", entity_id=student_id, before=before, after=None)
            db.commit()
        return {"msg": "Ученик удалён"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sync", dependencies=[Depends(require_role("admin"))])
def sync_student_accounts(db: Session = Depends(get_db)):
    """Синхронизирует записи: если у Student нет связанного User — создаёт его; если есть User со ролью student без Student — создаёт запись Student."""
    created = []
    students = db.query(models.Student).all()
    for s in students:
        user = db.query(models.User).filter(models.User.id == s.user_id).first()
        if not user:
            base_email = (s.user.full_name.replace(' ', '').lower() if getattr(s, 'user', None) and s.user and s.user.full_name else f'student{s.id}')
            email = f"{base_email}@school.local"
            i = 1
            while db.query(models.User).filter(models.User.email == email).first():
                email = f"{base_email}{i}@school.local"; i += 1
            new_user = models.User(email=email, full_name=f'Ученик {s.id}', hashed_password=get_password_hash('student123'), role='student')
            db.add(new_user); db.flush()
            s.user_id = new_user.id
            created.append({'student_id': s.id, 'email': email})

    student_users = db.query(models.User).filter(models.User.role == 'student').all()
    for u in student_users:
        st = db.query(models.Student).filter(models.Student.user_id == u.id).first()
        if not st:
            cls = db.query(models.Class).first()
            class_id = cls.id if cls else 1
            new_student = models.Student(user_id=u.id, class_id=class_id)
            db.add(new_student)
            created.append({'created_student_for_user': u.email})

    db.commit()
    return {"created": created}


@router.put("/{student_id}")
def update_student(
    student_id: int,
    data: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    student = db.query(models.Student).options(
        joinedload(models.Student.user),
        joinedload(models.Student.class_group)
    ).filter(models.Student.id == student_id).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Ученик не найден")

    actor = db.query(models.User).filter(models.User.email == current_user["email"]).first()
    before = {
        "student_id": student.id,
        "user_id": student.user_id,
        "full_name": student.user.full_name if student.user else None,
        "email": student.user.email if student.user else None,
        "class_id": student.class_id,
    }
    
    if data.email and data.email != student.user.email:
        existing = db.query(models.User).filter(
            models.User.email == data.email,
            models.User.id != student.user_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email уже используется")
        student.user.email = data.email
    
    if data.full_name:
        student.user.full_name = data.full_name
    
    if data.password and data.password.strip():
        student.user.hashed_password = get_password_hash(data.password)
    
    if data.class_id is not None:
        _check_class_capacity(db, data.class_id, exclude_student_id=student.id)
        student.class_id = data.class_id
    
    try:
        db.commit()
        db.refresh(student)
        db.refresh(student.user)
        if actor:
            after = {
                "student_id": student.id,
                "user_id": student.user_id,
                "full_name": student.user.full_name if student.user else None,
                "email": student.user.email if student.user else None,
                "class_id": student.class_id,
            }
            log_audit(db, actor_user_id=actor.id, action="update", entity_type="student", entity_id=student.id, before=before, after=after)
            db.commit()
        return {
            "id": student.id,
            "msg": "Ученик обновлён",
            "email": student.user.email,
            "full_name": student.user.full_name,
            "class_name": student.class_group.name if student.class_group else None
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка сохранения: {str(e)}")