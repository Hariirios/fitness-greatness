import sqlite3
import hashlib
import secrets
from datetime import datetime

class Database:
    def __init__(self, db_name='fitness_app.db'):
        self.db_name = db_name
        self.init_db()
    
    def get_connection(self):
        conn = sqlite3.connect(self.db_name)
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_db(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Sessions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Workouts table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS workouts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                calories REAL NOT NULL,
                gender INTEGER NOT NULL,
                age INTEGER NOT NULL,
                height REAL NOT NULL,
                weight REAL NOT NULL,
                duration INTEGER NOT NULL,
                heart_rate INTEGER NOT NULL,
                body_temp REAL NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def hash_password(self, password):
        return hashlib.sha256(password.encode()).hexdigest()
    
    def create_user(self, username, email, password):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            password_hash = self.hash_password(password)
            cursor.execute(
                'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                (username, email, password_hash)
            )
            conn.commit()
            user_id = cursor.lastrowid
            conn.close()
            return user_id
        except sqlite3.IntegrityError:
            conn.close()
            return None
    
    def verify_user(self, username, password):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        password_hash = self.hash_password(password)
        cursor.execute(
            'SELECT id, username, email FROM users WHERE username = ? AND password_hash = ?',
            (username, password_hash)
        )
        user = cursor.fetchone()
        conn.close()
        
        return dict(user) if user else None
    
    def create_session(self, user_id):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        token = secrets.token_hex(32)
        cursor.execute(
            'INSERT INTO sessions (user_id, token) VALUES (?, ?)',
            (user_id, token)
        )
        conn.commit()
        conn.close()
        
        return token
    
    def verify_session(self, token):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            'SELECT user_id FROM sessions WHERE token = ?',
            (token,)
        )
        session = cursor.fetchone()
        conn.close()
        
        return session['user_id'] if session else None
    
    def delete_session(self, token):
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM sessions WHERE token = ?', (token,))
        conn.commit()
        conn.close()
    
    def save_workout(self, user_id, workout_data):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO workouts 
            (user_id, calories, gender, age, height, weight, duration, heart_rate, body_temp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id,
            workout_data['calories'],
            workout_data['gender'],
            workout_data['age'],
            workout_data['height'],
            workout_data['weight'],
            workout_data['duration'],
            workout_data['heart_rate'],
            workout_data['body_temp']
        ))
        
        conn.commit()
        workout_id = cursor.lastrowid
        conn.close()
        
        return workout_id
    
    def get_user_workouts(self, user_id):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            'SELECT * FROM workouts WHERE user_id = ? ORDER BY created_at DESC',
            (user_id,)
        )
        workouts = cursor.fetchall()
        conn.close()
        
        return [dict(workout) for workout in workouts]
    
    def delete_workout(self, workout_id, user_id):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            'DELETE FROM workouts WHERE id = ? AND user_id = ?',
            (workout_id, user_id)
        )
        conn.commit()
        deleted = cursor.rowcount > 0
        conn.close()
        
        return deleted
    
    def get_user_stats(self, user_id):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT 
                COUNT(*) as total_workouts,
                SUM(calories) as total_calories,
                AVG(calories) as avg_calories,
                SUM(duration) as total_duration
            FROM workouts 
            WHERE user_id = ?
        ''', (user_id,))
        
        stats = cursor.fetchone()
        conn.close()
        
        return dict(stats) if stats else None
