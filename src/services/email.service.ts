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

      console.log('  Purchase confirmation email sent:', result);
      return result;
      
    } catch (error) {
      console.error('  Failed to send purchase confirmation email:', error);
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

      console.log('  Payment failure notification sent:', result);
      return result;
      
    } catch (error) {
      console.error('  Failed to send payment failure notification:', error);
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

      console.log('  Admin alert sent:', result);
      return result;
      
    } catch (error) {
      console.error('  Failed to send admin alert:', error);
      throw error;
    }
  }
}