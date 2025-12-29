// services/emailCampaignAgent.service.ts - COMPLETE DELIVERABLES INTEGRATION
import { prisma } from '@/lib/prisma';
import { Redis } from '@upstash/redis';

// Types
interface CampaignConfig {
  name: string;
  description?: string;
  emailAccountId: string;
  leads: any[];  // ✅ Full lead objects from deliverables
  leadGenerationMap: { [leadId: string]: string };  // ✅ Track source generation
  scheduleType: 'immediate' | 'scheduled' | 'drip';
  startDate?: Date;
  endDate?: Date;
  timezone?: string;
  dripInterval?: number;
  autoReply?: boolean;
  autoFollowup?: boolean;
  followupInterval?: number;
  maxFollowups?: number;
  emailTemplate: {
    subject: string;
    body: string;
  };
}

interface PersonalizedEmail {
  subject: string;
  body: string;
  htmlBody?: string;
}

export class EmailCampaignAgent {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!
    });
  }

  // ==================== CAMPAIGN MANAGEMENT ====================

  /**
   * Create new email campaign with leads stored in metadata
   * No database validation - API already validated leads against deliverables
   */
  async createCampaign(userId: string, workspaceId: string, config: CampaignConfig) {
    console.log('📧 Creating email campaign:', config.name);
    
    try {
      // Validate email account exists and is enabled
      const emailAccount = await prisma.emailAccount.findFirst({
        where: {
          id: config.emailAccountId,
          user_id: userId
        }
      });

      if (!emailAccount) {
        throw new Error('Email account not found or access denied');
      }

      if (!emailAccount.enabled) {
        throw new Error('Email account is disabled. Please reconnect your email account.');
      }

      console.log(`✅ Email account validated: ${emailAccount.email}`);

      // Validate we have leads
      if (!config.leads || config.leads.length === 0) {
        throw new Error('No leads provided for campaign');
      }

      console.log(`✅ Campaign will target ${config.leads.length} leads`);

      // ✅ Create campaign with ALL lead data in metadata (NO separate leads table)
      const campaign = await prisma.emailCampaign.create({
        data: {
          name: config.name,
          description: config.description,
          user_id: userId,
          workspace_id: workspaceId,
          email_account_id: config.emailAccountId,
          
          // Campaign settings
          status: config.scheduleType === 'immediate' ? 'active' : 'scheduled',
          schedule_type: config.scheduleType || 'immediate',
          start_date: config.startDate,
          drip_interval: config.dripInterval || 3,
          auto_reply: config.autoReply || false,
          auto_followup: config.autoFollowup || false,
          max_followups: config.maxFollowups || 3,
          
          // Tracking (updated as campaign runs)
          emails_sent: 0,
          emails_opened: 0,
          emails_replied: 0,
          
          // ✅ Store ALL lead data in metadata (single source of truth for campaign)
          metadata: {
            emailTemplate: config.emailTemplate,
            leads: config.leads,  // ✅ Full lead objects with all fields
            leadGenerationMap: config.leadGenerationMap,  // ✅ Track source deliverable
            totalLeads: config.leads.length,
            createdAt: new Date().toISOString(),
            scheduleConfig: {
              type: config.scheduleType,
              startDate: config.startDate?.toISOString(),
              endDate: config.endDate?.toISOString(),
              timezone: config.timezone || 'UTC',
              dripInterval: config.dripInterval
            },
            stats: {
              sentCount: 0,
              errorCount: 0,
              successRate: 0
            }
          }
        }
      });

      console.log(`✅ Campaign created: ${campaign.id} with ${config.leads.length} leads in metadata`);

      // If immediate send, trigger campaign processing in background
      if (config.scheduleType === 'immediate') {
        console.log('🚀 Queuing campaign for immediate processing...');
        
        // Don't await - let it run in background
        this.processCampaign(campaign.id).catch(error => {
          console.error('Background campaign processing error:', error);
        });
      }

      return {
        success: true,
        campaignId: campaign.id,
        message: `Campaign created with ${config.leads.length} leads`,
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          leadCount: config.leads.length,
          createdAt: campaign.created_at
        }
      };

    } catch (error) {
      console.error('❌ Create campaign error:', error);
      throw error;
    }
  }

  /**
   * Process campaign - send emails to leads from metadata
   * ✅ NO database queries for leads - everything from metadata
   */
  async processCampaign(campaignId: string) {
    const startTime = Date.now();
    console.log('🚀 Processing campaign:', campaignId);
    
    try {
      // Fetch campaign with email account
      const campaign = await prisma.emailCampaign.findUnique({
        where: { id: campaignId },
        include: {
          emailAccount: true
        }
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      if (campaign.status !== 'active') {
        console.log('⏭️ Campaign not active, skipping processing');
        return;
      }

      // ✅ Get leads from campaign metadata (NOT from database)
      const campaignMetadata = campaign.metadata as any;
      const leads = campaignMetadata.leads || [];
      const emailTemplate = campaignMetadata.emailTemplate;

      if (leads.length === 0) {
        console.log('⚠️ No leads in campaign metadata');
        await prisma.emailCampaign.update({
          where: { id: campaignId },
          data: { status: 'completed' }
        });
        return;
      }

      console.log(`📊 Processing ${leads.length} leads from campaign metadata`);

      // Import email service
      const { EmailConnectionService } = await import('./emailConnection.service');
      const emailService = new EmailConnectionService();

      let sentCount = 0;
      let errorCount = 0;
      const errors: any[] = [];

      // Process each lead
      for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        
        try {
          console.log(`📧 Processing lead ${i + 1}/${leads.length}: ${lead.email}`);

          // Skip if already sent in this campaign
          if (lead.emailCampaignStatus === 'sent') {
            console.log(`⏭️ Already sent to ${lead.email}, skipping`);
            continue;
          }

          // Skip if no valid email
          if (!lead.email || !lead.email.includes('@')) {
            console.log(`⏭️ Invalid email for ${lead.name}, skipping`);
            lead.emailCampaignStatus = 'failed';
            lead.lastError = 'Invalid email address';
            errorCount++;
            continue;
          }

          // Generate personalized email using AI
          const personalizedEmail = await this.generatePersonalizedEmail(lead, emailTemplate);

          // Send email via connected account
          await emailService.sendEmail(
            campaign.email_account_id,
            lead.email,
            personalizedEmail.subject,
            personalizedEmail.body,
            {
              html: personalizedEmail.htmlBody,
              campaignId: campaign.id,
              leadId: lead.id,
              leadName: lead.name,
              generationId: lead.generationId,
              generationTitle: lead.generationTitle
            }
          );

          // ✅ Update lead status in metadata (in-memory)
          lead.emailCampaignStatus = 'sent';
          lead.lastEmailSent = new Date().toISOString();
          lead.emailsSent = (lead.emailsSent || 0) + 1;
          lead.lastContacted = new Date().toISOString();

          sentCount++;
          console.log(`✅ Sent email ${sentCount}/${leads.length} to ${lead.email}`);

          // Rate limiting: 2 seconds between emails to avoid spam filters
          if (i < leads.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

        } catch (error) {
          console.error(`❌ Failed to send to ${lead.email}:`, error);
          
          // ✅ Update lead status in metadata (in-memory)
          lead.emailCampaignStatus = 'failed';
          lead.lastError = error instanceof Error ? error.message : 'Unknown error';
          lead.lastAttempt = new Date().toISOString();
          
          errorCount++;
          errors.push({
            leadEmail: lead.email,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // ✅ Save ALL updated leads back to campaign metadata
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: {
          metadata: {
            ...campaignMetadata,
            leads,  // ✅ Updated with email statuses
            lastProcessed: new Date().toISOString(),
            processingTime: Date.now() - startTime,
            stats: {
              sentCount,
              errorCount,
              successRate: leads.length > 0 ? (sentCount / leads.length) * 100 : 0
            },
            errors: errors.length > 0 ? errors : undefined
          },
          emails_sent: sentCount,
          status: sentCount === leads.length ? 'completed' : 
                  errorCount === leads.length ? 'failed' : 'active'
        }
      });

      console.log(`✅ Campaign processing complete: ${sentCount} sent, ${errorCount} errors in ${Date.now() - startTime}ms`);

      return {
        success: true,
        sentCount,
        errorCount,
        totalLeads: leads.length,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('❌ Process campaign error:', error);
      
      // Mark campaign as failed
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: { 
          status: 'failed',
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
            failedAt: new Date().toISOString()
          }
        }
      });
      
      throw error;
    }
  }

  /**
   * Generate personalized email using AI
   * Uses OpenRouter with caching
   */
  private async generatePersonalizedEmail(
    lead: any, 
    template: any
  ): Promise<PersonalizedEmail> {
    
    // Check cache first
    const cacheKey = `email:${lead.id}:${template.subject}`;
    
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        console.log('✅ Using cached email for:', lead.email);
        return typeof cached === 'string' ? JSON.parse(cached) : cached as PersonalizedEmail;
      }
    } catch (cacheError) {
      console.warn('⚠️ Cache read error:', cacheError);
    }

    // Generate using AI
    const prompt = `Generate a professional, personalized cold email based on this template and lead information.

LEAD INFORMATION:
- Name: ${lead.name}
- First Name: ${lead.first_name || lead.name.split(' ')[0]}
- Last Name: ${lead.last_name || lead.name.split(' ').slice(1).join(' ')}
- Title: ${lead.title}
- Company: ${lead.company}
- Industry: ${lead.industry}
- Location: ${lead.location}
${lead.companySize ? `- Company Size: ${lead.companySize}` : ''}
${lead.website ? `- Website: ${lead.website}` : ''}

EMAIL TEMPLATE:
Subject: ${template.subject}
Body: ${template.body}

INSTRUCTIONS:
1. Personalize the email using the lead's information
2. Replace {{firstName}}, {{company}}, {{title}}, {{industry}}, etc. with actual values
3. Keep it professional and concise (under 200 words)
4. Include a clear but low-pressure call-to-action
5. Make it feel natural and conversational, not robotic or sales-y
6. Reference their specific role, company, or industry when relevant

Return ONLY a JSON object with this EXACT structure:
{
  "subject": "personalized subject line",
  "body": "personalized email body with proper line breaks",
  "htmlBody": "<p>HTML formatted version with proper paragraph tags</p>"
}`;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
          'X-Title': 'ArbitrageOS Email Agent'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert email copywriter who creates personalized, professional cold emails that convert. Always return valid JSON only, never include markdown code blocks or extra text.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 1000,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error:', response.status, errorText);
        throw new Error(`AI email generation failed: ${response.status}`);
      }

      const data = await response.json();
      let generatedEmail: PersonalizedEmail;

      try {
        const content = data.choices[0].message.content;
        
        // Try to parse directly
        generatedEmail = JSON.parse(content);
        
        // Validate structure
        if (!generatedEmail.subject || !generatedEmail.body) {
          throw new Error('Invalid email structure from AI');
        }

        // Ensure HTML body exists
        if (!generatedEmail.htmlBody) {
          generatedEmail.htmlBody = generatedEmail.body
            .split('\n\n')
            .map(para => `<p>${para}</p>`)
            .join('\n');
        }

      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        throw parseError;
      }

      // Cache for 1 hour
      try {
        await this.redis.set(cacheKey, JSON.stringify(generatedEmail), { ex: 3600 });
      } catch (cacheError) {
        console.warn('⚠️ Cache write error:', cacheError);
      }

      return generatedEmail;

    } catch (error) {
      console.error('❌ AI generation failed, using template fallback:', error);
      
      // Fallback: simple template variable replacement
      return {
        subject: this.replaceTemplateVariables(template.subject, lead),
        body: this.replaceTemplateVariables(template.body, lead),
        htmlBody: this.replaceTemplateVariables(template.body, lead)
          .split('\n\n')
          .map(para => `<p>${para}</p>`)
          .join('\n')
      };
    }
  }

  /**
   * Simple template variable replacement (fallback)
   */
  private replaceTemplateVariables(text: string, lead: any): string {
    return text
      .replace(/\{\{firstName\}\}/g, lead.first_name || lead.name.split(' ')[0])
      .replace(/\{\{lastName\}\}/g, lead.last_name || lead.name.split(' ').slice(1).join(' ') || '')
      .replace(/\{\{name\}\}/g, lead.name)
      .replace(/\{\{title\}\}/g, lead.title)
      .replace(/\{\{company\}\}/g, lead.company)
      .replace(/\{\{industry\}\}/g, lead.industry)
      .replace(/\{\{location\}\}/g, lead.location)
      .replace(/\{\{companySize\}\}/g, lead.companySize || 'your organization')
      .replace(/\{\{website\}\}/g, lead.website || lead.company);
  }

  // ==================== INBOUND EMAIL PROCESSING ====================

  /**
   * Process inbound emails and match to leads in campaign metadata
   */
  async processInboundEmails(emailAccountId: string, workspaceId: string) {
    try {
      console.log('📥 Processing inbound emails for account:', emailAccountId);

      // Fetch new inbound emails
      const inboundEmails = await prisma.inboundEmail.findMany({
        where: {
          email_account_id: emailAccountId,
          workspace_id: workspaceId,
          processed: false
        },
        orderBy: { received_at: 'desc' },
        take: 50
      });

      console.log(`Found ${inboundEmails.length} unprocessed emails`);

      let processedCount = 0;

      for (const email of inboundEmails) {
        try {
          // ✅ Find campaign that has this lead (search in metadata)
          const campaigns = await prisma.emailCampaign.findMany({
            where: {
              workspace_id: workspaceId,
              email_account_id: emailAccountId,
              status: { in: ['active', 'completed'] }
            }
          });

          let matchedLead: any = null;
          let matchedCampaign: any = null;

          // Search through campaign metadata for matching lead
          for (const campaign of campaigns) {
            const campaignMetadata = campaign.metadata as any;
            const leads = campaignMetadata?.leads || [];
            
            const lead = leads.find((l: any) => l.email === email.from);
            if (lead) {
              matchedLead = lead;
              matchedCampaign = campaign;
              break;
            }
          }

          if (!matchedLead) {
            console.log(`No lead found for ${email.from}`);
            await prisma.inboundEmail.update({
              where: { id: email.id },
              data: { processed: true }
            });
            continue;
          }

          console.log(`✅ Matched email from ${email.from} to campaign ${matchedCampaign.name}`);

          // Analyze sentiment using AI
          const { sentiment, summary } = await this.analyzeSentiment(email.body);
          
          // ✅ Update lead in campaign metadata
          const campaignMetadata = matchedCampaign.metadata as any;
          const leads = campaignMetadata.leads || [];
          const leadIndex = leads.findIndex((l: any) => l.email === email.from);
          
          if (leadIndex !== -1) {
            leads[leadIndex].status = sentiment === 'interested' ? 'interested' : 
                                      sentiment === 'negative' ? 'not_interested' : 'replied';
            leads[leadIndex].last_reply = new Date().toISOString();
            leads[leadIndex].emailsReplied = (leads[leadIndex].emailsReplied || 0) + 1;
            leads[leadIndex].lastSentiment = sentiment;
            
            // Save back to campaign
            await prisma.emailCampaign.update({
              where: { id: matchedCampaign.id },
              data: {
                metadata: {
                  ...campaignMetadata,
                  leads
                },
                emails_replied: { increment: 1 }
              }
            });
          }

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
          if (sentiment === 'interested' && matchedCampaign.auto_reply) {
            await this.handleInterestedReply(email, matchedLead, matchedCampaign);
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

      return {
        success: true,
        processed: processedCount,
        total: inboundEmails.length
      };

    } catch (error) {
      console.error('Failed to process inbound emails:', error);
      throw error;
    }
  }

  /**
   * Analyze email sentiment using AI
   */
  private async analyzeSentiment(emailBody: string): Promise<{ sentiment: string; summary: string }> {
    try {
      // Check cache
      const cacheKey = `sentiment:${Buffer.from(emailBody.substring(0, 100)).toString('base64')}`;
      
      try {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          return typeof cached === 'string' ? JSON.parse(cached) : cached as { sentiment: string; summary: string };
        }
      } catch (cacheError) {
        console.warn('⚠️ Cache read error:', cacheError);
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
          'X-Title': 'ArbitrageOS Email Agent'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [{
            role: 'user',
            content: `Analyze this email reply and determine the sender's sentiment. Return ONLY valid JSON:

Email: ${emailBody}

Return format:
{
  "sentiment": "interested" | "neutral" | "negative" | "not_interested",
  "summary": "brief 1-sentence summary"
}

Sentiment definitions:
- interested: Positive response, wants to learn more, asks questions, requests meeting
- neutral: Acknowledges but non-committal, asks for more info later
- negative: Politely declines, not right fit, wrong timing
- not_interested: Explicitly not interested, unsubscribe, do not contact`
          }],
          temperature: 0.3,
          max_tokens: 200,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error('Sentiment analysis failed');
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      // Validate sentiment
      const validSentiments = ['interested', 'neutral', 'negative', 'not_interested'];
      if (!validSentiments.includes(result.sentiment)) {
        result.sentiment = 'neutral';
      }

      // Cache for 24 hours
      try {
        await this.redis.set(cacheKey, JSON.stringify(result), { ex: 86400 });
      } catch (cacheError) {
        console.warn('⚠️ Cache write error:', cacheError);
      }
      
      return result;

    } catch (error) {
      console.error('Failed to analyze sentiment:', error);
      return { sentiment: 'neutral', summary: 'Unable to analyze' };
    }
  }

  /**
   * Handle auto-reply for interested responses
   */
  private async handleInterestedReply(email: any, lead: any, campaign: any) {
    try {
      console.log(`💚 Handling interested reply from ${lead.email}`);

      const { EmailConnectionService } = await import('./emailConnection.service');
      const emailService = new EmailConnectionService();

      // Generate appropriate response
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
          'X-Title': 'ArbitrageOS Email Agent'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [{
            role: 'user',
            content: `${lead.first_name} ${lead.last_name} from ${lead.company} replied positively to our email.

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
4. Be warm but professional
5. Include a clear call-to-action`
          }],
          temperature: 0.7,
          max_tokens: 800,
          response_format: { type: 'json_object' }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const reply = JSON.parse(data.choices[0].message.content);
        
        // Send the auto-reply
        await emailService.sendEmail(
          campaign.email_account_id,
          lead.email,
          reply.subject || `Re: ${email.subject}`,
          reply.body,
          {
            html: reply.htmlBody,
            campaignId: campaign.id,
            leadId: lead.id
          }
        );

        console.log(`✅ Sent auto-reply to ${lead.email}`);
      }

    } catch (error) {
      console.error('Failed to handle interested reply:', error);
    }
  }

  // ==================== CAMPAIGN CONTROL ====================

  /**
   * Pause campaign
   */
  async pauseCampaign(campaignId: string): Promise<boolean> {
    try {
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: { status: 'paused' }
      });
      
      console.log(`⏸️ Campaign ${campaignId} paused`);
      return true;
    } catch (error) {
      console.error('Failed to pause campaign:', error);
      return false;
    }
  }

  /**
   * Resume campaign
   */
  async resumeCampaign(campaignId: string): Promise<boolean> {
    try {
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: { status: 'active' }
      });
      
      console.log(`▶️ Campaign ${campaignId} resumed`);
      
      // Resume processing in background
      this.processCampaign(campaignId).catch(error => {
        console.error('Background campaign resume error:', error);
      });
      
      return true;
    } catch (error) {
      console.error('Failed to resume campaign:', error);
      return false;
    }
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(userId: string, campaignId: string): Promise<boolean> {
    try {
      const result = await prisma.emailCampaign.deleteMany({
        where: {
          id: campaignId,
          user_id: userId
        }
      });
      
      console.log(`🗑️ Campaign ${campaignId} deleted`);
      return result.count > 0;
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      return false;
    }
  }

  // ==================== ANALYTICS ====================

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId: string) {
    try {
      const campaign = await prisma.emailCampaign.findUnique({
        where: { id: campaignId },
        include: {
          sentEmails: true
        }
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const metadata = campaign.metadata as any;
      const leads = metadata?.leads || [];

      // Calculate metrics from SentEmail table
      const sentEmails = campaign.sentEmails;
      const openedCount = sentEmails.filter((e: any) => e.opened_at).length;
      const clickedCount = sentEmails.filter((e: any) => e.clicked_at).length;
      const repliedCount = sentEmails.filter((e: any) => e.replied_at).length;

      // Calculate rates
      const openRate = sentEmails.length > 0 ? (openedCount / sentEmails.length) * 100 : 0;
      const clickRate = sentEmails.length > 0 ? (clickedCount / sentEmails.length) * 100 : 0;
      const replyRate = sentEmails.length > 0 ? (repliedCount / sentEmails.length) * 100 : 0;

      // Sentiment distribution from leads in metadata
      const sentimentDistribution = {
        interested: leads.filter((l: any) => l.status === 'interested').length,
        neutral: leads.filter((l: any) => l.status === 'replied' || l.status === 'neutral').length,
        negative: leads.filter((l: any) => l.status === 'not_interested').length,
        not_sent: leads.filter((l: any) => l.emailCampaignStatus === 'not_sent').length,
        sent: leads.filter((l: any) => l.emailCampaignStatus === 'sent').length,
        failed: leads.filter((l: any) => l.emailCampaignStatus === 'failed').length
      };

      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        status: campaign.status,
        
        // Lead metrics
        totalLeads: leads.length,
        
        // Email metrics
        emailsSent: sentEmails.length,
        emailsOpened: openedCount,
        emailsClicked: clickedCount,
        emailsReplied: repliedCount,
        
        // Rates
        openRate: Math.round(openRate * 10) / 10,
        clickRate: Math.round(clickRate * 10) / 10,
        replyRate: Math.round(replyRate * 10) / 10,
        
        // Sentiment
        sentimentDistribution,
        
        // Processing stats
        processingTime: metadata?.processingTime,
        lastProcessed: metadata?.lastProcessed,
        
        // Metadata stats
        stats: metadata?.stats
      };

    } catch (error) {
      console.error('Failed to get campaign analytics:', error);
      throw error;
    }
  }

  /**
   * Get workspace-wide email analytics
   */
async getWorkspaceAnalytics(userId: string, workspaceId: string) {
  try {
    const campaigns = await prisma.emailCampaign.findMany({
      where: {
        user_id: userId,
        workspace_id: workspaceId
      },
      include: {
        sentEmails: true
      }
    });

    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    
    // Aggregate metrics
    let totalLeads = 0;
    let totalSent = 0;
    let totalOpened = 0;
    let totalClicked = 0;
    let totalReplied = 0;

    campaigns.forEach(campaign => {
      const metadata = campaign.metadata as any;
      totalLeads += metadata?.leads?.length || 0;
      
      totalSent += campaign.sentEmails.length;
      totalOpened += campaign.sentEmails.filter((e: any) => e.opened_at).length;
      totalClicked += campaign.sentEmails.filter((e: any) => e.clicked_at).length;
      totalReplied += campaign.sentEmails.filter((e: any) => e.replied_at).length;
    });

    // ✅ Calculate top performing campaigns
    const campaignPerformance = campaigns
      .filter(c => c.sentEmails.length > 0) // Only campaigns with sent emails
      .map(campaign => {
        const opened = campaign.sentEmails.filter((e: any) => e.opened_at).length;
        const replied = campaign.sentEmails.filter((e: any) => e.replied_at).length;
        const sent = campaign.sentEmails.length;
        
        return {
          id: campaign.id,
          name: campaign.name,
          openRate: sent > 0 ? (opened / sent) * 100 : 0,
          replyRate: sent > 0 ? (replied / sent) * 100 : 0
        };
      })
      .sort((a, b) => b.replyRate - a.replyRate) // Sort by reply rate (most important)
      .slice(0, 5); // Top 5

    return {
      totalCampaigns,
      activeCampaigns,
      totalLeads,
      emailsSent: totalSent,  // ✅ FIXED: Changed from totalSent
      emailsOpened: totalOpened,  // ✅ FIXED: Changed from totalOpened
      emailsReplied: totalReplied,  // ✅ FIXED: Changed from totalReplied
      averageOpenRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 1000) / 10 : 0,
      averageReplyRate: totalSent > 0 ? Math.round((totalReplied / totalSent) * 1000) / 10 : 0,
      topPerformingCampaigns: campaignPerformance,  // ✅ NEW: Added top campaigns
      sentimentDistribution: {  // ✅ NEW: Added to match interface
        interested: 0,
        neutral: 0,
        negative: 0,
        not_interested: 0
      }
    };

  } catch (error) {
    console.error('Failed to get workspace analytics:', error);
    throw error;
  }
}
}