const API_URL = 'http://localhost:5000';

let workoutHistory = [];
let charts = {};
let currentUser = null;

const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'auth.html';
}

// Utility Functions
function showLoading() {
    const loader = document.createElement('div');
    loader.id = 'loadingSpinner';
    loader.className = 'loading-spinner';
    loader.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loader);
}

function hideLoading() {
    const loader = document.getElementById('loadingSpinner');
    if (loader) loader.remove();
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => errorDiv.remove(), 4000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'error-message success-message';
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(successDiv);
    
    setTimeout(() => successDiv.remove(), 3000);
}

function formatNumber(num) {
    return new Intl.NumberFormat().format(Math.round(num));
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function loadProfilePicture() {
    const profilePic = localStorage.getItem('profilePicture');
    const userAvatar = document.getElementById('userAvatar');
    
    if (profilePic && userAvatar) {
        const img = new Image();
        img.onload = () => {
            userAvatar.innerHTML = `<img src="${profilePic}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" loading="lazy">`;
        };
        img.onerror = () => {
            console.error('Failed to load profile picture');
            localStorage.removeItem('profilePicture');
        };
        img.src = profilePic;
    }
}

// Add page visibility API to pause/resume when tab is inactive
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause any animations or polling
        console.log('Page hidden - pausing updates');
    } else {
        // Resume updates
        console.log('Page visible - resuming updates');
        loadWorkouts();
    }
});

// Keyboard Shortcuts
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            toggleSearch();
        }
        
        // Ctrl/Cmd + W for workouts
        if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
            e.preventDefault();
            window.location.href = 'workouts.html';
        }
        
        // Ctrl/Cmd + H for history
        if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
            e.preventDefault();
            window.location.href = 'history.html';
        }
        
        // Ctrl/Cmd + , for settings
        if ((e.ctrlKey || e.metaKey) && e.key === ',') {
            e.preventDefault();
            window.location.href = 'settings.html';
        }
    });
    
    // Show keyboard shortcuts hint
    showKeyboardHint();
}

function showKeyboardHint() {
    const hint = document.createElement('div');
    hint.style.cssText = `
        position: fixed;
        bottom: 2rem;
        left: 2rem;
        background: rgba(42, 42, 42, 0.95);
        padding: 1rem;
        border-radius: 10px;
        font-size: 0.875rem;
        color: #9ca3af;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s;
    `;
    hint.innerHTML = `
        <div style="margin-bottom: 0.5rem; font-weight: 600; color: #fff;">Keyboard Shortcuts</div>
        <div><kbd style="background: #1a1a1a; padding: 0.25rem 0.5rem; border-radius: 4px;">Ctrl+K</kbd> Search</div>
        <div><kbd style="background: #1a1a1a; padding: 0.25rem 0.5rem; border-radius: 4px;">Ctrl+W</kbd> Workouts</div>
        <div><kbd style="background: #1a1a1a; padding: 0.25rem 0.5rem; border-radius: 4px;">Ctrl+H</kbd> History</div>
    `;
    
    document.body.appendChild(hint);
    
    setTimeout(() => hint.style.opacity = '1', 100);
    setTimeout(() => {
        hint.style.opacity = '0';
        setTimeout(() => hint.remove(), 300);
    }, 5000);
}

document.addEventListener('DOMContentLoaded', async () => {
    currentUser = JSON.parse(localStorage.getItem('user'));
    
    // Set user name in greeting and profile
    if (currentUser) {
        const userNameElement = document.getElementById('userName');
        const greetingElement = document.getElementById('greetingText');
        
        if (userNameElement) {
            userNameElement.textContent = currentUser.username;
        }
        if (greetingElement) {
            greetingElement.textContent = `Hello, ${currentUser.username}`;
        }
    }
    
    // Load profile picture
    loadProfilePicture();
    
    initCharts();
    await loadWorkouts();
    updateStats();
    
    // Initialize notifications if elements exist
    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {
        initNotifications();
    }
    
    // Initialize button functionality
    initButtons();
    
    // Register service worker for offline support
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered successfully');
        } catch (error) {
            console.log('Service Worker registration failed:', error);
        }
    }
    
    // Add keyboard shortcuts
    initKeyboardShortcuts();
});

