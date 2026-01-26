const API_URL = 'http://localhost:5000';

let workoutHistory = [];
let currentUser = null;

const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'auth.html';
}

document.addEventListener('DOMContentLoaded', async () => {
    currentUser = JSON.parse(localStorage.getItem('user'));
    document.getElementById('userName').textContent = currentUser.username;
    
    await loadWorkouts();
    renderTable();
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
    } catch (error) {
        console.error('Failed to load workouts');
    }
}

function renderTable() {
    const tbody = document.getElementById('workoutTableBody');
    
    if (workoutHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #6b7280; padding: 3rem;">No workouts yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = workoutHistory.map(workout => `
        <tr>
            <td>${new Date(workout.created_at).toLocaleDateString()}</td>
            <td>${Math.round(workout.calories)} kcal</td>
            <td>${workout.duration} min</td>
            <td>${workout.heart_rate} bpm</td>
            <td>
                <button onclick="deleteWorkout(${workout.id})" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
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
        renderTable();
    } catch (error) {
        alert('Failed to delete workout');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'auth.html';
}
