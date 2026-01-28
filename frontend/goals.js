const API_URL = 'http://localhost:5000';

let goals = [];
let workoutHistory = [];
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
    
    loadGoals();
    await loadWorkouts();
    initEventListeners();
    renderGoals();
    updateStats();
});

function loadGoals() {
    const savedGoals = localStorage.getItem('fitnessGoals');
    goals = savedGoals ? JSON.parse(savedGoals) : getDefaultGoals();
    saveGoals();
}

function saveGoals() {
    localStorage.setItem('fitnessGoals', JSON.stringify(goals));
}

function getDefaultGoals() {
    return [
        {
            id: 1,
            type: 'calories',
            target: 5000,
            period: 'weekly',
            description: 'Burn 5000 calories this week',
            created: new Date().toISOString(),
            status: 'active'
        },
        {
            id: 2,
            type: 'workouts',
            target: 10,
            period: 'monthly',
            description: 'Complete 10 workouts this month',
            created: new Date().toISOString(),
            status: 'active'
        },
        {
            id: 3,
            type: 'streak',
            target: 7,
            period: 'daily',
            description: 'Maintain a 7-day workout streak',
            created: new Date().toISOString(),
            status: 'active'
        }
    ];
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

function initEventListeners() {
    document.getElementById('toggleGoalForm').addEventListener('click', toggleGoalForm);
    document.getElementById('newGoalForm').addEventListener('submit', createGoal);
    document.getElementById('goalFilter').addEventListener('change', renderGoals);
}

function toggleGoalForm() {
    const form = document.getElementById('goalForm');
    const button = document.getElementById('toggleGoalForm');
    
    if (form.style.display === 'none') {
        form.style.display = 'block';
        button.innerHTML = '<i class="fas fa-times"></i> Cancel';
    } else {
        form.style.display = 'none';
        button.innerHTML = '<i class="fas fa-plus"></i> Add Goal';
        document.getElementById('newGoalForm').reset();
    }
}

function createGoal(e) {
    e.preventDefault();
    
    const type = document.getElementById('goalType').value;
    const target = parseInt(document.getElementById('goalTarget').value);
    const period = document.getElementById('goalPeriod').value;
    const description = document.getElementById('goalDescription').value || generateDescription(type, target, period);
    
    const newGoal = {
        id: Date.now(),
        type,
        target,
        period,
        description,
        created: new Date().toISOString(),
        status: 'active'
    };
    
    goals.push(newGoal);
    saveGoals();
    renderGoals();
    updateStats();
    toggleGoalForm();
    
    showSuccess('Goal created successfully!');
}

function generateDescription(type, target, period) {
    const typeNames = {
        calories: 'calories',
        workouts: 'workouts',
        duration: 'minutes',
        streak: 'day streak'
    };
    
    return `${type === 'streak' ? 'Maintain a' : 'Complete'} ${target} ${typeNames[type]} ${period === 'daily' ? 'daily' : `this ${period.slice(0, -2)}`}`;
}

function renderGoals() {
    const filter = document.getElementById('goalFilter').value;
    const container = document.getElementById('goalsContainer');
    
    let filteredGoals = goals;
    if (filter !== 'all') {
        filteredGoals = goals.filter(goal => {
            if (filter === 'active') return goal.status === 'active';
            if (filter === 'completed') return goal.status === 'completed';
            if (filter === 'overdue') return isGoalOverdue(goal);
            return true;
        });
    }
    
    if (filteredGoals.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: #6b7280; padding: 3rem;">
                <i class="fas fa-bullseye" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                <p>No goals found</p>
                <small>Create your first fitness goal to get started</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredGoals.map(goal => {
        const progress = calculateProgress(goal);
        const progressPercentage = Math.min(100, (progress / goal.target) * 100);
        const status = getGoalStatus(goal, progress);
        const statusColor = getStatusColor(status);
        
        return `
            <div style="background: #0f1419; padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <h3 style="font-size: 1.125rem; margin-bottom: 0.5rem;">${goal.description}</h3>
                        <p style="color: #6b7280; font-size: 0.875rem;">${capitalizeFirst(goal.period)} target</p>
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <span style="padding: 0.375rem 0.875rem; background: ${statusColor}; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">
                            ${status}
                        </span>
                        <button onclick="deleteGoal(${goal.id})" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: none; padding: 0.375rem; border-radius: 6px; cursor: pointer;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div style="margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="color: #9ca3af; font-size: 0.875rem;">Progress</span>
                        <span style="color: #fff; font-weight: 600;">${progress} / ${goal.target} ${getUnit(goal.type)}</span>
                    </div>
                    <div style="height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden;">
                        <div style="width: ${progressPercentage}%; height: 100%; background: linear-gradient(90deg, #a855f7, #7c3aed); transition: width 0.3s;"></div>
                    </div>
                </div>
                <div style="display: flex; justify-content: between; align-items: center; font-size: 0.875rem; color: #6b7280;">
                    <span>Created: ${new Date(goal.created).toLocaleDateString()}</span>
                    <span style="margin-left: auto;">${Math.round(progressPercentage)}% complete</span>
                </div>
            </div>
        `;
    }).join('');
}

function calculateProgress(goal) {
    const now = new Date();
    let startDate;
    
    switch (goal.period) {
        case 'daily':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'weekly':
            const dayOfWeek = now.getDay();
            startDate = new Date(now.getTime() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) * 24 * 60 * 60 * 1000);
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'monthly':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'yearly':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            startDate = new Date(goal.created);
    }
    
    const relevantWorkouts = workoutHistory.filter(w => new Date(w.created_at) >= startDate);
    
    switch (goal.type) {
        case 'calories':
            return Math.round(relevantWorkouts.reduce((sum, w) => sum + w.calories, 0));
        case 'workouts':
            return relevantWorkouts.length;
        case 'duration':
            return relevantWorkouts.reduce((sum, w) => sum + w.duration, 0);
        case 'streak':
            return calculateWorkoutStreak();
        default:
            return 0;
    }
}

function calculateWorkoutStreak() {
    if (workoutHistory.length === 0) return 0;
    
    const sortedWorkouts = workoutHistory
        .map(w => new Date(w.created_at).toDateString())
        .filter((date, index, arr) => arr.indexOf(date) === index)
        .sort((a, b) => new Date(b) - new Date(a));
    
    let streak = 0;
    let currentDate = new Date();
    
    for (let i = 0; i < sortedWorkouts.length; i++) {
        const workoutDate = currentDate.toDateString();
        if (sortedWorkouts.includes(workoutDate)) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }
    
    return streak;
}

function getGoalStatus(goal, progress) {
    if (progress >= goal.target) return 'Completed';
    if (isGoalOverdue(goal)) return 'Overdue';
    return 'In Progress';
}

function isGoalOverdue(goal) {
    const now = new Date();
    const created = new Date(goal.created);
    
    switch (goal.period) {
        case 'daily':
            return now.toDateString() !== created.toDateString() && now > created;
        case 'weekly':
            const weeksPassed = Math.floor((now - created) / (7 * 24 * 60 * 60 * 1000));
            return weeksPassed >= 1;
        case 'monthly':
            return now.getMonth() !== created.getMonth() || now.getFullYear() !== created.getFullYear();
        case 'yearly':
            return now.getFullYear() !== created.getFullYear();
        default:
            return false;
    }
}

function getStatusColor(status) {
    switch (status) {
        case 'Completed': return 'rgba(16, 185, 129, 0.15)';
        case 'In Progress': return 'rgba(168, 85, 247, 0.15)';
        case 'Overdue': return 'rgba(239, 68, 68, 0.15)';
        default: return 'rgba(107, 114, 128, 0.15)';
    }
}

function getUnit(type) {
    switch (type) {
        case 'calories': return 'kcal';
        case 'workouts': return 'workouts';
        case 'duration': return 'min';
        case 'streak': return 'days';
        default: return '';
    }
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function deleteGoal(goalId) {
    if (!confirm('Delete this goal?')) return;
    
    goals = goals.filter(goal => goal.id !== goalId);
    saveGoals();
    renderGoals();
    updateStats();
    
    showSuccess('Goal deleted successfully!');
}

function updateStats() {
    const totalGoals = goals.length;
    const completedGoals = goals.filter(goal => {
        const progress = calculateProgress(goal);
        return progress >= goal.target;
    }).length;
    const activeGoals = goals.filter(goal => goal.status === 'active').length;
    const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
    
    document.getElementById('totalGoals').textContent = totalGoals;
    document.getElementById('completedGoals').textContent = completedGoals;
    document.getElementById('activeGoals').textContent = activeGoals;
    document.getElementById('completionRate').textContent = `${completionRate}%`;
}

function showSuccess(message) {
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