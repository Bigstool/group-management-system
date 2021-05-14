import time
from logging import Logger
from pprint import pformat
import base64
import json
import logging
from hashlib import sha1
from time import sleep

import pytest
import requests

api = "http://localhost:8080"

logger = logging.getLogger(__name__)
logger.propagate = True


def log_res(r: requests.Response):
    logger.info('\n' + r.request.method + ' ' + r.request.path_url + '\n' + pformat(r.json()) + '\n')


user_list = [
    {
        "email": "test1@local.com",
        "alias": "User1"
    },
    {
        "email": "test2@local.com",
        "alias": "User2"
    },
    {
        "email": "test3@local.com",
        "alias": "User3"
    },
    {
        "email": "test4@local.com",
        "alias": "User4"
    },
    {
        "email": "test5@local.com",
        "alias": "User5"
    },
    {
        "email": "test6@local.com",
        "alias": "User6"
    }
]
admin_username = "superuser@test.com"
admin_password = "resurepus"
admin_alias = "Nimda"


# Global

# @pytest.fixture(autouse=True)
# def run_before_and_after_tests():
#     """Fixture to execute asserts before and after a test is run"""
#     # Setup: fill with any logic you want
#
#     yield # this is where the testing happens
#
#     # Teardown : fill with any logic you want

# Test User

def login(username: str, password: str):
    return requests.post(f"{api}/oauth2/token", data={
        "grant_type": "password",
        "username": username,
        "password": sha1(password.encode()).hexdigest()
    })


@pytest.fixture(scope="package")
def test_admin_sign_in():
    r = login(admin_username, admin_password)
    assert r.status_code == 200
    log_res(r)
    user_token_access = r.json()["data"]["access_token"]
    user_token_refresh = r.json()["data"]["refresh_token"]
    user_uuid = json.loads(base64.b64decode(user_token_access.split(".")[1] + '==='))["uuid"]
    return {
        "token_access": user_token_access,
        "token_refresh": user_token_refresh,
        "user_uuid": user_uuid
    }


@pytest.fixture(scope="package")
def test_create_user(test_admin_sign_in, test_patch_sys_config):
    r = requests.post(f"{api}/user", headers={
        "Authorization": f"Bearer {test_admin_sign_in['token_access']}"
    }, json=user_list)
    log_res(r)
    assert r.status_code == 200
    generated_user: list = r.json()["data"]
    return {
        "generated_user": generated_user
    }


@pytest.fixture(scope="package")
def test_user_sign_in(test_create_user):
    ret = []
    for user in test_create_user["generated_user"]:
        r = login(user["email"], user["initial_password"])
        log_res(r)
        assert r.status_code == 200
        user_token_access = r.json()["data"]["access_token"]
        user_token_refresh = r.json()["data"]["refresh_token"]
        user_uuid = json.loads(base64.b64decode(user_token_access.split(".")[1] + '==='))["uuid"]
        ret.append({
            "token_access": user_token_access,
            "token_refresh": user_token_refresh,
            "user_uuid": user_uuid
        })
    return ret


def test_token_refresh(test_user_sign_in):
    r = requests.post(f"{api}/oauth2/refresh", data={
        "grant_type": "refresh",
        "refresh_token": test_user_sign_in[0]["token_refresh"]
    })
    log_res(r)
    assert r.status_code == 200


def test_update_user_profile(test_user_sign_in):
    r = requests.patch(f"{api}/user/{test_user_sign_in[0]['user_uuid']}", headers={
        "Authorization": f"Bearer {test_user_sign_in[0]['token_access']}"
    }, json={
        "bio": "Lorem ipsum"
    })
    log_res(r)
    assert r.status_code == 200


def test_update_admin_profile(test_admin_sign_in):
    r = requests.patch(f"{api}/user/{test_admin_sign_in['user_uuid']}", headers={
        "Authorization": f"Bearer {test_admin_sign_in['token_access']}"
    }, json={
        "alias": admin_alias
    })
    log_res(r)
    assert r.status_code == 200


