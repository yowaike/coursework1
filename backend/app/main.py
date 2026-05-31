from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pathlib import Path
from app.database import engine, Base
from app.routers import auth, students, teachers, classes, subjects, grades, schedule, analytics, notes, assignments
from app.routers import final_grades
from app.routers import audit_logs

app = FastAPI(title="Электронный дневничок")

@app.on_event("startup")
def on_startup():
    from app.migrate import migrate_schema
    from app.database import SessionLocal
    Base.metadata.create_all(bind=engine)
    migrate_schema()
    db = SessionLocal()
    db.close()

BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent
static_dir = ROOT_DIR / "frontend" / "static"
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")
templates_dir = BACKEND_DIR / "templates"
templates = Jinja2Templates(directory=str(templates_dir))

app.include_router(auth.router, prefix="/api/auth", tags=["авторизация"])
app.include_router(students.router, prefix="/api/students", tags=["ученики"])
app.include_router(teachers.router, prefix="/api/teachers", tags=["учителя"])
app.include_router(classes.router, prefix="/api/classes", tags=["классы"])
app.include_router(subjects.router, prefix="/api/subjects", tags=["предметы"])
app.include_router(grades.router, prefix="/api/grades", tags=["оценки"])
app.include_router(schedule.router, prefix="/api/schedule", tags=["расписание"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["аналитика"])
app.include_router(notes.router, prefix="/api/notes", tags=["заметки"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["нагрузка"])
app.include_router(final_grades.router, prefix="/api/final-grades", tags=["итоговые оценки"])
app.include_router(audit_logs.router, prefix="/api/audit-logs", tags=["аудит"])
# app.include_router(notifications.router, prefix="/api/notifications", tags=["уведомления"])  # удалено

@app.get("/", response_class=HTMLResponse)
def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/dashboard", response_class=HTMLResponse)
def dashboard(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})