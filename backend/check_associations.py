from app.database import SessionLocal
from app import models

db = SessionLocal()
# teacher
user = db.query(models.User).filter(models.User.email=='teacher@school.ru').first()
if user:
    t = db.query(models.Teacher).filter(models.Teacher.user_id==user.id).first()
    print('teacher@ -> teacher record:', bool(t), 'teacher_id=', t.id if t else None)
else:
    print('teacher@ missing')
# student@
user = db.query(models.User).filter(models.User.email=='student@school.ru').first()
if user:
    s = db.query(models.Student).filter(models.Student.user_id==user.id).first()
    print('student@ -> student record:', bool(s), 'student_id=', s.id if s else None)
else:
    print('student@ missing')
# student1@
user = db.query(models.User).filter(models.User.email=='student1@school.ru').first()
if user:
    s = db.query(models.Student).filter(models.Student.user_id==user.id).first()
    print('student1@ -> student record:', bool(s), 'student_id=', s.id if s else None)
else:
    print('student1@ missing')

db.close()
