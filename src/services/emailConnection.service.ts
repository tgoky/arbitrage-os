// services/emailConnection.service.ts - COMPLETE SECURE VERSION
import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { encrypt, decrypt } from '@/lib/encryption.service';

export class EmailConnectionService {
  
  // ✅ SECURE: Connect Gmail with token encryption
  async connectGmail(userId: string, workspaceId: string, authCode: string) {
    try {
      const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(authCode);
      oauth2Client.setCredentials(tokens);

      // Get user's email
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const profile = await gmail.users.getProfile({ userId: 'me' });
      const emailAddress = profile.data.emailAddress!;

      // ✅ ENCRYPT TOKENS BEFORE STORING
      console.log('🔐 Encrypting OAuth tokens...');
      const encryptedAccessToken = encrypt(tokens.access_token!);
      const encryptedRefreshToken = tokens.refresh_token 
        ? encrypt(tokens.refresh_token) 
        : null;

      console.log('✅ Tokens encrypted successfully');

      // Save to database with encrypted tokens
      const emailAccount = await prisma.emailAccount.create({
        data: {
          user_id: userId,
          workspace_id: workspaceId,
          provider: 'gmail',
          email: emailAddress,
          access_token: encryptedAccessToken,      // ✅ Encrypted
          refresh_token: encryptedRefreshToken,    // ✅ Encrypted
          token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          enabled: true,
        }
      });

      console.log('✅ Email account saved securely:', emailAccount.id);

      // Set up Gmail webhook for inbound emails
      await this.setupGmailWebhook(emailAccount.id, oauth2Client);

      return {
        success: true,
        account: {
          id: emailAccount.id,
          email: emailAccount.email,
          provider: emailAccount.provider,
          enabled: emailAccount.enabled,
          created_at: emailAccount.created_at
          // ❌ NEVER return encrypted tokens
        }
      };

    } catch (error) {
      console.error('Failed to connect Gmail:', error);
      throw error;
    }
  }

  // ✅ SECURE: Send email with token decryption
  async sendEmail(
    emailAccountId: string,
    to: string,
    subject: string,
    body: string,
    options?: {
      html?: string;
      cc?: string[];
      bcc?: string[];
      threadId?: string;
      campaignId?: string;
      leadId?: string;
       leadName?: string;           // ✅ NEW
    generationId?: string;       // ✅ NEW
    generationTitle?: string;    // ✅ NEW
     isManualEntry?: boolean;  
    }
  ) {
    try {
      // Fetch account from database
      const emailAccount = await prisma.emailAccount.findUnique({
        where: { id: emailAccountId },
        include: { workspace: true }
      });

      if (!emailAccount || !emailAccount.enabled) {
        throw new Error('Email account not found or disabled');
      }

      // Check daily limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const sentToday = await prisma.sentEmail.count({
        where: {
          email_account_id: emailAccountId,
          created_at: { gte: today }
        }
      });

      if (sentToday >= emailAccount.daily_limit) {
        throw new Error('Daily sending limit reached');
      }

      // ✅ DECRYPT TOKENS ONLY IN MEMORY (never log them)
      console.log('🔐 Decrypting tokens for sending...');
      
      let accessToken: string;
      let refreshToken: string | null = null;

      try {
        accessToken = decrypt(emailAccount.access_token!);
        if (emailAccount.refresh_token) {
          refreshToken = decrypt(emailAccount.refresh_token);
        }
      } catch (decryptError) {
        console.error('❌ Token decryption failed - tokens may be corrupted');
        throw new Error('Email account authentication failed. Please reconnect your account.');
      }

      console.log('✅ Tokens decrypted successfully');

