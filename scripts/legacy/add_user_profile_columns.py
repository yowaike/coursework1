from sqlalchemy import text
from app.database import engine

with engine.begin() as conn:
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS school varchar(255);"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS city varchar(100);"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS academic_year varchar(50);"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS position varchar(100);"))
    print('Columns added or already exist')
