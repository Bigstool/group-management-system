import logging

import pytest
import requests

from test.shared import api, log_res
from test_user import test_user_sign_in, test_admin_sign_in, test_create_user, test_admin_sign_in

logger = logging.getLogger(__name__)
logger.propagate = True

group_list = [
    {
        "name": "GroupA",
        "title": "ProjectA",
        "description": "test group A"
    },
    {
        "name": "GroupB",
        "title": "ProjectB",
        "description": "test group B"
    }
]

@pytest.fixture(scope="package")
def test_create_group(test_user_sign_in):
    # User1 create groupA
    r = requests.post(f"{api}/group", headers={
        "Authorization": f"Bearer {test_user_sign_in[0]['token_access']}"
    }, json=group_list[0])
    log_res(logger, r)
    assert r.status_code == 200
    # User3 create groupB
    r = requests.post(f"{api}/group", headers={
        "Authorization": f"Bearer {test_user_sign_in[2]['token_access']}"
    }, json=group_list[1])
    log_res(logger, r)
    assert r.status_code == 200
    # User5 create groupC
    r = requests.post(f"{api}/group", headers={
        "Authorization": f"Bearer {test_user_sign_in[4]['token_access']}"
    }, json={
        "name": "GroupC",
        "title": "ProjectC",
        "description": "test group C"
    })
    log_res(logger, r)
    assert r.status_code == 200
    # User6 create groupD
    r = requests.post(f"{api}/group", headers={
        "Authorization": f"Bearer {test_user_sign_in[5]['token_access']}"
    }, json={
        "name": "GroupD",
        "title": "ProjectD",
        "description": "test group D"
    })
    log_res(logger, r)
    assert r.status_code == 200


@pytest.fixture(scope="package")
def test_get_group_list(test_create_group, test_user_sign_in):
    # User1 get
    r = requests.get(f"{api}/group", headers={
        "Authorization": f"Bearer {test_user_sign_in[0]['token_access']}"
    })
    log_res(logger, r)
    assert r.status_code == 200
    return sorted(r.json()["data"], key=lambda i: i["name"])


def test_get_group_info(test_user_sign_in, test_get_group_list):
    # User1 get GroupA
    r = requests.get(f"{api}/group/{test_get_group_list[0]['uuid']}", headers={
        "Authorization": f"Bearer {test_user_sign_in[0]['token_access']}"
    })
    log_res(logger, r)
    assert r.status_code == 200
    # User3 get GroupA
    r = requests.get(f"{api}/group/{test_get_group_list[0]['uuid']}", headers={
        "Authorization": f"Bearer {test_user_sign_in[2]['token_access']}"
    })
    log_res(logger, r)
    assert r.status_code == 200


def test_update_group_info(test_user_sign_in, test_get_group_list):
    # User1 update GroupA
    r = requests.patch(f"{api}/group/{test_get_group_list[0]['uuid']}", headers={
        "Authorization": f"Bearer {test_user_sign_in[0]['token_access']}"
    }, json={
        "description": "modified",
        "proposal": "set"
    })
    log_res(logger, r)
    assert r.status_code == 200


def test_favorite_group(test_user_sign_in, test_get_group_list):
    # User2 favorite GroupA
    r = requests.post(f"{api}/group/{test_get_group_list[0]['uuid']}/favorite", headers={
        "Authorization": f"Bearer {test_user_sign_in[0]['token_access']}"
    })
    log_res(logger, r)
    assert r.status_code == 200


def test_undo_favorite_group(test_user_sign_in, test_get_group_list):
    # User2 undo favorite GroupA
    r = requests.delete(f"{api}/group/{test_get_group_list[0]['uuid']}/favorite", headers={
        "Authorization": f"Bearer {test_user_sign_in[0]['token_access']}"
    })
    log_res(logger, r)
    assert r.status_code == 200


def test_add_group_comment(test_user_sign_in, test_admin_sign_in, test_get_group_list):
    # User1 comment GroupA
    r = requests.post(f"{api}/group/{test_get_group_list[0]['uuid']}/comment", headers={
        "Authorization": f"Bearer {test_user_sign_in[0]['token_access']}"
    }, json={
        "content": "User1 comment"
    })
    log_res(logger, r)
    assert r.status_code == 200
    # Admin comment GroupA
    r = requests.post(f"{api}/group/{test_get_group_list[0]['uuid']}/comment", headers={
        "Authorization": f"Bearer {test_admin_sign_in['token_access']}"
    }, json={
        "content": "Admin comment"
    })
    log_res(logger, r)
    assert r.status_code == 200


def test_delete_group(test_user_sign_in, test_admin_sign_in, test_get_group_list):
    # User5 delete GroupC
    r = requests.delete(f"{api}/group/{test_get_group_list[2]['uuid']}", headers={
        "Authorization": f"Bearer {test_user_sign_in[4]['token_access']}"
    })
    log_res(logger, r)
    assert r.status_code == 200
    # Admin delete GroupD
    r = requests.delete(f"{api}/group/{test_get_group_list[3]['uuid']}", headers={
        "Authorization": f"Bearer {test_admin_sign_in['token_access']}"
    })
    log_res(logger, r)
    assert r.status_code == 200