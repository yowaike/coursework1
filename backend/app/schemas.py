from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date

# схемы для валидации данных

class UserLogin(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str

class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    role: str

    model_config = ConfigDict(from_attributes=True)

class StudentBase(BaseModel):
    user_id: int
    class_id: int

class StudentCreate(StudentBase):
    pass

class StudentOut(BaseModel):
    id: int
    class_id: int
    class_name: Optional[str] = None
    user: UserOut

    model_config = ConfigDict(from_attributes=True)

class TeacherBase(BaseModel):
    user_id: int
    subject_id: int
    room_number: Optional[str] = None

class TeacherCreate(TeacherBase):
    pass

class TeacherOut(BaseModel):
    id: int
    subject_id: int
    subject_name: Optional[str] = None
    room_number: Optional[str] = None
    user: UserOut

    model_config = ConfigDict(from_attributes=True)

class ClassCreate(BaseModel):
    name: str
    year: int

class SubjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ScheduleCreate(BaseModel):
    class_id: int
    subject_id: int
    teacher_id: int
    day_of_week: int
    start_time: str
    room: Optional[str] = None

class NoteCreate(BaseModel):
    student_id: int
    text: str
    date: date

class GradeCreate(BaseModel):
    student_id: int
    subject_id: int
    teacher_id: int
    grade_type: str
    grade_value: int
    work_type: str
    quarter: int
    date: date