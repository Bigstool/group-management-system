import json
from typing import Tuple, Union

from database.mysql.MysqlService import MysqlHelper


class UserDao:
    mysql: MysqlHelper

    def __init__(self):
        from shared import mysql_helper
        self.mysql = mysql_helper

    def insert_user(self, user_uuid: str, username: str, mobile: str, password_salt: bytes,
                    password_hash: bytes, meta: dict):
        sql = "INSERT INTO resource(uuid, resource_type, creation_time, creator_uuid) " \
              "VALUE (UUID_TO_BIN(%s), 'USER', UNIX_TIMESTAMP(), UUID_TO_BIN('00000000-0000-0000-0000-000000000000')); " \
              "INSERT INTO user(uuid, password_salt, password_hash, mobile, username, meta) " \
              "VALUE (UUID_TO_BIN(%s), UNHEX(%s), UNHEX(%s), %s, %s, %s);"
        self.mysql.modify(sql, (
            user_uuid, user_uuid, password_salt.hex(), password_hash.hex(), mobile, username, json.dumps(meta)))

    def get_user_password_by_email(self, mobile: str) -> Union[dict, None]:
        sql = "SELECT " \
              "BIN_TO_UUID(user.uuid) AS uuid, " \
              "HEX(user.password_salt) AS password_salt, " \
              "HEX(user.password_hash) AS password_hash, " \
              "resource.enabled AS enabled " \
              "FROM user " \
              "INNER JOIN resource ON user.uuid = resource.uuid " \
              "WHERE user.mobile = %s"
        data = self.mysql.read(sql, (mobile,), "one")
        return data

    def get_user_by_mobile(self, mobile: str) -> Union[dict, None]:
        """
        根据用户手机号获取用户信息
        :param mobile:
        :return:
        """
        sql = "SELECT " \
              "BIN_TO_UUID(user.uuid) AS uuid, " \
              "user.mobile AS mobile, " \
              "user.username AS username, " \
              "user.email AS email, " \
              "user.meta AS meta, " \
              "resource.enabled AS enabled, " \
              "resource.locked AS locked, " \
              "BIN_TO_UUID(resource.creator_uuid) AS creator_uuid, " \
              "resource.creation_time AS creation_time " \
              "FROM user " \
              "INNER JOIN resource ON user.uuid = resource.uuid " \
              "WHERE user.mobile = %s"
        data = self.mysql.read(sql, (mobile,), "one")

        if data:
            data["enabled"] = bool(data["enabled"])
            data["locked"] = bool(data["locked"])
            data["meta"] = json.loads(data["meta"]) if data["meta"] else None

        return data

    def get_user_by_uuid(self, uuid: str) -> Union[dict, None]:
        """
        根据用户id得到用户基本信息
        :param uuid: 用户id
        :return: 用户基本信息
        """
        sql = "SELECT " \
              "BIN_TO_UUID(user.uuid) AS uuid, " \
              "user.mobile AS mobile, " \
              "user.username AS username, " \
              "user.email AS email, " \
              "user.meta AS meta, " \
              "resource.enabled AS enabled, " \
              "resource.locked AS locked, " \
              "BIN_TO_UUID(resource.creator_uuid) AS creator_uuid, " \
              "resource.creation_time AS creation_time " \
              "FROM user " \
              "INNER JOIN resource ON user.uuid = resource.uuid " \
              "WHERE user.uuid = UUID_TO_BIN(%s)"
        data = self.mysql.read(sql, (uuid,), "one")

        if data:
            data["enabled"] = bool(data["enabled"])
            data["locked"] = bool(data["locked"])
            data["meta"] = json.loads(data["meta"]) if data["meta"] else None

        return data

    def get_user_list(self, page_index: int, page_size: int, order_by: str = None, search: str = None) -> dict:
        search_clause = ""
        if search is not None:
            search_clause = "WHERE username LIKE %s OR email LIKE %s OR mobile LIKE %s OR meta LIKE %s"

        order_clause = ""
        if order_by == "ENABLED_ASC":
            order_clause = "ORDER BY resource.enabled ASC"
        elif order_by == "ENABLED_DESC":
            order_clause = "ORDER BY resource.enabled DESC"
        elif order_by == "CREATION_TIME_ASC":
            order_clause = "ORDER BY resource.creation_time ASC"
        elif order_by == "CREATION_TIME_DESC":
            order_clause = "ORDER BY resource.creation_time DESC"
        elif order_by == "USERNAME_ASC":
            order_clause = "ORDER BY user.username ASC"
        elif order_by == "USERNAME_DESC":
            order_clause = "ORDER BY user.username DESC"

        limit_clause = ""
        if page_size is not None and page_index is not None:
            limit_clause = "LIMIT %s, %s"

        sql = "SELECT " \
              "BIN_TO_UUID(user.uuid) AS uuid, " \
              "user.mobile AS mobile, " \
              "user.username AS username, " \
              "user.email AS email, " \
              "user.meta AS meta, " \
              "resource.enabled AS enabled, " \
              "resource.locked AS locked, " \
              "BIN_TO_UUID(resource.creator_uuid) AS creator_uuid, " \
              "resource.creation_time AS creation_time " \
              "FROM user " \
              "INNER JOIN resource ON user.uuid = resource.uuid " \
              f"{search_clause} " \
              f"{order_clause} " \
              f"{limit_clause}"

        data_user = self.mysql.read(sql, tuple(
            ([f"%{search}%"] * 4 if search is not None else []) +
            ([(page_index - 1) * page_size, page_size] if page_size is not None and page_index is not None else [])
        ))

        sql = "SELECT COUNT(*) AS cnt " \
              "FROM user " \
              f"{search_clause}"

        data_count = self.mysql.read(sql, tuple(
            [f"%{search}%"] * 4 if search is not None else []
        ), fetch="one")

        for data in data_user:
            data["enabled"] = bool(data["enabled"])
            data["locked"] = bool(data["locked"])
            data["meta"] = json.loads(data["meta"]) if data["meta"] else None

        return {
            "page_size": page_size,
            "page_index": page_index,
            "total_item": data_count["cnt"],
            "items": data_user
        }

    def get_employee_list(self, uuid: str, page_index: int = None, page_size: int = None, order_by: str = None,
                          assignable_to: str = None, search: str = None) -> dict:
        assignable_clause = ""
        if assignable_to is not None:
            # filter out resource which has already been assigned to the owner
            assignable_clause = "AND permission.resource_uuid NOT IN (" \
                                "SELECT resource_uuid FROM permission " \
                                "WHERE resource_owner_uuid = UUID_TO_BIN(%s)" \
                                ") AND permission.resource_uuid != UUID_TO_BIN(%s)"

        search_clause = ""
        if search is not None:
            search_clause = "AND (user.username LIKE %s OR " \
                            "user.mobile LIKE %s OR " \
                            "user.email LIKE %s OR " \
                            "user.meta LIKE %s OR " \
                            "permission.resource_alias LIKE %s)"

        order_clause = ""
        if order_by == "AVAILABLE_ASC":
            order_clause = "ORDER BY permission.resource_available ASC"
        elif order_by == "AVAILABLE_DESC":
            order_clause = "ORDER BY permission.resource_available DESC"
        elif order_by == "ALIAS_ASC":
            order_clause = "ORDER BY permission.resource_alias ASC"
        elif order_by == "ALIAS_DESC":
            order_clause = "ORDER BY permission.resource_alias DESC"

        limit_clause = ""
        if page_size is not None and page_index is not None:
            limit_clause = "LIMIT %s, %s"

        sql = "SELECT " \
              "BIN_TO_UUID(permission.uuid) AS permission_uuid, " \
              "permission.meta AS permission_meta, " \
              "BIN_TO_UUID(user.uuid) AS user_uuid, " \
              "user.username AS username, " \
              "user.mobile AS mobile, " \
              "user.email AS email, " \
              "permission.resource_alias AS alias, " \
              "permission.resource_available AS available " \
              "FROM user " \
              "INNER JOIN resource ON resource.uuid = user.uuid AND resource.enabled = TRUE " \
              "INNER JOIN permission ON user.uuid = permission.resource_uuid AND permission.enabled = TRUE " \
              f"WHERE permission.resource_owner_uuid = UUID_TO_BIN(%s) " \
              f"{assignable_clause} " \
              f"{search_clause} " \
              f"{order_clause} " \
              f"{limit_clause}"

        data_employee = self.mysql.read(sql, tuple(
            [uuid] +
            ([assignable_to] * 2 if assignable_to is not None else []) +
            ([f"%{search}%"] * 5 if search is not None else []) +
            ([(page_index - 1) * page_size, page_size] if page_size is not None and page_index is not None else [])
        ))

        sql = "SELECT COUNT(*) AS cnt " \
              "FROM user " \
              "INNER JOIN resource ON resource.uuid = user.uuid AND resource.enabled = TRUE " \
              "INNER JOIN permission ON user.uuid = permission.resource_uuid AND permission.enabled = TRUE " \
              f"WHERE permission.resource_owner_uuid = UUID_TO_BIN(%s) " \
              f"{assignable_clause} " \
              f"{search_clause} "
        data_count = self.mysql.read(sql, tuple(
            [uuid] +
            ([assignable_to] * 2 if assignable_to else []) +
            ([f"%{search}%"] * 5 if search is not None else [])
        ), fetch="one")

        for data in data_employee:
            data["available"] = bool(data["available"])
            data["permission_meta"] = json.loads(data["permission_meta"]) if data["permission_meta"] else None

        return {
            "page_size": page_size,
            "page_index": page_index,
            "total_item": data_count["cnt"],
            "items": data_employee
        }

    def get_employer_list(self, uuid: str, page_index: int = None, page_size: int = None, order_by: str = None,
                          search: str = None) -> dict:
        search_clause = ""
        if search is not None:
            search_clause = "AND (user.username LIKE %s OR " \
                            "user.mobile LIKE %s OR " \
                            "user.email LIKE %s OR " \
                            "user.meta LIKE %s OR " \
                            "permission.resource_owner_alias LIKE %s)"

        order_clause: str = ""
        if order_by == "AVAILABLE_TO_ASC":
            order_clause = "ORDER BY permission.resource_available ASC"
        elif order_by == "AVAILABLE_TO_DESC":
            order_clause = "ORDER BY permission.resource_available DESC"
        elif order_by == "ALIAS_ASC":
            order_clause = "ORDER BY permission.resource_alias ASC"
        elif order_by == "ALIAS_DESC":
            order_clause = "ORDER BY permission.resource_alias DESC"

        limit_clause = ""
        if page_size is not None and page_index is not None:
            limit_clause = "LIMIT %s, %s"

        sql = "SELECT " \
              "BIN_TO_UUID(permission.uuid) AS permission_uuid," \
              "permission.meta AS permission_meta, " \
              "BIN_TO_UUID(user.uuid) AS user_uuid," \
              "user.username AS username, " \
              "user.mobile AS mobile, " \
              "user.email AS email, " \
              "permission.resource_owner_alias AS alias, " \
              "permission.resource_available AS available_to " \
              "FROM user " \
              "INNER JOIN resource ON resource.uuid = user.uuid AND resource.enabled = TRUE " \
              "INNER JOIN permission ON user.uuid = permission.resource_owner_uuid AND permission.enabled = TRUE " \
              f"WHERE permission.resource_uuid = UUID_TO_BIN(%s) " \
              f"{search_clause} " \
              f"{order_clause} " \
              f"{limit_clause}"

        data_employer = self.mysql.read(sql, tuple(
            [uuid] +
            ([f"%{search}%"] * 5 if search is not None else []) +
            ([(page_index - 1) * page_size, page_size] if page_size is not None and page_index is not None else [])
        ))

        sql = "SELECT COUNT(*) AS cnt " \
              "FROM user " \
              "INNER JOIN resource ON resource.uuid = user.uuid AND resource.enabled = TRUE " \
              "INNER JOIN permission ON user.uuid = permission.resource_owner_uuid AND permission.enabled = TRUE " \
              f"WHERE permission.resource_uuid = UUID_TO_BIN(%s) " \
              f"{search_clause}"
        data_count = self.mysql.read(sql, tuple(
            [uuid] +
            ([f"%{search}%"] * 5 if search is not None else [])
        ), fetch="one")

        for data in data_employer:
            data["available_to"] = bool(data["available_to"])
            data["permission_meta"] = json.loads(data["permission_meta"]) if data["permission_meta"] else None

        return {
            "page_size": page_size,
            "page_index": page_index,
            "total_item": data_count["cnt"],
            "items": data_employer
        }

    def get_employee(self, user_uuid: str, employee_uuid: str) -> dict:
        sql = "SELECT " \
              "BIN_TO_UUID(user.uuid) AS user_uuid, " \
              "user.username AS username, " \
              "user.mobile AS mobile, " \
              "user.email AS email, " \
              "permission.resource_alias AS alias, " \
              "permission.resource_available AS available " \
              "FROM user " \
              "INNER JOIN resource ON resource.uuid = user.uuid AND resource.enabled = TRUE " \
              "INNER JOIN permission ON user.uuid = permission.resource_uuid AND permission.enabled = TRUE " \
              "WHERE permission.resource_owner_uuid = UUID_TO_BIN(%s) AND permission.resource_uuid = UUID_TO_BIN(%s)"

        employee = self.mysql.read(sql, (user_uuid, employee_uuid), fetch="one")

        if employee:
            employee["available"] = bool(employee["available"])

        return employee

    def get_employer(self, user_uuid: str, employer_uuid: str) -> dict:
        pass
        sql = "SELECT " \
              "BIN_TO_UUID(user.uuid) AS user_uuid," \
              "user.username AS username, " \
              "user.mobile AS mobile, " \
              "user.email AS email, " \
              "permission.resource_owner_alias AS alias, " \
              "permission.resource_available AS available_to " \
              "FROM user " \
              "INNER JOIN resource ON resource.uuid = user.uuid AND resource.enabled = TRUE " \
              "INNER JOIN permission ON user.uuid = permission.resource_owner_uuid AND permission.enabled = TRUE " \
              "WHERE permission.resource_uuid = UUID_TO_BIN(%s) AND permission.resource_owner_uuid = UUID_TO_BIN(%s)"

        employer = self.mysql.read(sql, (user_uuid, employer_uuid), fetch="one")

        if employer:
            employer["available_to"] = bool(employer["available_to"])

        return employer

    def update_user(self, uuid: str, **kwargs):
        clause = list()
        args = list()
        if "password" in kwargs:
            clause.append("password_salt = UNHEX(%s), password_hash = UNHEX(%s)")
            args.append(kwargs["password"][0].hex())
            args.append(kwargs["password"][1].hex())
        if "username" in kwargs:
            clause.append("username = %s")
            args.append(kwargs["username"])
        if "email" in kwargs:
            clause.append("email = %s")
            args.append(kwargs["email"])
        if "mobile" in kwargs:
            clause.append("mobile = %s")
            args.append(kwargs["mobile"])
        if "meta" in kwargs:
            clause.append("meta = %s")
            args.append(json.dumps(kwargs["meta"]))

        if len(args) > 0:
            clause = ", ".join(clause)
            args.append(uuid)
        else:
            return  # nothing to do

        sql = "UPDATE user " \
              f"SET {clause} " \
              "WHERE uuid = UUID_TO_BIN(%s)"

        self.mysql.modify(sql, tuple(args))

    def remove_user(self, uuid):
        sql = "DELETE FROM resource " \
              "WHERE uuid = UUID_TO_BIN(%s)"

        self.mysql.modify(sql, (uuid,))
