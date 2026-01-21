import os
import pyodbc
from dotenv import load_dotenv
from contextlib import contextmanager
import logging

# Load env file
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("db")


def get_env(key: str, default=None):
    value = os.getenv(key, default)
    if value is None:
        raise RuntimeError(f"Missing environment variable: {key}")
    return value


SQLSERVER_HUMAN = {
    "driver": get_env("SQLSERVER_DRIVER"),
    "server": get_env("HUMAN_DB_SERVER"),
    "database": get_env("HUMAN_DB_NAME"),
    "uid": get_env("HUMAN_DB_USER"),
    "pwd": get_env("HUMAN_DB_PASSWORD"),
}

SQLSERVER_ACCOUNT = {
    "driver": get_env("SQLSERVER_DRIVER"),
    "server": get_env("ACCOUNT_DB_SERVER"),
    "database": get_env("ACCOUNT_DB_NAME"),
    "uid": get_env("ACCOUNT_DB_USER"),
    "pwd": get_env("ACCOUNT_DB_PASSWORD"),
}

# -------------------------
# Connection Factory
# -------------------------

def create_connection(cfg: dict):
    conn_str = (
        f"DRIVER={cfg['driver']};"
        f"SERVER={cfg['server']};"
        f"DATABASE={cfg['database']};"
        f"UID={cfg['uid']};"
        f"PWD={cfg['pwd']};"
        "TrustServerCertificate=yes;"
    )
    return pyodbc.connect(conn_str)


# -------------------------
# Context Managers
# -------------------------

@contextmanager
def get_human_cursor():
    conn = None
    try:
        conn = create_connection(SQLSERVER_HUMAN)
        cursor = conn.cursor()
        cursor.execute("SET NOCOUNT ON")
        yield cursor
        conn.commit()
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"[HUMAN DB] {e}")
        raise
    finally:
        if conn:
            cursor.close()
            conn.close()


@contextmanager
def get_account_cursor():
    conn = None
    try:
        conn = create_connection(SQLSERVER_ACCOUNT)
        cursor = conn.cursor()
        cursor.execute("SET NOCOUNT ON")
        yield cursor
        conn.commit()
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"[ACCOUNT DB] {e}")
        raise
    finally:
        if conn:
            cursor.close()
            conn.close()
