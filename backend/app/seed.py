from datetime import date

from sqlalchemy.orm import Session

from . import models
from .auth import get_password_hash


def seed_demo_data(db: Session) -> dict:
    """
    Идемпотентный seed демо-данных.
    Запускается на startup и не дублирует данные, если они уже созданы.
    """

    # Если уже есть завуч — считаем, что база заполнена.
    existing_admin = db.query(models.User).filter(models.User.role == "admin").first()
    if existing_admin:
        return {"seeded": False, "reason": "admin_exists"}

    # --- справочники ---
    # классы
    class_5a = models.Class(name="5А", year=5, max_students=30, lessons_per_week=30)
    class_5b = models.Class(name="5Б", year=5, max_students=30, lessons_per_week=30)
    db.add_all([class_5a, class_5b])
    db.flush()

    # предметы
    subj_math = models.Subject(name="Математика", description="Алгебра и основы геометрии")
    subj_rus = models.Subject(name="Русский язык", description="Орфография, пунктуация, речь")
    subj_hist = models.Subject(name="История", description="История России и мира")
    db.add_all([subj_math, subj_rus, subj_hist])
    db.flush()

    # --- пользователи / профили ---
    admin = models.User(
        full_name="Завуч Демонстрационный",
        email="admin@school.local",
        hashed_password=get_password_hash("admin123"),
        role="admin",
        school="Школа №1",
        city="Город",
        academic_year="2025/2026",
        position="Завуч",
    )
    db.add(admin)
    db.flush()

    t1u = models.User(
        full_name="Иванова Анна Петровна",
        email="teacher1@school.local",
        hashed_password=get_password_hash("teacher123"),
        role="teacher",
        position="Учитель",
    )
    t2u = models.User(
        full_name="Петров Сергей Ильич",
        email="teacher2@school.local",
        hashed_password=get_password_hash("teacher123"),
        role="teacher",
        position="Учитель",
    )
    t3u = models.User(
        full_name="Смирнова Мария Андреевна",
        email="teacher3@school.local",
        hashed_password=get_password_hash("teacher123"),
        role="teacher",
        position="Учитель",
    )
    db.add_all([t1u, t2u, t3u])
    db.flush()

    t1 = models.Teacher(user_id=t1u.id, subject_id=subj_math.id, room_number="301")
    t2 = models.Teacher(user_id=t2u.id, subject_id=subj_rus.id, room_number="214")
    t3 = models.Teacher(user_id=t3u.id, subject_id=subj_hist.id, room_number="102")
    db.add_all([t1, t2, t3])
    db.flush()

    s1u = models.User(
        full_name="Кузнецов Артём",
        email="student1@school.local",
        hashed_password=get_password_hash("student123"),
        role="student",
    )
    s2u = models.User(
        full_name="Волкова София",
        email="student2@school.local",
        hashed_password=get_password_hash("student123"),
        role="student",
    )
    s3u = models.User(
        full_name="Орлова Полина",
        email="student3@school.local",
        hashed_password=get_password_hash("student123"),
        role="student",
    )
    db.add_all([s1u, s2u, s3u])
    db.flush()

    s1 = models.Student(user_id=s1u.id, class_id=class_5a.id)
    s2 = models.Student(user_id=s2u.id, class_id=class_5a.id)
    s3 = models.Student(user_id=s3u.id, class_id=class_5b.id)
    db.add_all([s1, s2, s3])
    db.flush()

    # --- расписание ---
    schedule = [
        # 5А
        models.Schedule(class_id=class_5a.id, subject_id=subj_math.id, teacher_id=t1.id, day_of_week=1, start_time="08:00", room="301"),
        models.Schedule(class_id=class_5a.id, subject_id=subj_rus.id, teacher_id=t2.id, day_of_week=2, start_time="09:00", room="214"),
        models.Schedule(class_id=class_5a.id, subject_id=subj_hist.id, teacher_id=t3.id, day_of_week=3, start_time="10:00", room="102"),
        # 5Б
        models.Schedule(class_id=class_5b.id, subject_id=subj_math.id, teacher_id=t1.id, day_of_week=1, start_time="09:00", room="301"),
        models.Schedule(class_id=class_5b.id, subject_id=subj_rus.id, teacher_id=t2.id, day_of_week=4, start_time="08:00", room="214"),
        models.Schedule(class_id=class_5b.id, subject_id=subj_hist.id, teacher_id=t3.id, day_of_week=5, start_time="11:00", room="102"),
    ]
    db.add_all(schedule)
    db.flush()

    # --- оценки ---
    today = date.today()
    grades = [
        # текущие (учителя)
        models.Grade(student_id=s1.id, subject_id=subj_math.id, teacher_id=t1.id, grade_type=models.GRADE_TYPE_CURRENT, grade_value=5, work_type="ДЗ", quarter=1, date=today),
        models.Grade(student_id=s1.id, subject_id=subj_math.id, teacher_id=t1.id, grade_type=models.GRADE_TYPE_CURRENT, grade_value=4, work_type="КР", quarter=1, date=today),
        models.Grade(student_id=s2.id, subject_id=subj_rus.id, teacher_id=t2.id, grade_type=models.GRADE_TYPE_CURRENT, grade_value=3, work_type="ОТВ", quarter=1, date=today),
        models.Grade(student_id=s3.id, subject_id=subj_hist.id, teacher_id=t3.id, grade_type=models.GRADE_TYPE_CURRENT, grade_value=2, work_type="ТЕСТ", quarter=1, date=today),
        # четвертные (завуч)
        models.Grade(student_id=s1.id, subject_id=subj_math.id, teacher_id=t1.id, grade_type=models.GRADE_TYPE_QUARTER, grade_value=5, work_type=models.WORK_TYPE_QUARTER, quarter=1, date=today),
        models.Grade(student_id=s2.id, subject_id=subj_rus.id, teacher_id=t2.id, grade_type=models.GRADE_TYPE_QUARTER, grade_value=4, work_type=models.WORK_TYPE_QUARTER, quarter=1, date=today),
        models.Grade(student_id=s3.id, subject_id=subj_hist.id, teacher_id=t3.id, grade_type=models.GRADE_TYPE_QUARTER, grade_value=3, work_type=models.WORK_TYPE_QUARTER, quarter=1, date=today),
    ]
    db.add_all(grades)
    db.flush()

    # --- заметки ---
    notes = [
        models.Note(student_id=s1.id, author_id=admin.id, text="Проверить подготовку к контрольной.", date=today),
        models.Note(student_id=s1.id, author_id=t1u.id, text="Хороший прогресс, продолжай.", date=today),
        models.Note(student_id=s2.id, author_id=t2u.id, text="Обратить внимание на орфографию.", date=today),
    ]
    db.add_all(notes)

    db.commit()
    return {
        "seeded": True,
        "accounts": {
            "admin": {"email": admin.email, "password": "admin123"},
            "teachers": [
                {"email": t1u.email, "password": "teacher123"},
                {"email": t2u.email, "password": "teacher123"},
                {"email": t3u.email, "password": "teacher123"},
            ],
            "students": [
                {"email": s1u.email, "password": "student123"},
                {"email": s2u.email, "password": "student123"},
                {"email": s3u.email, "password": "student123"},
            ],
        },
    }

