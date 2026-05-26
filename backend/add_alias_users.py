from app.database import SessionLocal
from app import models, auth

# Скрипт добавляет удобные алиасы для тестирования:
# teacher@school.ru  -> пароль teacher123
# student@school.ru  -> пароль student123


def add_aliases():
    db = SessionLocal()
    try:
        # добавим teacher@school.ru если нет
        if not db.query(models.User).filter(models.User.email == 'teacher@school.ru').first():
            # создаём пользователя-учителя
            user = models.User(
                email='teacher@school.ru',
                full_name='Тестовый Учитель',
                hashed_password=auth.get_password_hash('teacher123'),
                role='teacher'
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            # пытаемся взять существующий предмет для привязки
            subj = db.query(models.Subject).first()
            subj_id = subj.id if subj else 1
            teacher = models.Teacher(user_id=user.id, subject_id=subj_id, room_number='000')
            db.add(teacher)
            db.commit()
            print('Добавлен teacher@school.ru')
        else:
            print('teacher@school.ru уже есть')

        # добавим student@school.ru если нет
        if not db.query(models.User).filter(models.User.email == 'student@school.ru').first():
            user = models.User(
                email='student@school.ru',
                full_name='Тестовый Ученик',
                hashed_password=auth.get_password_hash('student123'),
                role='student'
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            # привяжем к первому классу если он есть
            cls = db.query(models.Class).first()
            class_id = cls.id if cls else 1
            student = models.Student(user_id=user.id, class_id=class_id)
            db.add(student)
            db.commit()
            print('Добавлен student@school.ru')
        else:
            print('student@school.ru уже есть')

    finally:
        db.close()

if __name__ == '__main__':
    add_aliases()
