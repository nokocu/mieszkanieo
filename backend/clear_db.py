"""
database clean
"""

import sqlite3
import os

def clear_properties():
    """clear all properties from database"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(script_dir, 'real_estate.db')
    
    try:
        print(f"Looking for database at: {db_path}")
        
        if not os.path.exists(db_path):
            print("Database file not found")
            return
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Count current properties
        cursor.execute('SELECT COUNT(*) FROM properties')
        count = cursor.fetchone()[0]
        
        if count == 0:
            print("No properties to clear")
            return
        
        print(f"Found {count} properties")
        
        # Delete all properties
        cursor.execute('DELETE FROM properties')
        conn.commit()
        
        print(f"Cleared {count} properties")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    clear_properties()