import os
import sqlite3

db_path = "blackvave.db"
if os.path.exists(db_path):
    try:
        os.remove(db_path)
        print("Deleted DB")
    except Exception as e:
        print(f"Could not delete: {e}")
else:
    print("DB not found")