function initButtons() {
    // Search button
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', toggleSearch);
    }
    
    // Favorites button
    const favoritesBtn = document.getElementById('favoritesBtn');
    if (favoritesBtn) {
        favoritesBtn.addEventListener('click', toggleFavorites);
    }
    
    // Dark mode button
    const darkModeBtn = document.getElementById('darkModeBtn');
    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', toggleDarkMode);
        // Load saved dark mode preference
        loadDarkMode();
    }
}

function toggleSearch() {
    const searchOverlay = document.getElementById('searchOverlay');
    if (searchOverlay) {
        searchOverlay.classList.toggle('active');
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
        }
    } else {
        // Create search overlay if it doesn't exist
        createSearchOverlay();
    }
}

function createSearchOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'searchOverlay';
    overlay.className = 'search-overlay';
    overlay.innerHTML = `
        <div class="search-container">
            <div class="search-header">
                <i class="fas fa-search"></i>
                <input type="text" id="searchInput" placeholder="Search workouts, goals, analytics..." autofocus>
                <button onclick="closeSearch()" class="close-search-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="search-results" id="searchResults">
                <div class="search-category">
                    <h4>Quick Actions</h4>
                    <a href="workouts.html" class="search-result-item">
                        <i class="fas fa-dumbbell"></i>
                        <span>Calculate Calories</span>
                    </a>
                    <a href="goals.html" class="search-result-item">
                        <i class="fas fa-bullseye"></i>
                        <span>Create Goal</span>
                    </a>
                    <a href="analytics.html" class="search-result-item">
                        <i class="fas fa-chart-line"></i>
                        <span>View Analytics</span>
                    </a>
                    <a href="history.html" class="search-result-item">
                        <i class="fas fa-history"></i>
                        <span>Workout History</span>
                    </a>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // Add event listener for search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', performSearch);
        searchInput.focus();
    }
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeSearch();
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSearch();
        }
    });
}

function closeSearch() {
    const overlay = document.getElementById('searchOverlay');
    if (overlay) {
        overlay.remove();
    }
}

function performSearch(e) {
    const query = e.target.value.toLowerCase();
    const resultsContainer = document.getElementById('searchResults');
    
    if (!query) {
        resultsContainer.innerHTML = `
            <div class="search-category">
                <h4>Quick Actions</h4>
                <a href="workouts.html" class="search-result-item">
                    <i class="fas fa-dumbbell"></i>
                    <span>Calculate Calories</span>
                </a>
                <a href="goals.html" class="search-result-item">
                    <i class="fas fa-bullseye"></i>
                    <span>Create Goal</span>
                </a>
                <a href="analytics.html" class="search-result-item">
                    <i class="fas fa-chart-line"></i>
                    <span>View Analytics</span>
                </a>
                <a href="history.html" class="search-result-item">
                    <i class="fas fa-history"></i>
                    <span>Workout History</span>
                </a>
            </div>
        `;
        return;
    }
    
    // Search through workouts
    const results = workoutHistory.filter(w => {
        const date = new Date(w.created_at).toLocaleDateString();
        return date.toLowerCase().includes(query) || 
               w.calories.toString().includes(query) ||
               w.duration.toString().includes(query);
    });
    
    if (results.length > 0) {
        resultsContainer.innerHTML = `
            <div class="search-category">
                <h4>Workouts (${results.length})</h4>
                ${results.slice(0, 5).map(w => `
                    <div class="search-result-item">
                        <i class="fas fa-fire"></i>
                        <span>${Math.round(w.calories)} kcal - ${w.duration} min - ${new Date(w.created_at).toLocaleDateString()}</span>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        resultsContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #6b7280;">
                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                <p>No results found for "${query}"</p>
            </div>
        `;
    }
}

function toggleFavorites() {
    const btn = document.getElementById('favoritesBtn');
    const icon = btn.querySelector('i');
    
    if (icon.classList.contains('fas')) {
        icon.classList.remove('fas');
        icon.classList.add('far');
        showToast('Removed from favorites');
    } else {
        icon.classList.remove('far');
        icon.classList.add('fas');
        showToast('Added to favorites');
    }
}

function toggleDarkMode() {
    const body = document.body;
    const isDark = body.classList.toggle('light-mode');
    
    // Save preference
    localStorage.setItem('darkMode', !isDark);
    
    const btn = document.getElementById('darkModeBtn');
    const icon = btn.querySelector('i');
    
    if (!isDark) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        showToast('Light mode enabled');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        showToast('Dark mode enabled');
    }
}

