from sqlalchemy import text
from .database import engine


def migrate_schema():
    """Добавляет новые колонки в существующую БД (без потери данных)."""
    with engine.begin() as conn:
        conn.execute(text(
            "ALTER TABLE classes ADD COLUMN IF NOT EXISTS max_students INTEGER NOT NULL DEFAULT 30"
        ))
        conn.execute(text(
            "ALTER TABLE classes ADD COLUMN IF NOT EXISTS lessons_per_week INTEGER NOT NULL DEFAULT 30"
        ))

        has_author = conn.execute(text(
            "SELECT 1 FROM information_schema.columns "
            "WHERE table_name = 'notes' AND column_name = 'author_id'"
        )).fetchone()

        if not has_author:
            conn.execute(text("ALTER TABLE notes ADD COLUMN author_id INTEGER"))
            conn.execute(text(
                "UPDATE notes SET author_id = ("
                "  SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1"
                ") WHERE author_id IS NULL"
            ))
            conn.execute(text(
                "UPDATE notes SET author_id = ("
                "  SELECT id FROM users ORDER BY id LIMIT 1"
                ") WHERE author_id IS NULL"
            ))
            conn.execute(text("ALTER TABLE notes ALTER COLUMN author_id SET NOT NULL"))
            conn.execute(text(
                "ALTER TABLE notes ADD CONSTRAINT fk_notes_author_id "
                "FOREIGN KEY (author_id) REFERENCES users(id)"
            ))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS academic_years (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE,
                is_active BOOLEAN NOT NULL DEFAULT FALSE
            )
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS terms (
                id SERIAL PRIMARY KEY,
                academic_year_id INTEGER NOT NULL REFERENCES academic_years(id),
                term_no INTEGER NOT NULL,
                name VARCHAR(50) NOT NULL
            )
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS teacher_assignments (
                id SERIAL PRIMARY KEY,
                teacher_id INTEGER NOT NULL REFERENCES teachers(id),
                class_id INTEGER NOT NULL REFERENCES classes(id),
                subject_id INTEGER NOT NULL REFERENCES subjects(id),
                academic_year_id INTEGER NULL REFERENCES academic_years(id)
            )
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS final_grades (
                id SERIAL PRIMARY KEY,
                student_id INTEGER NOT NULL REFERENCES students(id),
                subject_id INTEGER NOT NULL REFERENCES subjects(id),
                academic_year_id INTEGER NOT NULL REFERENCES academic_years(id),
                value INTEGER NOT NULL,
                is_override BOOLEAN NOT NULL DEFAULT FALSE,
                override_by_user_id INTEGER NULL REFERENCES users(id),
                calculated_from_term_avg INTEGER NULL,
                updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
            )
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                actor_user_id INTEGER NOT NULL REFERENCES users(id),
                action VARCHAR(50) NOT NULL,
                entity_type VARCHAR(50) NOT NULL,
                entity_id INTEGER NOT NULL,
                before_json TEXT NULL,
                after_json TEXT NULL,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
            )
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                type VARCHAR(50) NOT NULL,
                payload_json TEXT NULL,
                is_read BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
            )
        """))

        conn.execute(text("ALTER TABLE grades ADD COLUMN IF NOT EXISTS academic_year_id INTEGER NULL"))
        conn.execute(text("ALTER TABLE schedule ADD COLUMN IF NOT EXISTS academic_year_id INTEGER NULL"))

        active_year = conn.execute(text(
            "SELECT id, name FROM academic_years WHERE is_active = TRUE ORDER BY id LIMIT 1"
        )).fetchone()

        if not active_year:
            year_name = conn.execute(text(
                "SELECT academic_year FROM users WHERE academic_year IS NOT NULL AND academic_year <> '' ORDER BY id LIMIT 1"
            )).fetchone()
            name = year_name[0] if year_name and year_name[0] else "2025/2026"
            conn.execute(text("UPDATE academic_years SET is_active = FALSE"))
            new_id = conn.execute(text(
                "INSERT INTO academic_years(name, is_active) VALUES (:name, TRUE) RETURNING id"
            ), {"name": name}).fetchone()[0]
            active_year_id = new_id
        else:
            active_year_id = active_year[0]

        existing_terms = conn.execute(text(
            "SELECT COUNT(*) FROM terms WHERE academic_year_id = :y"
        ), {"y": active_year_id}).fetchone()[0]
        if existing_terms == 0:
            for i in (1, 2, 3, 4):
                conn.execute(text(
                    "INSERT INTO terms(academic_year_id, term_no, name) VALUES (:y, :t, :n)"
                ), {"y": active_year_id, "t": i, "n": f"{i} четверть"})

        conn.execute(text(
            "UPDATE grades SET academic_year_id = :y WHERE academic_year_id IS NULL"
        ), {"y": active_year_id})
        conn.execute(text(
            "UPDATE schedule SET academic_year_id = :y WHERE academic_year_id IS NULL"
        ), {"y": active_year_id})
