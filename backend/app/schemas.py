from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

# схемы для валидации данных

class UserLogin(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str

class TeacherBase(BaseModel):
    full_name: str
    subject_id: int
    room_number: Optional[str] = None

class StudentBase(BaseModel):
    full_name: str
    class_id: int

class GradeCreate(BaseModel):
    student_id: int
    subject_id: int
    teacher_id: int
    grade_type: str
    grade_value: int
    work_type: str
    quarter: int
    date: date