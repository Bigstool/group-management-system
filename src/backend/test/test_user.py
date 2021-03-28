import base64
import json
from hashlib import sha1

import pytest
import requests

api = "http://localhost:8080"

user_email = "test@local.com"
user_alias = "Tech Staff"
user_password = "123123"
user_bio = "Lorem ipsum"

def test_create_user():
    r = requests.post(f"{api}/user", json={
        "alias": user_alias,
        "email": user_email,
        "password": sha1(user_password.encode()).hexdigest()
    })
    assert r.status_code == 200


@pytest.fixture(scope="module")
def test_sign_in():
    r = requests.post(f"{api}/oauth2/token", data={
        "grant_type": "password",
        "username": user_email,
        "password": sha1(user_password.encode()).hexdigest(),
        "scope": "USER"
    })
    assert r.status_code == 200
    user_token_access = r.json()["data"]["access_token"]
    user_token_refresh = r.json()["data"]["refresh_token"]
    user_uuid = json.loads(base64.b64decode(user_token_access.split(".")[1] + '==='))["uuid"]
    return {
        "token_access": user_token_access,
        "token_refresh": user_token_refresh,
        "user_uuid": user_uuid
    }


def test_token_refresh(test_sign_in):
    r = requests.post(f"{api}/oauth2/refresh", data={
        "grant_type": "refresh",
        "refresh_token": test_sign_in["token_refresh"]
    })
    assert r.status_code == 200


def test_update_user_profile(test_sign_in):
    r = requests.patch(f"{api}/user/{test_sign_in['user_uuid']}", headers={
        "Authorization": f"Bearer {test_sign_in['token_access']}"
    }, json={
        "bio": user_bio
    })
    assert r.status_code == 200


def test_get_user_profile(test_sign_in):
    r = requests.get(f"{api}/user/{test_sign_in['user_uuid']}")
    assert r.status_code == 200
    assert r.json()["data"]["bio"] == user_bio
