from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

# настройка хеширования
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "my_super_secret_key_for_coursework"
ALGORITHM = "HS256"

#функция для хеширования пароля
def get_password_hash(password):
    return pwd_context.hash(password)

#функция для проверки пароля
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

#функция для создания токена
def create_access_token(data: dict):
    expire = datetime.utcnow() + timedelta(hours=2)
    to_encode = data.copy()
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token