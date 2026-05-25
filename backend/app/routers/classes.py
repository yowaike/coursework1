from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..dependencies import require_role
from ..schemas import ClassCreate

router = APIRouter()

# получить все классы (только завуч)
@router.get("/")
async def get_classes(db: Session = Depends(get_db), user: dict = Depends(require_role("admin"))):
    classes = db.query(models.Class).all()
    return [
        {
            "id": cls.id,
            "name": cls.name,
            "year": cls.year
        }
        for cls in classes
    ]

# создать класс (только завуч)
@router.post("/")
async def create_class(data: ClassCreate, db: Session = Depends(get_db), user: dict = Depends(require_role("admin"))):
    new_class = models.Class(**data.dict())
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    return {
        "id": new_class.id,
        "name": new_class.name,
        "year": new_class.year
    }

# удалить класс (только завуч)
@router.delete("/{class_id}")
async def delete_class(class_id: int, db: Session = Depends(get_db), user: dict = Depends(require_role("admin"))):
    cls = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Класс не найден")
    db.delete(cls)
    db.commit()
    return {"message": "Класс удален"}
