const API_URL = 'http://localhost:5000';

// Check if already logged in
if (localStorage.getItem('token')) {
    window.location.href = 'overview.html';
}

// Form switching
document.getElementById('showSignup').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('signupForm').classList.add('active');
    hideError();
    hideSignupError();
});

document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signupForm').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
    hideError();
    hideSignupError();
});

// Password strength checker
document.getElementById('signupPassword').addEventListener('input', (e) => {
    const password = e.target.value;
    const strengthBar = document.getElementById('passwordStrength');
    
    if (password.length === 0) {
        strengthBar.className = 'password-strength';
        return;
    }
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    
    if (strength <= 2) {
        strengthBar.className = 'password-strength weak';
    } else if (strength <= 3) {
        strengthBar.className = 'password-strength medium';
    } else {
        strengthBar.className = 'password-strength strong';
    }
});

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.toggle-password');
    
    if (input.type === 'password') {
        input.type = 'text';
        button.querySelector('.eye-icon').textContent = '🙈';
    } else {
        input.type = 'password';
        button.querySelector('.eye-icon').textContent = '👁️';
    }
}

// Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = 'index.html';
        } else {
            showError(data.error || 'Login failed');
        }
    } catch (error) {
        showError('Failed to connect to server');
    }
});

// Signup
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = 'index.html';
        } else {
            showError(data.error || 'Signup failed');
        }
    } catch (error) {
        showError('Failed to connect to server');
    }
});

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    document.getElementById('errorMessage').classList.add('hidden');
}


// Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Success animation
            const btn = e.target.querySelector('.btn-primary');
            btn.innerHTML = '<span>✓ Success!</span>';
            btn.style.background = '#10b981';
            
            setTimeout(() => {
                window.location.href = 'overview.html';
            }, 500);
        } else {
            showError(data.error || 'Login failed');
        }
    } catch (error) {
        showError('Failed to connect to server. Make sure backend is running.');
    }
});

// Signup
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    if (password !== confirmPassword) {
        showSignupError('Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        showSignupError('Password must be at least 6 characters');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Success animation
            const btn = e.target.querySelector('.btn-primary');
            btn.innerHTML = '<span>✓ Account Created!</span>';
            btn.style.background = '#10b981';
            
            setTimeout(() => {
                window.location.href = 'overview.html';
            }, 500);
        } else {
            showSignupError(data.error || 'Signup failed');
        }
    } catch (error) {
        showSignupError('Failed to connect to server. Make sure backend is running.');
    }
});

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    document.getElementById('errorMessage').classList.add('hidden');
}

function showSignupError(message) {
    const errorDiv = document.getElementById('signupErrorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideSignupError() {
    document.getElementById('signupErrorMessage').classList.add('hidden');
}
