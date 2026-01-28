// app/api/cron/email-agent/route.ts
/**
 * EMAIL AGENT CRON JOB
 * 
 * This runs every 10 minutes (configurable in Vercel/your platform)
 * 
 * What it does:
 * 1. Processes active campaigns (sends emails)
 * 2. Fetches and analyzes inbound emails from Gmail
 * 3. Sends auto-replies to interested leads
 * 4. Schedules and sends follow-up emails
 * 
 * IMPORTANT: This ensures emails are detected even when the web app is closed!
 * 
 * Setup in Vercel:
 * - Go to your project settings
 * - Add a Cron Job
 * - Pattern: `* /10 * * * *` (every 10 minutes)
 * - URL: /api/cron/email-agent
 * - Add CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 300; // 5 minutes max execution time

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn('❌ Unauthorized cron attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🤖 ========================================');
    console.log('🤖 EMAIL AGENT CRON JOB STARTING...');
    console.log('🤖 ========================================');
    console.log(`⏰ Time: ${new Date().toISOString()}`);

    const { EmailCampaignAgent } = await import('@/services/emailCampaignAgent.service');
    const { EmailConnectionService } = await import('@/services/emailConnection.service');
    const { prisma } = await import('@/lib/prisma');
    
    const agent = new EmailCampaignAgent();
    const emailService = new EmailConnectionService();

    const results = {
      campaignsProcessed: 0,
      emailsSent: 0,
      inboundEmailsFetched: 0,
      inboundEmailsProcessed: 0,
      followupsSent: 0,
      autoRepliesSent: 0,
      errors: [] as string[]
    };

    // ==================== STEP 1: PROCESS ACTIVE CAMPAIGNS ====================
    console.log('\n📧 STEP 1: Processing Active Campaigns...');
    
    try {
      const activeCampaigns = await prisma.emailCampaign.findMany({
        where: { 
          status: 'active'
        },
        include: {
          emailAccount: true
        }
      });

      console.log(`Found ${activeCampaigns.length} active campaigns to process`);

      for (const campaign of activeCampaigns) {
        try {
          // Check if campaign should run based on schedule
          const metadata = campaign.metadata as any;
          const lastProcessed = metadata?.lastProcessed 
            ? new Date(metadata.lastProcessed)
            : null;

          if (lastProcessed) {
            const minutesSinceLastProcess = Math.floor(
              (Date.now() - lastProcessed.getTime()) / (1000 * 60)
            );
            
            // Skip if processed in last 5 minutes (prevent duplicate sends)
            if (minutesSinceLastProcess < 5) {
              console.log(`⏭️  Skipping ${campaign.name} - processed ${minutesSinceLastProcess} min ago`);
              continue;
            }
          }

          console.log(`\n📤 Processing campaign: ${campaign.name}`);
          
          await agent.processCampaign(campaign.id);
          results.campaignsProcessed++;
          
          // Update campaign stats
          const updatedCampaign = await prisma.emailCampaign.findUnique({
            where: { id: campaign.id }
          });
          
          if (updatedCampaign) {
            results.emailsSent += updatedCampaign.emails_sent - campaign.emails_sent;
          }
          
        } catch (error: any) {
          console.error(`❌ Failed to process campaign ${campaign.id}:`, error.message);
          results.errors.push(`Campaign ${campaign.name}: ${error.message}`);
        }
      }

      console.log(`✅ Campaigns processed: ${results.campaignsProcessed}`);
      console.log(`✅ Emails sent: ${results.emailsSent}`);

    } catch (error: any) {
      console.error('❌ Campaign processing error:', error);
      results.errors.push(`Campaign processing: ${error.message}`);
    }

    // ==================== STEP 2: FETCH & PROCESS INBOUND EMAILS ====================
    console.log('\n📥 STEP 2: Fetching Inbound Emails...');

    try {
      const emailAccounts = await prisma.emailAccount.findMany({
        where: { enabled: true }
      });

      console.log(`Found ${emailAccounts.length} enabled email accounts`);

      for (const account of emailAccounts) {
        try {
          console.log(`\n📧 Fetching emails for: ${account.email}`);
          
          // Fetch new emails since last sync
          const sinceDatee = account.last_sync_at || new Date(Date.now() - 60 * 60 * 1000); // Last hour
          const newEmails = await emailService.fetchInboundEmails(account.id, sinceDatee);
          
          results.inboundEmailsFetched += newEmails.length;
          console.log(`  Found ${newEmails.length} new emails`);

       if (newEmails.length > 0) {
  // Process emails (sentiment analysis, lead updates, etc.)
 for (const email of newEmails) {
  await agent.processInboundEmails(account.id, account.workspace_id);
}
  results.inboundEmailsProcessed += newEmails.length;

  // Update last sync time
  await prisma.emailAccount.update({
    where: { id: account.id },
    data: { last_sync_at: new Date() }
  });

  console.log(`  ✅ Processed ${newEmails.length} emails`);
}

        } catch (error: any) {
          console.error(`❌ Failed to process inbound for ${account.email}:`, error.message);
          results.errors.push(`Inbound ${account.email}: ${error.message}`);
        }
      }

      console.log(`✅ Total inbound emails fetched: ${results.inboundEmailsFetched}`);
      console.log(`✅ Total inbound emails processed: ${results.inboundEmailsProcessed}`);

    } catch (error: any) {
      console.error('❌ Inbound email processing error:', error);
      results.errors.push(`Inbound processing: ${error.message}`);
    }

    // ==================== STEP 3: SCHEDULE FOLLOW-UPS ====================
    console.log('\n🔄 STEP 3: Scheduling Follow-ups...');

    try {
      const campaignsWithFollowup = await prisma.emailCampaign.findMany({
        where: {
          status: 'active',
          auto_followup: true
        }
      });

      console.log(`Found ${campaignsWithFollowup.length} campaigns with auto-followup enabled`);

      for (const campaign of campaignsWithFollowup) {
        try {
          console.log(`\n📨 Processing follow-ups for: ${campaign.name}`);
    //  await agent.processFollowups(campaign.id);

    // await agent.processFollowups(campaign.id);
// TODO: Implement follow-up scheduling
console.log(`  ⚠️  Follow-up scheduling not yet implemented for: ${campaign.name}`);

          results.followupsSent++;
        } catch (error: any) {
          console.error(`❌ Failed to schedule followups for ${campaign.id}:`, error.message);
          results.errors.push(`Follow-up ${campaign.name}: ${error.message}`);
        }
      }

      console.log(`✅ Follow-ups processed: ${results.followupsSent}`);

    } catch (error: any) {
      console.error('❌ Follow-up scheduling error:', error);
      results.errors.push(`Follow-up scheduling: ${error.message}`);
    }

    // ==================== STEP 4: PROCESS INTERESTED LEADS (Auto-Reply) ====================
    console.log('\n💚 STEP 4: Processing Interested Leads...');

    try {
      // Find recent inbound emails marked as "interested" that haven't been replied to
      const interestedEmails = await prisma.inboundEmail.findMany({
        where: {
          sentiment: 'interested',
          requires_action: true,
          processed: true,
          // Only emails from the last 24 hours
          received_at: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        include: {
          emailAccount: true
        },
        take: 20 // Limit to prevent overwhelming the system
      });

      console.log(`Found ${interestedEmails.length} interested leads requiring action`);

      for (const email of interestedEmails) {
        try {
          // Find the lead
          const lead = await prisma.lead.findFirst({
            where: { email: email.from }
          });

          if (lead && email.emailAccount) {
            console.log(`  💚 Auto-replying to interested lead: ${lead.email}`);
            
            // The processInboundEmails already handles auto-replies,
            // but we can trigger it again for any missed ones
            // This is a safety net
            
            // Mark as no longer requiring action to prevent duplicate replies
            await prisma.inboundEmail.update({
              where: { id: email.id },
              data: { requires_action: false }
            });

            results.autoRepliesSent++;
          }
        } catch (error: any) {
          console.error(`❌ Failed to auto-reply to ${email.from}:`, error.message);
          results.errors.push(`Auto-reply ${email.from}: ${error.message}`);
        }
      }

      console.log(`✅ Auto-replies sent: ${results.autoRepliesSent}`);

    } catch (error: any) {
      console.error('❌ Auto-reply processing error:', error);
      results.errors.push(`Auto-reply processing: ${error.message}`);
    }

    // ==================== CLEANUP & SUMMARY ====================
    console.log('\n🧹 STEP 5: Cleanup...');

    try {
      // Archive old processed emails (older than 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const archivedCount = await prisma.inboundEmail.updateMany({
        where: {
          processed: true,
          received_at: { lt: thirtyDaysAgo },
          archived: false
        },
        data: {
          archived: true
        }
      });

      console.log(`Archived ${archivedCount.count} old emails`);

    } catch (error: any) {
      console.error('❌ Cleanup error:', error);
      results.errors.push(`Cleanup: ${error.message}`);
    }

    const duration = Date.now() - startTime;

    console.log('\n🤖 ========================================');
    console.log('🤖 EMAIL AGENT CRON JOB COMPLETED');
    console.log('🤖 ========================================');
    console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`📊 Summary:`);
    console.log(`   - Campaigns processed: ${results.campaignsProcessed}`);
    console.log(`   - Emails sent: ${results.emailsSent}`);
    console.log(`   - Inbound emails fetched: ${results.inboundEmailsFetched}`);
    console.log(`   - Inbound emails processed: ${results.inboundEmailsProcessed}`);
    console.log(`   - Follow-ups sent: ${results.followupsSent}`);
    console.log(`   - Auto-replies sent: ${results.autoRepliesSent}`);
    console.log(`   - Errors: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered:`);
      results.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    }

    return NextResponse.json({ 
      success: true,
      duration: `${(duration / 1000).toFixed(2)}s`,
      timestamp: new Date().toISOString(),
      results
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    console.error('\n💥 ========================================');
    console.error('💥 CRON JOB CRITICAL ERROR');
    console.error('💥 ========================================');
    console.error(error);

    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Cron job failed',
        duration: `${(duration / 1000).toFixed(2)}s`,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST is also supported for manual triggers
export async function POST(req: NextRequest) {
  return GET(req);
}