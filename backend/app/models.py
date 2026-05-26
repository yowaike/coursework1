from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

# модели таблиц базы данных

# типы оценок и виды работ (валидация в роутерах)
GRADE_TYPE_CURRENT = "current"
GRADE_TYPE_QUARTER = "quarter"
WORK_TYPES_TEACHER = ("КР", "ДЗ", "ОТВ", "СР", "ТЕСТ")
WORK_TYPE_QUARTER = "ЧЕТВ"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)
    # Дополнительные профильные поля
    school = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    academic_year = Column(String(50), nullable=True)
    position = Column(String(100), nullable=True)

    teacher = relationship("Teacher", back_populates="user", uselist=False)
    student = relationship("Student", back_populates="user", uselist=False)
    authored_notes = relationship("Note", back_populates="author", foreign_keys="Note.author_id")

class Teacher(Base):
    __tablename__ = "teachers"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    room_number = Column(String(20))

    user = relationship("User", back_populates="teacher")
    subject = relationship("Subject", back_populates="teachers")
    grades = relationship("Grade", back_populates="teacher")
    schedule_items = relationship("Schedule", back_populates="teacher")

class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)

    user = relationship("User", back_populates="student")
    class_group = relationship("Class", back_populates="students")
    grades = relationship("Grade", back_populates="student")
    notes = relationship("Note", back_populates="student")

class Class(Base):
    __tablename__ = "classes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(10), nullable=False)
    year = Column(Integer, nullable=False)
    max_students = Column(Integer, nullable=False, default=30)
    lessons_per_week = Column(Integer, nullable=False, default=30)

    students = relationship("Student", back_populates="class_group")
    schedule_items = relationship("Schedule", back_populates="class_group")

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)

    teachers = relationship("Teacher", back_populates="subject")
    grades = relationship("Grade", back_populates="subject")
    schedule_items = relationship("Schedule", back_populates="subject")
    events = relationship("Event", back_populates="subject")

class Grade(Base):
    __tablename__ = "grades"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    grade_type = Column(String(20), nullable=False)
    grade_value = Column(Integer, nullable=False)
    work_type = Column(String(50))
    quarter = Column(Integer, nullable=False)
    date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="grades")
    subject = relationship("Subject", back_populates="grades")
    teacher = relationship("Teacher", back_populates="grades")

class Schedule(Base):
    __tablename__ = "schedule"
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)
    start_time = Column(String(5), nullable=False)
    room = Column(String(10))

    class_group = relationship("Class", back_populates="schedule_items")
    subject = relationship("Subject", back_populates="schedule_items")
    teacher = relationship("Teacher", back_populates="schedule_items")

class Note(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    text = Column(Text, nullable=False)
    date = Column(Date, nullable=False)

    student = relationship("Student", back_populates="notes")
    author = relationship("User", back_populates="authored_notes", foreign_keys=[author_id])

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    date = Column(Date, nullable=False)
    time = Column(String(5))

    subject = relationship("Subject", back_populates="events")