def test_get_user_profile(test_user_sign_in):
    r = requests.get(f"{api}/user/{test_user_sign_in[0]['user_uuid']}")
    log_res(r)
    assert r.status_code == 200
    assert r.json()["data"]["bio"] == "Lorem ipsum"


def test_change_password(test_create_user, test_user_sign_in, test_admin_sign_in):
    # User1 change password
    r = requests.patch(f"{api}/user/{test_user_sign_in[0]['user_uuid']}/password",
                       headers={
                           "Authorization": f"Bearer {test_user_sign_in[0]['token_access']}"
                       },
                       json={
                           "old_password": sha1(
                               test_create_user["generated_user"][0]["initial_password"].encode()).hexdigest(),
                           "new_password": sha1("password".encode()).hexdigest()
                       })
    log_res(r)
    assert r.status_code == 200
    # verify result
    r = login(user_list[0]["email"], "password")
    log_res(r)
    assert r.status_code == 200

    # Admin change User2 password
    r = requests.patch(f"{api}/user/{test_user_sign_in[1]['user_uuid']}/password",
                       headers={
                           "Authorization": f"Bearer {test_admin_sign_in['token_access']}"
                       },
                       json={
                           "new_password": sha1("password".encode()).hexdigest()
                       })
    log_res(r)
    assert r.status_code == 200
    # verify result
    r = login(user_list[1]["email"], "password")
    log_res(r)
    assert r.status_code == 200


def test_get_user_list(test_create_user, test_admin_sign_in, test_accept_application):
    r = requests.get(f"{api}/user", headers={
        "Authorization": f"Bearer {test_admin_sign_in['token_access']}"
    })
    log_res(r)
    assert r.status_code == 200


# Test Group

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
    log_res(r)
    assert r.status_code == 200
    # User3 create groupB
    r = requests.post(f"{api}/group", headers={
        "Authorization": f"Bearer {test_user_sign_in[2]['token_access']}"
    }, json=group_list[1])
    log_res(r)
    assert r.status_code == 200
    # User5 create groupC
    r = requests.post(f"{api}/group", headers={
        "Authorization": f"Bearer {test_user_sign_in[4]['token_access']}"
    }, json={
        "name": "GroupC",
        "title": "ProjectC",
        "description": "test group C"
    })
    log_res(r)
    assert r.status_code == 200
    # User6 create groupD
    r = requests.post(f"{api}/group", headers={
        "Authorization": f"Bearer {test_user_sign_in[5]['token_access']}"
    }, json={
        "name": "GroupD",
        "title": "ProjectD",
        "description": "test group D"
    })
    log_res(r)
    assert r.status_code == 200


@pytest.fixture(scope="package")
def test_get_group_list(test_create_group, test_user_sign_in):
    # User1 get
    r = requests.get(f"{api}/group", headers={
        "Authorization": f"Bearer {test_user_sign_in[0]['token_access']}"
    })
    log_res(r)
    assert r.status_code == 200
    return sorted(r.json()["data"], key=lambda i: i["name"])


def test_get_group_info(test_user_sign_in, test_get_group_list, test_add_group_comment):
    # User1 get GroupA
    r = requests.get(f"{api}/group/{test_get_group_list[0]['uuid']}", headers={
        "Authorization": f"Bearer {test_user_sign_in[0]['token_access']}"
    })
    log_res(r)
    assert r.status_code == 200
    # User3 get GroupA
    r = requests.get(f"{api}/group/{test_get_group_list[0]['uuid']}", headers={
        "Authorization": f"Bearer {test_user_sign_in[2]['token_access']}"
    })
    log_res(r)
    assert r.status_code == 200


