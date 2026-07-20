const nodemailer = require('nodemailer');

module.exports = {
  /*
  Sends password recovery tokens.
  Params: recipientEmail (string), recoveryToken (string).
  Returns: Delivery status.
  */
  sendForgotPasswordEmail: async (recipientEmail, recoveryToken) => {
    console.log(`[EMAIL SERVICE] Initializing SMTP broadcast to: ${recipientEmail}`);
    
    const smtpHost = process.env.SMTP_HOST || 'smtp.mailtrap.io';
    const smtpPort = process.env.SMTP_PORT || 2525;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      console.log(`[EMAIL SERVICE] Missing SMTP credentials. Fallback to console logs.`);
      console.log(`[EMAIL SERVICE] Reset URL: http://localhost:3000/reset-password?token=${recoveryToken}`);
      return {
        success: true,
        message: 'Password reset link outputted to console logs (fallback).'
      };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      const resetUrl = `http://localhost:3000/reset-password?token=${recoveryToken}`;
      const mailOptions = {
        from: '"SkillForge Placement Team" <noreply@skillforge.edu>',
        to: recipientEmail,
        subject: 'Placement Readiness Portal - Password Reset Request',
        html: `
          <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #2563eb;">SkillForge Account Assistance</h2>
            <p>You requested a password reset. Please click the button below to establish a new password credential:</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 15px 0;">Reset Password</a>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">If you did not request this assistance, you can safely ignore this email.</p>
          </div>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[EMAIL SERVICE] SMTP dispatch complete. Msg ID: ${info.messageId}`);
      return {
        success: true,
        message: 'Password reset email dispatched successfully via SMTP.'
      };
    } catch (err) {
      console.error(`[EMAIL SERVICE] Nodemailer dispatch failed: ${err.message}`);
      return {
        success: false,
        message: 'SMTP dispatch failed, recovery fallback initiated.',
        error: err.message
      };
    }
  }
};
