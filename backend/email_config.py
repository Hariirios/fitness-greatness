# Email Configuration for FitnessGuard
# 
# IMPORTANT: To enable email sending, you need to:
# 1. Use a Gmail account (or update SMTP settings for other providers)
# 2. Enable 2-Factor Authentication on your Gmail account
# 3. Generate an "App Password" for this application
# 4. Update the EMAIL_CONFIG in app.py with your credentials
#
# Steps to get Gmail App Password:
# 1. Go to your Google Account settings
# 2. Security → 2-Step Verification (enable if not already)
# 3. Security → App passwords
# 4. Generate password for "Mail" application
# 5. Use this 16-character password (not your regular Gmail password)

EMAIL_CONFIG = {
    'SMTP_SERVER': 'smtp.gmail.com',
    'SMTP_PORT': 587,
    'EMAIL_ADDRESS': 'your-email@gmail.com',      # Replace with your Gmail address
    'EMAIL_PASSWORD': 'your-16-char-app-password', # Replace with your Gmail app password
    'FROM_NAME': 'FitnessGuard Support'
}

# Alternative SMTP providers:
# 
# Outlook/Hotmail:
# 'SMTP_SERVER': 'smtp-mail.outlook.com'
# 'SMTP_PORT': 587
# 
# Yahoo:
# 'SMTP_SERVER': 'smtp.mail.yahoo.com'
# 'SMTP_PORT': 587
# 
# Custom SMTP:
# Update server and port according to your email provider