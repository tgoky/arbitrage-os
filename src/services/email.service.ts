// services/email.service.ts
import { Resend } from 'resend';

// Initialize Resend (you'll need to install: npm install resend)
const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  
  // Send purchase confirmation email
  static async sendPurchaseConfirmationEmail(
    userEmail: string,
    userName: string,
    packageName: string,
    credits: number,
    amountPaid: number,
    sessionId: string
  ) {
    console.log('📧 Sending purchase confirmation email to:', userEmail);
    
    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #5CC49D; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
            .button { background: #5CC49D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0; }
            .success-badge { background: #52c41a; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Purchase Confirmed! 🎉</h1>
              <div class="success-badge">Payment Successful</div>
            </div>
            
            <div class="content">
              <h2>Hi ${userName}!</h2>
              
              <p>Thank you for your purchase! Your credits have been added to your arbitrageOS account.</p>
              
              <h3>Purchase Details:</h3>
              <ul>
                <li><strong>Package:</strong> ${packageName}</li>
                <li><strong>Credits Added:</strong> ${credits.toLocaleString()}</li>
                <li><strong>Amount Paid:</strong> $${amountPaid.toFixed(2)}</li>
                <li><strong>Transaction ID:</strong> ${sessionId}</li>
                <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
              </ul>
              
              <p>You can now start generating high-quality leads with your new credits!</p>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/lead-generation" class="button">
                Start Generating Leads
              </a>
              
              <p>Need help? Contact our support team at <a href="mailto:support@arbitrageos.com">support@arbitrageos.com</a></p>
            </div>
            
            <div class="footer">
              <p>arbitrageOS Lead Generation Platform</p>
              <p>You received this email because you made a purchase on our platform.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const result = await resend.emails.send({
        from: 'arbitrageOS <noreply@arbitrageos.com>', // Use your verified domain
        to: userEmail,
        subject: `Purchase Confirmed - ${credits} Credits Added to Your Account`,
        html
      });

      console.log('✅ Purchase confirmation email sent:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Failed to send purchase confirmation email:', error);
      throw error;
    }
  }

  // Send payment failure notification
  static async sendPaymentFailureNotification(
    userEmail: string,
    userName: string,
    packageName: string,
    reason: string,
    sessionId: string
  ) {
    console.log('📧 Sending payment failure notification to:', userEmail);
    
    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ff4d4f; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
            .button { background: #5CC49D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0; }
            .warning-badge { background: #faad14; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Issue</h1>
              <div class="warning-badge">Action Required</div>
            </div>
            
            <div class="content">
              <h2>Hi ${userName},</h2>
              
              <p>We encountered an issue processing your payment for the ${packageName} package.</p>
              
              <h3>Issue Details:</h3>
              <ul>
                <li><strong>Package:</strong> ${packageName}</li>
                <li><strong>Reason:</strong> ${reason}</li>
                <li><strong>Session ID:</strong> ${sessionId}</li>
                <li><strong>Date:</strong> ${new Date().toLocaleDateString()}</li>
              </ul>
              
              <p>Don't worry - no charges were made to your account. You can try purchasing again or contact our support team for assistance.</p>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/lead-generation" class="button">
                Try Again
              </a>
              
              <p>Need help? Contact our support team at <a href="mailto:support@arbitrageos.com">support@arbitrageos.com</a></p>
            </div>
            
            <div class="footer">
              <p>arbitrageOS Lead Generation Platform</p>
              <p>You received this email because of a payment attempt on our platform.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const result = await resend.emails.send({
        from: 'arbitrageOS <noreply@arbitrageos.com>',
        to: userEmail,
        subject: `Payment Issue - ${packageName} Purchase`,
        html
      });

      console.log('✅ Payment failure notification sent:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Failed to send payment failure notification:', error);
      throw error;
    }
  }

  // Send magic link email via Resend (replaces Supabase default email)
  static async sendMagicLinkEmail(
    userEmail: string,
    magicLink: string
  ) {
    console.log('📧 Sending magic link email via Resend to:', userEmail);

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://arbitrageos.com';
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0b2520 0%, #0f2e2c 50%, #062f23 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
            .header h1 { margin: 0; font-size: 28px; letter-spacing: 1px; }
            .header p { margin: 8px 0 0; opacity: 0.8; font-size: 14px; }
            .content { padding: 32px 24px; background: #ffffff; }
            .footer { padding: 20px; text-align: center; color: #888; font-size: 12px; background: #fafafa; border-radius: 0 0 12px 12px; }
            .button { background: #5CC49D; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: 600; font-size: 16px; }
            .button:hover { background: #4ab38c; }
            .divider { height: 1px; background: #eee; margin: 24px 0; }
            .info-box { background: #f0faf6; border-left: 4px solid #5CC49D; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ArbitrageOS</h1>
              <p>Your AI Growth Operating System</p>
            </div>

            <div class="content">
              <h2 style="margin-top: 0;">Sign in to ArbitrageOS</h2>

              <p>Click the button below to securely sign in to your account. No password needed.</p>

              <div style="text-align: center;">
                <a href="${magicLink}" class="button">
                  Sign In to ArbitrageOS
                </a>
              </div>

              <div class="info-box">
                <p style="margin: 0; font-size: 14px;">
                  <strong>This link expires in 1 hour.</strong> If it expires, you can request a new one from the login page.
                </p>
              </div>

              <div class="divider"></div>

              <p style="font-size: 13px; color: #666;">
                If you didn't request this email, you can safely ignore it. Only someone with access to your email can use this link.
              </p>

              <p style="font-size: 12px; color: #999; word-break: break-all;">
                If the button doesn't work, copy and paste this URL into your browser:<br>
                <a href="${magicLink}" style="color: #5CC49D;">${magicLink}</a>
              </p>
            </div>

            <div class="footer">
              <p>ArbitrageOS - AI-Powered Growth Platform</p>
              <p>You received this email because a sign-in was requested for this email address.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const result = await resend.emails.send({
        from: 'ArbitrageOS <noreply@arbitrageos.com>',
        to: userEmail,
        subject: 'Sign in to ArbitrageOS',
        html
      });

      console.log('✅ Magic link email sent via Resend:', result);
      return result;

    } catch (error) {
      console.error('❌ Failed to send magic link email:', error);
      throw error;
    }
  }

  // Send invite email via Resend (for new user invitations)
  static async sendInviteEmail(
    userEmail: string,
    magicLink: string,
    invitedBy: string
  ) {
    console.log('📧 Sending invite email via Resend to:', userEmail);

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://arbitrageos.com';
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0b2520 0%, #0f2e2c 50%, #062f23 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
            .header h1 { margin: 0; font-size: 28px; letter-spacing: 1px; }
            .header p { margin: 8px 0 0; opacity: 0.8; font-size: 14px; }
            .content { padding: 32px 24px; background: #ffffff; }
            .footer { padding: 20px; text-align: center; color: #888; font-size: 12px; background: #fafafa; border-radius: 0 0 12px 12px; }
            .button { background: #5CC49D; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: 600; font-size: 16px; }
            .button:hover { background: #4ab38c; }
            .divider { height: 1px; background: #eee; margin: 24px 0; }
            .info-box { background: #f0faf6; border-left: 4px solid #5CC49D; padding: 12px 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
            .feature-list { list-style: none; padding: 0; }
            .feature-list li { padding: 8px 0; padding-left: 24px; position: relative; }
            .feature-list li:before { content: "✓"; position: absolute; left: 0; color: #5CC49D; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ArbitrageOS</h1>
              <p>You've been invited!</p>
            </div>

            <div class="content">
              <h2 style="margin-top: 0;">Welcome to ArbitrageOS</h2>

              <p><strong>${invitedBy}</strong> has invited you to join ArbitrageOS - the AI-powered growth operating system.</p>

              <p>Here's what you'll get access to:</p>
              <ul class="feature-list">
                <li>AI-powered lead generation</li>
                <li>Cold email writer &amp; campaigns</li>
                <li>Growth plan creator</li>
                <li>AI agent crews &amp; automation</li>
                <li>Niche research tools</li>
              </ul>

              <div style="text-align: center;">
                <a href="${magicLink}" class="button">
                  Accept Invite &amp; Sign In
                </a>
              </div>

              <div class="info-box">
                <p style="margin: 0; font-size: 14px;">
                  <strong>This invite expires in 7 days.</strong> The sign-in link itself expires in 1 hour, but you can always request a new one from the login page.
                </p>
              </div>

              <div class="divider"></div>

              <p style="font-size: 13px; color: #666;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>

              <p style="font-size: 12px; color: #999; word-break: break-all;">
                If the button doesn't work, copy and paste this URL into your browser:<br>
                <a href="${magicLink}" style="color: #5CC49D;">${magicLink}</a>
              </p>
            </div>

            <div class="footer">
              <p>ArbitrageOS - AI-Powered Growth Platform</p>
              <p>You received this email because you were invited to join ArbitrageOS.</p>
              <p>Questions? Contact <a href="mailto:team@growaiagency.io" style="color: #5CC49D;">team@growaiagency.io</a></p>
            </div>
          </div>
        </body>
        </html>
      `;

      const result = await resend.emails.send({
        from: 'ArbitrageOS <noreply@arbitrageos.com>',
        to: userEmail,
        subject: "You're invited to ArbitrageOS",
        html
      });

      console.log('✅ Invite email sent via Resend:', result);
      return result;

    } catch (error) {
      console.error('❌ Failed to send invite email:', error);
      throw error;
    }
  }

  // Send admin notification for manual intervention
  static async sendAdminAlert(
    sessionId: string,
    userId: string,
    packageName: string,
    credits: number,
    error: string
  ) {
    console.log('🚨 Sending admin alert for failed credit addition');
    
    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ff4d4f; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .alert { background: #fff2f0; border-left: 4px solid #ff4d4f; padding: 12px; margin: 16px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 MANUAL INTERVENTION REQUIRED</h1>
            </div>
            
            <div class="content">
              <div class="alert">
                <h3>Failed to Add Credits After Successful Payment</h3>
                <p>A customer's payment was processed successfully by Stripe, but adding credits to their account failed.</p>
              </div>
              
              <h3>Details:</h3>
              <ul>
                <li><strong>User ID:</strong> ${userId}</li>
                <li><strong>Session ID:</strong> ${sessionId}</li>
                <li><strong>Package:</strong> ${packageName}</li>
                <li><strong>Credits:</strong> ${credits}</li>
                <li><strong>Error:</strong> ${error}</li>
                <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
              </ul>
              
              <h3>Required Actions:</h3>
              <ol>
                <li>Verify payment in Stripe dashboard</li>
                <li>Manually add ${credits} credits to user ${userId}</li>
                <li>Send confirmation email to customer</li>
                <li>Investigate and fix the underlying issue</li>
              </ol>
              
              <p><strong>Priority:</strong> HIGH - Customer paid but didn't receive credits</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const result = await resend.emails.send({
        from: 'alerts@arbitrageos.com',
        to: 'admin@arbitrageos.com', // Your admin email
        subject: `🚨 URGENT: Credit Addition Failed - ${sessionId}`,
        html
      });

      console.log('✅ Admin alert sent:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Failed to send admin alert:', error);
      throw error;
    }
  }
}