def test_update_group_info(test_user_sign_in, test_get_group_list):
    # User1 update GroupA
    r = requests.patch(f"{api}/group/{test_get_group_list[0]['uuid']}", headers={
        "Authorization": f"Bearer {test_user_sign_in[0]['token_access']}"
    }, json={
        "description": "modified",
        "proposal": "set"
    })
    log_res(r)
    assert r.status_code == 200


def test_favorite_group(test_user_sign_in, test_get_group_list):
    # User2 favorite GroupA
    r = requests.post(f"{api}/group/{test_get_group_list[0]['uuid']}/favorite", headers={
        "Authorization": f"Bearer {test_user_sign_in[1]['token_access']}"
    })
    log_res(r)
    assert r.status_code == 200
    # verify
    r = requests.get(f"{api}/group/{test_get_group_list[0]['uuid']}", headers={
        "Authorization": f"Bearer {test_user_sign_in[1]['token_access']}"
    })
    log_res(r)
    assert r.status_code == 200
    assert r.json()["data"]["favorite"] == True


def test_undo_favorite_group(test_user_sign_in, test_get_group_list):
    # User2 undo favorite GroupA
    r = requests.delete(f"{api}/group/{test_get_group_list[0]['uuid']}/favorite", headers={
        "Authorization": f"Bearer {test_user_sign_in[1]['token_access']}"
    })
    log_res(r)
    assert r.status_code == 200
    # verify
    r = requests.get(f"{api}/group/{test_get_group_list[0]['uuid']}", headers={
        "Authorization": f"Bearer {test_user_sign_in[1]['token_access']}"
    })
    log_res(r)
    assert r.status_code == 200
    assert r.json()["data"]["favorite"] == False


@pytest.fixture(scope="package")
def test_add_group_comment(test_user_sign_in, test_admin_sign_in, test_get_group_list):
    # User1 comment GroupA
    r = requests.post(f"{api}/group/{test_get_group_list[0]['uuid']}/comment", headers={
        "Authorization": f"Bearer {test_user_sign_in[0]['token_access']}"
    }, json={
        "content": "User1 comment"
    })
    log_res(r)
    assert r.status_code == 200
    # Admin comment GroupA
    r = requests.post(f"{api}/group/{test_get_group_list[0]['uuid']}/comment", headers={
        "Authorization": f"Bearer {test_admin_sign_in['token_access']}"
    }, json={
        "content": "Admin comment"
    })
    log_res(r)
    assert r.status_code == 200


@pytest.fixture(scope="package")
def test_delete_group(test_user_sign_in, test_admin_sign_in, test_get_group_list):
    # User5 delete GroupC
    r = requests.delete(f"{api}/group/{test_get_group_list[2]['uuid']}", headers={
        "Authorization": f"Bearer {test_user_sign_in[4]['token_access']}"
    })
    log_res(r)
    assert r.status_code == 200
    # Admin delete GroupD
    r = requests.delete(f"{api}/group/{test_get_group_list[3]['uuid']}", headers={
        "Authorization": f"Bearer {test_admin_sign_in['token_access']}"
    })
    log_res(r)
    assert r.status_code == 200


def test_transfer_group_owner(test_user_sign_in, test_get_group_list, test_accept_application, test_reject_application):
    # User1 transfer GroupA ownership to User2
    r = requests.patch(f"{api}/group/{test_get_group_list[0]['uuid']}/owner",
                       headers={
                           "Authorization": f"Bearer {test_user_sign_in[0]['token_access']}"
                       },
                       json={
                           "owner_uuid": test_user_sign_in[1]['user_uuid']
                       })
    log_res(r)
    assert r.status_code == 200


def test_assign_group(test_admin_sign_in, test_user_sign_in, test_delete_application):
    # Admin assign User5(owner) User6(member) to new GroupE
    r = requests.post(f"{api}/group/assigned",
                      headers={
                          "Authorization": f"Bearer {test_admin_sign_in['token_access']}"
                      },
                      json={
                          "name": "GroupE",
                          "title": "ProjectE",
                          "description": "assigned groupE",
                          "owner_uuid": test_user_sign_in[4]["user_uuid"],
                          "member_uuid": [
                              test_user_sign_in[5]["user_uuid"]
                          ]
                      })
    log_res(r)
    assert r.status_code == 200


