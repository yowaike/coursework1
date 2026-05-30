# backend/populate_test_data.py
from datetime import date
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from app.auth import get_password_hash

# ----- Данные аккаунтов (как в README) -----
TEST_ACCOUNTS = {
    "admin": {"email": "admin@school.ru", "full_name": "Завуч Демонстрационный", "role": "admin"},
    "teachers": [
        {"email": "petrova@school.ru", "full_name": "Петрова Анна Владимировна", "subject": "Математика", "room": "301"},
        {"email": "sidorov@school.ru", "full_name": "Сидоров Игорь Николаевич", "subject": "Русский язык", "room": "205"},
        {"email": "smirnova@school.ru", "full_name": "Смирнова Ольга Дмитриевна", "subject": "Английский язык", "room": "412"},
        {"email": "kozlov@school.ru", "full_name": "Козлов Дмитрий Алексеевич", "subject": "Физика", "room": "108"},
    ],
    "students": [
        {"email": "ivanov@school.ru", "full_name": "Иванов Артём Александрович", "class_name": "9А"},
        {"email": "petrova_s@school.ru", "full_name": "Петрова Мария Сергеевна", "class_name": "9Б"},
        {"email": "smirnov_k@school.ru", "full_name": "Смирнов Кирилл Дмитриевич", "class_name": "10А"},
        {"email": "kozlova_a@school.ru", "full_name": "Козлова Алиса Андреевна", "class_name": "10Б"},
    ]
}

# ----- Расписание: для каждого класса список уроков -----
# Дни: 1-Пн, 2-Вт, 3-Ср, 4-Чт, 5-Пт
SCHEDULE_DATA = {
    "9А": [
        {"day": 1, "time": "08:30", "subject": "Математика", "teacher_email": "petrova@school.ru", "room": "301"},
        {"day": 1, "time": "10:20", "subject": "Русский язык", "teacher_email": "sidorov@school.ru", "room": "205"},
        {"day": 2, "time": "09:00", "subject": "Английский язык", "teacher_email": "smirnova@school.ru", "room": "412"},
        {"day": 2, "time": "11:00", "subject": "Физика", "teacher_email": "kozlov@school.ru", "room": "108"},
        {"day": 3, "time": "08:30", "subject": "Математика", "teacher_email": "petrova@school.ru", "room": "301"},
        {"day": 4, "time": "10:20", "subject": "Русский язык", "teacher_email": "sidorov@school.ru", "room": "205"},
        {"day": 5, "time": "09:00", "subject": "Английский язык", "teacher_email": "smirnova@school.ru", "room": "412"},
    ],
    "9Б": [
        {"day": 1, "time": "10:20", "subject": "Математика", "teacher_email": "petrova@school.ru", "room": "301"},
        {"day": 1, "time": "12:00", "subject": "Русский язык", "teacher_email": "sidorov@school.ru", "room": "205"},
        {"day": 2, "time": "08:30", "subject": "Английский язык", "teacher_email": "smirnova@school.ru", "room": "412"},
        {"day": 3, "time": "11:00", "subject": "Физика", "teacher_email": "kozlov@school.ru", "room": "108"},
        {"day": 3, "time": "13:30", "subject": "Математика", "teacher_email": "petrova@school.ru", "room": "301"},
        {"day": 4, "time": "09:00", "subject": "Русский язык", "teacher_email": "sidorov@school.ru", "room": "205"},
        {"day": 5, "time": "10:20", "subject": "Английский язык", "teacher_email": "smirnova@school.ru", "room": "412"},
    ],
    "10А": [
        {"day": 1, "time": "09:00", "subject": "Математика", "teacher_email": "petrova@school.ru", "room": "301"},
        {"day": 2, "time": "10:20", "subject": "Русский язык", "teacher_email": "sidorov@school.ru", "room": "205"},
        {"day": 3, "time": "08:30", "subject": "Английский язык", "teacher_email": "smirnova@school.ru", "room": "412"},
        {"day": 4, "time": "12:00", "subject": "Физика", "teacher_email": "kozlov@school.ru", "room": "108"},
        {"day": 4, "time": "13:30", "subject": "Математика", "teacher_email": "petrova@school.ru", "room": "301"},
        {"day": 5, "time": "09:00", "subject": "Русский язык", "teacher_email": "sidorov@school.ru", "room": "205"},
    ],
    "10Б": [
        {"day": 1, "time": "11:00", "subject": "Математика", "teacher_email": "petrova@school.ru", "room": "301"},
        {"day": 2, "time": "09:00", "subject": "Русский язык", "teacher_email": "sidorov@school.ru", "room": "205"},
        {"day": 3, "time": "10:20", "subject": "Английский язык", "teacher_email": "smirnova@school.ru", "room": "412"},
        {"day": 3, "time": "14:00", "subject": "Физика", "teacher_email": "kozlov@school.ru", "room": "108"},
        {"day": 4, "time": "08:30", "subject": "Математика", "teacher_email": "petrova@school.ru", "room": "301"},
        {"day": 5, "time": "12:00", "subject": "Русский язык", "teacher_email": "sidorov@school.ru", "room": "205"},
    ]
}

