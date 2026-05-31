from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from .. import models
from ..dependencies import get_current_user, require_role
from ..schemas import ScheduleCreate

router = APIRouter()

def _sync_assignment_from_schedule(db: Session, item: models.Schedule):
    existing = db.query(models.TeacherAssignment).filter(
        models.TeacherAssignment.teacher_id == item.teacher_id,
        models.TeacherAssignment.class_id == item.class_id,
        models.TeacherAssignment.subject_id == item.subject_id,
        models.TeacherAssignment.academic_year_id == item.academic_year_id,
    ).first()
    if not existing:
        db.add(models.TeacherAssignment(
            teacher_id=item.teacher_id,
            class_id=item.class_id,
            subject_id=item.subject_id,
            academic_year_id=item.academic_year_id,
        ))

# функция для получения расписания
@router.get("/")
async def get_schedule(
    class_id: int = None,
    teacher_id: int = None,
    db: Session = Depends(get_db),
    request: Request = None,
):
    if request is None:
        raise HTTPException(status_code=401, detail="Не авторизован")
    current_user = await get_current_user(request)

    query = db.query(models.Schedule).options(
        joinedload(models.Schedule.class_group),
        joinedload(models.Schedule.subject),
        joinedload(models.Schedule.teacher).joinedload(models.Teacher.user)
    )

    # RBAC ограничения
    if current_user["role"] == "admin":
        if class_id is not None:
            query = query.filter(models.Schedule.class_id == class_id)
        if teacher_id is not None:
            query = query.filter(models.Schedule.teacher_id == teacher_id)
    elif current_user["role"] == "teacher":
        teacher = db.query(models.Teacher).join(models.User).filter(
            models.User.email == current_user["email"]
        ).first()
        if not teacher:
            return []
        query = query.filter(models.Schedule.teacher_id == teacher.id)
    elif current_user["role"] == "student":
        student = db.query(models.Student).join(models.User).filter(
            models.User.email == current_user["email"]
        ).first()
        if not student:
            return []
        query = query.filter(models.Schedule.class_id == student.class_id)
    else:
        raise HTTPException(status_code=403, detail="Недостаточно прав")

    schedule = query.all()
    
    result = []
    for s in schedule:
        result.append({
            "id": s.id,
            "day_of_week": s.day_of_week,
            "start_time": s.start_time,
            "class_id": s.class_id,
            "class_name": s.class_group.name if s.class_group else None,
            "subject_id": s.subject_id,
            "subject_name": s.subject.name if s.subject else None,
            "teacher_id": s.teacher_id,
            "teacher_name": s.teacher.user.full_name if s.teacher and s.teacher.user else None,
            "room": s.room
        })
    return result

# функция для добавления урока в расписание (только завуч)
@router.post("/", dependencies=[Depends(require_role("admin"))])
def create_schedule_item(data: ScheduleCreate, db: Session = Depends(get_db)):
    teacher = db.query(models.Teacher).filter(models.Teacher.id == data.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Учитель не найден")
    if teacher.subject_id != data.subject_id:
        raise HTTPException(status_code=400, detail="Учитель не ведёт выбранный предмет")
    new_item = models.Schedule(**data.dict())
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    _sync_assignment_from_schedule(db, new_item)
    db.commit()
    return {"id": new_item.id, "msg": "Запись добавлена"}

# функция для редактирования урока в расписании (только завуч)
@router.put("/{item_id}", dependencies=[Depends(require_role("admin"))])
def update_schedule_item(
    item_id: int,
    data: ScheduleCreate,
    db: Session = Depends(get_db),
):
    item = db.query(models.Schedule).filter(models.Schedule.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Запись не найдена")

    teacher = db.query(models.Teacher).filter(models.Teacher.id == data.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Учитель не найден")
    if teacher.subject_id != data.subject_id:
        raise HTTPException(status_code=400, detail="Учитель не ведёт выбранный предмет")

    item.class_id = data.class_id
    item.subject_id = data.subject_id
    item.teacher_id = data.teacher_id
    item.day_of_week = data.day_of_week
    item.start_time = data.start_time
    item.room = data.room

    db.commit()
    db.refresh(item)
    _sync_assignment_from_schedule(db, item)
    db.commit()
    return {"id": item.id, "msg": "Запись обновлена"}

# функция для удаления урока из расписания (только завуч)
@router.delete("/{item_id}", dependencies=[Depends(require_role("admin"))])
def delete_schedule_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.Schedule).filter(models.Schedule.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    db.delete(item)
    db.commit()
    return {"msg": "Запись удалена"}