# Test Application

@pytest.fixture(scope="package")
def test_create_application(test_user_sign_in, test_get_group_list, test_delete_group):
    # User2 apply GroupA
    r = requests.post(f"{api}/group/{test_get_group_list[0]['uuid']}/application",
                      headers={
                          "Authorization": f"Bearer {test_user_sign_in[1]['token_access']}"
                      },
                      json={
                          "comment": "Application 2->A"
                      })
    log_res(r)
    assert r.status_code == 200
    # User2 apply GroupB
    r = requests.post(f"{api}/group/{test_get_group_list[1]['uuid']}/application",
                      headers={
                          "Authorization": f"Bearer {test_user_sign_in[1]['token_access']}"
                      },
                      json={
                          "comment": "Application 2->B"
                      })
    log_res(r)
    assert r.status_code == 200
    # User4 apply GroupB
    r = requests.post(f"{api}/group/{test_get_group_list[1]['uuid']}/application",
                      headers={
                          "Authorization": f"Bearer {test_user_sign_in[3]['token_access']}"
                      },
                      json={
                          "comment": "Application 4->B"
                      })
    log_res(r)
    assert r.status_code == 200
    # User5 apply GroupA
    r = requests.post(f"{api}/group/{test_get_group_list[0]['uuid']}/application",
                      headers={
                          "Authorization": f"Bearer {test_user_sign_in[4]['token_access']}"
                      },
                      json={
                          "comment": "Application 5->A"
                      })
    log_res(r)
    assert r.status_code == 200
    # User6 apply GroupA
    r = requests.post(f"{api}/group/{test_get_group_list[0]['uuid']}/application",
                      headers={
                          "Authorization": f"Bearer {test_user_sign_in[5]['token_access']}"
                      },
                      json={
                          "comment": "Application 6->A"
                      })
    log_res(r)
    assert r.status_code == 200


@pytest.fixture(scope="package")
def test_get_group_application_list(test_get_group_list, test_user_sign_in, test_create_application):
    ret = {}
    # User1 get GroupA
    r = requests.get(f"{api}/group/{test_get_group_list[0]['uuid']}/application",
                     headers={
                         "Authorization": f"Bearer {test_user_sign_in[0]['token_access']}"
                     })
    log_res(r)
    assert r.status_code == 200
    ret["GroupA"] = sorted(r.json()["data"], key=lambda i: i["comment"])
    # User3 get GroupB
    r = requests.get(f"{api}/group/{test_get_group_list[1]['uuid']}/application",
                     headers={
                         "Authorization": f"Bearer {test_user_sign_in[2]['token_access']}"
                     })
    log_res(r)
    assert r.status_code == 200
    ret["GroupB"] = sorted(r.json()["data"], key=lambda i: i["comment"])
    return ret


@pytest.fixture(scope="package")
def test_get_user_application_list(test_user_sign_in, test_create_application):
    # User6
    r = requests.get(f"{api}/user/{test_user_sign_in[5]['user_uuid']}/application",
                     headers={
                         "Authorization": f"Bearer {test_user_sign_in[5]['token_access']}"
                     })
    log_res(r)
    assert r.status_code == 200
    return sorted(r.json()["data"], key=lambda i: i["comment"])


@pytest.fixture(scope="package")
def test_accept_application(test_user_sign_in, test_get_group_application_list):
    # User1 accept Application 2>A
    r = requests.post(f"{api}/application/accepted",
                      headers={
                          "Authorization": f"Bearer {test_user_sign_in[0]['token_access']}"
                      }, json={
            "uuid": test_get_group_application_list["GroupA"][0]["uuid"]
        })
    log_res(r)
    assert r.status_code == 200
    # User3 accept Application 4>B
    r = requests.post(f"{api}/application/accepted",
                      headers={
                          "Authorization": f"Bearer {test_user_sign_in[2]['token_access']}"
                      }, json={
            "uuid": test_get_group_application_list["GroupB"][1]["uuid"]
        })
    log_res(r)
    assert r.status_code == 200


