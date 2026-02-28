import os
import pyodbc
import pymysql
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


# -------------------------
# Database Configurations
# -------------------------

# HR Database - SQL Server
DB_HR = {
    "type": "sqlserver",
    "driver": get_env("SQLSERVER_DRIVER", "{ODBC Driver 17 for SQL Server}"),
    "server": get_env("HR_DB_SERVER", "localhost:1433"),
    "database": get_env("HR_DB_NAME", "HUMAN"),
    "uid": get_env("HR_DB_USER", "sa"),
    "pwd": get_env("HR_DB_PASSWORD", "Ilovedu20@"),
}

# Payroll Database - MySQL
DB_PAYROLL = {
    "type": "mysql",
    "host": get_env("PAYROLL_DB_HOST", "localhost"),
    "port": int(get_env("PAYROLL_DB_PORT", "3306")),
    "database": get_env("PAYROLL_DB_NAME", "payroll"),
    "user": get_env("PAYROLL_DB_USER", "root"),
    "password": get_env("PAYROLL_DB_PASSWORD", "Ilovedu20@"),
}

# Auth Database - MySQL
DB_AUTH = {
    "type": "mysql",
    "host": get_env("AUTH_DB_HOST", "localhost"),
    "port": int(get_env("AUTH_DB_PORT", "3306")),
    "database": get_env("AUTH_DB_NAME", "auth_db"),
    "user": get_env("AUTH_DB_USER", "root"),
    "password": get_env("AUTH_DB_PASSWORD", "Ilovedu20@"),
}


# -------------------------
# Connection Factory
# -------------------------

def create_sqlserver_connection(cfg: dict):
    """Create SQL Server connection using pyodbc"""
    conn_str = (
        f"DRIVER={cfg['driver']};"
        f"SERVER={cfg['server']};"
        f"DATABASE={cfg['database']};"
        f"UID={cfg['uid']};"
        f"PWD={cfg['pwd']};"
        "TrustServerCertificate=yes;"
    )
    return pyodbc.connect(conn_str)


def create_mysql_connection(cfg: dict):
    """Create MySQL connection using pymysql"""
    return pymysql.connect(
        host=cfg['host'],
        port=cfg['port'],
        database=cfg['database'],
        user=cfg['user'],
        password=cfg['password'],
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )


def create_connection(cfg: dict):
    """Create connection based on database type"""
    if cfg['type'] == 'sqlserver':
        return create_sqlserver_connection(cfg)
    elif cfg['type'] == 'mysql':
        return create_mysql_connection(cfg)
    else:
        raise ValueError(f"Unsupported database type: {cfg['type']}")


# -------------------------
# Context Managers
# -------------------------

@contextmanager
def get_hr_cursor():
    """Get cursor for HR database (SQL Server)"""
    conn = None
    try:
        conn = create_connection(DB_HR)
        cursor = conn.cursor()
        cursor.execute("SET NOCOUNT ON")
        yield cursor
        conn.commit()
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"[HR DB] {e}")
        raise
    finally:
        if conn:
            cursor.close()
            conn.close()


@contextmanager
def get_payroll_cursor():
    """Get cursor for Payroll database (MySQL)"""
    conn = None
    try:
        conn = create_connection(DB_PAYROLL)
        cursor = conn.cursor()
        yield cursor
        conn.commit()
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"[PAYROLL DB] {e}")
        raise
    finally:
        if conn:
            cursor.close()
            conn.close()


@contextmanager
def get_auth_cursor():
    """Get cursor for Auth database (MySQL)"""
    conn = None
    try:
        conn = create_connection(DB_AUTH)
        cursor = conn.cursor()
        yield cursor
        conn.commit()
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"[AUTH DB] {e}")
        raise
    finally:
        if conn:
            cursor.close()
            conn.close()


# Legacy aliases for backward compatibility
get_human_cursor = get_hr_cursor
