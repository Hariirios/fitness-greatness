const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class Database {
    constructor(dbName = 'fitness_app.db') {
        this.db = new sqlite3.Database(dbName);
        this.initDb();
    }
    
    initDb() {
        this.db.serialize(() => {
            // Users table
            this.db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Sessions table
            this.db.run(`
                CREATE TABLE IF NOT EXISTS sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    token TEXT UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            `);
            
            // Workouts table
            this.db.run(`
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
            `);
            
            // Password reset tokens table
            this.db.run(`
                CREATE TABLE IF NOT EXISTS password_reset_tokens (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    token TEXT UNIQUE NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    used BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            `);
        });
    }
    
    hashPassword(password) {
        return bcrypt.hashSync(password, 10);
    }
    
    createUser(username, email, password) {
        return new Promise((resolve, reject) => {
            try {
                const passwordHash = this.hashPassword(password);
                this.db.run('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                    [username, email, passwordHash],
                    function(err) {
                        if (err) resolve(null);
                        else resolve(this.lastID);
                    }
                );
            } catch (error) {
                resolve(null);
            }
        });
    }
    
    verifyUser(username, password) {
        return new Promise((resolve) => {
            this.db.get('SELECT id, username, email, password_hash FROM users WHERE username = ?',
                [username],
                (err, user) => {
                    if (err || !user) return resolve(null);
                    
                    const isValid = bcrypt.compareSync(password, user.password_hash);
                    if (!isValid) return resolve(null);
                    
                    resolve({ id: user.id, username: user.username, email: user.email });
                }
            );
        });
    }
    
    getUserByEmail(email) {
        return new Promise((resolve) => {
            this.db.get('SELECT id, username, email FROM users WHERE email = ?',
                [email],
                (err, user) => {
                    if (err || !user) return resolve(null);
                    resolve(user);
                }
            );
        });
    }
    
    createSession(userId) {
        return new Promise((resolve) => {
            const token = crypto.randomBytes(32).toString('hex');
            this.db.run('INSERT INTO sessions (user_id, token) VALUES (?, ?)',
                [userId, token],
                (err) => {
                    if (err) console.error(err);
                    resolve(token);
                }
            );
        });
    }
    
    verifySession(token) {
        return new Promise((resolve) => {
            this.db.get('SELECT user_id FROM sessions WHERE token = ?',
                [token],
                (err, session) => {
                    if (err || !session) return resolve(null);
                    resolve(session.user_id);
                }
            );
        });
    }
    
    deleteSession(token) {
        return new Promise((resolve) => {
            this.db.run('DELETE FROM sessions WHERE token = ?', [token], () => resolve());
        });
    }
    
    saveWorkout(userId, workoutData) {
        return new Promise((resolve) => {
            this.db.run(`
                INSERT INTO workouts 
                (user_id, calories, gender, age, height, weight, duration, heart_rate, body_temp)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, workoutData.calories, workoutData.gender, workoutData.age,
                 workoutData.height, workoutData.weight, workoutData.duration,
                 workoutData.heart_rate, workoutData.body_temp],
                function(err) {
                    if (err) console.error(err);
                    resolve(this.lastID);
                }
            );
        });
    }
    
    getUserWorkouts(userId) {
        return new Promise((resolve) => {
            this.db.all('SELECT * FROM workouts WHERE user_id = ? ORDER BY created_at DESC',
                [userId],
                (err, workouts) => {
                    if (err) return resolve([]);
                    resolve(workouts || []);
                }
            );
        });
    }
    
    deleteWorkout(workoutId, userId) {
        return new Promise((resolve) => {
            this.db.run('DELETE FROM workouts WHERE id = ? AND user_id = ?',
                [workoutId, userId],
                function(err) {
                    if (err) return resolve(false);
                    resolve(this.changes > 0);
                }
            );
        });
    }
    
    getUserStats(userId) {
        return new Promise((resolve) => {
            this.db.get(`
                SELECT 
                    COUNT(*) as total_workouts,
                    SUM(calories) as total_calories,
                    AVG(calories) as avg_calories,
                    SUM(duration) as total_duration
                FROM workouts 
                WHERE user_id = ?`,
                [userId],
                (err, stats) => {
                    if (err) return resolve(null);
                    resolve(stats);
                }
            );
        });
    }
    
    createResetToken(userId, token, expiresAt) {
        return new Promise((resolve) => {
            this.db.run('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
                [userId, token, expiresAt],
                (err) => {
                    if (err) console.error(err);
                    resolve(true);
                }
            );
        });
    }
    
    verifyResetToken(token) {
        return new Promise((resolve) => {
            this.db.get(`
                SELECT user_id, expires_at, used FROM password_reset_tokens 
                WHERE token = ? AND used = 0`,
                [token],
                (err, result) => {
                    if (err || !result) return resolve(null);
                    
                    const expiresAt = new Date(result.expires_at);
                    if (new Date() > expiresAt) return resolve(null);
                    
                    resolve(result.user_id);
                }
            );
        });
    }
    
    useResetToken(token) {
        return new Promise((resolve) => {
            this.db.run('UPDATE password_reset_tokens SET used = 1 WHERE token = ?',
                [token],
                () => resolve()
            );
        });
    }
    
    updatePassword(userId, newPassword) {
        return new Promise((resolve) => {
            const passwordHash = this.hashPassword(newPassword);
            this.db.run('UPDATE users SET password_hash = ? WHERE id = ?',
                [passwordHash, userId],
                function(err) {
                    if (err) return resolve(false);
                    resolve(this.changes > 0);
                }
            );
        });
    }
}

module.exports = Database;
