const API_URL = 'http://localhost:5000';

let workoutHistory = [];
let charts = {};
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
    
    initCharts();
    await loadWorkouts();
    updateStats();
    initNotifications();
});

// Notification System
function initNotifications() {
    const notificationBtn = document.getElementById('notificationBtn');
    const messageBtn = document.getElementById('messageBtn');
    const notificationPanel = document.getElementById('notificationPanel');
    const messagePanel = document.getElementById('messagePanel');
    
    // Toggle notification panel
    notificationBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationPanel.classList.toggle('active');
        messagePanel.classList.remove('active');
    });
    
    // Toggle message panel
    messageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        messagePanel.classList.toggle('active');
        notificationPanel.classList.remove('active');
    });
    
    // Close panels when clicking outside
    document.addEventListener('click', (e) => {
        if (!notificationPanel.contains(e.target) && !notificationBtn.contains(e.target)) {
            notificationPanel.classList.remove('active');
        }
        if (!messagePanel.contains(e.target) && !messageBtn.contains(e.target)) {
            messagePanel.classList.remove('active');
        }
    });
    
    // Mark notification as read when clicked
    document.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', function() {
            this.classList.remove('unread');
            updateNotificationCount();
        });
    });
}

function markAllRead() {
    document.querySelectorAll('.notification-item').forEach(item => {
        item.classList.remove('unread');
    });
    updateNotificationCount();
}

function updateNotificationCount() {
    const unreadCount = document.querySelectorAll('.notification-item.unread').length;
    const badge = document.getElementById('notificationCount');
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
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

function updateStats() {
    const totalCalories = workoutHistory.reduce((sum, w) => sum + w.calories, 0);
    const totalWorkouts = workoutHistory.length;
    const avgCalories = totalWorkouts > 0 ? totalCalories / totalWorkouts : 0;
    const totalDuration = workoutHistory.reduce((sum, w) => sum + w.duration, 0);
    const avgHeartRate = totalWorkouts > 0 
        ? workoutHistory.reduce((sum, w) => sum + w.heart_rate, 0) / totalWorkouts 
        : 0;
    
    document.getElementById('totalCaloriesCard').textContent = Math.round(totalCalories);
    document.getElementById('totalWorkoutsCard').textContent = totalWorkouts;
    document.getElementById('avgCaloriesCard').textContent = Math.round(avgCalories);
    document.getElementById('totalDurationCard').textContent = `${Math.round(totalDuration)}m`;
    document.getElementById('avgHeartRateCard').textContent = Math.round(avgHeartRate);
    
    const fitnessScore = Math.min(1000, Math.round(totalCalories / 10 + totalWorkouts * 50));
    document.getElementById('fitnessScore').textContent = fitnessScore;
    
    if (charts.score) {
        charts.score.data.datasets[0].data = [fitnessScore, 1000 - fitnessScore];
        charts.score.update('none');
    }
    
    const badge = document.querySelector('.score-badge');
    if (badge) {
        if (fitnessScore >= 700) {
            badge.textContent = 'High';
            badge.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        } else if (fitnessScore >= 400) {
            badge.textContent = 'Medium';
            badge.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
        } else {
            badge.textContent = 'Low';
            badge.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        }
    }
    
    updateCharts();
}

function initCharts() {
    const scoreCtx = document.getElementById('scoreChart');
    if (scoreCtx) {
        charts.score = new Chart(scoreCtx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [0, 1000],
                    backgroundColor: ['#f97316', '#1a1f2e'],
                    borderWidth: 0
                }]
            },
            options: {
                cutout: '75%',
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
    }
    
    const caloriesCtx = document.getElementById('caloriesChart');
    if (caloriesCtx) {
        charts.calories = new Chart(caloriesCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Calories',
                    data: [],
                    borderColor: '#a855f7',
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#6b7280' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#6b7280' }
                    }
                }
            }
        });
    }
}

function updateCharts() {
    if (workoutHistory.length === 0 || !charts.calories) return;
    
    const last10 = workoutHistory.slice(0, 10).reverse();
    const labels = last10.map(w => new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    
    charts.calories.data.labels = labels;
    charts.calories.data.datasets[0].data = last10.map(w => w.calories);
    charts.calories.update();
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'auth.html';
}

// Upgrade Modal Functions
function openUpgradeModal() {
    document.getElementById('upgradeModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeUpgradeModal() {
    document.getElementById('upgradeModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function selectPlan(plan) {
    alert(`You selected the ${plan.toUpperCase()} plan!\n\nThis is a demo. In production, this would redirect to payment processing.`);
    closeUpgradeModal();
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('upgradeModal');
    if (e.target === modal) {
        closeUpgradeModal();
    }
});
