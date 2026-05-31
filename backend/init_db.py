# backend/init_db.py
from app.database import engine, Base, SessionLocal
from app.migrate import migrate_schema
from app import models, auth
from datetime import date
import random
import sys


def init_db():
    Base.metadata.create_all(bind=engine)
    migrate_schema()
    print("Миграция схемы выполнена.")

    db = SessionLocal()

    if db.query(models.User).first():
        db.close()
        print("База данных уже содержит данные. Пропускаем инициализацию.")
        return

    admin = models.User(
        email="admin@school.ru",
        full_name="Воронцова Елена Сергеевна",
        hashed_password=auth.get_password_hash("admin123"),
        role="admin",
        school="Школа №1",
        city="Москва",
        academic_year="2024/2025",
        position="Завуч"
    )
    db.add(admin)
    db.commit()

    subjects_data = [
        {"name": "Математика", "description": "Алгебра и геометрия"},
        {"name": "Русский язык", "description": "Русский язык и литература"},
        {"name": "Английский язык", "description": "Иностранный язык"},
        {"name": "Физика", "description": "Физика и астрономия"},
    ]
    subjects = []
    for s in subjects_data:
        subj = models.Subject(**s)
        db.add(subj)
        subjects.append(subj)
    db.commit()

    teachers_data = [
        {"email": "petrova@school.ru", "name": "Петрова Анна Владимировна", "subject_idx": 0, "room": "301"},
        {"email": "sidorov@school.ru", "name": "Сидоров Игорь Николаевич", "subject_idx": 1, "room": "205"},
        {"email": "smirnova@school.ru", "name": "Смирнова Ольга Дмитриевна", "subject_idx": 2, "room": "412"},
        {"email": "kozlov@school.ru", "name": "Козлов Дмитрий Алексеевич", "subject_idx": 3, "room": "108"},
    ]
    teachers = []
    for t in teachers_data:
        user = models.User(
            email=t["email"],
            full_name=t["name"],
            hashed_password=auth.get_password_hash("teacher123"),
            role="teacher",
            school="Школа №1",
            city="Москва",
            academic_year="2024/2025",
            position="Учитель"
        )
        db.add(user)
        db.commit()
        teacher = models.Teacher(
            user_id=user.id,
            subject_id=subjects[t["subject_idx"]].id,
            room_number=t["room"]
        )
        db.add(teacher)
        db.commit()
        teachers.append(teacher)

    classes_data = [
        {"name": "9А", "year": 2024, "max_students": 30, "lessons_per_week": 34},
        {"name": "9Б", "year": 2024, "max_students": 28, "lessons_per_week": 32},
        {"name": "10А", "year": 2024, "max_students": 25, "lessons_per_week": 35},
        {"name": "10Б", "year": 2024, "max_students": 27, "lessons_per_week": 33},
    ]
    classes = []
    for c in classes_data:
        cls = models.Class(**c)
        db.add(cls)
        classes.append(cls)
    db.commit()

    students_data = [
        {"email": "ivanov@school.ru", "name": "Иванов Артём Александрович", "class_idx": 0},
        {"email": "petrova_s@school.ru", "name": "Петрова Мария Сергеевна", "class_idx": 1},
        {"email": "smirnov_k@school.ru", "name": "Смирнов Кирилл Дмитриевич", "class_idx": 2},
        {"email": "kozlova_a@school.ru", "name": "Козлова Алиса Андреевна", "class_idx": 3},
    ]
    students = []
    for s in students_data:
        user = models.User(
            email=s["email"],
            full_name=s["name"],
            hashed_password=auth.get_password_hash("student123"),
            role="student",
            school="Школа №1",
            city="Москва",
            academic_year="2024/2025",
            position="Ученик"
        )
        db.add(user)
        db.commit()
        student = models.Student(
            user_id=user.id,
            class_id=classes[s["class_idx"]].id
        )
        db.add(student)
        db.commit()
        students.append(student)

    random.seed(42)
    def get_month(q):
        return {1: 10, 2: 12, 3: 3, 4: 5}[q]

    for student in students:
        for subj in subjects[:2]: 
            teacher = next((t for t in teachers if t.subject_id == subj.id), teachers[0])
            for quarter in [1, 2, 3, 4]:
                month = get_month(quarter)
                for _ in range(random.randint(3, 5)):
                    grade = models.Grade(
                        student_id=student.id,
                        subject_id=subj.id,
                        teacher_id=teacher.id,
                        grade_type="current",
                        grade_value=random.choice([3, 4, 4, 5]),
                        work_type=random.choice(list(models.WORK_TYPES_TEACHER)),
                        quarter=quarter,
                        date=date(2024 if month >= 9 else 2025, month, random.randint(1, 28))
                    )
                    db.add(grade)
                q_grade = models.Grade(
                    student_id=student.id,
                    subject_id=subj.id,
                    teacher_id=teacher.id,
                    grade_type="quarter",
                    grade_value=round(random.uniform(3.5, 4.8)),
                    work_type=models.WORK_TYPE_QUARTER,
                    quarter=quarter,
                    date=date(2024 if month >= 9 else 2025, month, 25)
                )
                db.add(q_grade)
    db.commit()

    for cls in classes:
        for day in [1, 3]:
            subj = subjects[(cls.id + day) % len(subjects)]
            teacher = next((t for t in teachers if t.subject_id == subj.id), teachers[0])
            db.add(models.Schedule(
                class_id=cls.id,
                subject_id=subj.id,
                teacher_id=teacher.id,
                day_of_week=day,
                start_time="08:30" if day == 1 else "10:20",
                room=teacher.room_number
            ))
    db.commit()

    notes_data = [
        {"student_id": students[0].id, "author_id": admin.id, "text": "Подготовиться к контрольной по математике", "date": date(2024, 10, 5)},
        {"student_id": students[0].id, "author_id": students[0].user_id, "text": "Сдать домашнее задание по русскому до пятницы", "date": date(2024, 10, 12)},
        {"student_id": students[1].id, "author_id": teachers[0].user_id, "text": "Отличная работа на уроке!", "date": date(2024, 10, 8)},
        {"student_id": students[2].id, "author_id": admin.id, "text": "Повторить правила по английскому", "date": date(2024, 10, 15)},
    ]
    for n in notes_data:
        db.add(models.Note(**n))
    db.commit()

    db.close()

    print("  ТЕСТОВЫЕ АККАУНТЫ")
    print("  Завуч:")
    print("    admin@school.ru / admin123")
    print("\n  Учителя:")
    for t in teachers_data:
        print(f"    {t['email']} / teacher123  ({subjects_data[t['subject_idx']]['name']})")
    print("\n  Ученики:")
    for s in students_data:
        print(f"    {s['email']} / student123  ({s['name']})")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--migrate":
        Base.metadata.create_all(bind=engine)
        migrate_schema()
        print("Миграция схемы выполнена.")
    else:
        init_db()