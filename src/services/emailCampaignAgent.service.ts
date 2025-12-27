// services/emailCampaignAgent.service.ts - PRODUCTION VERSION
import { prisma } from '@/lib/prisma';
import { EmailConnectionService } from './emailConnection.service';
import { Redis } from '@upstash/redis';
import { OpenRouterClient } from '@/lib/openrouter';

// Types
interface CampaignConfig {
  name: string;
  description?: string;
  emailAccountId: string;
  leadIds: string[];
  scheduleType: 'immediate' | 'scheduled' | 'drip';
  startDate?: Date;
  dripInterval?: number;
  autoReply?: boolean;
  autoFollowup?: boolean;
  maxFollowups?: number;
  emailTemplate: {
    method: string;
    tone: string;
    valueProposition: string;
    targetIndustry: string;
    targetRole: string;
  };
}

interface PersonalizedEmail {
  subject: string;
  body: string;
  htmlBody: string;
}

interface CampaignAnalytics {
  totalCampaigns: number;
  activeCampaigns: number;
  emailsSent: number;
  emailsOpened: number;
  emailsReplied: number;
  averageOpenRate: number;
  averageReplyRate: number;
  topPerformingCampaigns: Array<{
    id: string;
    name: string;
    openRate: number;
    replyRate: number;
  }>;
  sentimentDistribution: {
    interested: number;
    neutral: number;
    negative: number;
    not_interested: number;
  };
}

export class EmailCampaignAgent {
  private emailService: EmailConnectionService;
  private redis: Redis;
  private openRouterClient: OpenRouterClient;

