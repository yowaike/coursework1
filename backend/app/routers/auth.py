from fastapi import APIRouter, Depends, HTTPException, Response, Cookie, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, auth as auth_utils
from jose import jwt
from ..auth import SECRET_KEY, ALGORITHM

router = APIRouter()

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
    
    # Создаём Response явно
    from fastapi.responses import JSONResponse
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
def get_me(request: Request):
    token = request.cookies.get("access_token")
    
    # Отладочный вывод в терминал
    if token:
        print(f"DEBUG /me: токен получен (начало): {token[:30]}")
    else:
        print("DEBUG /me: токен не найден в cookie")
    
    if not token:
        raise HTTPException(status_code=401, detail="Не авторизован")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"DEBUG /me: токен декодирован: {payload}")
        return {"email": payload.get("sub"), "role": payload.get("role")}
    except Exception as e:
        print(f"DEBUG /me: ошибка декодирования: {e}")
        raise HTTPException(status_code=401, detail="Токен истёк или невалиден")

# функция для выхода
@router.post("/logout")
def logout():
    from fastapi.responses import JSONResponse
    response = JSONResponse(content={"msg": "выход выполнен"})
    response.delete_cookie(key="access_token", path="/")
    return response