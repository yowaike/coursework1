from app.database import SessionLocal
from app import models, auth

db = SessionLocal()
user = db.query(models.User).filter(models.User.email=='teacher@school.ru').first()
if not user:
    print('NO_USER')
else:
    ok = auth.verify_password('teacher123', user.hashed_password)
    print('FOUND', user.email, 'full_name=', user.full_name, 'role=', user.role, 'password_ok=', ok)
    print('hashed:', user.hashed_password[:60])
    # print full object for debugging
    print('user.__dict__ keys=', list(user.__dict__.keys()))
    if hasattr(user, 'school'):
        print('school attr:', user.school)
    else:
        print('no school attr')

db.close()
