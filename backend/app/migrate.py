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
