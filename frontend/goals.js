const API_URL = 'http://localhost:5000';

let currentUser = null;

const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'auth.html';
}

document.addEventListener('DOMContentLoaded', () => {
    currentUser = JSON.parse(localStorage.getItem('user'));
    document.getElementById('userName').textContent = currentUser.username;
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'auth.html';
}
