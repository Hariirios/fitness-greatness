const nodemailer = require('nodemailer');

const EMAIL_CONFIG = {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
        user: 'fitnessguard2026@outlook.com',
        pass: 'fitness.11'
    }
};

const transporter = nodemailer.createTransport(EMAIL_CONFIG);

async function sendPasswordResetEmail(toEmail, username, resetLink) {
    try {
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #00f0ff 0%, #ff00ff 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; background: linear-gradient(135deg, #00f0ff 0%, #ff00ff 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏋️‍♂️ FitnessGuard</h1>
                    <h2>Password Reset Request</h2>
                </div>
                <div class="content">
                    <p>Hello <strong>${username}</strong>,</p>
                    
                    <p>We received a request to reset your password for your FitnessGuard account.</p>
                    
                    <p>Click the button below to reset your password:</p>
                    
                    <p style="text-align: center;">
                        <a href="${resetLink}" class="button">Reset My Password</a>
                    </p>
                    
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">
                        ${resetLink}
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
        `;
        
        const textContent = `
        FitnessGuard - Password Reset Request
        
        Hello ${username},
        
        We received a request to reset your password for your FitnessGuard account.
        
        Please click the following link to reset your password:
        ${resetLink}
        
        This link will expire in 1 hour.
        
        If you didn't request this password reset, please ignore this email.
        
        Best regards,
        The FitnessGuard Team
        `;
        
        await transporter.sendMail({
            from: '"FitnessGuard Support" <fitnessguard2026@outlook.com>',
            to: toEmail,
            subject: 'Password Reset Request - FitnessGuard',
            text: textContent,
            html: htmlContent
        });
        
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        return false;
    }
}

module.exports = { sendPasswordResetEmail };
