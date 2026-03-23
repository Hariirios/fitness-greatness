const API_URL = 'http://localhost:5000';

let currentUser = null;

const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'auth.html';
}

document.addEventListener('DOMContentLoaded', () => {
    currentUser = JSON.parse(localStorage.getItem('user'));
    document.getElementById('settingsUsername').value = currentUser.username;
    document.getElementById('settingsEmail').value = currentUser.email || '';
    
    // Load profile picture
    loadProfilePicture();
    
    // Event listeners
    document.getElementById('profilePicture').addEventListener('change', uploadProfilePicture);
    document.getElementById('removePhoto').addEventListener('click', removeProfilePicture);
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
});

function loadProfilePicture() {
    const profilePic = localStorage.getItem('profilePicture');
    if (profilePic) {
        const profileAvatar = document.getElementById('profileAvatar');
        const userProfileImg = document.getElementById('userProfileImg');
        
        profileAvatar.innerHTML = `<img src="${profilePic}" style="width: 100%; height: 100%; object-fit: cover;">`;
        if (userProfileImg) {
            userProfileImg.src = profilePic;
        }
    }
}

function uploadProfilePicture(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const imageData = event.target.result;
        
        // Save to localStorage
        localStorage.setItem('profilePicture', imageData);
        
        // Update UI
        const profileAvatar = document.getElementById('profileAvatar');
        const userProfileImg = document.getElementById('userProfileImg');
        
        profileAvatar.innerHTML = `<img src="${imageData}" style="width: 100%; height: 100%; object-fit: cover;">`;
        if (userProfileImg) {
            userProfileImg.src = imageData;
        }
        
        // Show success message
        showSuccess('Profile picture updated!');
    };
    
    reader.readAsDataURL(file);
}

function removeProfilePicture() {
    if (!confirm('Remove profile picture?')) return;
    
    localStorage.removeItem('profilePicture');
    
    const profileAvatar = document.getElementById('profileAvatar');
    const userProfileImg = document.getElementById('userProfileImg');
    
    profileAvatar.innerHTML = '<i class="fas fa-user"></i>';
    if (userProfileImg) {
        userProfileImg.src = 'https://i.pravatar.cc/40';
    }
    
    showSuccess('Profile picture removed!');
}

function saveSettings() {
    const username = document.getElementById('settingsUsername').value;
    const email = document.getElementById('settingsEmail').value;
    
    // Update local storage
    currentUser.username = username;
    currentUser.email = email;
    localStorage.setItem('user', JSON.stringify(currentUser));
    
    showSuccess('Settings saved successfully!');
}

function showSuccess(message) {
    const btn = document.getElementById('saveSettings');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> ' + message;
    btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    
    setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.style.background = '';
    }, 2000);
}

function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    menu.classList.toggle('hidden');
}

// Close menu when clicking outside
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
