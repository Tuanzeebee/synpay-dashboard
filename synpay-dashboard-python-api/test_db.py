from db import create_connection, DB_HR, DB_PAYROLL, DB_AUTH

def test_connection(name, cfg):
    try:
        conn = create_connection(cfg)
        print(f"✓ Connected to {name} database successfully")
        cursor = conn.cursor()
        
        # Test query based on database type
        if cfg['type'] == 'sqlserver':
            cursor.execute("SELECT @@VERSION")
            print(f"  SQL Server version: {cursor.fetchone()[0][:50]}...")
        elif cfg['type'] == 'mysql':
            cursor.execute("SELECT VERSION()")
            result = cursor.fetchone()
            version = result['VERSION()'] if isinstance(result, dict) else result[0]
            print(f"  MySQL version: {version}")
        
        cursor.close()
        conn.close()
        print()
    except Exception as e:
        print(f"✗ Connection to {name} failed:", e)
        print()

print("=" * 60)
print("Testing Database Connections")
print("=" * 60)
print()

test_connection("HR (SQL Server)", DB_HR)
test_connection("Payroll (MySQL)", DB_PAYROLL)
test_connection("Auth (MySQL)", DB_AUTH)

print("=" * 60)
print("Testing Context Managers")
print("=" * 60)
print()

# Test context managers
from db import get_hr_cursor, get_payroll_cursor, get_auth_cursor

try:
    with get_hr_cursor() as cursor:
        cursor.execute("SELECT DB_NAME() as db_name")
        row = cursor.fetchone()
        print(f"✓ HR cursor works - Database: {row[0]}")
except Exception as e:
    print(f"✗ HR cursor failed: {e}")

try:
    with get_payroll_cursor() as cursor:
        cursor.execute("SELECT DATABASE() as db_name")
        result = cursor.fetchone()
        db_name = result['db_name'] if isinstance(result, dict) else result[0]
        print(f"✓ Payroll cursor works - Database: {db_name}")
except Exception as e:
    print(f"✗ Payroll cursor failed: {e}")

try:
    with get_auth_cursor() as cursor:
        cursor.execute("SELECT DATABASE() as db_name")
        result = cursor.fetchone()
        db_name = result['db_name'] if isinstance(result, dict) else result[0]
        print(f"✓ Auth cursor works - Database: {db_name}")
except Exception as e:
    print(f"✗ Auth cursor failed: {e}")

print()
print("=" * 60)