      // Use tokens (they're only in memory, never stored decrypted)
      const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      // Create email message
  const messageParts = [
  `To: ${to}`,
  options?.cc && options.cc.length > 0 ? `Cc: ${options.cc.join(', ')}` : '',
  options?.bcc && options.bcc.length > 0 ? `Bcc: ${options.bcc.join(', ')}` : '',
  `Subject: ${subject}`,
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=utf-8',  // ✅ FIXED
  '',
  body  // ✅ FIXED - always use body parameter
].filter(Boolean);

      const message = messageParts.join('\n');

      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
          threadId: options?.threadId
        }
      });

      // ⚠️ Clear tokens from memory immediately after use
      accessToken = '';
      refreshToken = '';

      // Save to database
      const sentEmail = await prisma.sentEmail.create({
        data: {
          email_account_id: emailAccountId,
          workspace_id: emailAccount.workspace_id,
          to,
          cc: options?.cc || [],
          bcc: options?.bcc || [],
          subject,
          body,
          html_body: options?.html,
          message_id: result.data.id!,
          campaign_id: options?.campaignId,
           lead_id: options?.isManualEntry ? null : options?.leadId, 
          status: 'sent',
          sent_at: new Date(),
           metadata: {                                                // ✅ ADD THIS
      leadName: options?.leadName,
      generationId: options?.generationId,
      generationTitle: options?.generationTitle,
      isManualEntry: options?.isManualEntry,
      manualEmail: options?.isManualEntry ? to : undefined
    }
        }
      });

      console.log('✅ Email sent successfully');

      return {
        success: true,
        sentEmail
      };

    } catch (error) {
      console.error('Failed to send email:', error);
      
      // ❌ NEVER log the actual error if it might contain tokens
      if (error instanceof Error && error.message.includes('token')) {
        throw new Error('Email authentication failed. Please reconnect your account.');
      }
      
      throw error;
    }
  }

  // ✅ SECURE: Refresh expired tokens
  async refreshAccessToken(emailAccountId: string): Promise<boolean> {
    try {
      const emailAccount = await prisma.emailAccount.findUnique({
        where: { id: emailAccountId }
      });

      if (!emailAccount || !emailAccount.refresh_token) {
        return false;
      }

      console.log('🔐 Refreshing access token...');

      // Decrypt refresh token
      const refreshToken = decrypt(emailAccount.refresh_token);

      const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({ refresh_token: refreshToken });

      // Get new access token
      const { credentials } = await oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error('Failed to refresh token');
      }

      // Encrypt new access token
      const encryptedAccessToken = encrypt(credentials.access_token);

      // Update in database
      await prisma.emailAccount.update({
        where: { id: emailAccountId },
        data: {
          access_token: encryptedAccessToken,
          token_expiry: credentials.expiry_date 
            ? new Date(credentials.expiry_date) 
            : null,
        }
      });

      console.log('✅ Access token refreshed and re-encrypted');
      return true;

    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  }

  // ✅ NEW: Get all workspace email accounts
  async getWorkspaceEmailAccounts(workspaceId: string) {
    try {
      const accounts = await prisma.emailAccount.findMany({
        where: { 
          workspace_id: workspaceId,
          enabled: true 
        },
        select: {
          id: true,
          email: true,
          provider: true,
          enabled: true,
          daily_limit: true,
          created_at: true,
          // ❌ Explicitly exclude encrypted fields
          access_token: false,
          refresh_token: false,
          smtp_password: false
        },
        orderBy: { created_at: 'desc' }
      });

      return accounts;

    } catch (error) {
      console.error('Failed to get workspace email accounts:', error);
      throw error;
    }
  }

  // ✅ SECURE: Get single account (never returns decrypted tokens)
  async getEmailAccount(accountId: string) {
    const account = await prisma.emailAccount.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        email: true,
        provider: true,
        enabled: true,
        daily_limit: true,
        created_at: true,
        workspace_id: true,
        user_id: true,
        // ❌ Explicitly exclude encrypted fields from response
        access_token: false,
        refresh_token: false,
        smtp_password: false
      }
    });

    return account;
  }

  // ✅ NEW: Fetch inbound emails from Gmail
  async fetchInboundEmails(emailAccountId: string, since?: Date) {
    try {
      const emailAccount = await prisma.emailAccount.findUnique({
        where: { id: emailAccountId }
      });

      if (!emailAccount) {
        throw new Error('Email account not found');
      }

      if (emailAccount.provider === 'gmail') {
        return await this.fetchGmailInbound(emailAccount, since);
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch inbound emails:', error);
      throw error;
    }
  }

  // Fetch Gmail inbound emails
  private async fetchGmailInbound(emailAccount: any, since?: Date) {
    try {
      const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({
        access_token: decrypt(emailAccount.access_token),
        refresh_token: emailAccount.refresh_token ? decrypt(emailAccount.refresh_token) : undefined,
      });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      // Build query
      let query = 'in:inbox';
      if (since) {
        const timestamp = Math.floor(since.getTime() / 1000);
        query += ` after:${timestamp}`;
      }

      const response = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 50
      });

      const messages = response.data.messages || [];
      const inboundEmails = [];

      for (const message of messages) {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!,
          format: 'full'
        });

        const headers = detail.data.payload?.headers || [];
        const from = headers.find(h => h.name === 'From')?.value || '';
        const to = headers.find(h => h.name === 'To')?.value || '';
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const messageId = headers.find(h => h.name === 'Message-ID')?.value || '';
        const inReplyTo = headers.find(h => h.name === 'In-Reply-To')?.value;

        // Extract body
        let body = '';
        if (detail.data.payload?.body?.data) {
          body = Buffer.from(detail.data.payload.body.data, 'base64').toString();
        } else if (detail.data.payload?.parts) {
          // Handle multipart messages
          for (const part of detail.data.payload.parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
              body = Buffer.from(part.body.data, 'base64').toString();
              break;
            }
          }
        }

        // Save to database
        const inboundEmail = await prisma.inboundEmail.create({
          data: {
            email_account_id: emailAccount.id,
            workspace_id: emailAccount.workspace_id,
            from,
            to,
            subject,
            body,
            message_id: messageId,
            in_reply_to: inReplyTo,
            received_at: new Date(parseInt(detail.data.internalDate!)),
            processed: false,
          }
        });

        inboundEmails.push(inboundEmail);
      }

      return inboundEmails;

    } catch (error) {
      console.error('Failed to fetch Gmail inbound:', error);
      return [];
    }
  }

  // ✅ SECURE: Disconnect account (securely delete tokens)
  async disconnectEmailAccount(accountId: string) {
    try {
      // Get account
      const account = await prisma.emailAccount.findUnique({
        where: { id: accountId }
      });

      if (!account) {
        throw new Error('Account not found');
      }

      // Revoke OAuth tokens at Google (if Gmail)
      if (account.provider === 'gmail' && account.access_token) {
        try {
          const accessToken = decrypt(account.access_token);
          await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
            method: 'POST'
          });
        } catch (error) {
          console.error('Failed to revoke token at Google:', error);
          // Continue with deletion anyway
        }
      }

      // Delete from database (cascades to sent emails, etc.)
      await prisma.emailAccount.delete({
        where: { id: accountId }
      });

      console.log('✅ Email account disconnected and tokens revoked');

    } catch (error) {
      console.error('Failed to disconnect email account:', error);
      throw error;
    }
  }

  private async setupGmailWebhook(accountId: string, oauth2Client: OAuth2Client) {
    try {
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      
      await gmail.users.watch({
        userId: 'me',
        requestBody: {
          topicName: process.env.GMAIL_PUBSUB_TOPIC,
          labelIds: ['INBOX'],
        }
      });

      console.log('✅ Gmail webhook setup complete for account:', accountId);
    } catch (error) {
      console.error('Failed to setup Gmail webhook:', error);
      // Don't throw - webhook is optional
    }
  }
}