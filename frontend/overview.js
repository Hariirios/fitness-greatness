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
    
    // Update user info
    if (document.getElementById('userName')) {
        document.getElementById('userName').textContent = currentUser.username;
    }
    
    // Load profile picture
    const profilePic = localStorage.getItem('profilePicture');
    if (profilePic && document.getElementById('userAvatarImg')) {
        document.getElementById('userAvatarImg').src = profilePic;
    }
    
    await loadWorkouts();
    updateStats();
    
    // Wait for DOM to be ready then init charts
    setTimeout(() => {
        initCharts();
    }, 100);
    
    // Add event listeners
    initEventListeners();
});

function initEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            updateMainChart(this.textContent.toLowerCase());
        });
    });
    
    // Notification button
    const notificationBtn = document.querySelector('.notification-btn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', () => {
            alert('Notifications: You have 3 new workout achievements!');
        });
    }
    
    // User profile dropdown
    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
        userProfile.addEventListener('click', () => {
            const dropdown = document.createElement('div');
            dropdown.style.cssText = `
                position: absolute;
                top: 100%;
                right: 0;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                padding: 10px;
                margin-top: 10px;
                z-index: 1000;
            `;
            dropdown.innerHTML = `
                <div style="padding: 10px; cursor: pointer; border-radius: 8px; transition: all 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'" onclick="window.location.href='settings.html'">Settings</div>
                <div style="padding: 10px; cursor: pointer; border-radius: 8px; transition: all 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'" onclick="logout()">Logout</div>
            `;
            
            // Remove existing dropdown
            const existing = document.querySelector('.user-dropdown');
            if (existing) existing.remove();
            
            dropdown.className = 'user-dropdown';
            userProfile.style.position = 'relative';
            userProfile.appendChild(dropdown);
            
            // Close dropdown when clicking outside
            setTimeout(() => {
                document.addEventListener('click', function closeDropdown(e) {
                    if (!userProfile.contains(e.target)) {
                        dropdown.remove();
                        document.removeEventListener('click', closeDropdown);
                    }
                });
            }, 100);
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
        // Use demo data if API fails
        workoutHistory = generateDemoData();
    }
}

function generateDemoData() {
    const demoData = [];
    for (let i = 0; i < 20; i++) {
        demoData.push({
            calories: 200 + Math.random() * 400,
            duration: 20 + Math.random() * 60,
            heart_rate: 100 + Math.random() * 80,
            created_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    return demoData;
}

function updateStats() {
    const totalCalories = workoutHistory.reduce((sum, w) => sum + w.calories, 0);
    const totalWorkouts = workoutHistory.length;
    const avgCalories = totalWorkouts > 0 ? totalCalories / totalWorkouts : 0;
    
    // Update main stats with animation
    animateValue('totalWorkouts', 0, totalWorkouts, 1000);
    animateValue('avgCalories', 0, Math.round(avgCalories), 1000);
}

function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    if (!element) return;
    
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

function initCharts() {
    // Main Chart (Bar Chart)
    const mainCtx = document.getElementById('mainChart');
    if (mainCtx) {
        const ctx = mainCtx.getContext('2d');
        charts.main = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    data: generateMonthlyData(),
                    backgroundColor: 'rgba(139, 92, 246, 0.8)',
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        display: false,
                        grid: { display: false }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { 
                            color: 'rgba(255, 255, 255, 0.6)',
                            font: { size: 12 }
                        }
                    }
                },
                elements: {
                    bar: {
                        borderRadius: 8
                    }
                }
            }
        });
    }
    
    // Platforms Chart (Doughnut)
    const platformsCtx = document.getElementById('platformsChart');
    if (platformsCtx) {
        const ctx = platformsCtx.getContext('2d');
        charts.platforms = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Cardio', 'Strength', 'Flexibility'],
                datasets: [{
                    data: [68, 43, 12],
                    backgroundColor: ['#4285f4', '#2d8cff', '#6264a7'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff'
                    }
                },
                cutout: '70%'
            }
        });
    }
    
    // Sentiments Chart (Doughnut)
    const sentimentsCtx = document.getElementById('sentimentsChart');
    if (sentimentsCtx) {
        const ctx = sentimentsCtx.getContext('2d');
        charts.sentiments = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Positive', 'Negative', 'Neutral'],
                datasets: [{
                    data: [74, 5, 21],
                    backgroundColor: ['#22c55e', '#ef4444', '#6b7280'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff'
                    }
                },
                cutout: '70%'
            }
        });
    }
    
    console.log('Charts initialized:', Object.keys(charts));
}

function updateMainChart(type) {
    if (!charts.main) return;
    
    let newData;
    switch(type) {
        case 'workouts':
            newData = generateMonthlyData();
            break;
        case 'duration':
            newData = generateMonthlyData().map(val => val * 1.5);
            break;
        case 'calories':
            newData = generateMonthlyData().map(val => val * 10);
            break;
        default:
            newData = generateMonthlyData();
    }
    
    charts.main.data.datasets[0].data = newData;
    charts.main.update('active');
}

function generateMonthlyData() {
    // Generate realistic workout data for each month based on actual data
    if (workoutHistory.length > 0) {
        const monthlyData = new Array(12).fill(0);
        workoutHistory.forEach(workout => {
            const month = new Date(workout.created_at).getMonth();
            monthlyData[month] += 1;
        });
        return monthlyData;
    }
    
    // Fallback demo data
    const baseData = [25, 32, 28, 45, 38, 42, 35, 48, 41, 36, 29, 33];
    return baseData.map(val => val + Math.floor(Math.random() * 10));
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('profilePicture');
    window.location.href = 'auth.html';
}
func
tion updateMainChart(type) {
    if (!charts.main) return;
    
    let newData;
    let label = 'Workouts';
    
    switch(type) {
        case 'workouts':
            newData = generateMonthlyData();
            label = 'Workouts';
            break;
        case 'duration':
            newData = generateMonthlyData().map(val => val * 1.5);
            label = 'Duration (hours)';
            break;
        case 'calories':
            newData = generateMonthlyData().map(val => val * 10);
            label = 'Calories';
            break;
        default:
            newData = generateMonthlyData();
            label = 'General Stats';
    }
    
    charts.main.data.datasets[0].data = newData;
    charts.main.data.datasets[0].label = label;
    charts.main.update('active');
}

// Make sidebar icons interactive
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.icon-item').forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
});

// Add search functionality
function initSearch() {
    const searchInput = document.querySelector('.search-container input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            console.log('Searching for:', searchTerm);
            // Add search logic here
        });
    }
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', initSearch);