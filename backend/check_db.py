from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text('SELECT * FROM properties'))
    rows = result.fetchall()
    print(f"Found {len(rows)} properties in database:")
    for row in rows:
        print(dict(row._mapping))
