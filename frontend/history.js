const API_URL = 'http://localhost:5000';

let workoutHistory = [];
let filteredHistory = [];
let currentUser = null;

const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'auth.html';
}

document.addEventListener('DOMContentLoaded', async () => {
    currentUser = JSON.parse(localStorage.getItem('user'));
    
    // Load profile picture
    loadProfilePicture();
    
    await loadWorkouts();
    updateStats();
    renderTable();
    initEventListeners();
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
        filteredHistory = [...workoutHistory];
        console.log('Loaded workouts:', workoutHistory.length);
    } catch (error) {
        console.error('Failed to load workouts:', error);
    }
}

function initEventListeners() {
    document.getElementById('timeFilter').addEventListener('change', filterWorkouts);
    document.getElementById('searchInput').addEventListener('input', searchWorkouts);
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('clearAllBtn').addEventListener('click', clearAllWorkouts);
}

function filterWorkouts() {
    const filter = document.getElementById('timeFilter').value;
    const now = new Date();
    
    switch (filter) {
        case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredHistory = workoutHistory.filter(w => new Date(w.created_at) >= weekAgo);
            break;
        case 'month':
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            filteredHistory = workoutHistory.filter(w => new Date(w.created_at) >= monthAgo);
            break;
        case 'year':
            const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            filteredHistory = workoutHistory.filter(w => new Date(w.created_at) >= yearAgo);
            break;
        default:
            filteredHistory = [...workoutHistory];
    }
    
    updateStats();
    renderTable();
}

function searchWorkouts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchTerm) {
        filteredHistory = [...workoutHistory];
    } else {
        filteredHistory = workoutHistory.filter(workout => {
            const date = new Date(workout.created_at).toLocaleDateString().toLowerCase();
            const calories = workout.calories.toString();
            const duration = workout.duration.toString();
            
            return date.includes(searchTerm) || 
                   calories.includes(searchTerm) || 
                   duration.includes(searchTerm);
        });
    }
    
    renderTable();
}

function renderTable() {
    const tbody = document.getElementById('historyTableBody');
    
    if (filteredHistory.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 3rem; color: #6b7280;">
                    <i class="fas fa-dumbbell" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3; display: block;"></i>
                    <p>No workout history found</p>
                    <small>Start by <a href="workouts.html" style="color: #ff6b35; text-decoration: none;">calculating calories</a> and saving workouts</small>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredHistory.map(workout => {
        const date = new Date(workout.created_at);
        const intensity = getIntensity(workout.heart_rate);
        const intensityColor = getIntensityColor(intensity);
        
        return `
            <tr style="border-bottom: 1px solid #2a2a2a; transition: all 0.3s;" onmouseover="this.style.background='#2a2a2a'" onmouseout="this.style.background='transparent'">
                <td style="padding: 1rem;">
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-weight: 600;">${date.toLocaleDateString()}</span>
                        <span style="color: #6b7280; font-size: 0.875rem;">${date.toLocaleTimeString()}</span>
                    </div>
                </td>
                <td style="padding: 1rem;">
                    <span style="color: #ec4899; font-weight: 600; font-size: 1.125rem;">
                        <i class="fas fa-fire"></i> ${Math.round(workout.calories)}
                    </span>
                </td>
                <td style="padding: 1rem;">
                    <span style="color: #3b82f6; font-weight: 600;">
                        <i class="fas fa-clock"></i> ${workout.duration} min
                    </span>
                </td>
                <td style="padding: 1rem;">
                    <span style="color: #ef4444; font-weight: 600;">
                        <i class="fas fa-heartbeat"></i> ${workout.heart_rate} bpm
                    </span>
                </td>
                <td style="padding: 1rem;">
                    <span style="color: #f59e0b; font-weight: 600;">
                        <i class="fas fa-thermometer-half"></i> ${workout.body_temp}°C
                    </span>
                </td>
                <td style="padding: 1rem;">
                    <span style="padding: 0.375rem 0.875rem; background: ${intensityColor}; border-radius: 20px; font-size: 0.875rem; font-weight: 600;">
                        ${intensity}
                    </span>
                </td>
                <td style="padding: 1rem; text-align: center;">
                    <button onclick="deleteWorkout(${workout.id})" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.background='#ef4444'; this.style.color='white'" onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'; this.style.color='#ef4444'">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function getIntensity(heartRate) {
    if (heartRate < 100) return 'Low';
    if (heartRate < 140) return 'Moderate';
    if (heartRate < 170) return 'High';
    return 'Very High';
}

function getIntensityColor(intensity) {
    switch (intensity) {
        case 'Low': return 'rgba(16, 185, 129, 0.2)';
        case 'Moderate': return 'rgba(59, 130, 246, 0.2)';
        case 'High': return 'rgba(245, 158, 11, 0.2)';
        case 'Very High': return 'rgba(239, 68, 68, 0.2)';
        default: return 'rgba(107, 114, 128, 0.2)';
    }
}

function updateStats() {
    const totalCalories = filteredHistory.reduce((sum, w) => sum + w.calories, 0);
    const totalWorkouts = filteredHistory.length;
    const totalDuration = filteredHistory.reduce((sum, w) => sum + w.duration, 0);
    const avgHeartRate = totalWorkouts > 0 
        ? Math.round(filteredHistory.reduce((sum, w) => sum + w.heart_rate, 0) / totalWorkouts)
        : 0;
    
    document.getElementById('totalCaloriesHistory').textContent = Math.round(totalCalories);
    document.getElementById('totalWorkoutsHistory').textContent = totalWorkouts;
    document.getElementById('totalDurationHistory').textContent = totalDuration;
    document.getElementById('avgHeartRateHistory').textContent = avgHeartRate;
}

async function deleteWorkout(workoutId) {
    if (!confirm('Delete this workout?')) return;
    
    try {
        const response = await fetch(`${API_URL}/workouts/${workoutId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        await loadWorkouts();
        filterWorkouts();
        
        showNotification('Workout deleted successfully!', 'success');
    } catch (error) {
        showNotification('Failed to delete workout', 'error');
    }
}

async function clearAllWorkouts() {
    if (!confirm('Delete ALL workouts? This cannot be undone!')) return;
    
    try {
        const deletePromises = workoutHistory.map(workout => 
            fetch(`${API_URL}/workouts/${workout.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
        );
        
        await Promise.all(deletePromises);
        await loadWorkouts();
        filterWorkouts();
        
        showNotification('All workouts cleared!', 'success');
    } catch (error) {
        showNotification('Failed to clear workouts', 'error');
    }
}

function exportData() {
    if (filteredHistory.length === 0) {
        alert('No data to export');
        return;
    }
    
    const csv = [
        ['Date', 'Time', 'Calories', 'Duration (min)', 'Heart Rate (bpm)', 'Body Temp (°C)', 'Gender', 'Age', 'Height (cm)', 'Weight (kg)'],
        ...filteredHistory.map(w => {
            const date = new Date(w.created_at);
            return [
                date.toLocaleDateString(),
                date.toLocaleTimeString(),
                Math.round(w.calories),
                w.duration,
                w.heart_rate,
                w.body_temp,
                w.gender === 0 ? 'Female' : 'Male',
                w.age,
                w.height,
                w.weight
            ];
        })
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully!', 'success');
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
    }, 3000);
}

function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    menu.classList.toggle('hidden');
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    const menu = document.getElementById('userMenu');
    const profile = document.querySelector('.user-profile');
    if (profile && !profile.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add('hidden');
    }
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('profilePicture');
    window.location.href = 'auth.html';
}
