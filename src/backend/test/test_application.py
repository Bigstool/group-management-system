import logging

import pytest
import requests

from test.shared import log_res
from test.test_user import test_user_sign_in, test_create_user, test_admin_sign_in
from test.test_group import test_get_group_list, test_create_group, test_delete_group

logger = logging.getLogger(__name__)
logger.propagate = True

api = "http://localhost:8080"


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
    log_res(logger, r)
    assert r.status_code == 200
    # User2 apply GroupB
    r = requests.post(f"{api}/group/{test_get_group_list[1]['uuid']}/application",
                      headers={
                          "Authorization": f"Bearer {test_user_sign_in[1]['token_access']}"
                      },
                      json={
                          "comment": "Application 2->B"
                      })
    log_res(logger, r)
    assert r.status_code == 200
    # User4 apply GroupB
    r = requests.post(f"{api}/group/{test_get_group_list[1]['uuid']}/application",
                      headers={
                          "Authorization": f"Bearer {test_user_sign_in[3]['token_access']}"
                      },
                      json={
                          "comment": "Application 4->B"
                      })
    log_res(logger, r)
    assert r.status_code == 200
    # User5 apply GroupA
    r = requests.post(f"{api}/group/{test_get_group_list[0]['uuid']}/application",
                      headers={
                          "Authorization": f"Bearer {test_user_sign_in[4]['token_access']}"
                      },
                      json={
                          "comment": "Application 5->A"
                      })
    log_res(logger, r)
    assert r.status_code == 200
    # User6 apply GroupA
    r = requests.post(f"{api}/group/{test_get_group_list[0]['uuid']}/application",
                      headers={
                          "Authorization": f"Bearer {test_user_sign_in[5]['token_access']}"
                      },
                      json={
                          "comment": "Application 6->A"
                      })
    log_res(logger, r)
    assert r.status_code == 200


@pytest.fixture(scope="package")
def test_get_group_application_list(test_get_group_list, test_user_sign_in, test_create_application):
    ret = {}
    # User1 get GroupA
    r = requests.get(f"{api}/group/{test_get_group_list[0]['uuid']}/application",
                     headers={
                         "Authorization": f"Bearer {test_user_sign_in[0]['token_access']}"
                     })
    log_res(logger, r)
    assert r.status_code == 200
    ret["GroupA"] = r.json()["data"]
    # User3 get GroupB
    r = requests.get(f"{api}/group/{test_get_group_list[1]['uuid']}/application",
                     headers={
                         "Authorization": f"Bearer {test_user_sign_in[2]['token_access']}"
                     })
    log_res(logger, r)
    assert r.status_code == 200
    ret["GroupB"] = r.json()["data"]
    return ret


@pytest.fixture(scope="package")
def test_get_user_application_list(test_user_sign_in, test_create_application):
    # User6
    r = requests.get(f"{api}/user/{test_user_sign_in[5]['user_uuid']}/application",
                     headers={
                         "Authorization": f"Bearer {test_user_sign_in[5]['token_access']}"
                     })
    log_res(logger, r)
    assert r.status_code == 200
    return r.json()["data"]


def test_accept_application(test_user_sign_in, test_get_group_application_list):
    # User1 accept Application 2>A
    r = requests.post(f"{api}/application/accepted",
                      headers={
                          "Authorization": f"Bearer {test_user_sign_in[0]['token_access']}"
                      }, json={
            "uuid": test_get_group_application_list["GroupA"][0]["uuid"]
        })
    log_res(logger, r)
    assert r.status_code == 200
    # User3 accept Application 4>B
    r = requests.post(f"{api}/application/accepted",
                      headers={
                          "Authorization": f"Bearer {test_user_sign_in[2]['token_access']}"
                      }, json={
            "uuid": test_get_group_application_list["GroupB"][1]["uuid"]
        })
    log_res(logger, r)
    assert r.status_code == 200


def test_reject_application(test_user_sign_in, test_get_group_application_list):
    # User1 reject Application 5>A
    r = requests.post(f"{api}/application/rejected",
                      headers={
                          "Authorization": f"Bearer {test_user_sign_in[0]['token_access']}"
                      }, json={
            "uuid": test_get_group_application_list["GroupA"][1]["uuid"]
        })
    log_res(logger, r)
    assert r.status_code == 200


def test_delete_application(test_get_user_application_list, test_user_sign_in):
    # User6 delete Application 6>A
    r = requests.delete(f"{api}/application/{test_get_user_application_list[0]['uuid']}",
                        headers={
                            "Authorization": f"Bearer {test_user_sign_in[5]['token_access']}"
                        })
    log_res(logger, r)
    assert r.status_code == 200
