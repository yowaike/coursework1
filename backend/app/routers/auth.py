from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from jose import jwt
from pydantic import BaseModel
from typing import Optional
from ..database import get_db
from .. import models, auth as auth_utils
from ..auth import SECRET_KEY, ALGORITHM
from ..dependencies import get_current_user

router = APIRouter()

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    school: Optional[str] = None
    city: Optional[str] = None
    academic_year: Optional[str] = None
    position: Optional[str] = None
    # teacher-specific
    subject_id: Optional[int] = None
    room_number: Optional[str] = None

# функция для входа пользователя
@router.post("/login")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth_utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Неверный email или пароль")

    token = auth_utils.create_access_token(data={"sub": user.email, "role": user.role})

    response = JSONResponse(content={"msg": "вход выполнен", "role": user.role})
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=1800,
        samesite="lax",
        secure=False,
        path="/"
    )
    return response

# функция для получения текущего пользователя
@router.get("/me")
def get_me(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Не авторизован")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        result = {"email": user.email, "role": user.role, "full_name": user.full_name}
        # include profile fields if present
        result.update({
            "school": user.school,
            "city": user.city,
            "academic_year": user.academic_year,
            "position": user.position
        })
        # если учитель — попытаемся вернуть данные учителя
        if user.role == 'teacher':
            teacher = db.query(models.Teacher).filter(models.Teacher.user_id == user.id).first()
            if teacher:
                result.update({
                    "teacher_id": teacher.id,
                    "subject_id": teacher.subject_id,
                    "subject_name": teacher.subject.name if teacher.subject else None,
                    "room_number": teacher.room_number
                })
        return result
    except Exception:
        raise HTTPException(status_code=401, detail="Токен истёк или невалиден")

# функция для обновления профиля
@router.put("/update-profile")
async def update_profile(
    data: UpdateProfileRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    user_data = await get_current_user(request)
    user = db.query(models.User).filter(models.User.email == user_data["email"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    updated = False
    if data.full_name is not None:
        user.full_name = data.full_name; updated = True
    if data.school is not None:
        user.school = data.school; updated = True
    if data.city is not None:
        user.city = data.city; updated = True
    if data.academic_year is not None:
        user.academic_year = data.academic_year; updated = True
    if data.position is not None:
        user.position = data.position; updated = True

    # если учитель — обновим запись в teachers
    if user.role == 'teacher' and (data.subject_id is not None or data.room_number is not None):
        teacher = db.query(models.Teacher).filter(models.Teacher.user_id == user.id).first()
        if teacher:
            if data.subject_id is not None:
                teacher.subject_id = data.subject_id; updated = True
            if data.room_number is not None:
                teacher.room_number = data.room_number; updated = True

    if updated:
        db.commit()
        db.refresh(user)

    return {"msg": "Профиль обновлён", "full_name": user.full_name, "school": user.school, "city": user.city, "academic_year": user.academic_year, "position": user.position}

# функция для выхода
@router.post("/logout")
def logout():
    response = JSONResponse(content={"msg": "выход выполнен"})
    response.delete_cookie(key="access_token", path="/")
    return response