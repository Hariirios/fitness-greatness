const API_URL = 'http://localhost:5000';

// Check if already logged in
if (localStorage.getItem('token')) {
    window.location.href = 'overview.html';
}

// Form switching functions with stability checks
function showLogin() {
    // Only switch if not currently typing in an input
    if (document.activeElement && document.activeElement.tagName === 'INPUT') {
        return; // Don't switch if user is typing
    }
    document.querySelector('.login-container').classList.remove('hidden');
    document.querySelector('.register-container').classList.add('hidden');
}

function showRegister() {
    // Only switch if not currently typing in an input
    if (document.activeElement && document.activeElement.tagName === 'INPUT') {
        return; // Don't switch if user is typing
    }
    document.querySelector('.login-container').classList.add('hidden');
    document.querySelector('.register-container').classList.remove('hidden');
}

function showForgotPassword() {
    console.log('showForgotPassword called');
    const modal = document.getElementById('forgotPasswordModal');
    console.log('Modal element:', modal);
    console.log('Modal classes before:', modal ? modal.className : 'modal not found');
    
    if (modal) {
        modal.classList.remove('hidden');
        console.log('Modal classes after:', modal.className);
        console.log('Modal style display:', window.getComputedStyle(modal).display);
        console.log('Modal should be visible now');
    } else {
        console.error('Modal not found!');
    }
}

function closeForgotPassword() {
    console.log('closeForgotPassword called');
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Ensure functions are globally accessible
window.showForgotPassword = showForgotPassword;
window.closeForgotPassword = closeForgotPassword;
window.showLogin = showLogin;
window.showRegister = showRegister;

function showError(message) {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <span>${message}</span>
    `;
    
    // Add error styles
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(239, 68, 68, 0.9);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        border: 1px solid #ef4444;
        backdrop-filter: blur(10px);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease;
        box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
    `;
    
    document.body.appendChild(errorDiv);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        errorDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 300);
    }, 4000);
}

