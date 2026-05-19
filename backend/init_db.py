from app.database import engine, Base, SessionLocal
from app import models
from sqlalchemy.orm import Session
from app import auth

#функция для инициализации базы данных
def init_db():
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # создаём тестовых пользователей, если их нет
    if not db.query(models.User).filter(models.User.email == "admin@school.ru").first():
        admin = models.User(
            email="admin@school.ru",
            full_name="Завуч Ирина",
            hashed_password=auth.get_password_hash("admin123"),
            role="admin"
        )
        teacher = models.User(
            email="teacher@school.ru",
            full_name="Учитель Петр",
            hashed_password=auth.get_password_hash("teacher123"),
            role="teacher"
        )
        student = models.User(
            email="student@school.ru",
            full_name="Ученик Алексей",
            hashed_password=auth.get_password_hash("student123"),
            role="student"
        )
        db.add_all([admin, teacher, student])
        db.commit()
    
    db.close()
    print("База данных инициализирована")

if __name__ == "__main__":
    init_db()