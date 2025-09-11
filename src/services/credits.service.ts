// services/credits.service.ts
import { prisma } from '@/lib/prisma';

export interface UserCreditsInfo {
  credits: number;
  freeLeadsUsed: number;
  freeLeadsAvailable: number;
  totalPurchased: number;
}

export interface CostInfo {
  totalCost: number;
  freeLeadsUsed: number;
  paidLeads: number;
}

export interface CreditDeductionResult {
  creditsDeducted: number;
  freeLeadsUsed: number;
  remainingCredits: number;
  remainingFreeLeads: number;
}

export class CreditsService {
  private static readonly FREE_LEADS_LIMIT = 5;
  private static readonly CREDITS_PER_LEAD = 1;

  // Get user's current credit status
  async getUserCredits(userId: string): Promise<UserCreditsInfo> {
    console.log('📊 Getting credits for user:', userId);
    
    let userCredit = await prisma.userCredit.findUnique({
      where: { user_id: userId }
    });

    // Create credits record if it doesn't exist (new user)
    if (!userCredit) {
      console.log('👤 Creating new credit record for user:', userId);
      userCredit = await prisma.userCredit.create({
        data: {
          user_id: userId,
          credits: 0,
          free_leads_used: 0,
          total_purchased: 0
        }
      });
    }

    const result = {
      credits: userCredit.credits,
      freeLeadsUsed: userCredit.free_leads_used,
      freeLeadsAvailable: Math.max(0, CreditsService.FREE_LEADS_LIMIT - userCredit.free_leads_used),
      totalPurchased: userCredit.total_purchased
    };

    console.log('📊 User credits:', result);
    return result;
  }

  // Calculate cost for lead generation
  async calculateCost(leadCount: number, freeLeadsAvailable: number): Promise<CostInfo> {
    const freeLeadsUsed = Math.min(leadCount, freeLeadsAvailable);
    const paidLeads = leadCount - freeLeadsUsed;
    const totalCost = paidLeads * CreditsService.CREDITS_PER_LEAD;

    const result = {
      totalCost,
      freeLeadsUsed,
      paidLeads
    };

    console.log('💰 Cost calculation:', {
      leadCount,
      freeLeadsAvailable,
      ...result
    });

    return result;
  }

