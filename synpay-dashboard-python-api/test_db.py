from db import create_connection, SQLSERVER_HUMAN, SQLSERVER_ACCOUNT

def test_connection(name, cfg):
    try:
        conn = create_connection(cfg)
        print(f"Connected to {name} successfully")
        conn.close()
    except Exception as e:
        print(f"Connection to {name} failed:", e)

test_connection("HUMAN", SQLSERVER_HUMAN)
test_connection("ACCOUNT", SQLSERVER_ACCOUNT)