# ----- Оценки для каждого ученика (пример для Иванова, добавьте остальных по аналогии) -----
# Поля: student_email, subject, quarter (1-4), grade_type ("current"/"quarter"), grade_value, work_type, date (YYYY-MM-DD)
GRADES_DATA = [
    # Иванов Артём (9А) - Математика, 1 четверть
    {"student_email": "ivanov@school.ru", "subject": "Математика", "quarter": 1, "grade_type": "current", "grade_value": 5, "work_type": "ДЗ", "date": "2024-09-15"},
    {"student_email": "ivanov@school.ru", "subject": "Математика", "quarter": 1, "grade_type": "current", "grade_value": 4, "work_type": "КР", "date": "2024-09-28"},
    {"student_email": "ivanov@school.ru", "subject": "Математика", "quarter": 1, "grade_type": "current", "grade_value": 5, "work_type": "ОТВ", "date": "2024-10-05"},
    {"student_email": "ivanov@school.ru", "subject": "Математика", "quarter": 1, "grade_type": "quarter", "grade_value": 5, "work_type": "ЧЕТВ", "date": "2024-10-24"},
    # Математика, 2 четверть
    {"student_email": "ivanov@school.ru", "subject": "Математика", "quarter": 2, "grade_type": "current", "grade_value": 4, "work_type": "ДЗ", "date": "2024-11-10"},
    {"student_email": "ivanov@school.ru", "subject": "Математика", "quarter": 2, "grade_type": "current", "grade_value": 5, "work_type": "СР", "date": "2024-11-25"},
    {"student_email": "ivanov@school.ru", "subject": "Математика", "quarter": 2, "grade_type": "quarter", "grade_value": 5, "work_type": "ЧЕТВ", "date": "2024-12-24"},
    # Русский язык, 1 четверть
    {"student_email": "ivanov@school.ru", "subject": "Русский язык", "quarter": 1, "grade_type": "current", "grade_value": 4, "work_type": "ДЗ", "date": "2024-09-12"},
    {"student_email": "ivanov@school.ru", "subject": "Русский язык", "quarter": 1, "grade_type": "current", "grade_value": 3, "work_type": "ТЕСТ", "date": "2024-09-26"},
    {"student_email": "ivanov@school.ru", "subject": "Русский язык", "quarter": 1, "grade_type": "quarter", "grade_value": 4, "work_type": "ЧЕТВ", "date": "2024-10-24"},
    # Английский язык, 1 четверть
    {"student_email": "ivanov@school.ru", "subject": "Английский язык", "quarter": 1, "grade_type": "current", "grade_value": 5, "work_type": "ОТВ", "date": "2024-09-10"},
    {"student_email": "ivanov@school.ru", "subject": "Английский язык", "quarter": 1, "grade_type": "current", "grade_value": 4, "work_type": "ДЗ", "date": "2024-09-20"},
    {"student_email": "ivanov@school.ru", "subject": "Английский язык", "quarter": 1, "grade_type": "quarter", "grade_value": 5, "work_type": "ЧЕТВ", "date": "2024-10-23"},
    # Физика, 1 четверть
    {"student_email": "ivanov@school.ru", "subject": "Физика", "quarter": 1, "grade_type": "current", "grade_value": 4, "work_type": "ЛР", "date": "2024-09-18"},
    {"student_email": "ivanov@school.ru", "subject": "Физика", "quarter": 1, "grade_type": "current", "grade_value": 5, "work_type": "ОТВ", "date": "2024-10-02"},
    {"student_email": "ivanov@school.ru", "subject": "Физика", "quarter": 1, "grade_type": "quarter", "grade_value": 4, "work_type": "ЧЕТВ", "date": "2024-10-25"},
]

