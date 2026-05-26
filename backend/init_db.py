from app.database import engine, Base, SessionLocal
from app import models, auth
from datetime import date
import random

# функция для инициализации базы данных с демо-данными
def init_db():
    # создаём таблицы
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # если данные уже есть — не пересоздаём
    if db.query(models.User).first():
        db.close()
        print("База данных уже содержит данные. Пропускаем инициализацию.")
        print("Чтобы пересоздать — удалите таблицы вручную.")
        return
    
    # ========== ПОЛЬЗОВАТЕЛИ ==========
    admin_user = models.User(
        email="admin@school.ru",
        full_name="Воронцова Елена Сергеевна",
        hashed_password=auth.get_password_hash("admin123"),
        role="admin"
    )
    
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
    
    student_names = [
        ("Иванов", "Артём", "Александрович"), ("Петрова", "Мария", "Сергеевна"),
        ("Смирнов", "Кирилл", "Дмитриевич"), ("Кузнецова", "Алиса", "Андреевна"),
        ("Попов", "Максим", "Игоревич"), ("Васильева", "Дарья", "Павловна"),
        ("Соколов", "Никита", "Романович"), ("Морозова", "Анастасия", "Викторовна"),
        ("Богданов", "Илья", "Евгеньевич"), ("Соловьёва", "Варвара", "Алексеевна"),
        ("Егоров", "Арсений", "Владимирович"), ("Григорьева", "Виктория", "Олеговна"),
    ]
    
    student_users = []
    for i, (surname, firstname, patronymic) in enumerate(student_names):
        u = models.User(
            email=f"student{i+1}@school.ru",
            full_name=f"{surname} {firstname} {patronymic}",
            hashed_password=auth.get_password_hash("student123"),
            role="student"
        )
        student_users.append(u)
    
    db.add(admin_user)
    db.add_all([teacher_math, teacher_rus, teacher_eng, teacher_phys])
    db.add_all(student_users)
    db.commit()
    
    # ========== ПРЕДМЕТЫ ==========
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
    
    # ========== КЛАССЫ ==========
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
    
    # ========== УЧИТЕЛЯ ==========
    teacher_records = [
        models.Teacher(user_id=teacher_math.id, subject_id=subjects[0].id, room_number="301"),
        models.Teacher(user_id=teacher_rus.id, subject_id=subjects[1].id, room_number="205"),
        models.Teacher(user_id=teacher_eng.id, subject_id=subjects[2].id, room_number="412"),
        models.Teacher(user_id=teacher_phys.id, subject_id=subjects[3].id, room_number="108"),
    ]
    db.add_all(teacher_records)
    db.commit()
    
    # ========== УЧЕНИКИ ==========
    student_records = []
    for i, user in enumerate(student_users):
        class_idx = i // 2
        student_records.append(models.Student(user_id=user.id, class_id=classes[class_idx].id))
    db.add_all(student_records)
    db.commit()
    
    # ========== ОЦЕНКИ с разными профилями классов ==========
    random.seed(42)
    grade_records = []
    quarters = [1, 2, 3, 4]
    work_types = ["КР", "ДЗ", "СР", "ОТВ", "ТЕСТ"]
    
    # профили: [доля_2, доля_3, доля_4, доля_5]
    class_profiles = [
        [0.05, 0.15, 0.35, 0.45],  # 9А — хороший
        [0.30, 0.40, 0.20, 0.10],  # 9Б — слабый
        [0.05, 0.20, 0.35, 0.40],  # 10А — хороший
        [0.15, 0.30, 0.35, 0.20],  # 10Б — средний
        [0.02, 0.08, 0.25, 0.65],  # 11А — отличный
        [0.35, 0.40, 0.20, 0.05],  # 11Б — очень слабый
    ]
    
    for student in student_records:
        class_subjects = subjects[:4]
        class_idx = student.class_id - classes[0].id
        if class_idx < 0 or class_idx >= len(class_profiles):
            class_idx = 0
        profile = class_profiles[class_idx]
        
        for subj in class_subjects:
            for quarter in quarters:
                num_grades = random.randint(3, 5)
                quarter_grades = []
                
                for _ in range(num_grades):
                    r = random.random()
                    if r < profile[0]:
                        grade_val = 2
                    elif r < profile[0] + profile[1]:
                        grade_val = 3
                    elif r < profile[0] + profile[1] + profile[2]:
                        grade_val = 4
                    else:
                        grade_val = 5
                    quarter_grades.append(grade_val)
                    
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
    
    # ========== РАСПИСАНИЕ ==========
    schedule_data = [
        {"class_id": classes[0].id, "subject_id": subjects[0].id, "teacher_id": teacher_records[0].id, "day_of_week": 1, "start_time": "08:30", "room": "301"},
        {"class_id": classes[0].id, "subject_id": subjects[1].id, "teacher_id": teacher_records[1].id, "day_of_week": 1, "start_time": "09:25", "room": "205"},
        {"class_id": classes[0].id, "subject_id": subjects[2].id, "teacher_id": teacher_records[2].id, "day_of_week": 2, "start_time": "08:30", "room": "412"},
        {"class_id": classes[0].id, "subject_id": subjects[3].id, "teacher_id": teacher_records[3].id, "day_of_week": 2, "start_time": "09:25", "room": "108"},
        {"class_id": classes[0].id, "subject_id": subjects[0].id, "teacher_id": teacher_records[0].id, "day_of_week": 3, "start_time": "10:20", "room": "301"},
        {"class_id": classes[1].id, "subject_id": subjects[1].id, "teacher_id": teacher_records[1].id, "day_of_week": 1, "start_time": "08:30", "room": "205"},
        {"class_id": classes[1].id, "subject_id": subjects[3].id, "teacher_id": teacher_records[3].id, "day_of_week": 2, "start_time": "09:25", "room": "108"},
        {"class_id": classes[1].id, "subject_id": subjects[2].id, "teacher_id": teacher_records[2].id, "day_of_week": 3, "start_time": "08:30", "room": "412"},
        {"class_id": classes[2].id, "subject_id": subjects[0].id, "teacher_id": teacher_records[0].id, "day_of_week": 1, "start_time": "09:25", "room": "301"},
        {"class_id": classes[2].id, "subject_id": subjects[2].id, "teacher_id": teacher_records[2].id, "day_of_week": 2, "start_time": "10:20", "room": "412"},
        {"class_id": classes[2].id, "subject_id": subjects[3].id, "teacher_id": teacher_records[3].id, "day_of_week": 3, "start_time": "08:30", "room": "108"},
        {"class_id": classes[3].id, "subject_id": subjects[1].id, "teacher_id": teacher_records[1].id, "day_of_week": 1, "start_time": "10:20", "room": "205"},
        {"class_id": classes[3].id, "subject_id": subjects[0].id, "teacher_id": teacher_records[0].id, "day_of_week": 2, "start_time": "08:30", "room": "301"},
        {"class_id": classes[4].id, "subject_id": subjects[3].id, "teacher_id": teacher_records[3].id, "day_of_week": 1, "start_time": "08:30", "room": "108"},
        {"class_id": classes[4].id, "subject_id": subjects[2].id, "teacher_id": teacher_records[2].id, "day_of_week": 2, "start_time": "09:25", "room": "412"},
        {"class_id": classes[5].id, "subject_id": subjects[0].id, "teacher_id": teacher_records[0].id, "day_of_week": 1, "start_time": "10:20", "room": "301"},
        {"class_id": classes[5].id, "subject_id": subjects[1].id, "teacher_id": teacher_records[1].id, "day_of_week": 3, "start_time": "09:25", "room": "205"},
    ]
    
    for s in schedule_data:
        db.add(models.Schedule(**s))
    db.commit()
    
    # ========== ЗАМЕТКИ ==========
    if len(student_records) >= 2:
        notes_data = [
            {"student_id": student_records[0].id, "text": "Подготовиться к контрольной по математике — повторить квадратные уравнения", "date": date(2024, 10, 5)},
            {"student_id": student_records[0].id, "text": "Долг по домашнему заданию: упр. 245 по русскому языку", "date": date(2024, 10, 12)},
            {"student_id": student_records[1].id, "text": "Молодец! Отличная работа на уроке физики", "date": date(2024, 10, 8)},
        ]
        for n in notes_data:
            db.add(models.Note(**n))
        db.commit()
    
    # ========== СОБЫТИЯ ==========
    events_data = [
        {"title": "Контрольная работа", "description": "Итоговая контрольная по математике для 9-х классов", "subject_id": subjects[0].id, "date": date(2024, 12, 20), "time": "08:30"},
        {"title": "Олимпиада по физике", "description": "Школьный этап олимпиады по физике", "subject_id": subjects[3].id, "date": date(2024, 11, 15), "time": "10:00"},
        {"title": "Диктант", "description": "Проверочный диктант по русскому языку", "subject_id": subjects[1].id, "date": date(2024, 10, 25), "time": "09:00"},
    ]
    
    for e in events_data:
        db.add(models.Event(**e))
    db.commit()
    
    class_names_list = [c.name for c in classes]
    
    db.close()
    
    print("База данных успешно инициализирована!")
    print()
    print("=" * 60)
    print("  ТЕСТОВЫЕ АККАУНТЫ")
    print("=" * 60)
    print("  Завуч:")
    print("    admin@school.ru / admin123")
    print()
    print("  Учителя:")
    print("    petrova@school.ru  / teacher123  (Математика)")
    print("    sidorov@school.ru  / teacher123  (Русский язык)")
    print("    smirnova@school.ru / teacher123  (Английский)")
    print("    kozlov@school.ru   / teacher123  (Физика)")
    print()
    print("  Ученики (12 человек):")
    for i, (surname, name, patronymic) in enumerate(student_names):
        cname = class_names_list[i // 2]
        print(f"    student{i+1}@school.ru / student123  ({surname} {name} {patronymic}, {cname})")

if __name__ == "__main__":
    init_db()