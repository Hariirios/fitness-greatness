const API_URL = 'http://localhost:5000';

let charts = {};
let currentUser = null;

const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'auth.html';
}

document.addEventListener('DOMContentLoaded', () => {
    currentUser = JSON.parse(localStorage.getItem('user'));
    document.getElementById('userName').textContent = currentUser.username;
    
    initCharts();
});

function initCharts() {
    // Analytics Bar Chart
    const analyticsCtx = document.getElementById('analyticsChart');
    if (analyticsCtx) {
        charts.analytics = new Chart(analyticsCtx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Calories',
                    data: [320, 450, 380, 520, 410, 600, 490],
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
    
    // Breakdown Pie Chart
    const breakdownCtx = document.getElementById('breakdownChart');
    if (breakdownCtx) {
        charts.breakdown = new Chart(breakdownCtx, {
            type: 'doughnut',
            data: {
                labels: ['Cardio', 'Strength', 'Flexibility', 'Sports'],
                datasets: [{
                    data: [40, 30, 15, 15],
                    backgroundColor: ['#a855f7', '#3b82f6', '#10b981', '#f59e0b'],
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
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'auth.html';
}
