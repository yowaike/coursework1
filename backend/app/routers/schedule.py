from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..dependencies import require_role
from ..schemas import ScheduleCreate

router = APIRouter()

# получить расписание (только завуч, может фильтровать по teacher_id)
@router.get("/")
async def get_schedule(
    teacher_id: int = Query(None),
    db: Session = Depends(get_db),
    user: dict = Depends(require_role("admin"))
):
    query = db.query(models.Schedule)
    if teacher_id:
        query = query.filter(models.Schedule.teacher_id == teacher_id)
    schedule = query.all()
    return [
        {
            "id": sched.id,
            "class_id": sched.class_id,
            "class_name": sched.class_.name if sched.class_ else None,
            "subject_id": sched.subject_id,
            "subject_name": sched.subject.name if sched.subject else None,
            "teacher_id": sched.teacher_id,
            "teacher_name": sched.teacher.user.full_name if sched.teacher and sched.teacher.user else None,
            "day_of_week": sched.day_of_week,
            "start_time": sched.start_time,
            "room": sched.room
        }
        for sched in schedule
    ]

# создать расписание (только завуч)
@router.post("/")
async def create_schedule(data: ScheduleCreate, db: Session = Depends(get_db), user: dict = Depends(require_role("admin"))):
    new_schedule = models.Schedule(**data.dict())
    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)
    return {
        "id": new_schedule.id,
        "class_id": new_schedule.class_id,
        "subject_id": new_schedule.subject_id,
        "teacher_id": new_schedule.teacher_id,
        "day_of_week": new_schedule.day_of_week,
        "start_time": new_schedule.start_time,
        "room": new_schedule.room
    }

# удалить расписание (только завуч)
@router.delete("/{schedule_id}")
async def delete_schedule(schedule_id: int, db: Session = Depends(get_db), user: dict = Depends(require_role("admin"))):
    schedule = db.query(models.Schedule).filter(models.Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Расписание не найдено")
    db.delete(schedule)
    db.commit()
    return {"message": "Расписание удалено"}