# ------------------------------------------------------------
def get_or_create_subject(db: Session, name: str) -> models.Subject:
    subj = db.query(models.Subject).filter(models.Subject.name == name).first()
    if not subj:
        subj = models.Subject(name=name, description="")
        db.add(subj)
        db.commit()
        db.refresh(subj)
    return subj

def get_or_create_class(db: Session, name: str) -> models.Class:
    cls = db.query(models.Class).filter(models.Class.name == name).first()
    if not cls:
        cls = models.Class(name=name, year=int(name[:2]) + 2000, max_students=30, lessons_per_week=30)
        db.add(cls)
        db.commit()
        db.refresh(cls)
    return cls

def ensure_accounts(db: Session):
    # Админ
    admin = db.query(models.User).filter(models.User.email == TEST_ACCOUNTS["admin"]["email"]).first()
    if not admin:
        admin = models.User(
            email=TEST_ACCOUNTS["admin"]["email"],
            full_name=TEST_ACCOUNTS["admin"]["full_name"],
            hashed_password=get_password_hash("admin123"),
            role="admin"
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    # Учителя
    teacher_objs = []
    for t in TEST_ACCOUNTS["teachers"]:
        user = db.query(models.User).filter(models.User.email == t["email"]).first()
        if not user:
            user = models.User(
                email=t["email"],
                full_name=t["full_name"],
                hashed_password=get_password_hash("teacher123"),
                role="teacher"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        subject = get_or_create_subject(db, t["subject"])
        teacher = db.query(models.Teacher).filter(models.Teacher.user_id == user.id).first()
        if not teacher:
            teacher = models.Teacher(user_id=user.id, subject_id=subject.id, room_number=t["room"])
            db.add(teacher)
            db.commit()
            db.refresh(teacher)
        teacher_objs.append((teacher, subject, t["room"]))
    return admin, teacher_objs

def ensure_students_and_classes(db: Session):
    class_map = {}
    student_objs = []
    for s in TEST_ACCOUNTS["students"]:
        cls = get_or_create_class(db, s["class_name"])
        class_map[s["class_name"]] = cls
        user = db.query(models.User).filter(models.User.email == s["email"]).first()
        if not user:
            user = models.User(
                email=s["email"],
                full_name=s["full_name"],
                hashed_password=get_password_hash("student123"),
                role="student"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        student = db.query(models.Student).filter(models.Student.user_id == user.id).first()
        if not student:
            student = models.Student(user_id=user.id, class_id=cls.id)
            db.add(student)
            db.commit()
            db.refresh(student)
        student_objs.append((student, cls))
    return student_objs, class_map

def ensure_schedule(db: Session, class_map):
    for class_name, cls in class_map.items():
        lessons = SCHEDULE_DATA.get(class_name, [])
        for lesson in lessons:
            teacher_user = db.query(models.User).filter(models.User.email == lesson["teacher_email"]).first()
            if not teacher_user:
                continue
            teacher = db.query(models.Teacher).filter(models.Teacher.user_id == teacher_user.id).first()
            if not teacher:
                continue
            subject = get_or_create_subject(db, lesson["subject"])
            # Не создаём дубликаты
            existing = db.query(models.Schedule).filter(
                models.Schedule.class_id == cls.id,
                models.Schedule.day_of_week == lesson["day"],
                models.Schedule.start_time == lesson["time"],
                models.Schedule.subject_id == subject.id,
                models.Schedule.teacher_id == teacher.id
            ).first()
            if not existing:
                sched = models.Schedule(
                    class_id=cls.id,
                    subject_id=subject.id,
                    teacher_id=teacher.id,
                    day_of_week=lesson["day"],
                    start_time=lesson["time"],
                    room=lesson["room"]
                )
                db.add(sched)
            # TeacherAssignment для нагрузки
            assign = db.query(models.TeacherAssignment).filter(
                models.TeacherAssignment.teacher_id == teacher.id,
                models.TeacherAssignment.class_id == cls.id,
                models.TeacherAssignment.subject_id == subject.id
            ).first()
            if not assign:
                assign = models.TeacherAssignment(
                    teacher_id=teacher.id,
                    class_id=cls.id,
                    subject_id=subject.id
                )
                db.add(assign)
    db.commit()

def ensure_grades(db: Session):
    for g in GRADES_DATA:
        student = db.query(models.Student).join(models.User).filter(models.User.email == g["student_email"]).first()
        if not student:
            continue
        subject = db.query(models.Subject).filter(models.Subject.name == g["subject"]).first()
        if not subject:
            continue
        teacher = db.query(models.Teacher).filter(models.Teacher.subject_id == subject.id).first()
        if not teacher:
            continue
        # Проверка существования такой же оценки (чтобы не дублировать)
        existing = db.query(models.Grade).filter(
            models.Grade.student_id == student.id,
            models.Grade.subject_id == subject.id,
            models.Grade.teacher_id == teacher.id,
            models.Grade.grade_type == g["grade_type"],
            models.Grade.quarter == g["quarter"],
            models.Grade.date == date.fromisoformat(g["date"]),
            models.Grade.work_type == g["work_type"]
        ).first()
        if not existing:
            new_grade = models.Grade(
                student_id=student.id,
                subject_id=subject.id,
                teacher_id=teacher.id,
                grade_type=g["grade_type"],
                grade_value=g["grade_value"],
                work_type=g["work_type"],
                quarter=g["quarter"],
                date=date.fromisoformat(g["date"])
            )
            db.add(new_grade)
    db.commit()

def recalculate_final_grades(db: Session, student_objs, class_map):
    active_year = db.query(models.AcademicYear).filter(models.AcademicYear.is_active == True).first()
    if not active_year:
        active_year = models.AcademicYear(name="2024/2025", is_active=True)
        db.add(active_year)
        db.commit()
        db.refresh(active_year)
    for student, cls in student_objs:
        subjects_in_class = db.query(models.Subject).join(models.Schedule).filter(
            models.Schedule.class_id == cls.id
        ).distinct().all()
        for subject in subjects_in_class:
            quarter_grades = db.query(models.Grade).filter(
                models.Grade.student_id == student.id,
                models.Grade.subject_id == subject.id,
                models.Grade.academic_year_id == active_year.id,
                models.Grade.grade_type == "quarter"
            ).all()
            if not quarter_grades:
                continue
            avg_val = sum(g.grade_value for g in quarter_grades) / len(quarter_grades)
            calculated = int(round(avg_val))
            calculated = max(2, min(5, calculated))
            final = db.query(models.FinalGrade).filter(
                models.FinalGrade.student_id == student.id,
                models.FinalGrade.subject_id == subject.id,
                models.FinalGrade.academic_year_id == active_year.id
            ).first()
            if final:
                if not final.is_override:
                    final.value = calculated
                    final.calculated_from_term_avg = calculated
            else:
                final = models.FinalGrade(
                    student_id=student.id,
                    subject_id=subject.id,
                    academic_year_id=active_year.id,
                    value=calculated,
                    is_override=False,
                    calculated_from_term_avg=calculated
                )
                db.add(final)
    db.commit()

def main():
    db = SessionLocal()
    ensure_accounts(db)
    student_objs, class_map = ensure_students_and_classes(db)
    ensure_schedule(db, class_map)
    ensure_grades(db)
    recalculate_final_grades(db, student_objs, class_map)
    print("Готово!")

if __name__ == "__main__":
    main()