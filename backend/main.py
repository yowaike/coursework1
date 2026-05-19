from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from app.database import engine, Base
from app.routers import auth, students, teachers, classes, subjects, grades, schedule, analytics

app = FastAPI(title="Электронный дневничок")

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

app.include_router(auth.router, prefix="/api/auth", tags=["авторизация"])
app.include_router(students.router, prefix="/api/students", tags=["ученики"])
app.include_router(teachers.router, prefix="/api/teachers", tags=["учителя"])
app.include_router(classes.router, prefix="/api/classes", tags=["классы"])
app.include_router(subjects.router, prefix="/api/subjects", tags=["предметы"])
app.include_router(grades.router, prefix="/api/grades", tags=["оценки"])
app.include_router(schedule.router, prefix="/api/schedule", tags=["расписание"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["аналитика"])

def init_db():
    Base.metadata.create_all(bind=engine)

@app.get("/", response_class=HTMLResponse)
def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})