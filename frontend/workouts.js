const API_URL = 'http://localhost:5000';

let currentPrediction = null;
let currentUser = null;
let workoutHistory = [];

const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'auth.html';
}

document.addEventListener('DOMContentLoaded', async () => {
    currentUser = JSON.parse(localStorage.getItem('user'));
    
    // Load profile picture
    loadProfilePicture();
    
    await loadWorkouts();
    updateTodayStats();
    
    document.getElementById('predictionForm').addEventListener('submit', predictCalories);
    document.getElementById('saveBtn').addEventListener('click', saveToHistory);
    
    // Initialize search button
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            alert('Search feature - Navigate to overview page to use search');
        });
    }
});

function loadProfilePicture() {
    const profilePic = localStorage.getItem('profilePicture');
    const userProfileImgs = document.querySelectorAll('.user-profile img');
    
    if (profilePic && userProfileImgs.length > 0) {
        userProfileImgs.forEach(img => {
            img.src = profilePic;
        });
    }
}

async function loadWorkouts() {
    try {
        const response = await fetch(`${API_URL}/workouts`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const data = await response.json();
        workoutHistory = data.workouts || [];
    } catch (error) {
        console.error('Failed to load workouts');
    }
}

function updateTodayStats() {
    const today = new Date().toDateString();
    const todayWorkouts = workoutHistory.filter(w => 
        new Date(w.created_at).toDateString() === today
    );
    
    const todayCalories = todayWorkouts.reduce((sum, w) => sum + w.calories, 0);
    const todayDuration = todayWorkouts.reduce((sum, w) => sum + w.duration, 0);
    
    document.getElementById('todayWorkouts').textContent = todayWorkouts.length;
    document.getElementById('todayCalories').textContent = Math.round(todayCalories);
    document.getElementById('todayDuration').textContent = `${todayDuration}m`;
}

async function predictCalories(e) {
    e.preventDefault();
    
    const gender = parseFloat(document.getElementById('gender').value);
    const age = parseFloat(document.getElementById('age').value);
    const height = parseFloat(document.getElementById('height').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const duration = parseFloat(document.getElementById('duration').value);
    const heartRate = parseFloat(document.getElementById('heartRate').value);
    const bodyTemp = parseFloat(document.getElementById('bodyTemp').value);
    
    const features = [gender, age, height, weight, duration, heartRate, bodyTemp];
    
    try {
        const response = await fetch(`${API_URL}/predict`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ features })
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const data = await response.json();
        
        if (data.error) {
            alert('Error: ' + data.error);
        } else {
            currentPrediction = {
                calories: data.calories,
                gender: gender,
                age: age,
                height: height,
                weight: weight,
                duration: duration,
                heart_rate: heartRate,
                body_temp: bodyTemp
            };
            
            // Show result card
            document.getElementById('caloriesValue').textContent = Math.round(data.calories);
            document.getElementById('resultCard').style.display = 'block';
            
            // Animate the circle
            const circumference = 2 * Math.PI * 45;
            const offset = circumference - (Math.min(data.calories, 1000) / 1000) * circumference;
            document.getElementById('caloriesCircle').style.strokeDashoffset = offset;
            
            // Show success message
            showNotification('Calories calculated successfully! Click "Save to History" to save this workout.', 'success');
        }
    } catch (error) {
        showNotification('Failed to connect to server. Please try again.', 'error');
    }
}

async function saveToHistory() {
    if (!currentPrediction) return;
    
    try {
        const response = await fetch(`${API_URL}/workouts`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(currentPrediction)
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const result = await response.json();
        
        const btn = document.getElementById('saveBtn');
        btn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        btn.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
        
        await loadWorkouts();
        updateTodayStats();
        
        showNotification(`Workout saved successfully! Burned ${Math.round(currentPrediction.calories)} calories in ${currentPrediction.duration} minutes.`, 'success');
        
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-save"></i> Save to History';
            btn.style.background = '';
        }, 2000);
    } catch (error) {
        showNotification('Failed to save workout. Please try again.', 'error');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 30px;
        background: ${bgColor};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
        max-width: 400px;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}" style="font-size: 1.5rem;"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    menu.classList.toggle('hidden');
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    const menu = document.getElementById('userMenu');
    const profile = document.querySelector('.user-profile');
    if (!profile.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add('hidden');
    }
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('profilePicture');
    window.location.href = 'auth.html';
}