function loadDarkMode() {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'false') {
        document.body.classList.add('light-mode');
        const btn = document.getElementById('darkModeBtn');
        if (btn) {
            const icon = btn.querySelector('i');
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: #2a2a2a;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        animation: slideUp 0.3s ease-out;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Notification System
function initNotifications() {
    const notificationBtn = document.getElementById('notificationBtn');
    const messageBtn = document.getElementById('messageBtn');
    const notificationPanel = document.getElementById('notificationPanel');
    const messagePanel = document.getElementById('messagePanel');
    
    // Check if all required elements exist
    if (!notificationBtn || !messageBtn || !notificationPanel || !messagePanel) {
        return; // Exit if elements don't exist
    }
    
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
        showLoading();
        const response = await fetch(`${API_URL}/workouts`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        hideLoading();
        
        if (response.status === 401) {
            showError('Session expired. Please login again.');
            setTimeout(() => logout(), 2000);
            return;
        }
        
        if (!response.ok) {
            throw new Error('Failed to load workouts');
        }
        
        const data = await response.json();
        workoutHistory = data.workouts || [];
        
        if (workoutHistory.length === 0) {
            showEmptyState();
        }
    } catch (error) {
        hideLoading();
        console.error('Failed to load workouts:', error);
        showError('Unable to load workouts. Please check your connection.');
    }
}

function showEmptyState() {
    const dashboard = document.querySelector('.dashboard');
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
        <i class="fas fa-dumbbell"></i>
        <h3>No Workouts Yet</h3>
        <p>Start tracking your fitness journey by calculating your first workout!</p>
        <a href="workouts.html" class="btn">
            <i class="fas fa-plus"></i> Calculate Calories
        </a>
    `;
    
    // Only show if no workouts
    if (workoutHistory.length === 0) {
        const existingEmpty = dashboard.querySelector('.empty-state');
        if (!existingEmpty) {
            dashboard.appendChild(emptyState);
        }
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
    
    // Animate numbers
    animateValue('totalCaloriesCard', 0, totalCalories, 1000);
    animateValue('totalWorkoutsCard', 0, totalWorkouts, 1000);
    animateValue('avgCaloriesCard', 0, avgCalories, 1000);
    animateValue('totalDurationCard', 0, totalDuration, 1000);
    animateValue('avgHeartRateCard', 0, avgHeartRate, 1000);
    
    // Calculate and animate fitness score
    const fitnessScore = Math.min(1000, Math.round(totalCalories / 10 + totalWorkouts * 50));
    animateValue('fitnessScore', 0, fitnessScore, 1500);
    
    // Update circular progress indicators
    updateCircularProgress('workoutsCircle', totalWorkouts, 100);
    updateCircularProgress('caloriesCircle', totalCalories, 10000);
    updateCircularProgress('avgCaloriesCircle', avgCalories, 1000);
    updateCircularProgress('durationCircle', totalDuration, 1000);
    updateCircularProgress('heartRateCircle', avgHeartRate, 200);
    updateCircularProgress('scoreCircle', fitnessScore, 1000);
}

function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    if (!element) return;
    
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = formatNumber(current);
    }, 16);
}

function updateCircularProgress(id, value, max) {
    const circle = document.getElementById(id);
    if (!circle) return;
    
    const circumference = 2 * Math.PI * 45;
    const percentage = Math.min(100, (value / max) * 100);
    const offset = circumference - (percentage / 100) * circumference;
    
    circle.style.strokeDashoffset = offset;
}

function initCharts() {
    // Calories Line Chart
    const caloriesCtx = document.getElementById('caloriesChart');
    if (caloriesCtx) {
        charts.calories = new Chart(caloriesCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Calories',
                    data: [],
                    borderColor: '#ec4899',
                    backgroundColor: 'rgba(236, 72, 153, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2
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
    if (workoutHistory.length === 0 || !charts.calories) return;
    
    const last10 = workoutHistory.slice(0, 10).reverse();
    const labels = last10.map(w => new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    
    charts.calories.data.labels = labels;
    charts.calories.data.datasets[0].data = last10.map(w => w.calories);
    charts.calories.update();
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

function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    menu.classList.toggle('hidden');
}

// Close user menu when clicking outside
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