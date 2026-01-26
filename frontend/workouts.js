const API_URL = 'http://localhost:5000';

let currentPrediction = null;
let currentUser = null;

const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'auth.html';
}

document.addEventListener('DOMContentLoaded', () => {
    currentUser = JSON.parse(localStorage.getItem('user'));
    document.getElementById('userName').textContent = currentUser.username;
    
    // Load profile picture
    const profilePic = localStorage.getItem('profilePicture');
    if (profilePic) {
        document.querySelector('.user-avatar').innerHTML = `<img src="${profilePic}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    }
    
    document.getElementById('predictionForm').addEventListener('submit', predictCalories);
    document.getElementById('saveBtn').addEventListener('click', saveToHistory);
});

async function predictCalories(e) {
    e.preventDefault();
    
    const features = [
        parseFloat(document.getElementById('gender').value),
        parseFloat(document.getElementById('age').value),
        parseFloat(document.getElementById('height').value),
        parseFloat(document.getElementById('weight').value),
        parseFloat(document.getElementById('duration').value),
        parseFloat(document.getElementById('heartRate').value),
        parseFloat(document.getElementById('bodyTemp').value)
    ];
    
    try {
        const response = await fetch(`${API_URL}/predict`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ features })
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const data = await response.json();
        
        if (data.error) {
            alert('Error: ' + data.error);
        } else {
            currentPrediction = {
                calories: data.calories,
                gender: features[0],
                age: features[1],
                height: features[2],
                weight: features[3],
                duration: features[4],
                heart_rate: features[5],
                body_temp: features[6]
            };
            
            document.getElementById('caloriesValue').textContent = Math.round(data.calories);
            document.getElementById('result').classList.remove('hidden');
        }
    } catch (error) {
        alert('Failed to connect to server.');
    }
}

async function saveToHistory() {
    if (!currentPrediction) return;
    
    try {
        const response = await fetch(`${API_URL}/workouts`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(currentPrediction)
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const btn = document.getElementById('saveBtn');
        btn.textContent = '✓ Saved!';
        btn.style.background = '#059669';
        setTimeout(() => {
            btn.textContent = 'Save to History';
            btn.style.background = '';
        }, 2000);
    } catch (error) {
        alert('Failed to save workout');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'auth.html';
}
