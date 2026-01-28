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
    document.getElementById('userName').textContent = currentUser.username;
    
    // Load profile picture
    const profilePic = localStorage.getItem('profilePicture');
    if (profilePic) {
        document.querySelector('.user-avatar').innerHTML = `<img src="${profilePic}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    }
    
    await loadWorkouts();
    updateStats();
    renderTable();
    initEventListeners();
});

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
    } catch (error) {
        console.error('Failed to load workouts');
    }
}

function initEventListeners() {
    // Time filter
    document.getElementById('timeFilter').addEventListener('change', filterWorkouts);
    
    // Search
    document.getElementById('searchInput').addEventListener('input', searchWorkouts);
    
    // Export
    document.getElementById('exportBtn').addEventListener('click', exportData);
    
    // Clear all
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
        filterWorkouts();
        return;
    }
    
    filteredHistory = workoutHistory.filter(workout => {
        const date = new Date(workout.created_at).toLocaleDateString().toLowerCase();
        const calories = workout.calories.toString();
        const duration = workout.duration.toString();
        const heartRate = workout.heart_rate.toString();
        
        return date.includes(searchTerm) || 
               calories.includes(searchTerm) || 
               duration.includes(searchTerm) || 
               heartRate.includes(searchTerm);
    });
    
    updateStats();
    renderTable();
}

function updateStats() {
    const totalCalories = filteredHistory.reduce((sum, w) => sum + w.calories, 0);
    const totalWorkouts = filteredHistory.length;
    const totalDuration = filteredHistory.reduce((sum, w) => sum + w.duration, 0);
    const avgHeartRate = totalWorkouts > 0 
        ? filteredHistory.reduce((sum, w) => sum + w.heart_rate, 0) / totalWorkouts 
        : 0;
    
    document.getElementById('totalCaloriesHistory').textContent = Math.round(totalCalories);
    document.getElementById('totalWorkoutsHistory').textContent = totalWorkouts;
    document.getElementById('totalDurationHistory').textContent = `${Math.round(totalDuration)}m`;
    document.getElementById('avgHeartRateHistory').textContent = Math.round(avgHeartRate);
}

function renderTable() {
    const tbody = document.getElementById('historyTableBody');
    
    if (filteredHistory.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; color: #6b7280; padding: 3rem;">
                    <i class="fas fa-dumbbell" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>No workout history found</p>
                    <small>Try adjusting your filters or <a href="workouts.html" style="color: #a855f7;">add some workouts</a></small>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredHistory.map(workout => {
        const intensity = getIntensity(workout.heart_rate);
        const intensityColor = getIntensityColor(intensity);
        
        return `
            <tr>
                <td>${new Date(workout.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</td>
                <td><span style="color: #ec4899; font-weight: 600;">${Math.round(workout.calories)}</span> kcal</td>
                <td>${workout.duration} min</td>
                <td>${workout.heart_rate} bpm</td>
                <td>${workout.body_temp}°C</td>
                <td>
                    <span style="padding: 0.25rem 0.75rem; background: ${intensityColor}; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                        ${intensity}
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button onclick="viewWorkout(${workout.id})" style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: none; padding: 0.375rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem;">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button onclick="deleteWorkout(${workout.id})" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: none; padding: 0.375rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem;">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
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
        case 'Low': return 'rgba(16, 185, 129, 0.15)';
        case 'Moderate': return 'rgba(245, 158, 11, 0.15)';
        case 'High': return 'rgba(239, 68, 68, 0.15)';
        case 'Very High': return 'rgba(168, 85, 247, 0.15)';
        default: return 'rgba(107, 114, 128, 0.15)';
    }
}

function viewWorkout(workoutId) {
    const workout = workoutHistory.find(w => w.id === workoutId);
    if (!workout) return;
    
    alert(`Workout Details:
    
Date: ${new Date(workout.created_at).toLocaleString()}
Calories: ${Math.round(workout.calories)} kcal
Duration: ${workout.duration} minutes
Heart Rate: ${workout.heart_rate} bpm
Body Temperature: ${workout.body_temp}°C
Age: ${workout.age} years
Height: ${workout.height} cm
Weight: ${workout.weight} kg
Gender: ${workout.gender === 1 ? 'Male' : 'Female'}
Intensity: ${getIntensity(workout.heart_rate)}`);
}

async function deleteWorkout(workoutId) {
    if (!confirm('Delete this workout? This action cannot be undone.')) return;
    
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
        
        showSuccess('Workout deleted successfully!');
    } catch (error) {
        alert('Failed to delete workout');
    }
}

async function clearAllWorkouts() {
    if (!confirm('Delete ALL workouts? This action cannot be undone!')) return;
    
    try {
        for (const workout of workoutHistory) {
            await fetch(`${API_URL}/workouts/${workout.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        }
        
        await loadWorkouts();
        filterWorkouts();
        
        showSuccess('All workouts cleared!');
    } catch (error) {
        alert('Failed to clear workouts');
    }
}

function exportData() {
    if (filteredHistory.length === 0) {
        alert('No data to export');
        return;
    }
    
    const csvContent = [
        ['Date', 'Calories', 'Duration (min)', 'Heart Rate (bpm)', 'Body Temp (°C)', 'Age', 'Height (cm)', 'Weight (kg)', 'Gender', 'Intensity'],
        ...filteredHistory.map(w => [
            new Date(w.created_at).toLocaleString(),
            Math.round(w.calories),
            w.duration,
            w.heart_rate,
            w.body_temp,
            w.age,
            w.height,
            w.weight,
            w.gender === 1 ? 'Male' : 'Female',
            getIntensity(w.heart_rate)
        ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showSuccess('Data exported successfully!');
}

function showSuccess(message) {
    // Create a temporary success message
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: #10b981;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('profilePicture');
    window.location.href = 'auth.html';
}