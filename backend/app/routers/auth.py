from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, auth as auth_utils

router = APIRouter()

#функция для входа пользователя
@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db), response: Response = None):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth_utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Неверный email или пароль")

    token = auth_utils.create_access_token(data={"sub": user.email, "role": user.role})
    response.set_cookie(key="access_token", value=token, httponly=True, max_age=1800)
    return {"msg": "вход выполнен"}

#функция для выхода пользователя
@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"msg": "выход выполнен"}