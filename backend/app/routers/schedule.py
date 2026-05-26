from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from .. import models
from ..dependencies import get_current_user, require_role
from ..schemas import ScheduleCreate

router = APIRouter()

# функция для получения расписания (доступно всем авторизованным)
@router.get("/")
def get_schedule(
    class_id: int = None,
    teacher_id: int = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    query = db.query(models.Schedule).options(
        joinedload(models.Schedule.class_group),
        joinedload(models.Schedule.subject),
        joinedload(models.Schedule.teacher).joinedload(models.Teacher.user)
    )
    if class_id is not None:
        query = query.filter(models.Schedule.class_id == class_id)
    if teacher_id is not None:
        query = query.filter(models.Schedule.teacher_id == teacher_id)

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
    new_item = models.Schedule(**data.dict())
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return {"id": new_item.id, "msg": "Запись добавлена"}

# функция для удаления урока из расписания (только завуч)
@router.delete("/{item_id}", dependencies=[Depends(require_role("admin"))])
def delete_schedule_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.Schedule).filter(models.Schedule.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    db.delete(item)
    db.commit()
    return {"msg": "Запись удалена"}