from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
from functools import wraps
from database import Database

app = Flask(__name__)
CORS(app)
db = Database()

# Load the model
with open('../calories_model.pkl', 'rb') as f:
    model = pickle.load(f)

# Auth decorator
def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'No token provided'}), 401
        
        token = token.replace('Bearer ', '')
        user_id = db.verify_session(token)
        
        if not user_id:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(user_id, *args, **kwargs)
    return decorated_function

@app.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.json
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not username or not email or not password:
            return jsonify({'error': 'Missing required fields'}), 400
        
        user_id = db.create_user(username, email, password)
        
        if not user_id:
            return jsonify({'error': 'Username or email already exists'}), 400
        
        token = db.create_session(user_id)
        
        return jsonify({
            'token': token,
            'user': {'id': user_id, 'username': username, 'email': email}
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Missing username or password'}), 400
        
        user = db.verify_user(username, password)
        
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        token = db.create_session(user['id'])
        
        return jsonify({
            'token': token,
            'user': user
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/logout', methods=['POST'])
@require_auth
def logout(user_id):
    try:
        token = request.headers.get('Authorization').replace('Bearer ', '')
        db.delete_session(token)
        return jsonify({'message': 'Logged out successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/predict', methods=['POST'])
@require_auth
def predict(user_id):
    try:
        data = request.json
        features = np.array(data['features']).reshape(1, -1)
        prediction = model.predict(features)
        return jsonify({'calories': float(prediction[0])})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/workouts', methods=['GET'])
@require_auth
def get_workouts(user_id):
    try:
        workouts = db.get_user_workouts(user_id)
        return jsonify({'workouts': workouts})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/workouts', methods=['POST'])
@require_auth
def save_workout(user_id):
    try:
        data = request.json
        workout_id = db.save_workout(user_id, data)
        return jsonify({'id': workout_id, 'message': 'Workout saved'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/workouts/<int:workout_id>', methods=['DELETE'])
@require_auth
def delete_workout(user_id, workout_id):
    try:
        deleted = db.delete_workout(workout_id, user_id)
        if deleted:
            return jsonify({'message': 'Workout deleted'})
        return jsonify({'error': 'Workout not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/stats', methods=['GET'])
@require_auth
def get_stats(user_id):
    try:
        stats = db.get_user_stats(user_id)
        return jsonify(stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
