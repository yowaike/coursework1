from app.database import engine, Base, SessionLocal
from app import models, auth
from datetime import date
import random

# функция для инициализации базы данных с демо-данными
def init_db():
    # создаём таблицы
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # ОЧИЩАЕМ ВСЕ ДАННЫЕ для переинициализации
    try:
        db.query(models.Grade).delete()
        db.query(models.Note).delete()
        db.query(models.Event).delete()
        db.query(models.Schedule).delete()
        db.query(models.Student).delete()
        db.query(models.Teacher).delete()
        db.query(models.Subject).delete()
        db.query(models.Class).delete()
        db.query(models.User).delete()
        db.commit()
    except Exception as e:
        db.rollback()
        pass  # возможно, таблицы пусты
    
    # ПОЛЬЗОВАТЕЛИ
    # завуч
    admin_user = models.User(
        email="admin@school.ru",
        full_name="Воронцова Елена Сергеевна",
        hashed_password=auth.get_password_hash("admin123"),
        role="admin"
    )
    
    # учителя
    teacher_math = models.User(
        email="petrova@school.ru",
        full_name="Петрова Анна Владимировна",
        hashed_password=auth.get_password_hash("teacher123"),
        role="teacher"
    )
    teacher_rus = models.User(
        email="sidorov@school.ru",
        full_name="Сидоров Игорь Николаевич",
        hashed_password=auth.get_password_hash("teacher123"),
        role="teacher"
    )
    teacher_eng = models.User(
        email="smirnova@school.ru",
        full_name="Смирнова Ольга Дмитриевна",
        hashed_password=auth.get_password_hash("teacher123"),
        role="teacher"
    )
    teacher_phys = models.User(
        email="kozlov@school.ru",
        full_name="Козлов Дмитрий Алексеевич",
        hashed_password=auth.get_password_hash("teacher123"),
        role="teacher"
    )
    
    # ученики (24 штуки — по 4 на каждый из 6 классов)
    student_users = []
    student_names = [
        ("Иванов", "Артём"), ("Петрова", "Мария"), ("Смирнов", "Кирилл"), ("Кузнецова", "Алиса"),
        ("Попов", "Максим"), ("Васильева", "Дарья"), ("Михайлов", "Егор"), ("Фёдорова", "Полина"),
        ("Соколов", "Никита"), ("Морозова", "Анастасия"), ("Волков", "Даниил"), ("Зайцева", "София"),
        ("Богданов", "Илья"), ("Соловьёва", "Варвара"), ("Орлов", "Александр"), ("Новикова", "Екатерина"),
        ("Ковалёв", "Тимофей"), ("Белова", "Ксения"), ("Тарасов", "Матвей"), ("Медведева", "Анна"),
        ("Егоров", "Арсений"), ("Григорьева", "Виктория"), ("Лебедев", "Роман"), ("Семёнова", "Елизавета")
    ]
    
    for i, (surname, firstname) in enumerate(student_names):
        u = models.User(
            email=f"student{i+1}@school.ru",
            full_name=f"{surname} {firstname}",
            hashed_password=auth.get_password_hash("student123"),
            role="student"
        )
        student_users.append(u)
    
    db.add(admin_user)
    db.add_all([teacher_math, teacher_rus, teacher_eng, teacher_phys])
    db.add_all(student_users)
    db.commit()
    
    # ПРЕДМЕТЫ
    subjects_data = [
        {"name": "Математика", "description": "Алгебра и геометрия, 5 часов в неделю"},
        {"name": "Русский язык", "description": "Грамматика, литература и развитие речи"},
        {"name": "Английский язык", "description": "Иностранный язык, базовый и углублённый уровень"},
        {"name": "Физика", "description": "Механика, термодинамика, электричество"},
        {"name": "Информатика", "description": "Программирование, алгоритмы, базы данных"},
        {"name": "История", "description": "Всеобщая история и история России"},
    ]
    
    subjects = []
    for s in subjects_data:
        subj = models.Subject(**s)
        db.add(subj)
        subjects.append(subj)
    db.commit()
    
    # КЛАССЫ
    classes_data = [
        {"name": "9А", "year": 2024},
        {"name": "9Б", "year": 2024},
        {"name": "10А", "year": 2024},
        {"name": "10Б", "year": 2024},
        {"name": "11А", "year": 2024},
        {"name": "11Б", "year": 2024},
    ]
    
    classes = []
    for c in classes_data:
        cls = models.Class(**c)
        db.add(cls)
        classes.append(cls)
    db.commit()
    
    # УЧИТЕЛЯ (привязка к предметам)
    teacher_records = [
        models.Teacher(user_id=teacher_math.id, subject_id=subjects[0].id, room_number="301"),
        models.Teacher(user_id=teacher_rus.id, subject_id=subjects[1].id, room_number="205"),
        models.Teacher(user_id=teacher_eng.id, subject_id=subjects[2].id, room_number="412"),
        models.Teacher(user_id=teacher_phys.id, subject_id=subjects[3].id, room_number="108"),
    ]
    db.add_all(teacher_records)
    db.commit()
    
    # УЧЕНИКИ (распределение по классам)
    student_records = []
    for i, user in enumerate(student_users):
        class_idx = i // 4  # по 4 ученика в классе
        student_records.append(models.Student(user_id=user.id, class_id=classes[class_idx].id))
    db.add_all(student_records)
    db.commit()
    
    # ОЦЕНКИ (за все 4 четверти)
    random.seed(42)
    grade_records = []
    quarters = [1, 2, 3, 4]
    work_types = ["КР", "ДЗ", "СР", "ОТВ", "ТЕСТ"]
    
    for student in student_records:
        class_subjects = subjects[:4]  # основные 4 предмета
        for subj in class_subjects:
            for quarter in quarters:
                # 2-4 оценки за четверть по предмету
                num_grades = random.randint(2, 4)
                quarter_grades = []
                
                for _ in range(num_grades):
                    # генерируем оценку
                    base = random.random()
                    if base < 0.15:
                        grade_val = 2
                    elif base < 0.35:
                        grade_val = 3
                    elif base < 0.65:
                        grade_val = 4
                    else:
                        grade_val = 5
                    quarter_grades.append(grade_val)
                    
                    # определяем учителя по предмету
                    teacher_for_subj = None
                    for t in teacher_records:
                        if t.subject_id == subj.id:
                            teacher_for_subj = t
                            break
                    
                    if not teacher_for_subj:
                        teacher_for_subj = teacher_records[0]
                    
                    grade_records.append(models.Grade(
                        student_id=student.id,
                        subject_id=subj.id,
                        teacher_id=teacher_for_subj.id,
                        grade_type="current",
                        grade_value=grade_val,
                        work_type=random.choice(work_types),
                        quarter=quarter,
                        date=date(2024, random.randint(9, 11) if quarter == 1 
                                  else random.randint(12, 12) if quarter == 2 
                                  else random.randint(1, 2) if quarter == 3 
                                  else random.randint(4, 5), random.randint(1, 28))
                    ))
                
                # добавляем четвертную оценку (среднее округлённое)
                if quarter_grades:
                    quarter_grade = round(sum(quarter_grades) / len(quarter_grades))
                    quarter_grade = max(2, min(5, quarter_grade))
                    
                    teacher_for_subj = None
                    for t in teacher_records:
                        if t.subject_id == subj.id:
                            teacher_for_subj = t
                            break
                    if not teacher_for_subj:
                        teacher_for_subj = teacher_records[0]
                    
                    grade_records.append(models.Grade(
                        student_id=student.id,
                        subject_id=subj.id,
                        teacher_id=teacher_for_subj.id,
                        grade_type="quarter",
                        grade_value=quarter_grade,
                        work_type="ЧЕТВ",
                        quarter=quarter,
                        date=date(2024, 10 if quarter == 1 else 12 if quarter == 2 else 3 if quarter == 3 else 5, 25)
                    ))
    
    db.add_all(grade_records)
    db.commit()
    
    # РАСПИСАНИЕ (17 записей)
    schedule_data = [
        # 9А (5 занятий)
        {"class_id": classes[0].id, "subject_id": subjects[0].id, "teacher_id": teacher_records[0].id, "day_of_week": 1, "start_time": "08:30", "room": "301"},
        {"class_id": classes[0].id, "subject_id": subjects[1].id, "teacher_id": teacher_records[1].id, "day_of_week": 1, "start_time": "09:25", "room": "205"},
        {"class_id": classes[0].id, "subject_id": subjects[2].id, "teacher_id": teacher_records[2].id, "day_of_week": 2, "start_time": "08:30", "room": "412"},
        {"class_id": classes[0].id, "subject_id": subjects[3].id, "teacher_id": teacher_records[3].id, "day_of_week": 2, "start_time": "09:25", "room": "108"},
        {"class_id": classes[0].id, "subject_id": subjects[0].id, "teacher_id": teacher_records[0].id, "day_of_week": 3, "start_time": "10:20", "room": "301"},
        # 9Б (3 занятия)
        {"class_id": classes[1].id, "subject_id": subjects[1].id, "teacher_id": teacher_records[1].id, "day_of_week": 1, "start_time": "08:30", "room": "205"},
        {"class_id": classes[1].id, "subject_id": subjects[3].id, "teacher_id": teacher_records[3].id, "day_of_week": 2, "start_time": "09:25", "room": "108"},
        {"class_id": classes[1].id, "subject_id": subjects[2].id, "teacher_id": teacher_records[2].id, "day_of_week": 3, "start_time": "08:30", "room": "412"},
        # 10А (3 занятия)
        {"class_id": classes[2].id, "subject_id": subjects[0].id, "teacher_id": teacher_records[0].id, "day_of_week": 1, "start_time": "09:25", "room": "301"},
        {"class_id": classes[2].id, "subject_id": subjects[2].id, "teacher_id": teacher_records[2].id, "day_of_week": 2, "start_time": "10:20", "room": "412"},
        {"class_id": classes[2].id, "subject_id": subjects[3].id, "teacher_id": teacher_records[3].id, "day_of_week": 3, "start_time": "08:30", "room": "108"},
        # 10Б (2 занятия)
        {"class_id": classes[3].id, "subject_id": subjects[1].id, "teacher_id": teacher_records[1].id, "day_of_week": 1, "start_time": "10:20", "room": "205"},
        {"class_id": classes[3].id, "subject_id": subjects[0].id, "teacher_id": teacher_records[0].id, "day_of_week": 2, "start_time": "08:30", "room": "301"},
        # 11А (2 занятия)
        {"class_id": classes[4].id, "subject_id": subjects[3].id, "teacher_id": teacher_records[3].id, "day_of_week": 1, "start_time": "08:30", "room": "108"},
        {"class_id": classes[4].id, "subject_id": subjects[2].id, "teacher_id": teacher_records[2].id, "day_of_week": 2, "start_time": "09:25", "room": "412"},
        # 11Б (2 занятия)
        {"class_id": classes[5].id, "subject_id": subjects[0].id, "teacher_id": teacher_records[0].id, "day_of_week": 1, "start_time": "10:20", "room": "301"},
        {"class_id": classes[5].id, "subject_id": subjects[1].id, "teacher_id": teacher_records[1].id, "day_of_week": 3, "start_time": "09:25", "room": "205"},
    ]
    
    for s in schedule_data:
        db.add(models.Schedule(**s))
    db.commit()
    
    # ЗАМЕТКИ ДЛЯ УЧЕНИКОВ (5 штук)
    notes_data = [
        {"student_id": 1, "text": "Подготовиться к контрольной по математике — повторить квадратные уравнения", "date": date(2024, 10, 5)},
        {"student_id": 1, "text": "Долг по домашнему заданию: упр. 245 по русскому языку", "date": date(2024, 10, 12)},
        {"student_id": 2, "text": "Молодец! Отличная работа на уроке физики", "date": date(2024, 10, 8)},
        {"student_id": 5, "text": "Принести тетрадь для лабораторных работ", "date": date(2024, 11, 1)},
        {"student_id": 7, "text": "Участвует в олимпиаде по информатике 15 декабря", "date": date(2024, 11, 20)},
    ]
    
    for n in notes_data:
        db.add(models.Note(**n))
    db.commit()
    
    # СОБЫТИЯ (3 штуки)
    events_data = [
        {"title": "Контрольная работа", "description": "Итоговая контрольная по математике для 9-х классов", "subject_id": subjects[0].id, "date": date(2024, 12, 20), "time": "08:30"},
        {"title": "Олимпиада по физике", "description": "Школьный этап олимпиады по физике", "subject_id": subjects[3].id, "date": date(2024, 11, 15), "time": "10:00"},
        {"title": "Диктант", "description": "Проверочный диктант по русскому языку", "subject_id": subjects[1].id, "date": date(2024, 10, 25), "time": "09:00"},
    ]
    
    for e in events_data:
        db.add(models.Event(**e))
    db.commit()
    
    db.close()
    
    print("База данных успешно инициализирована демо-данными!")
    print()
    print("=" * 70)
    print("  ТЕСТОВЫЕ АККАУНТЫ ДЛЯ ВХОДА")
    print("=" * 70)
    print("  ЗАВУЧь (администратор):")
    print("    email:     admin@school.ru")
    print("    password:  admin123")
    print()
    print("  УЧИТЕЛЯ:")
    print("    petrova@school.ru    / teacher123  (Математика)")
    print("    sidorov@school.ru    / teacher123  (Русский язык)")
    print("    smirnova@school.ru   / teacher123  (Английский язык)")
    print("    kozlov@school.ru     / teacher123  (Физика)")
    print()
    print("  УЧЕНИКИ (всего 24, по 4 на класс):")
    print("    Класс 9А:")
    print("      student1@school.ru  / student123  (Иванов Артём)")
    print("      student2@school.ru  / student123  (Петрова Мария)")
    print("      student3@school.ru  / student123  (Смирнов Кирилл)")
    print("      student4@school.ru  / student123  (Кузнецова Алиса)")
    print("    Класс 9Б:")
    print("      student5@school.ru  / student123  (Попов Максим)")
    print("      student6@school.ru  / student123  (Васильева Дарья)")
    print("      student7@school.ru  / student123  (Михайлов Егор)")
    print("      student8@school.ru  / student123  (Фёдорова Полина)")
    print("    ... и так далее (student9-student24)")
    print()
    print("  Всего в БД:")
    print("    - 6 классов (9А, 9Б, 10А, 10Б, 11А, 11Б)")
    print("    - 6 предметов (Математика, Русский, Английский, Физика, Информатика, История)")
    print("    - 1 завуч + 4 учителя + 24 ученика = 29 пользователей")
    print("    - ~400 оценок (текущие и четвертные)")
    print("    - 17 записей расписания")
    print("    - 5 заметок")
    print("    - 3 события")
    print("=" * 70)

if __name__ == "__main__":
    init_db()
