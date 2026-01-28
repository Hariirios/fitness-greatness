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
    
    await loadWorkouts();
    initCharts();
    updatePersonalRecords();
    generateInsights();
    
    // Time range filter
    document.getElementById('timeRange').addEventListener('change', updateCharts);
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

function initCharts() {
    // Performance Chart (Line)
    const performanceCtx = document.getElementById('performanceChart');
    if (performanceCtx) {
        charts.performance = new Chart(performanceCtx, {
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
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
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
    
    // Distribution Chart (Doughnut)
    const distributionCtx = document.getElementById('distributionChart');
    if (distributionCtx) {
        charts.distribution = new Chart(distributionCtx, {
            type: 'doughnut',
            data: {
                labels: ['Low Intensity', 'Moderate', 'High', 'Very High'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#a855f7'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#9ca3af', padding: 15 }
                    }
                }
            }
        });
    }
    
    // Heart Rate Chart (Bar)
    const heartRateCtx = document.getElementById('heartRateChart');
    if (heartRateCtx) {
        charts.heartRate = new Chart(heartRateCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Heart Rate',
                    data: [],
                    backgroundColor: '#ef4444',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
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
    
    // Scatter Chart (Calories vs Duration)
    const scatterCtx = document.getElementById('scatterChart');
    if (scatterCtx) {
        charts.scatter = new Chart(scatterCtx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Workouts',
                    data: [],
                    backgroundColor: '#3b82f6',
                    borderColor: '#3b82f6',
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        title: { display: true, text: 'Calories', color: '#9ca3af' },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#6b7280' }
                    },
                    x: {
                        title: { display: true, text: 'Duration (min)', color: '#9ca3af' },
                        grid: { display: false },
                        ticks: { color: '#6b7280' }
                    }
                }
            }
        });
    }
    
    // Weekly Chart (Bar)
    const weeklyCtx = document.getElementById('weeklyChart');
    if (weeklyCtx) {
        charts.weekly = new Chart(weeklyCtx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Calories',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: [
                        '#a855f7', '#3b82f6', '#10b981', '#f59e0b', 
                        '#ef4444', '#ec4899', '#06b6d4'
                    ],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
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
    
    updateCharts();
}

function updateCharts() {
    if (workoutHistory.length === 0) return;
    
    const days = parseInt(document.getElementById('timeRange').value);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const filteredData = workoutHistory.filter(w => new Date(w.created_at) >= cutoffDate);
    
    // Performance Chart
    if (charts.performance) {
        const labels = filteredData.slice(-10).map(w => 
            new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        );
        charts.performance.data.labels = labels;
        charts.performance.data.datasets[0].data = filteredData.slice(-10).map(w => w.calories);
        charts.performance.update();
    }
    
    // Distribution Chart
    if (charts.distribution) {
        const intensities = [0, 0, 0, 0]; // Low, Moderate, High, Very High
        filteredData.forEach(w => {
            const hr = w.heart_rate;
            if (hr < 100) intensities[0]++;
            else if (hr < 140) intensities[1]++;
            else if (hr < 170) intensities[2]++;
            else intensities[3]++;
        });
        charts.distribution.data.datasets[0].data = intensities;
        charts.distribution.update();
    }
    
    // Heart Rate Chart
    if (charts.heartRate) {
        const last7 = filteredData.slice(-7);
        charts.heartRate.data.labels = last7.map(w => 
            new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        );
        charts.heartRate.data.datasets[0].data = last7.map(w => w.heart_rate);
        charts.heartRate.update();
    }
    
    // Scatter Chart
    if (charts.scatter) {
        charts.scatter.data.datasets[0].data = filteredData.map(w => ({
            x: w.duration,
            y: w.calories
        }));
        charts.scatter.update();
    }
    
    // Weekly Chart
    if (charts.weekly) {
        const weeklyData = [0, 0, 0, 0, 0, 0, 0];
        filteredData.forEach(w => {
            const day = new Date(w.created_at).getDay();
            const adjustedDay = day === 0 ? 6 : day - 1; // Convert Sunday=0 to Sunday=6
            weeklyData[adjustedDay] += w.calories;
        });
        charts.weekly.data.datasets[0].data = weeklyData;
        charts.weekly.update();
    }
}

function updatePersonalRecords() {
    if (workoutHistory.length === 0) return;
    
    const maxCalories = Math.max(...workoutHistory.map(w => w.calories));
    const maxDuration = Math.max(...workoutHistory.map(w => w.duration));
    const maxHeartRate = Math.max(...workoutHistory.map(w => w.heart_rate));
    
    document.getElementById('maxCalories').textContent = `${Math.round(maxCalories)} kcal`;
    document.getElementById('maxDuration').textContent = `${maxDuration} min`;
    document.getElementById('maxHeartRate').textContent = `${maxHeartRate} bpm`;
    
    // Calculate streak
    const streak = calculateWorkoutStreak();
    document.getElementById('workoutStreak').textContent = `${streak} days`;
}

function calculateWorkoutStreak() {
    if (workoutHistory.length === 0) return 0;
    
    const sortedWorkouts = workoutHistory
        .map(w => new Date(w.created_at).toDateString())
        .filter((date, index, arr) => arr.indexOf(date) === index)
        .sort((a, b) => new Date(b) - new Date(a));
    
    let streak = 0;
    const today = new Date().toDateString();
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

function generateInsights() {
    if (workoutHistory.length === 0) {
        document.getElementById('insightsContainer').innerHTML = `
            <div style="text-align: center; color: #6b7280; padding: 2rem;">
                <i class="fas fa-chart-line" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                <p>No data available for insights</p>
                <small>Complete some workouts to see personalized insights</small>
            </div>
        `;
        return;
    }
    
    const insights = [];
    const avgCalories = workoutHistory.reduce((sum, w) => sum + w.calories, 0) / workoutHistory.length;
    const avgDuration = workoutHistory.reduce((sum, w) => sum + w.duration, 0) / workoutHistory.length;
    const avgHeartRate = workoutHistory.reduce((sum, w) => sum + w.heart_rate, 0) / workoutHistory.length;
    
    // Calorie insight
    if (avgCalories > 400) {
        insights.push({
            icon: 'fas fa-fire',
            color: '#ec4899',
            title: 'High Calorie Burner',
            message: `You burn an average of ${Math.round(avgCalories)} calories per workout - that's excellent!`
        });
    } else {
        insights.push({
            icon: 'fas fa-arrow-up',
            color: '#f59e0b',
            title: 'Room for Improvement',
            message: `Try increasing workout intensity to burn more than your current ${Math.round(avgCalories)} calorie average.`
        });
    }
    
    // Duration insight
    if (avgDuration >= 45) {
        insights.push({
            icon: 'fas fa-clock',
            color: '#10b981',
            title: 'Great Endurance',
            message: `Your average workout duration of ${Math.round(avgDuration)} minutes shows excellent commitment.`
        });
    }
    
    // Heart rate insight
    if (avgHeartRate > 140) {
        insights.push({
            icon: 'fas fa-heartbeat',
            color: '#ef4444',
            title: 'High Intensity Training',
            message: `Your average heart rate of ${Math.round(avgHeartRate)} bpm indicates intense workouts.`
        });
    }
    
    // Consistency insight
    const streak = calculateWorkoutStreak();
    if (streak >= 7) {
        insights.push({
            icon: 'fas fa-trophy',
            color: '#a855f7',
            title: 'Consistency Champion',
            message: `Amazing ${streak}-day workout streak! Keep up the momentum.`
        });
    }
    
    document.getElementById('insightsContainer').innerHTML = insights.map(insight => `
        <div style="display: flex; align-items: center; gap: 1rem; padding: 1.5rem; background: #0f1419; border-radius: 12px;">
            <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(${hexToRgb(insight.color)}, 0.15); display: flex; align-items: center; justify-content: center;">
                <i class="${insight.icon}" style="color: ${insight.color}; font-size: 1.25rem;"></i>
            </div>
            <div>
                <h4 style="margin-bottom: 0.5rem; color: #fff;">${insight.title}</h4>
                <p style="color: #9ca3af; font-size: 0.875rem; line-height: 1.5;">${insight.message}</p>
            </div>
        </div>
    `).join('');
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
        '168, 85, 247';
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('profilePicture');
    window.location.href = 'auth.html';
}