  // Deduct credits for lead generation
  async deductCredits(
    userId: string, 
    workspaceId: string,
    leadCount: number,
    deliverableId?: string
  ): Promise<CreditDeductionResult> {
    console.log('💳 Deducting credits:', {
      userId,
      workspaceId,
      leadCount,
      deliverableId
    });

    const userCredits = await this.getUserCredits(userId);
    const costInfo = await this.calculateCost(leadCount, userCredits.freeLeadsAvailable);

    if (costInfo.totalCost > userCredits.credits) {
      throw new Error(
        `Insufficient credits. Need ${costInfo.totalCost}, have ${userCredits.credits}. ` +
        `You have ${userCredits.freeLeadsAvailable} free leads available.`
      );
    }

    // Use a transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update user credits
      const updatedCredits = await tx.userCredit.update({
        where: { user_id: userId },
        data: {
          credits: Math.max(0, userCredits.credits - costInfo.totalCost),
          free_leads_used: userCredits.freeLeadsUsed + costInfo.freeLeadsUsed
        }
      });

      // Log the transaction for audit trail
      if (costInfo.totalCost > 0) {
        await tx.creditTransaction.create({
          data: {
            user_id: userId,
            workspace_id: workspaceId,
            amount: -costInfo.totalCost,
            transaction_type: 'usage',
            description: `Lead generation: ${leadCount} leads`,
            reference_id: deliverableId,
            metadata: {
              leadCount,
              freeLeadsUsed: costInfo.freeLeadsUsed,
              paidLeads: costInfo.paidLeads,
              deliverableId
            }
          }
        });
      }

      // Log free leads usage if any
      if (costInfo.freeLeadsUsed > 0) {
        await tx.creditTransaction.create({
          data: {
            user_id: userId,
            workspace_id: workspaceId,
            amount: 0,
            transaction_type: 'free_usage',
            description: `Free leads used: ${costInfo.freeLeadsUsed} leads`,
            reference_id: deliverableId,
            metadata: {
              freeLeadsUsed: costInfo.freeLeadsUsed,
              deliverableId
            }
          }
        });
      }

      const deductionResult = {
        creditsDeducted: costInfo.totalCost,
        freeLeadsUsed: costInfo.freeLeadsUsed,
        remainingCredits: updatedCredits.credits,
        remainingFreeLeads: CreditsService.FREE_LEADS_LIMIT - updatedCredits.free_leads_used
      };

      console.log('✅ Credits deducted successfully:', deductionResult);
      return deductionResult;
    });

    return result;
  }

  // Add credits to user account
  async addCredits(
    userId: string, 
    amount: number, 
    source: string = 'purchase',
    workspaceId?: string,
    referenceId?: string,
    description?: string
  ) {
    console.log('💰 Adding credits:', {
      userId,
      amount,
      source,
      workspaceId,
      referenceId
    });

    const result = await prisma.$transaction(async (tx) => {
      // Update user credits
      const updatedCredits = await tx.userCredit.upsert({
        where: { user_id: userId },
        update: {
          credits: { increment: amount },
          total_purchased: source === 'purchase' ? { increment: amount } : undefined
        },
        create: {
          user_id: userId,
          credits: amount,
          free_leads_used: 0,
          total_purchased: source === 'purchase' ? amount : 0
        }
      });

      // Log the transaction
      await tx.creditTransaction.create({
        data: {
          user_id: userId,
          workspace_id: workspaceId,
          amount: amount,
          transaction_type: source,
          description: description || `Credits added: ${source}`,
          reference_id: referenceId,
          metadata: { 
            source,
            previousBalance: updatedCredits.credits - amount,
            newBalance: updatedCredits.credits
          }
        }
      });

      console.log('✅ Credits added successfully:', {
        newBalance: updatedCredits.credits,
        totalPurchased: updatedCredits.total_purchased
      });

      return updatedCredits;
    });

    return result;
  }

  // Get credit transaction history
  async getCreditHistory(userId: string, limit: number = 50) {
    console.log('📋 Getting credit history for user:', userId);
    
    const transactions = await prisma.creditTransaction.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        workspace: {
          select: { name: true, slug: true }
        }
      }
    });

    console.log(`📋 Found ${transactions.length} transactions`);
    return transactions;
  }

  // Check if user can afford lead generation
  async canAffordLeadGeneration(userId: string, leadCount: number): Promise<{
    canAfford: boolean;
    costInfo: CostInfo;
    userCredits: UserCreditsInfo;
    reason?: string;
  }> {
    const userCredits = await this.getUserCredits(userId);
    const costInfo = await this.calculateCost(leadCount, userCredits.freeLeadsAvailable);

    const canAfford = costInfo.totalCost <= userCredits.credits || costInfo.freeLeadsUsed === leadCount;
    
    let reason: string | undefined;
    if (!canAfford) {
      if (userCredits.freeLeadsAvailable > 0) {
        reason = `Insufficient credits. You can generate ${userCredits.freeLeadsAvailable} leads for free, ` +
                 `but need ${costInfo.totalCost} credits for ${costInfo.paidLeads} additional leads. ` +
                 `You have ${userCredits.credits} credits.`;
      } else {
        reason = `Insufficient credits. Need ${costInfo.totalCost} credits, have ${userCredits.credits}.`;
      }
    }

    return {
      canAfford,
      costInfo,
      userCredits,
      reason
    };
  }

  // Get user's usage statistics
  async getUserUsageStats(userId: string, timeframe: 'week' | 'month' | 'all' = 'month') {
    const dateFilter = this.getDateFilter(timeframe);
    
    const stats = await prisma.creditTransaction.aggregate({
      where: {
        user_id: userId,
        transaction_type: 'usage',
        created_at: dateFilter ? { gte: dateFilter } : undefined
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });

    // Get lead count from metadata
    const transactions = await prisma.creditTransaction.findMany({
      where: {
        user_id: userId,
        transaction_type: 'usage',
        created_at: dateFilter ? { gte: dateFilter } : undefined
      },
      select: {
        metadata: true
      }
    });

    const totalLeadsGenerated = transactions.reduce((sum, tx) => {
      const metadata = tx.metadata as any;
      return sum + (metadata?.leadCount || 0);
    }, 0);

    return {
      creditsUsed: Math.abs(stats._sum.amount || 0),
      generationsCount: stats._count.id,
      totalLeadsGenerated,
      timeframe
    };
  }

  // Refund credits (admin function)
  async refundCredits(
    userId: string,
    amount: number,
    reason: string,
    workspaceId?: string,
    originalTransactionId?: string
  ) {
    console.log('🔄 Processing refund:', {
      userId,
      amount,
      reason,
      originalTransactionId
    });

    const result = await prisma.$transaction(async (tx) => {
      // Add credits back
      const updatedCredits = await tx.userCredit.update({
        where: { user_id: userId },
        data: {
          credits: { increment: amount }
        }
      });

      // Log refund transaction
      await tx.creditTransaction.create({
        data: {
          user_id: userId,
          workspace_id: workspaceId,
          amount: amount,
          transaction_type: 'refund',
          description: `Refund: ${reason}`,
          reference_id: originalTransactionId,
          metadata: {
            refundReason: reason,
            originalTransactionId,
            newBalance: updatedCredits.credits
          }
        }
      });

      return updatedCredits;
    });

    console.log('✅ Refund processed successfully');
    return result;
  }

  // Helper method to get date filter
  private getDateFilter(timeframe: 'week' | 'month' | 'all'): Date | null {
    const now = new Date();
    
    switch (timeframe) {
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return weekAgo;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        return monthAgo;
      case 'all':
        return null;
      default:
        return null;
    }
  }

  // Get credit packages for purchase
  static getCreditPackages() {
    return [
      {
        id: 'starter',
        name: 'Starter',
        credits: 1000,
        price: 99,
        features: [
          '~200-500 leads',
          'Basic targeting',
          'Email support'
        ]
      },
      {
        id: 'professional',
        name: 'Professional',
        credits: 5000,
        price: 299,
        popular: true,
        features: [
          '~1,000-2,500 leads',
          'Advanced targeting',
          'Priority support',
          'Analytics dashboard'
        ]
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        credits: 15000,
        price: 799,
        features: [
          '~3,000-7,500 leads',
          'Custom targeting',
          'Dedicated support',
          'API access',
          'Custom integrations'
        ]
      }
    ];
  }
} 