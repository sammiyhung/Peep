const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create transporter
const createTransporter = () => {
  // For development without email config, use a test account
  // This will just log emails to console instead of sending them
  
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    // Real email service configured
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  
  // Development fallback - creates a test account that logs to console
  // This won't actually send emails but will show preview URLs
  return nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true,
  });
};

/**
 * Generate verification token
 */
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Send verification email
 */
const sendVerificationEmail = async (user, token) => {
  const transporter = createTransporter();
  
  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: `"Peep" <${process.env.EMAIL_FROM || 'noreply@peep.com'}>`,
    to: user.email,
    subject: '🎉 Verify Your Email - Peep',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              background: #0a0a0a;
              padding: 20px;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 0 auto;
              background: #1a1a1a;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            }
            .header {
              background: linear-gradient(135deg, #ff5757 0%, #ff6b9d 25%, #c471ed 75%, #7c3aed 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .logo {
              width: 180px;
              height: auto;
              margin-bottom: 20px;
            }
            .header-text {
              color: white;
              font-size: 16px;
              font-weight: 500;
              opacity: 0.95;
            }
            .content {
              padding: 40px 30px;
              background: #1a1a1a;
            }
            h1 {
              color: #ffffff;
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 20px;
              line-height: 1.3;
            }
            p {
              color: #b4b4b4;
              font-size: 16px;
              margin-bottom: 20px;
              line-height: 1.6;
            }
            .highlight {
              color: #ffffff;
              font-weight: 600;
            }
            .button-container {
              text-align: center;
              margin: 35px 0;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #ff5757 0%, #ff6b9d 25%, #c471ed 75%, #7c3aed 100%);
              color: white;
              padding: 16px 40px;
              text-decoration: none;
              border-radius: 12px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 8px 24px rgba(124, 58, 237, 0.4);
              transition: transform 0.2s;
            }
            .button:hover {
              transform: translateY(-2px);
            }
            .divider {
              height: 1px;
              background: linear-gradient(90deg, transparent, #333, transparent);
              margin: 30px 0;
            }
            .link-box {
              background: #0f0f0f;
              border: 1px solid #2a2a2a;
              border-radius: 8px;
              padding: 16px;
              margin: 20px 0;
            }
            .link-text {
              color: #7c3aed;
              font-size: 13px;
              word-break: break-all;
              font-family: 'Courier New', monospace;
            }
            .info-box {
              background: #2a1a3a;
              border-left: 4px solid #7c3aed;
              padding: 16px;
              border-radius: 8px;
              margin: 25px 0;
            }
            .info-box p {
              color: #d4b4f4;
              font-size: 14px;
              margin: 0;
            }
            .footer {
              background: #0f0f0f;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #2a2a2a;
            }
            .footer p {
              color: #666;
              font-size: 13px;
              margin: 5px 0;
            }
            .social-links {
              margin: 20px 0;
            }
            .social-links a {
              color: #7c3aed;
              text-decoration: none;
              margin: 0 10px;
              font-size: 14px;
            }
            @media only screen and (max-width: 600px) {
              .content {
                padding: 30px 20px;
              }
              h1 {
                font-size: 24px;
              }
              .button {
                padding: 14px 30px;
                font-size: 15px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <img src="${process.env.CLIENT_URL || 'http://localhost:5173'}/assets/images/logo.png" alt="Peep Logo" class="logo">
              <p class="header-text">Welcome to the community! 🎉</p>
            </div>
            
            <div class="content">
              <h1>Hey ${user.name}! 👋</h1>
              <p>We're <span class="highlight">thrilled</span> to have you join Peep! You're just one step away from connecting with an amazing community.</p>
              
              <p>To unlock all features and start your journey, please verify your email address:</p>
              
              <div class="button-container">
                <a href="${verificationUrl}" class="button">✨ Verify My Email</a>
              </div>
              
              <div class="divider"></div>
              
              <p style="color: #888; font-size: 14px; text-align: center;">Or copy and paste this link into your browser:</p>
              <div class="link-box">
                <p class="link-text">${verificationUrl}</p>
              </div>
              
              <div class="info-box">
                <p>⏰ <strong>Quick heads up:</strong> This verification link expires in 24 hours for security reasons.</p>
              </div>
              
              <p style="font-size: 14px; color: #888; margin-top: 30px;">
                Didn't create a Peep account? No worries! You can safely ignore this email.
              </p>
            </div>
            
            <div class="footer">
              <p style="color: #999; font-weight: 600; margin-bottom: 10px;">Peep</p>
              <p>© ${new Date().getFullYear()} Peep. All rights reserved.</p>
              <p style="margin-top: 15px;">Made with 💜 for our community</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    
    // Log for development
    if (!process.env.EMAIL_HOST) {
      console.log('\n📧 VERIFICATION EMAIL (Development Mode)');
      console.log('To:', user.email);
      console.log('Subject:', mailOptions.subject);
      console.log('Verification URL:', verificationUrl);
      console.log('Message ID:', info.messageId);
      console.log('─────────────────────────────────────\n');
    } else {
      console.log('✅ Verification email sent to:', user.email);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    console.error('Email config:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER ? '***configured***' : 'NOT SET',
      from: process.env.EMAIL_FROM
    });
    throw error; // Throw error instead of silently returning true
  }
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (user, token) => {
  const transporter = createTransporter();
  
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: `"Peep" <${process.env.EMAIL_FROM || 'noreply@peep.com'}>`,
    to: user.email,
    subject: '🔐 Reset Your Password - Peep',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              background: #0a0a0a;
              padding: 20px;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 0 auto;
              background: #1a1a1a;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            }
            .header {
              background: linear-gradient(135deg, #ff5757 0%, #ff6b9d 25%, #c471ed 75%, #7c3aed 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .logo {
              width: 180px;
              height: auto;
              margin-bottom: 20px;
            }
            .header-text {
              color: white;
              font-size: 16px;
              font-weight: 500;
              opacity: 0.95;
            }
            .content {
              padding: 40px 30px;
              background: #1a1a1a;
            }
            h1 {
              color: #ffffff;
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 20px;
              line-height: 1.3;
            }
            p {
              color: #b4b4b4;
              font-size: 16px;
              margin-bottom: 20px;
              line-height: 1.6;
            }
            .highlight {
              color: #ffffff;
              font-weight: 600;
            }
            .button-container {
              text-align: center;
              margin: 35px 0;
              color: #ffffff;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #ff5757 0%, #ff6b9d 25%, #c471ed 75%, #7c3aed 100%);
              color: white;
              padding: 16px 40px;
              text-decoration: none;
              border-radius: 12px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 8px 24px rgba(124, 58, 237, 0.4);
              transition: transform 0.2s;
            }
            .button:hover {
              transform: translateY(-2px);
            }
            .divider {
              height: 1px;
              background: linear-gradient(90deg, transparent, #333, transparent);
              margin: 30px 0;
            }
            .link-box {
              background: #0f0f0f;
              border: 1px solid #2a2a2a;
              border-radius: 8px;
              padding: 16px;
              margin: 20px 0;
            }
            .link-text {
              color: #ffffff;
              font-size: 13px;
              word-break: break-all;
              font-family: 'Courier New', monospace;
            }
            .warning-box {
              background: #3a1a1a;
              border-left: 4px solid #ff5757;
              padding: 16px;
              border-radius: 8px;
              margin: 25px 0;
            }
            .warning-box p {
              color: #ffb4b4;
              font-size: 14px;
              margin: 0;
            }
            .info-box {
              background: #2a1a3a;
              border-left: 4px solid #7c3aed;
              padding: 16px;
              border-radius: 8px;
              margin: 25px 0;
            }
            .info-box p {
              color: #d4b4f4;
              font-size: 14px;
              margin: 0;
            }
            .footer {
              background: #0f0f0f;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #2a2a2a;
            }
            .footer p {
              color: #666;
              font-size: 13px;
              margin: 5px 0;
            }
            @media only screen and (max-width: 600px) {
              .content {
                padding: 30px 20px;
              }
              h1 {
                font-size: 24px;
              }
              .button {
                padding: 14px 30px;
                font-size: 15px;
              }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <img src="${process.env.CLIENT_URL || 'https://peep-cr6u.onrender.com/'}/assets/images/logo.png" alt="Peep Logo" class="logo">
              <p class="header-text">Password Reset Request 🔐</p>
            </div>
            
            <div class="content">
              <h1>Hey ${user.name}! 👋</h1>
              <p>We received a request to reset your password for your Peep account.</p>
              
              <p>No worries! Click the button below to create a new password:</p>
              
              <div class="button-container">
                <a href="${resetUrl}" class="button">🔑 Reset My Password</a>
              </div>
              
              <div class="divider"></div>
              
              <p style="color: #888; font-size: 14px; text-align: center;">Or copy and paste this link into your browser:</p>
              <div class="link-box">
                <p class="link-text">${resetUrl}</p>
              </div>
              
              <div class="warning-box">
                <p>⚠️ <strong>Security Alert:</strong> This reset link expires in 1 hour and can only be used once.</p>
              </div>
              
              <div class="info-box">
                <p>💡 <strong>Didn't request this?</strong> You can safely ignore this email. Your password will remain unchanged.</p>
              </div>
              
              <p style="font-size: 14px; color: #888; margin-top: 30px;">
                If you're having trouble, please contact our support team.
              </p>
            </div>
            
            <div class="footer">
              <p style="color: #999; font-weight: 600; margin-bottom: 10px;">Peep</p>
              <p>© ${new Date().getFullYear()} Peep. All rights reserved.</p>
              <p style="margin-top: 15px;">Made with 💜 for our community</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    
    // Log for development
    if (!process.env.EMAIL_HOST) {
      console.log('\n🔐 PASSWORD RESET EMAIL (Development Mode)');
      console.log('To:', user.email);
      console.log('Subject:', mailOptions.subject);
      console.log('Reset URL:', resetUrl);
      console.log('Message ID:', info.messageId);
      console.log('─────────────────────────────────────\n');
    } else {
      console.log('✅ Password reset email sent to:', user.email);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    console.error('Email config:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER ? '***configured***' : 'NOT SET',
      from: process.env.EMAIL_FROM
    });
    throw error; // Throw error instead of silently returning true
  }
};

module.exports = {
  generateVerificationToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
