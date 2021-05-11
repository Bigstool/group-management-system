import logging

logger = logging.getLogger(__name__)
logger.propagate = True

api = "http://localhost:8080"


def test_create_application(test_user_sign_in, test_get_group_list):
    # User2 apply GroupA
    # User2 apply GroupB
    # User4 apply GroupB
    # User5 apply GroupA


def test_get_group_application_list():
    pass


def test_get_user_application_list():
    pass


def test_accept_application():
    pass


def test_reject_application():
    pass


def test_delete_application():
    pass
