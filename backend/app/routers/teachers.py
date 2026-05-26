from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from .. import models
from ..dependencies import get_current_user, require_role
from ..auth import get_password_hash
from ..schemas import TeacherCreate, TeacherUpdate

router = APIRouter()

# функция для получения списка учителей (только завуч)
@router.get("/")
def get_teachers(
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    teachers = db.query(models.Teacher).options(
        joinedload(models.Teacher.user),
        joinedload(models.Teacher.subject)
    ).all()
    
    result = []
    for t in teachers:
        result.append({
            "id": t.id,
            "user": {
                "full_name": t.user.full_name if t.user else None,
                "email": t.user.email if t.user else None
            } if t.user else None,
            "subject_id": t.subject_id,
            "subject_name": t.subject.name if t.subject else None,
            "room_number": t.room_number
        })
    return result

# функция для получения профиля текущего учителя
@router.get("/me")
async def get_my_teacher_profile(
    request: Request,
    db: Session = Depends(get_db)
):
    user = await get_current_user(request)
    if user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Только для учителей")
    teacher = db.query(models.Teacher).options(
        joinedload(models.Teacher.user),
        joinedload(models.Teacher.subject)
    ).join(models.User).filter(
        models.User.email == user["email"]
    ).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Профиль учителя не найден")
    return {
        "id": teacher.id,
        "user": {
            "full_name": teacher.user.full_name if teacher.user else None,
            "email": teacher.user.email if teacher.user else None
        } if teacher.user else None,
        "subject_id": teacher.subject_id,
        "subject_name": teacher.subject.name if teacher.subject else None,
        "room_number": teacher.room_number
    }

# функция для создания учителя (только завуч)
@router.post("/")
def create_teacher(data: dict, db: Session = Depends(get_db), current_user: dict = Depends(require_role("admin"))):
    # проверяем уникальность email
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email обязателен")
    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email уже используется")
    
    user = models.User(
        email=email,
        full_name=data.get("full_name", "Новый учитель"),
        hashed_password=get_password_hash(data.get("password", "teacher123")),
        role="teacher"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    teacher = models.Teacher(
        user_id=user.id,
        subject_id=data.get("subject_id", 1),
        room_number=data.get("room_number")
    )
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    
    return {"id": teacher.id, "msg": "Учитель создан"}

# функция для удаления учителя (только завуч)
@router.delete("/{teacher_id}")
def delete_teacher(teacher_id: int, db: Session = Depends(get_db), current_user: dict = Depends(require_role("admin"))):
    teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Учитель не найден")
    
    # удаляем связанные оценки
    db.query(models.Grade).filter(models.Grade.teacher_id == teacher.id).delete()
    # удаляем связанное расписание
    db.query(models.Schedule).filter(models.Schedule.teacher_id == teacher.id).delete()
    # удаляем учителя
    db.delete(teacher)
    db.commit()
    
    # удаляем пользователя
    user = db.query(models.User).filter(models.User.id == teacher.user_id).first()
    if user:
        db.delete(user)
        db.commit()

    return {"msg": "Учитель удалён"}

# функция для обновления учителя (только завуч)
@router.put("/{teacher_id}")
def update_teacher(
    teacher_id: int,
    data: TeacherUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_role("admin"))
):
    # функция для поиска учителя с данными пользователя и предмета
    teacher = db.query(models.Teacher).options(
        joinedload(models.Teacher.user),
        joinedload(models.Teacher.subject)
    ).filter(models.Teacher.id == teacher_id).first()
    
    if not teacher:
        raise HTTPException(status_code=404, detail="Учитель не найден")
    
    # функция для валидации уникальности email
    if data.email and data.email != teacher.user.email:
        existing = db.query(models.User).filter(
            models.User.email == data.email,
            models.User.id != teacher.user_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email уже используется")
        teacher.user.email = data.email
    
    # функция для обновления ФИО
    if data.full_name:
        teacher.user.full_name = data.full_name
    
    # функция для обновления пароля
    if data.password and data.password.strip():
        teacher.user.hashed_password = get_password_hash(data.password)
    
    # функция для обновления предмета
    if data.subject_id is not None:
        teacher.subject_id = data.subject_id
    
    # функция для обновления кабинета
    if data.room_number is not None:
        teacher.room_number = data.room_number
    
    # функция для сохранения изменений
    try:
        db.commit()
        db.refresh(teacher)
        db.refresh(teacher.user)
        return {
            "id": teacher.id,
            "msg": "Учитель обновлён",
            "email": teacher.user.email,
            "full_name": teacher.user.full_name,
            "subject_name": teacher.subject.name if teacher.subject else None
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка сохранения: {str(e)}")