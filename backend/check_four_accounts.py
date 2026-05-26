from app.database import SessionLocal
from app import models, auth

emails = ['admin@school.ru','teacher@school.ru','student@school.ru','student1@school.ru']

db = SessionLocal()
for e in emails:
    u = db.query(models.User).filter(models.User.email==e).first()
    if not u:
        print(e, 'MISSING')
        continue
    pw = 'admin123' if e.startswith('admin') else 'teacher123' if e.startswith('teacher') else 'student123'
    ok = auth.verify_password(pw, u.hashed_password)
    print(e, 'FOUND role=', u.role, 'pw_ok=', ok)

db.close()
