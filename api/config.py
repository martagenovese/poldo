import os

DB = {}

def get_db():
    """Get the database config."""
    DB['host']= os.getenv('DB_HOST')
    DB['user']= os.getenv('DB_USER')
    DB['password']= os.getenv('DB_PW')
    DB['database']= os.getenv('DB_NAME')
    
    if(DB['host'] is None or DB['user'] is None or DB['password'] is None or DB['database'] is None):
        return False
    return True

    
