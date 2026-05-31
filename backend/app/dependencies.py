from fastapi import Depends, HTTPException, Request
from jose import jwt, JWTError

# функция для получения данных пользователя из JWT токена в cookie
async def get_current_user(request: Request):
    from .auth import SECRET_KEY, ALGORITHM 
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Не авторизован")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"email": payload.get("sub"), "role": payload.get("role")}
    except JWTError:
        raise HTTPException(status_code=401, detail="Токен невалиден")

# функция-фабрика для проверки роли пользователя
def require_role(role: str):
    async def role_checker(user: dict = Depends(get_current_user)):
        if user["role"] != role:
            raise HTTPException(status_code=403, detail="Недостаточно прав")
        return user
    return role_checker

# функция-фабрика для проверки нескольких ролей пользователя
def require_roles(roles: list[str]):
    async def role_checker(user: dict = Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Недостаточно прав")
        return user
    return role_checker