function showSuccess(message) {
    // Create success notification
    const successDiv = document.createElement('div');
    successDiv.className = 'success-notification';
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    // Add success styles
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(16, 185, 129, 0.9);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        border: 1px solid #10b981;
        backdrop-filter: blur(10px);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease;
        box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
    `;
    
    document.body.appendChild(successDiv);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        successDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 300);
    }, 4000);
}

function resetButton(button, text) {
    button.innerHTML = text;
    button.disabled = false;
    button.style.borderColor = '#00f0ff';
    button.style.color = 'white';
}

// Add CSS animations for error notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing auth page');
    
    // Add global protection against accidental form switching
    let isTyping = false;
    
    // Track when user is typing
    document.addEventListener('focusin', (e) => {
        if (e.target.tagName === 'INPUT') {
            isTyping = true;
        }
    });
    
    document.addEventListener('focusout', (e) => {
        if (e.target.tagName === 'INPUT') {
            // Small delay to prevent immediate switching
            setTimeout(() => {
                isTyping = false;
            }, 100);
        }
    });
    
    // Override form switching functions to check typing state
    const originalShowLogin = window.showLogin;
    const originalShowRegister = window.showRegister;
    
    window.showLogin = function() {
        if (!isTyping) {
            originalShowLogin();
        }
    };
    
    window.showRegister = function() {
        if (!isTyping) {
            originalShowRegister();
        }
    };
    
    // Check if elements exist
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const usernameInput = document.getElementById('loginUsername');
    const passwordInput = document.getElementById('loginPassword');
    
    console.log('Login form:', loginForm);
    console.log('Username input:', usernameInput);
    console.log('Password input:', passwordInput);
    
    if (!loginForm) {
        console.error('Login form not found!');
        return;
    }

    // Login form handler
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Login form submitted');
        
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const submitBtn = e.target.querySelector('.submit-btn');
        
        console.log('Username:', username, 'Password:', password);
        
        // Loading state
        submitBtn.innerHTML = 'Logging in...';
        submitBtn.disabled = true;
        
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
                submitBtn.innerHTML = '✓ Success!';
                submitBtn.style.borderColor = '#10b981';
                submitBtn.style.color = '#10b981';
                
                setTimeout(() => {
                    window.location.href = 'overview.html';
                }, 800);
            } else {
                showError(data.error || 'Login failed');
                resetButton(submitBtn, 'Submit');
            }
        } catch (error) {
            showError('Failed to connect to server. Make sure backend is running.');
            resetButton(submitBtn, 'Submit');
        }
    });

    // Register form handler (if register form exists)
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('registerUsername').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const submitBtn = e.target.querySelector('.submit-btn');
            
            if (password !== confirmPassword) {
                showError('Passwords do not match');
                return;
            }
            
            if (password.length < 6) {
                showError('Password must be at least 6 characters');
                return;
            }
            
            // Loading state
            submitBtn.innerHTML = 'Creating Account...';
            submitBtn.disabled = true;
            
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
                    submitBtn.innerHTML = '✓ Account Created!';
                    submitBtn.style.borderColor = '#10b981';
                    submitBtn.style.color = '#10b981';
                    
                    setTimeout(() => {
                        window.location.href = 'overview.html';
                    }, 800);
                } else {
                    showError(data.error || 'Registration failed');
                    resetButton(submitBtn, 'Register');
                }
            } catch (error) {
                showError('Failed to connect to server. Make sure backend is running.');
                resetButton(submitBtn, 'Register');
            }
        });
    }
    
    // Forgot Password form handler
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('forgotEmail').value;
            const submitBtn = e.target.querySelector('.submit-btn');
            
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showError('Please enter a valid email address');
                return;
            }
            
            // Loading state
            submitBtn.innerHTML = 'Sending...';
            submitBtn.disabled = true;
            
            try {
                const response = await fetch(`${API_URL}/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Success animation
                    submitBtn.innerHTML = '✓ Email Sent!';
                    submitBtn.style.borderColor = '#10b981';
                    submitBtn.style.color = '#10b981';
                    
                    showSuccess('Password reset link sent to your email!');
                    
                    setTimeout(() => {
                        closeForgotPassword();
                        resetButton(submitBtn, 'Send Reset Link');
                        document.getElementById('forgotEmail').value = '';
                    }, 2000);
                } else {
                    showError(data.error || 'Failed to send reset email');
                    resetButton(submitBtn, 'Send Reset Link');
                }
            } catch (error) {
                // For demo purposes, show success even if backend is not available
                showSuccess('Password reset link sent! (Demo mode - check console)');
                console.log('Demo: Password reset requested for:', email);
                
                submitBtn.innerHTML = '✓ Email Sent!';
                submitBtn.style.borderColor = '#10b981';
                submitBtn.style.color = '#10b981';
                
                setTimeout(() => {
                    closeForgotPassword();
                    resetButton(submitBtn, 'Send Reset Link');
                    document.getElementById('forgotEmail').value = '';
                }, 2000);
            }
        });
    }
    
    // Animate progress bar on load
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
        progressFill.style.width = '0%';
        setTimeout(() => {
            progressFill.style.transition = 'width 2s ease';
            progressFill.style.width = '65%';
        }, 500);
    }
    
    // Add focus effects with improved stability
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            // Prevent any form switching during input focus
            event.stopPropagation();
            this.parentElement.style.transform = 'translateY(-2px)';
            this.parentElement.style.borderBottomColor = '#ff00ff';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'translateY(0)';
            this.parentElement.style.borderBottomColor = '#00f0ff';
        });
        
        // Prevent any accidental form switching while typing
        input.addEventListener('input', function(event) {
            event.stopPropagation();
        });
        
        input.addEventListener('keydown', function(event) {
            event.stopPropagation();
        });
    });
    
    console.log('Auth page initialization complete');
});