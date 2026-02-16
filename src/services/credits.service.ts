// services/credits.service.ts - UPDATED WITH STRIPE
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

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  stripePriceId: string; // Add Stripe price ID
  popular?: boolean;
  features: string[];
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
      console.log('👤 Creating new credit record for user - starting with 0 credits, 5 free leads available');
      userCredit = await prisma.userCredit.create({
        data: {
          user_id: userId,
          credits: 0, // New users start with 0 credits
          free_leads_used: 0, // But 5 free leads available
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

    console.log('📊 User credits result:', result);
    return result;
  }

  // Calculate cost for lead generation
  async calculateCost(leadCount: number, freeLeadsAvailable: number): Promise<CostInfo> {
    // Use free leads first if available
    const freeLeadsUsed = Math.min(leadCount, freeLeadsAvailable);
    const paidLeads = Math.max(0, leadCount - freeLeadsUsed);
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

  // Check if user can afford lead generation
  async canAffordLeadGeneration(userId: string, leadCount: number): Promise<{
    canAfford: boolean;
    costInfo: CostInfo;
    userCredits: UserCreditsInfo;
    reason?: string;
  }> {
    console.log(`🔍 Checking affordability for user ${userId}, leadCount: ${leadCount}`);
    
    const userCredits = await this.getUserCredits(userId);
    const costInfo = await this.calculateCost(leadCount, userCredits.freeLeadsAvailable);

    // User can afford if they have enough credits for the paid portion
    const canAfford = costInfo.totalCost <= userCredits.credits;
    
    console.log(`💳 Affordability check:`, {
      userCredits: userCredits.credits,
      freeLeadsAvailable: userCredits.freeLeadsAvailable,
      totalCost: costInfo.totalCost,
      freeLeadsUsed: costInfo.freeLeadsUsed,
      paidLeads: costInfo.paidLeads,
      canAfford
    });
    
    let reason: string | undefined;
    if (!canAfford) {
      if (userCredits.freeLeadsAvailable > 0) {
        const maxAffordableLeads = userCredits.freeLeadsAvailable + userCredits.credits;
        reason = `You can generate up to ${maxAffordableLeads} leads: ${userCredits.freeLeadsAvailable} free leads + ${userCredits.credits} with your current credits. ` +
                 `To generate ${leadCount} leads, you need ${costInfo.totalCost} credits but only have ${userCredits.credits}.`;
      } else {
        reason = `You've used your 5 free leads. To generate ${leadCount} leads, you need ${costInfo.totalCost} credits but only have ${userCredits.credits}.`;
      }
    }

    return {
      canAfford,
      costInfo,
      userCredits,
      reason
    };
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

    // Get fresh user credits
    const userCredits = await this.getUserCredits(userId);
    const costInfo = await this.calculateCost(leadCount, userCredits.freeLeadsAvailable);

    console.log('💳 Pre-deduction state:', {
      userCredits,
      costInfo,
      willDeductCredits: costInfo.totalCost,
      willUseFreeLeads: costInfo.freeLeadsUsed
    });

    // Check affordability one more time
    if (costInfo.totalCost > userCredits.credits) {
      const error = `Insufficient credits. Need ${costInfo.totalCost} credits for ${costInfo.paidLeads} paid leads, have ${userCredits.credits}. ` +
        `Free leads available: ${userCredits.freeLeadsAvailable}`;
      console.error('  Credit deduction failed:', error);
      throw new Error(error);
    }

    // Use a transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update user credits
      const updatedCredits = await tx.userCredit.update({
        where: { user_id: userId },
        data: {
          credits: userCredits.credits - costInfo.totalCost, // Deduct only for paid leads
          free_leads_used: userCredits.freeLeadsUsed + costInfo.freeLeadsUsed // Track free leads used
        }
      });

      // Log paid credits transaction if any
      if (costInfo.totalCost > 0) {
        await tx.creditTransaction.create({
          data: {
            user_id: userId,
            workspace_id: workspaceId,
            amount: -costInfo.totalCost,
            transaction_type: 'usage',
            description: `Lead generation: ${costInfo.paidLeads} paid leads (${costInfo.freeLeadsUsed} free leads also used)`,
            reference_id: deliverableId,
            metadata: {
              leadCount,
              freeLeadsUsed: costInfo.freeLeadsUsed,
              paidLeads: costInfo.paidLeads,
              creditsDeducted: costInfo.totalCost,
              deliverableId
            }
          }
        });
      }

      // Log free leads usage if any (even if no credits were deducted)
      if (costInfo.freeLeadsUsed > 0) {
        await tx.creditTransaction.create({
          data: {
            user_id: userId,
            workspace_id: workspaceId,
            amount: 0, // Free leads don't cost credits
            transaction_type: 'free_usage',
            description: `Free leads used: ${costInfo.freeLeadsUsed} of ${leadCount} total leads`,
            reference_id: deliverableId,
            metadata: {
              freeLeadsUsed: costInfo.freeLeadsUsed,
              totalLeadsGenerated: leadCount,
              deliverableId
            }
          }
        });
      }

      const deductionResult = {
        creditsDeducted: costInfo.totalCost,
        freeLeadsUsed: costInfo.freeLeadsUsed,
        remainingCredits: updatedCredits.credits,
        remainingFreeLeads: Math.max(0, CreditsService.FREE_LEADS_LIMIT - updatedCredits.free_leads_used)
      };

      console.log('  Credits deducted successfully:', deductionResult);
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
          free_leads_used: 0, // New users start with 0 free leads used (5 available)
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

      console.log('  Credits added successfully:', {
        newBalance: updatedCredits.credits,
        totalPurchased: updatedCredits.total_purchased,
        freeLeadsRemaining: CreditsService.FREE_LEADS_LIMIT - updatedCredits.free_leads_used
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

  // Get user's usage statistics
  async getUserUsageStats(userId: string, timeframe: 'week' | 'month' | 'all' = 'month') {
    const dateFilter = this.getDateFilter(timeframe);
    
    // Get both paid usage and free usage
    const paidStats = await prisma.creditTransaction.aggregate({
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

    const freeStats = await prisma.creditTransaction.aggregate({
      where: {
        user_id: userId,
        transaction_type: 'free_usage',
        created_at: dateFilter ? { gte: dateFilter } : undefined
      },
      _count: {
        id: true
      }
    });

    // Get lead count from metadata
    const allTransactions = await prisma.creditTransaction.findMany({
      where: {
        user_id: userId,
        transaction_type: { in: ['usage', 'free_usage'] },
        created_at: dateFilter ? { gte: dateFilter } : undefined
      },
      select: {
        metadata: true,
        transaction_type: true
      }
    });

    const totalLeadsGenerated = allTransactions.reduce((sum, tx) => {
      const metadata = tx.metadata as any;
      if (tx.transaction_type === 'usage') {
        return sum + (metadata?.leadCount || 0);
      } else if (tx.transaction_type === 'free_usage') {
        return sum + (metadata?.freeLeadsUsed || 0);
      }
      return sum;
    }, 0);

    const freeLeadsUsed = allTransactions
      .filter(tx => tx.transaction_type === 'free_usage')
      .reduce((sum, tx) => {
        const metadata = tx.metadata as any;
        return sum + (metadata?.freeLeadsUsed || 0);
      }, 0);

    return {
      creditsUsed: Math.abs(paidStats._sum.amount || 0),
      freeLeadsUsed,
      generationsCount: paidStats._count.id + freeStats._count.id,
      totalLeadsGenerated,
      timeframe
    };
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

  // Get credit packages for purchase - Updated with Stripe price IDs
static getCreditPackages(): CreditPackage[] {
  return [
    {
      id: 'starter',
      name: 'Starter',
      credits: 40,
      price: 10,
      stripePriceId: process.env.STRIPE_STARTER_PRICE_ID!,
      features: [
        '40 lead generations',
        'Basic targeting',
        'Email,Phone &  LinkedIn data',
        'CSV export',
      ]
    },
    {
      id: 'growth',
      name: 'Growth',
      credits: 125,
      price: 25,
      stripePriceId: process.env.STRIPE_GROWTH_PRICE_ID!,
      features: [
        '125 lead generations',
        'Advanced targeting',
        'Email,Phone & LinkedIn data',
        'Priority support',
       
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      credits: 300,
      price: 50,
      stripePriceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID!,
      popular: true,
      features: [
        '300 lead generations',
        'Premium targeting',
        'Full contact data',
        'Priority support',
        'Advanced analytics',
        'Bulk export tools'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      credits: 800,
      price: 100,
      stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
      features: [
        '800 lead generations',
        'Custom targeting',
          'Premium targeting',
           'Priority support',
        'Dedicated support',
        'Bulk export tools',
        'Bulk export tools'
      ]
    }
  ];
}

  // Get package by ID
  static getPackageById(packageId: string): CreditPackage | null {
    const packages = CreditsService.getCreditPackages();
    return packages.find(pkg => pkg.id === packageId) || null;
  }
}