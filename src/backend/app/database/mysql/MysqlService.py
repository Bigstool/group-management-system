from logging import Logger
from typing import List, Union, Any

import mysql.connector
import sqlparse as sqlparse
from mysql.connector.cursor import MySQLCursor
from mysql.connector.pooling import MySQLConnectionPool, PooledMySQLConnection

import shared


class MysqlHelper:
    _cnxpool: MySQLConnectionPool
    _logger: Logger

    def __init__(self, options: dict):
        self._cnxpool = mysql.connector.pooling.MySQLConnectionPool(**options)
        self._logger = shared.get_logger("MySQL")

    def _run_query(self, sql, args: Union[tuple, List[tuple], None], fetch: Union[str, int]):
        cnx: PooledMySQLConnection = self._cnxpool.get_connection()
        cursor: MySQLCursor = cnx.cursor(dictionary=True)

        # execute sql
        try:
            _ = [item for item in cursor.execute(sql, args, multi=True)]
            rows = cursor.rowcount

            data = None
            if fetch == "no" or fetch == 0:
                pass
            elif fetch == "one" or fetch == 1:
                data = cursor.fetchone()
            elif type(fetch) is int:
                data = cursor.fetchmany(fetch)
            else:
                data = cursor.fetchall()

            # if fetch == "no" or fetch == 0:
            cnx.commit()

            # log executed query
            if cursor.statement:
                self._logger.debug('\n' + sqlparse.format(cursor.statement, reindent=True))

            return rows, data
        except:
            self._logger.error(f"SQL statement failed:\n{sql}\n\n{args}")
            raise
        finally:
            if cnx.is_connected():
                cursor.close()
                cnx.close()

    def modify(self, sql, args: Union[tuple, List[tuple]] = None):
        self._run_query(sql, args, fetch="no")

    def read(self, sql, args: Union[tuple, List[tuple]] = None, fetch="all") -> Union[list, dict]:
        return self._run_query(sql, args, fetch=fetch)[1]
