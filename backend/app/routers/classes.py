from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..dependencies import get_current_user, require_role
from ..schemas import ClassCreate, ClassUpdate

router = APIRouter()

def _class_to_dict(cls: models.Class) -> dict:
    return {
        "id": cls.id,
        "name": cls.name,
        "year": cls.year,
        "max_students": cls.max_students,
        "lessons_per_week": cls.lessons_per_week,
    }

@router.get("/")
async def get_classes(db: Session = Depends(get_db), request: Request = None):
    user = await get_current_user(request)
    if user["role"] == "admin":
        classes = db.query(models.Class).all()
        return [_class_to_dict(cls) for cls in classes]
    if user["role"] == "teacher":
        teacher = db.query(models.Teacher).join(models.User).filter(models.User.email == user["email"]).first()
        if not teacher:
            return []
        class_ids = [r[0] for r in db.query(models.TeacherAssignment.class_id).filter(models.TeacherAssignment.teacher_id == teacher.id).distinct().all()]
        if not class_ids:
            class_ids = [r[0] for r in db.query(models.Schedule.class_id).filter(models.Schedule.teacher_id == teacher.id).distinct().all()]
        if not class_ids:
            return []
        classes = db.query(models.Class).filter(models.Class.id.in_(class_ids)).all()
        return [_class_to_dict(cls) for cls in classes]
    if user["role"] == "student":
        student = db.query(models.Student).join(models.User).filter(models.User.email == user["email"]).first()
        if not student:
            return []
        cls = db.query(models.Class).filter(models.Class.id == student.class_id).first()
        return [_class_to_dict(cls)] if cls else []
    raise HTTPException(status_code=403, detail="Недостаточно прав")

@router.post("/")
async def create_class(data: ClassCreate, db: Session = Depends(get_db), user: dict = Depends(require_role("admin"))):
    new_class = models.Class(**data.dict())
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    return _class_to_dict(new_class)

@router.put("/{class_id}")
async def update_class(class_id: int, data: ClassUpdate, db: Session = Depends(get_db), user: dict = Depends(require_role("admin"))):
    cls = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Класс не найден")
    if data.name is not None:
        cls.name = data.name
    if data.year is not None:
        cls.year = data.year
    if data.max_students is not None:
        enrolled = db.query(models.Student).filter(models.Student.class_id == class_id).count()
        if data.max_students < enrolled:
            raise HTTPException(status_code=400, detail=f"В классе уже {enrolled} учеников — лимит не может быть меньше")
        cls.max_students = data.max_students
    if data.lessons_per_week is not None:
        cls.lessons_per_week = data.lessons_per_week
    db.commit()
    db.refresh(cls)
    return _class_to_dict(cls)

@router.delete("/{class_id}")
async def delete_class(class_id: int, db: Session = Depends(get_db), user: dict = Depends(require_role("admin"))):
    cls = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Класс не найден")

    # 1. Найти всех учеников этого класса
    students = db.query(models.Student).filter(models.Student.class_id == class_id).all()
    for student in students:
        # Удаляем все связанные данные ученика
        db.query(models.Grade).filter(models.Grade.student_id == student.id).delete()
        db.query(models.FinalGrade).filter(models.FinalGrade.student_id == student.id).delete()
        db.query(models.Note).filter(models.Note.student_id == student.id).delete()
        db.query(models.Notification).filter(models.Notification.user_id == student.user_id).delete()
        # Удаляем ученика
        db.delete(student)
        # Удаляем пользователя, если он студент
        user_acc = db.query(models.User).filter(models.User.id == student.user_id, models.User.role == "student").first()
        if user_acc:
            db.delete(user_acc)

    # 2. Удаляем расписание этого класса
    db.query(models.Schedule).filter(models.Schedule.class_id == class_id).delete()

    # 3. Удаляем нагрузку учителей для этого класса
    db.query(models.TeacherAssignment).filter(models.TeacherAssignment.class_id == class_id).delete()

    # 4. Теперь можно удалить сам класс
    db.delete(cls)
    db.commit()
    return {"message": "Класс удалён"}