@pytest.fixture(scope="package")
def test_reject_application(test_user_sign_in, test_get_group_application_list):
    # User1 reject Application 5>A
    r = requests.post(f"{api}/application/rejected",
                      headers={
                          "Authorization": f"Bearer {test_user_sign_in[0]['token_access']}"
                      }, json={
            "uuid": test_get_group_application_list["GroupA"][1]["uuid"]
        })
    log_res(r)
    assert r.status_code == 200


@pytest.fixture(scope="package")
def test_delete_application(test_get_user_application_list, test_user_sign_in):
    # User6 delete Application 6>A
    r = requests.delete(f"{api}/application/{test_get_user_application_list[0]['uuid']}",
                        headers={
                            "Authorization": f"Bearer {test_user_sign_in[5]['token_access']}"
                        })
    log_res(r)
    assert r.status_code == 200


# Test Notification

def test_get_notification(test_user_sign_in, test_accept_application, test_reject_application):
    for user in test_user_sign_in:
        r = requests.get(f"{api}/user/{user['user_uuid']}/notification",
                         headers={
                             "Authorization": f"Bearer {user['token_access']}"
                         })
        log_res(r)
        assert r.status_code == 200


# Test System API
@pytest.fixture(scope="package")
def test_patch_sys_config(test_admin_sign_in):
    r = requests.patch(f"{api}/sysconfig",
                       headers={
                           "Authorization": f"Bearer {test_admin_sign_in['token_access']}"
                       },
                       json={
                           "system_state": {
                               "grouping_ddl": int(time.time() + 100),
                               "proposal_ddl": int(time.time() + 200)
                           }
                       })
    log_res(r)
    assert r.status_code == 200


def test_get_sysconfig(test_user_sign_in):
    r = requests.get(f"{api}/sysconfig",
                     headers={
                         "Authorization": f"Bearer {test_user_sign_in[0]['token_access']}"
                     })
    log_res(r)
    assert r.status_code == 200


# Test Semester API

@pytest.fixture(scope="package")
def test_archive_semester(test_admin_sign_in):
    r = requests.post(f"{api}/semester/archived",
                      headers={
                          "Authorization": f"Bearer {test_admin_sign_in['token_access']}"
                      },
                      json={
                          "name": "test_archived"
                      })
    log_res(r)
    assert r.status_code == 200
    # test dup name
    r = requests.post(f"{api}/semester/archived",
                      headers={
                          "Authorization": f"Bearer {test_admin_sign_in['token_access']}"
                      },
                      json={
                          "name": "test_archived"
                      })
    log_res(r)
    assert r.status_code == 409


@pytest.fixture(scope="package")
def test_get_semester_list(test_archive_semester, test_user_sign_in):
    r = requests.get(f"{api}/semester",
                     headers={
                         "Authorization": f"Bearer {test_user_sign_in[0]['token_access']}"
                     })
    log_res(r)
    assert r.status_code == 200
    return r.json()["data"]


def test_rename_semester(test_admin_sign_in, test_get_semester_list):
    r = requests.patch(f"{api}/semester/{test_get_semester_list[0]['uuid']}",
                       headers={
                           "Authorization": f"Bearer {test_admin_sign_in['token_access']}"
                       },
                       json={
                           "name": "archive_renamed"
                       })
    log_res(r)
    assert r.status_code == 200


def test_delete_semester(test_admin_sign_in, test_get_semester_list):
    r = requests.delete(f"{api}/semester/{test_get_semester_list[0]['uuid']}",
                        headers={
                            "Authorization": f"Bearer {test_admin_sign_in['token_access']}"
                        })
    log_res(r)
    assert r.status_code == 200
