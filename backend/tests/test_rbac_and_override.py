import os

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(autouse=True)
def _set_test_db_env():
    # Пользователь должен настроить отдельную тестовую БД.
    # По умолчанию тесты не должны трогать основную.
    if not os.getenv("DATABASE_URL"):
        os.environ["DATABASE_URL"] = "postgresql://postgres:1234@127.0.0.1:5432/school_diary_test"


def test_login_endpoint_exists():
    client = TestClient(app)
    resp = client.post("/api/auth/login", data={"username": "admin@school.local", "password": "admin123"})
    # В тестовой БД может не быть seeded данных — главное, что эндпойнт живой (не 404)
    assert resp.status_code != 404

