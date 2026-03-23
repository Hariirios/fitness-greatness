const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const Database = require('./database');
const emailService = require('./emailService');

const app = express();
const db = new Database();

app.use(cors());
app.use(express.json());

// Auth middleware
const requireAuth = async (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    const userId = await db.verifySession(token);
    
    if (!userId) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.userId = userId;
    next();
};

// ML Prediction function (simplified - you can integrate a proper ML model later)
function predictCalories(features) {
    // Simple formula for calorie prediction
    // features: [gender, age, height, weight, duration, heart_rate, body_temp]
    const [gender, age, height, weight, duration, heartRate, bodyTemp] = features;
    
    // Basic calorie calculation formula
    const bmr = gender === 0 
        ? 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
        : 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    
    const caloriesPerMinute = (bmr / 1440) * (heartRate / 70) * 1.5;
    const totalCalories = caloriesPerMinute * duration;
    
    return Math.round(totalCalories * 100) / 100;
}

// Routes
app.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const userId = await db.createUser(username, email, password);
        
        if (!userId) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        
        const token = await db.createSession(userId);
        
        res.json({
            token,
            user: { id: userId, username, email }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Missing username or password' });
        }
        
        const user = await db.verifyUser(username, password);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = await db.createSession(user.id);
        
        res.json({ token, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/logout', requireAuth, async (req, res) => {
    try {
        const token = req.headers.authorization.replace('Bearer ', '');
        await db.deleteSession(token);
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        const user = await db.getUserByEmail(email);
        
        if (!user) {
            return res.json({ message: 'If an account with this email exists, a reset link has been sent' });
        }
        
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000).toISOString();
        
        await db.createResetToken(user.id, resetToken, expiresAt);
        
        const resetLink = `http://localhost:8000/reset-password.html?token=${resetToken}`;
        const emailSent = await emailService.sendPasswordResetEmail(email, user.username, resetLink);
        
        if (emailSent) {
            res.json({ message: 'Password reset link sent to your email' });
        } else {
            res.status(500).json({ error: 'Failed to send email. Please try again later.' });
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'An error occurred. Please try again later.' });
    }
});

app.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        
        if (!token || !password) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }
        
        const userId = await db.verifyResetToken(token);
        
        if (!userId) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }
        
        const success = await db.updatePassword(userId, password);
        
        if (success) {
            await db.useResetToken(token);
            res.json({ message: 'Password reset successfully' });
        } else {
            res.status(500).json({ error: 'Failed to update password' });
        }
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'An error occurred. Please try again later.' });
    }
});

app.post('/predict', requireAuth, (req, res) => {
    try {
        const { features } = req.body;
        const calories = predictCalories(features);
        res.json({ calories });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/workouts', requireAuth, async (req, res) => {
    try {
        const workouts = await db.getUserWorkouts(req.userId);
        res.json({ workouts });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/workouts', requireAuth, async (req, res) => {
    try {
        const workoutId = await db.saveWorkout(req.userId, req.body);
        res.json({ id: workoutId, message: 'Workout saved' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/workouts/:id', requireAuth, async (req, res) => {
    try {
        const deleted = await db.deleteWorkout(req.params.id, req.userId);
        if (deleted) {
            res.json({ message: 'Workout deleted' });
        } else {
            res.status(404).json({ error: 'Workout not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/stats', requireAuth, async (req, res) => {
    try {
        const stats = await db.getUserStats(req.userId);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`);
});
