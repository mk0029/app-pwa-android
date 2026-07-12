"""Backend health sanity check for Jambh Electricals stub backend."""
import os
import requests
import pytest

BASE_URL = os.environ.get("EXPO_BACKEND_URL", "https://pwa-ios-android-1.preview.emergentagent.com").rstrip("/")


@pytest.fixture
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


class TestHealth:
    def test_health_status_code(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/health", timeout=10)
        assert r.status_code == 200

    def test_health_response_body(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/health", timeout=10)
        data = r.json()
        assert data.get("status") == "ok"
