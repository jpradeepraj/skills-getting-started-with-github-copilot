from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    # Ensure it's a dict and contains at least one known activity
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_prevent_duplicates():
    activity = "Chess Club"
    email = "testuser@example.com"

    # Ensure clean state: remove if already present
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # Sign up first time
    res = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert res.status_code == 200
    assert email in activities[activity]["participants"]

    # Signing up again should return 400
    res2 = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert res2.status_code == 400

    # Clean up
    activities[activity]["participants"].remove(email)


def test_remove_participant():
    activity = "Chess Club"
    email = "toremove@example.com"

    # Ensure participant exists
    if email not in activities[activity]["participants"]:
        activities[activity]["participants"].append(email)

    # Remove participant
    res = client.delete(f"/activities/{activity}/participants", params={"email": email})
    assert res.status_code == 200
    assert email not in activities[activity]["participants"]

    # Removing again should 404
    res2 = client.delete(f"/activities/{activity}/participants", params={"email": email})
    assert res2.status_code == 404
