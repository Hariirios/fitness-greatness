// Check authentication
if (!localStorage.getItem('token')) {
    window.location.href = 'auth.html';
}

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    setupUserInfo();
    setupUpgradeButton();
});

function initializeCharts() {
    // Weekly Activity Chart
    const weeklyCtx = document.getElementById('weeklyChart');
    if (weeklyCtx) {
        new Chart(weeklyCtx, {
            type: 'bar',
            data: {
                labels: ['Sun', 'Mon', 'Tue', 'Today', 'Thu', 'Fri', 'Sat'],
                datasets: [{
                    label: 'Activity',
                    data: [30, 45, 35, 60, 50, 40, 35],
                    backgroundColor: 'rgba(255, 107, 53, 0.8)',
                    borderRadius: 8,
                    barThickness: 30
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
                        display: false,
                        beginAtZero: true
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#fff', font: { size: 11 } }
                    }
                }
            }
        });
    }

    // Heart Rate Chart
    const heartRateCtx = document.getElementById('heartRateChart');
    if (heartRateCtx) {
        const heartData = [60, 65, 62, 70, 75, 80, 85, 90, 95, 100, 95, 90, 85, 80, 75, 70, 65, 60, 65, 70, 75, 80, 75, 70];
        new Chart(heartRateCtx, {
            type: 'bar',
            data: {
                labels: Array.from({length: 24}, (_, i) => `${i}:00`),
                datasets: [{
                    label: 'Heart Rate',
                    data: heartData,
                    backgroundColor: heartData.map(v => v > 80 ? '#ff6b35' : '#3a3a3a'),
                    borderRadius: 4,
                    barThickness: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { display: false, beginAtZero: true },
                    x: { display: false }
                }
            }
        });
    }

    // Sleep Chart
    const sleepCtx = document.getElementById('sleepChart');
    if (sleepCtx) {
        new Chart(sleepCtx, {
            type: 'line',
            data: {
                labels: ['22:00', '23:00', '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00'],
                datasets: [{
                    label: 'Sleep Stages',
                    data: [10, 25, 45, 60, 55, 40, 30, 20, 10],
                    borderColor: '#ff6b35',
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#ff6b35'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { display: false, beginAtZero: true },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#666', font: { size: 10 } }
                    }
                }
            }
        });
    }
}

function setupUserInfo() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.username) {
        const greeting = document.querySelector('.greeting');
        if (greeting) {
            greeting.textContent = `Hello, ${user.username}`;
        }
    }
}

function setupUpgradeButton() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        const upgradeBtn = document.createElement('button');
        upgradeBtn.className = 'nav-icon-item';
        upgradeBtn.innerHTML = '<i class="fas fa-crown"></i>';
        upgradeBtn.style.marginTop = 'auto';
        upgradeBtn.style.marginBottom = '20px';
        upgradeBtn.onclick = openUpgradeModal;
        sidebar.appendChild(upgradeBtn);
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'auth.html';
}


// Upgrade Modal Functions
function openUpgradeModal() {
    document.getElementById('upgradeModal').classList.add('show');
}

function closeUpgradeModal() {
    document.getElementById('upgradeModal').classList.remove('show');
}

// User Menu Toggle
function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

// Close user menu when clicking outside
document.addEventListener('click', function(event) {
    const userProfile = document.querySelector('.user-profile');
    const userMenu = document.getElementById('userMenu');
    
    if (userProfile && userMenu && !userProfile.contains(event.target) && !userMenu.contains(event.target)) {
        userMenu.classList.add('hidden');
    }
});

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'auth.html';
    }
    return false;
}