  constructor() {
    this.emailService = new EmailConnectionService();
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!
    });
    this.openRouterClient = new OpenRouterClient(process.env.OPENROUTER_API_KEY!);
  }

  // ==================== CAMPAIGN MANAGEMENT ====================

  async createCampaign(
    userId: string,
    workspaceId: string,
    config: CampaignConfig
  ) {
    try {
      console.log('📧 Creating email campaign:', config.name);

      // Validate email account
      const emailAccount = await prisma.emailAccount.findUnique({
        where: { id: config.emailAccountId }
      });

      if (!emailAccount || !emailAccount.enabled) {
        throw new Error('Email account not found or disabled');
      }

      // Validate leads exist
      const leads = await prisma.lead.findMany({
        where: {
          id: { in: config.leadIds },
          workspace_id: workspaceId
        }
      });

      if (leads.length === 0) {
        throw new Error('No valid leads found');
      }

      console.log(`✅ Validated ${leads.length} leads for campaign`);

      // Create campaign
      const campaign = await prisma.emailCampaign.create({
        data: {
          workspace_id: workspaceId,
          user_id: userId,
          name: config.name,
          description: config.description,
          target_leads: config.leadIds,
          email_account_id: config.emailAccountId,
          schedule_type: config.scheduleType,
          start_date: config.startDate,
          drip_interval: config.dripInterval,
          auto_reply: config.autoReply || false,
          auto_followup: config.autoFollowup || false,
          max_followups: config.maxFollowups || 3,
          status: config.scheduleType === 'immediate' ? 'active' : 'draft',
          metadata: {
            emailTemplate: config.emailTemplate,
            createdAt: new Date().toISOString()
          }
        }
      });

      console.log('✅ Campaign created:', campaign.id);

      // If immediate, start sending
      if (config.scheduleType === 'immediate') {
        // Run in background (don't await)
        this.processCampaign(campaign.id).catch(error => {
          console.error('Background campaign processing error:', error);
        });
      }

      // Invalidate campaign cache
      await this.invalidateCampaignCache(userId, workspaceId);

      return {
        success: true,
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          targetLeads: leads.length,
          createdAt: campaign.created_at
        }
      };

    } catch (error) {
      console.error('Failed to create campaign:', error);
      throw error;
    }
  }

  async processCampaign(campaignId: string) {
    const startTime = Date.now();
    
    try {
      const campaign = await prisma.emailCampaign.findUnique({
        where: { id: campaignId },
        include: {
          emailAccount: true,
          workspace: true
        }
      });

      if (!campaign || campaign.status !== 'active') {
        console.log('⏭️ Campaign not active or not found:', campaignId);
        return;
      }

      // Get leads to email
      const leads = await prisma.lead.findMany({
        where: {
          id: { in: campaign.target_leads },
          workspace_id: campaign.workspace_id
        }
      });

      console.log(`📧 Processing campaign ${campaign.name} for ${leads.length} leads`);

      let emailsSent = 0;
      let tokensUsed = 0;

      for (const lead of leads) {
        try {
          // Check if already contacted recently
          if (lead.last_contacted) {
            const daysSinceContact = Math.floor(
              (Date.now() - lead.last_contacted.getTime()) / (1000 * 60 * 60 * 24)
            );
            
            if (daysSinceContact < 7) {
              console.log(`⏭️ Skipping ${lead.email} - contacted ${daysSinceContact} days ago`);
              continue;
            }
          }

          // Generate personalized email using AI
          const emailTemplate = campaign.metadata as any;
          const { email: personalizedEmail, tokens } = await this.generatePersonalizedEmail(
            lead, 
            emailTemplate.emailTemplate
          );

          tokensUsed += tokens;

          // Send email
          const result = await this.emailService.sendEmail(
            campaign.email_account_id,
            lead.email,
            personalizedEmail.subject,
            personalizedEmail.body,
            {
              html: personalizedEmail.htmlBody,
              campaignId: campaign.id,
              leadId: lead.id
            }
          );

          if (result.success) {
            emailsSent++;
            
            // Update lead status
            await prisma.lead.update({
              where: { id: lead.id },
              data: {
                status: 'contacted',
                last_contacted: new Date()
              }
            });

            console.log(`✅ Sent email to ${lead.email}`);
          }

          // Rate limiting - wait between sends (2 seconds)
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          console.error(`Failed to send to ${lead.email}:`, error);
          
          // Log failed send
          await prisma.sentEmail.create({
            data: {
              email_account_id: campaign.email_account_id,
              workspace_id: campaign.workspace_id,
              to: lead.email,
              subject: 'Failed to generate',
              body: 'Email generation failed',
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error',
              campaign_id: campaign.id,
              lead_id: lead.id
            }
          });
        }
      }

      // Update campaign stats
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          emails_sent: { increment: emailsSent },
          status: emailsSent === leads.length ? 'completed' : 'active',
          metadata: {
            ...(campaign.metadata as any),
            tokensUsed,
            processingTime: Date.now() - startTime,
            lastProcessed: new Date().toISOString()
          }
        }
      });

      console.log(`✅ Campaign processed: ${emailsSent}/${leads.length} emails sent in ${Date.now() - startTime}ms`);

    } catch (error) {
      console.error('Failed to process campaign:', error);
      
      // Mark campaign as failed
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          status: 'paused',
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
            failedAt: new Date().toISOString()
          }
        }
      });
    }
  }

  // ==================== AI EMAIL GENERATION ====================

  private async generatePersonalizedEmail(
    lead: any, 
    template: any
  ): Promise<{ email: PersonalizedEmail; tokens: number }> {
    try {
      // Check cache first
      const cacheKey = `email:${lead.id}:${template.method}:${template.tone}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        console.log('✅ Using cached email for:', lead.email);
        if (typeof cached === 'string') {
          return { email: JSON.parse(cached), tokens: 0 };
        }
        return { email: cached as PersonalizedEmail, tokens: 0 };
      }

      const prompt = `Generate a highly personalized cold email for:

Lead Information:
- Name: ${lead.first_name} ${lead.last_name}
- Email: ${lead.email}
- Company: ${lead.company}
- Job Title: ${lead.job_title}
- Industry: ${lead.industry}

Email Strategy:
- Method: ${template.method}
- Tone: ${template.tone}
- Value Proposition: ${template.valueProposition}
- Target Industry: ${template.targetIndustry}
- Target Role: ${template.targetRole}

Generate a professional cold email that:
1. Addresses them by name
2. References their company and role
3. Shows understanding of their industry challenges
4. Presents the value proposition naturally
5. Has a clear, low-pressure call to action

CRITICAL: Return ONLY valid JSON with this exact structure:
{
  "subject": "compelling subject line",
  "body": "email body text with proper formatting",
  "htmlBody": "<p>HTML formatted email body</p>"
}`;

      const response = await this.openRouterClient.complete({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert email copywriter. Generate personalized, high-converting cold emails. Always return valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 1000
      });

      // Parse JSON response
      let emailData: PersonalizedEmail;
      try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          emailData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.warn('Failed to parse AI response, using fallback:', parseError);
        emailData = this.generateFallbackEmail(lead, template);
      }

      // Validate email structure
      if (!emailData.subject || !emailData.body) {
        console.warn('Invalid email structure, using fallback');
        emailData = this.generateFallbackEmail(lead, template);
      }

      // Cache for 1 hour
      await this.redis.set(cacheKey, JSON.stringify(emailData), { ex: 3600 });

      return {
        email: emailData,
        tokens: response.usage.total_tokens
      };

    } catch (error) {
      console.error('Failed to generate personalized email:', error);
      return {
        email: this.generateFallbackEmail(lead, template),
        tokens: 0
      };
    }
  }

  private generateFallbackEmail(lead: any, template: any): PersonalizedEmail {
    const subject = `Quick question about ${lead.company}`;
    const body = `Hi ${lead.first_name},

I noticed ${lead.company} is in the ${lead.industry} space. ${template.valueProposition}

Would you be open to a brief 15-minute call to discuss how this could benefit ${lead.company}?

Best regards`;

    const htmlBody = `
      <p>Hi ${lead.first_name},</p>
      <p>I noticed ${lead.company} is in the ${lead.industry} space. ${template.valueProposition}</p>
      <p>Would you be open to a brief 15-minute call to discuss how this could benefit ${lead.company}?</p>
      <p>Best regards</p>
    `;

    return { subject, body, htmlBody };
  }

  // ==================== INBOUND EMAIL PROCESSING ====================

  async processInboundEmails(emailAccountId: string) {
    try {
      console.log('📥 Processing inbound emails for account:', emailAccountId);

      // Fetch new inbound emails
      const inboundEmails = await prisma.inboundEmail.findMany({
        where: {
          email_account_id: emailAccountId,
          processed: false
        },
        orderBy: { received_at: 'desc' },
        take: 50
      });

      console.log(`Found ${inboundEmails.length} unprocessed emails`);

      let processedCount = 0;

      for (const email of inboundEmails) {
        try {
          // Find related lead
          const lead = await prisma.lead.findFirst({
            where: {
              email: email.from,
              workspace_id: email.workspace_id
            }
          });

          if (!lead) {
            console.log(`No lead found for ${email.from}`);
            await prisma.inboundEmail.update({
              where: { id: email.id },
              data: { processed: true }
            });
            continue;
          }

          // Analyze sentiment using AI
          const { sentiment, summary } = await this.analyzeSentiment(email.body);
          
          // Update lead based on sentiment
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              status: sentiment === 'interested' ? 'interested' : 
                     sentiment === 'negative' ? 'not_interested' : 'replied',
              last_reply: new Date()
            }
          });

          // Update email record
          await prisma.inboundEmail.update({
            where: { id: email.id },
            data: {
              processed: true,
              sentiment,
              ai_summary: summary,
              requires_action: sentiment === 'interested'
            }
          });

          // If interested and auto-reply enabled, generate response
          if (sentiment === 'interested') {
            await this.handleInterestedReply(email, lead);
          }

          processedCount++;
          console.log(`✅ Processed email from ${email.from} - Sentiment: ${sentiment}`);

        } catch (error) {
          console.error(`Failed to process email ${email.id}:`, error);
          
          // Mark as processed to avoid retry loop
          await prisma.inboundEmail.update({
            where: { id: email.id },
            data: {
              processed: true,
              metadata: {
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          });
        }
      }

      console.log(`✅ Processed ${processedCount}/${inboundEmails.length} inbound emails`);

    } catch (error) {
      console.error('Failed to process inbound emails:', error);
    }
  }

  private async analyzeSentiment(emailBody: string): Promise<{ sentiment: string; summary: string }> {
    try {
      // Check cache
      const cacheKey = `sentiment:${Buffer.from(emailBody).toString('base64').substring(0, 50)}`;
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        if (typeof cached === 'string') {
          return JSON.parse(cached);
        }
        return cached as { sentiment: string; summary: string };
      }

      const response = await this.openRouterClient.complete({
        model: 'openai/gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Analyze this email reply and return ONLY valid JSON:

Email: ${emailBody}

Return format:
{
  "sentiment": "interested" | "neutral" | "negative" | "not_interested",
  "summary": "brief summary of the email content"
}`
        }],
        temperature: 0.3,
        max_tokens: 200
      });

      // Parse response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        
        // Validate sentiment
        const validSentiments = ['interested', 'neutral', 'negative', 'not_interested'];
        if (!validSentiments.includes(result.sentiment)) {
          result.sentiment = 'neutral';
        }

        // Cache for 24 hours
        await this.redis.set(cacheKey, JSON.stringify(result), { ex: 86400 });
        
        return result;
      }

      return { sentiment: 'neutral', summary: 'Unable to analyze' };

    } catch (error) {
      console.error('Failed to analyze sentiment:', error);
      return { sentiment: 'neutral', summary: 'Analysis failed' };
    }
  }

  private async handleInterestedReply(email: any, lead: any) {
    try {
      console.log(`💚 Handling interested reply from ${lead.email}`);

      // Find campaign to check auto-reply setting
      const campaign = await prisma.emailCampaign.findFirst({
        where: {
          workspace_id: email.workspace_id,
          auto_reply: true,
          status: 'active'
        }
      });

      if (!campaign) {
        console.log('No active campaign with auto-reply enabled');
        return;
      }

      // Generate appropriate response
      const response = await this.openRouterClient.complete({
        model: 'openai/gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `The prospect ${lead.first_name} ${lead.last_name} from ${lead.company} replied positively.

Their reply: ${email.body}

Generate a professional follow-up response as JSON:
{
  "subject": "Re: [original subject]",
  "body": "professional response text",
  "htmlBody": "<p>HTML formatted response</p>"
}

The response should:
1. Thank them for their interest
2. Suggest a specific next step (call, demo, meeting)
3. Offer to answer questions
4. Be warm but professional`
        }],
        temperature: 0.7,
        max_tokens: 800
      });

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const reply = JSON.parse(jsonMatch[0]);
        
        // Send the reply
        const emailAccount = await prisma.emailAccount.findFirst({
          where: {
            workspace_id: email.workspace_id,
            email: email.to
          }
        });

        if (emailAccount) {
          await this.emailService.sendEmail(
            emailAccount.id,
            lead.email,
            reply.subject || `Re: ${email.subject}`,
            reply.body,
            {
              html: reply.htmlBody,
              leadId: lead.id
            }
          );

          console.log(`✅ Sent auto-reply to ${lead.email}`);
        }
      }

    } catch (error) {
      console.error('Failed to handle interested reply:', error);
    }
  }

  // ==================== FOLLOW-UP AUTOMATION ====================

  async scheduleFollowups(campaignId: string) {
    try {
      const campaign = await prisma.emailCampaign.findUnique({
        where: { id: campaignId }
      });

      if (!campaign || !campaign.auto_followup) {
        return;
      }

      // Find leads that haven't replied
      const dripDays = campaign.drip_interval || 3;
      const cutoffDate = new Date(Date.now() - dripDays * 24 * 60 * 60 * 1000);

      const sentEmails = await prisma.sentEmail.findMany({
        where: {
          campaign_id: campaignId,
          status: 'sent',
          replied_at: null,
          sent_at: { lte: cutoffDate }
        },
        include: {
          thread: true,
          lead: true
        }
      });

      console.log(`📅 Scheduling ${sentEmails.length} follow-ups for campaign ${campaign.name}`);

      for (const sentEmail of sentEmails) {
        if (!sentEmail.lead) continue;

        // Check if already sent max followups
        const followupCount = await prisma.sentEmail.count({
          where: {
            thread_id: sentEmail.thread_id,
            lead_id: sentEmail.lead_id
          }
        });

        if (followupCount >= campaign.max_followups) {
          console.log(`Max follow-ups reached for ${sentEmail.lead.email}`);
          continue;
        }

        // Generate and send followup
        await this.sendFollowup(campaign, sentEmail);
      }

    } catch (error) {
      console.error('Failed to schedule followups:', error);
    }
  }

  private async sendFollowup(campaign: any, originalEmail: any) {
    try {
      const lead = originalEmail.lead;
      if (!lead) return;

      const followupNumber = await prisma.sentEmail.count({
        where: {
          thread_id: originalEmail.thread_id,
          lead_id: lead.id
        }
      }) + 1;

      // Generate followup content
      const response = await this.openRouterClient.complete({
        model: 'openai/gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `Generate follow-up email #${followupNumber} as JSON:

Original email:
Subject: ${originalEmail.subject}
Body: ${originalEmail.body}

Lead: ${lead.first_name} ${lead.last_name} from ${lead.company}

Return format:
{
  "subject": "Re: [original subject]",
  "body": "follow-up email text",
  "htmlBody": "<p>HTML formatted follow-up</p>"
}

This is follow-up #${followupNumber}. Make it:
1. Brief and respectful
2. Add new value or perspective
3. Low pressure but clear CTA
4. Professional tone`
        }],
        temperature: 0.7,
        max_tokens: 800
      });

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const followup = JSON.parse(jsonMatch[0]);
        
        // Send followup
        await this.emailService.sendEmail(
          campaign.email_account_id,
          lead.email,
          followup.subject || `Re: ${originalEmail.subject}`,
          followup.body,
          {
            html: followup.htmlBody,
            threadId: originalEmail.thread_id,
            campaignId: campaign.id,
            leadId: lead.id
          }
        );

        console.log(`✅ Sent follow-up #${followupNumber} to ${lead.email}`);
      }

    } catch (error) {
      console.error('Failed to send followup:', error);
    }
  }

  // ==================== ANALYTICS & REPORTING ====================

  async getCampaignAnalytics(
    userId: string,
    workspaceId: string,
    timeframe: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<CampaignAnalytics> {
    try {
      // Calculate date filter
      const now = new Date();
      const dateFilter = new Date();
      
      switch (timeframe) {
        case 'week':
          dateFilter.setDate(now.getDate() - 7);
          break;
        case 'month':
          dateFilter.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          dateFilter.setMonth(now.getMonth() - 3);
          break;
      }

      // Get all campaigns
      const campaigns = await prisma.emailCampaign.findMany({
        where: {
          user_id: userId,
          workspace_id: workspaceId
        }
      });

      // Get sentiment distribution
      const sentimentCounts = await prisma.inboundEmail.groupBy({
        by: ['sentiment'],
        where: {
          workspace_id: workspaceId,
          received_at: { gte: dateFilter }
        },
        _count: true
      });

      const sentimentDistribution = {
        interested: 0,
        neutral: 0,
        negative: 0,
        not_interested: 0
      };

      sentimentCounts.forEach(item => {
        if (item.sentiment && item.sentiment in sentimentDistribution) {
          sentimentDistribution[item.sentiment as keyof typeof sentimentDistribution] = item._count;
        }
      });

      // Calculate metrics
      const totalEmailsSent = campaigns.reduce((sum, c) => sum + c.emails_sent, 0);
      const totalEmailsOpened = campaigns.reduce((sum, c) => sum + c.emails_opened, 0);
      const totalEmailsReplied = campaigns.reduce((sum, c) => sum + c.emails_replied, 0);

      // Top performing campaigns
      const topPerforming = campaigns
        .map(c => ({
          id: c.id,
          name: c.name,
          openRate: c.emails_sent > 0 ? (c.emails_opened / c.emails_sent) * 100 : 0,
          replyRate: c.emails_sent > 0 ? (c.emails_replied / c.emails_sent) * 100 : 0
        }))
        .sort((a, b) => b.replyRate - a.replyRate)
        .slice(0, 5);

      return {
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === 'active').length,
        emailsSent: totalEmailsSent,
        emailsOpened: totalEmailsOpened,
        emailsReplied: totalEmailsReplied,
        averageOpenRate: totalEmailsSent > 0 ? (totalEmailsOpened / totalEmailsSent) * 100 : 0,
        averageReplyRate: totalEmailsSent > 0 ? (totalEmailsReplied / totalEmailsSent) * 100 : 0,
        topPerformingCampaigns: topPerforming,
        sentimentDistribution
      };

    } catch (error) {
      console.error('Failed to get campaign analytics:', error);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  private async invalidateCampaignCache(userId: string, workspaceId: string) {
    const cacheKey = `campaigns:${userId}:${workspaceId}`;
    await this.redis.del(cacheKey);
  }

  async pauseCampaign(campaignId: string): Promise<boolean> {
    try {
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: { status: 'paused' }
      });
      return true;
    } catch (error) {
      console.error('Failed to pause campaign:', error);
      return false;
    }
  }

  async resumeCampaign(campaignId: string): Promise<boolean> {
    try {
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: { status: 'active' }
      });
      return true;
    } catch (error) {
      console.error('Failed to resume campaign:', error);
      return false;
    }
  }

  async deleteCampaign(userId: string, campaignId: string): Promise<boolean> {
    try {
      const result = await prisma.emailCampaign.deleteMany({
        where: {
          id: campaignId,
          user_id: userId
        }
      });
      return result.count > 0;
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      return false;
    }
  }
}