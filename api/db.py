import pymysql
from config import DB

class DatabaseManager:
    def __init__(self):
        self.connection = pymysql.connect(
            host=DB['host'],
            user=DB['user'],
            password=DB['password'],
            database=   DB['database'],
            cursorclass=pymysql.cursors.DictCursor
        )
        self.cursor = self.connection.cursor()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_value, traceback):
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
            
