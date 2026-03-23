from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pickle
import numpy as np
from functools import wraps
from database import Database
import smtplib
import secrets
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import os

app = Flask(__name__)
CORS(app)
db = Database()

# Email configuration
# Email configuration - USING OUTLOOK
EMAIL_CONFIG = {
    'SMTP_SERVER': 'smtp-mail.outlook.com',
    'SMTP_PORT': 587,
    'EMAIL_ADDRESS': 'fitnessguard2026@outlook.com',  # Your new Outlook email
    'EMAIL_PASSWORD': 'fitness.11',        # Replace with your Outlook password
    'FROM_NAME': 'FitnessGuard Support'
}

# Gmail option (if you get App Password working):
# EMAIL_CONFIG = {
#     'SMTP_SERVER': 'smtp.gmail.com',
#     'SMTP_PORT': 587,
#     'EMAIL_ADDRESS': 'abdallaahmet11@gmail.com',
#     'EMAIL_PASSWORD': 'your-16-char-app-password-here',
#     'FROM_NAME': 'FitnessGuard Support'
# }

# Load the model
import os
model_path = os.path.join(os.path.dirname(__file__), '..', 'calories_model.pkl')
with open(model_path, 'rb') as f:
    model = pickle.load(f)

def send_email(to_email, subject, html_content, text_content=None):
    """Send email using SMTP"""
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{EMAIL_CONFIG['FROM_NAME']} <{EMAIL_CONFIG['EMAIL_ADDRESS']}>"
        msg['To'] = to_email
        
        # Add text and HTML parts
        if text_content:
            text_part = MIMEText(text_content, 'plain')
            msg.attach(text_part)
        
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Send email
        server = smtplib.SMTP(EMAIL_CONFIG['SMTP_SERVER'], EMAIL_CONFIG['SMTP_PORT'])
        server.starttls()
        server.login(EMAIL_CONFIG['EMAIL_ADDRESS'], EMAIL_CONFIG['EMAIL_PASSWORD'])
        server.send_message(msg)
        server.quit()
        
        return True
    except Exception as e:
        print(f"Email sending failed: {str(e)}")
        return False

def generate_reset_token():
    """Generate a secure reset token"""
    return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))

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

@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.json
        email = data.get('email')
        
        print(f"DEBUG: Forgot password request for email: {email}")
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        # Check if user exists with this email
        user = db.get_user_by_email(email)
        print(f"DEBUG: User found: {user}")
        
        if not user:
            # For security, don't reveal if email exists or not
            print(f"DEBUG: No user found with email {email}")
            return jsonify({'message': 'If an account with this email exists, a reset link has been sent'})
        
        # Generate reset token
        reset_token = generate_reset_token()
        expires_at = datetime.now() + timedelta(hours=1)  # Token expires in 1 hour
        
        print(f"DEBUG: Generated token: {reset_token}")
        
        # Save token to database
        db.create_reset_token(user['id'], reset_token, expires_at.isoformat())
        print(f"DEBUG: Token saved to database")
        
        # Create reset link
        reset_link = f"http://localhost:8000/reset-password.html?token={reset_token}"
        
        # Email content
        subject = "Password Reset Request - FitnessGuard"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #00f0ff 0%, #ff00ff 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; background: linear-gradient(135deg, #00f0ff 0%, #ff00ff 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏋️‍♂️ FitnessGuard</h1>
                    <h2>Password Reset Request</h2>
                </div>
                <div class="content">
                    <p>Hello <strong>{user['username']}</strong>,</p>
                    
                    <p>We received a request to reset your password for your FitnessGuard account.</p>
                    
                    <p>Click the button below to reset your password:</p>
                    
                    <p style="text-align: center;">
                        <a href="{reset_link}" class="button">Reset My Password</a>
                    </p>
                    
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">
                        {reset_link}
                    </p>
                    
                    <p><strong>This link will expire in 1 hour.</strong></p>
                    
                    <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
                    
                    <p>Best regards,<br>The FitnessGuard Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated email. Please do not reply to this message.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        FitnessGuard - Password Reset Request
        
        Hello {user['username']},
        
        We received a request to reset your password for your FitnessGuard account.
        
        Please click the following link to reset your password:
        {reset_link}
        
        This link will expire in 1 hour.
        
        If you didn't request this password reset, please ignore this email.
        
        Best regards,
        The FitnessGuard Team
        """
        
        print(f"DEBUG: About to send email to {email}")
        
        # Send email
        email_sent = send_email(email, subject, html_content, text_content)
        
        print(f"DEBUG: Email sent result: {email_sent}")
        
        if email_sent:
            return jsonify({'message': 'Password reset link sent to your email'})
        else:
            return jsonify({'error': 'Failed to send email. Please try again later.'}), 500
        
    except Exception as e:
        print(f"Forgot password error: {str(e)}")
        return jsonify({'error': 'An error occurred. Please try again later.'}), 500

@app.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.json
        token = data.get('token')
        new_password = data.get('password')
        
        if not token or not new_password:
            return jsonify({'error': 'Token and new password are required'}), 400
        
        if len(new_password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400
        
        # Verify token
        user_id = db.verify_reset_token(token)
        
        if not user_id:
            return jsonify({'error': 'Invalid or expired reset token'}), 400
        
        # Update password
        success = db.update_password(user_id, new_password)
        
        if success:
            # Mark token as used
            db.use_reset_token(token)
            return jsonify({'message': 'Password reset successfully'})
        else:
            return jsonify({'error': 'Failed to update password'}), 500
        
    except Exception as e:
        print(f"Reset password error: {str(e)}")
        return jsonify({'error': 'An error occurred. Please try again later.'}), 500

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

# Serve frontend files
@app.route('/')
def index():
    return send_from_directory('../frontend', 'auth.html')

@app.route('/<path:path>')
def serve_frontend(path):
    return send_from_directory('../frontend', path)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
