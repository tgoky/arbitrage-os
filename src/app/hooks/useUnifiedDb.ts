// hooks/useUnifiedWorkDashboard.ts
import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';

// Import all your existing hooks
import { useSalesCallAnalyzer } from './useSalesCallAnalyzer';
import { useGrowthPlan } from './useGrowthPlan';
import { useSavedCalculations } from './usePricingCalculator';
import { useNicheResearcher } from './useNicheResearcher';
import { useColdEmail } from './useColdEmail';
import { useSavedOffers } from './useOfferCreator';

export interface WorkItem {
  id: string;
  type: 'sales-call' | 'growth-plan' | 'pricing-calc' | 'niche-research' | 'cold-email' | 'offer-creator' | 'ad-writer';
  title: string;
  subtitle: string;
  status: 'completed' | 'processing' | 'failed' | 'draft';
  createdAt: string;
  metadata: Record<string, any>;
  actions: string[];
  rawData: any;
}

export interface WorkSummary {
  totalItems: number;
  thisMonth: number;
  lastMonth: number;
  processing: number;
  completed: number;
  failed: number;
  byType: Record<string, number>;
  recentActivity: WorkItem[];
}

interface UseUnifiedWorkDashboardOptions {
  workspaceId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useUnifiedWorkDashboard(options: UseUnifiedWorkDashboardOptions = {}) {
  const { workspaceId, autoRefresh = false, refreshInterval = 30000 } = options;

  // State
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Initialize hooks
  const salesCallAnalyzer = useSalesCallAnalyzer();
  const growthPlan = useGrowthPlan();
  const savedCalculations = useSavedCalculations();
  const nicheResearcher = useNicheResearcher();
  const coldEmail = useColdEmail();
  const savedOffers = useSavedOffers();

  // Transform data from each hook into unified WorkItem format
  const transformSalesCall = (call: any): WorkItem => ({
    id: `sales-call-${call.id}`,
    type: 'sales-call',
    title: call.title || 'Sales Call Analysis',
    subtitle: `${call.prospectName || 'Unknown'} • ${call.companyName || 'Company'}`,
    status: call.status || 'completed',
    createdAt: call.createdAt || call.created_at || new Date().toISOString(),
    metadata: {
      duration: call.duration || 'N/A',
      callType: call.callType || 'unknown',
      company: call.companyName,
      prospect: call.prospectName,
      sentiment: call.sentiment || 'neutral',
      score: call.score || null,
      industry: call.companyIndustry
    },
    actions: ['view', 'export', 'delete'],
    rawData: call
  });

  const transformGrowthPlan = (plan: any): WorkItem => ({
    id: `growth-plan-${plan.id}`,
    type: 'growth-plan',
    title: plan.title || 'Growth Plan',
    subtitle: `${plan.metadata?.clientCompany || 'Company'} • ${plan.metadata?.industry || 'Industry'}`,
    status: 'completed',
    createdAt: plan.createdAt?.toISOString() || plan.created_at || new Date().toISOString(),
    metadata: {
      industry: plan.metadata?.industry,
      timeframe: plan.metadata?.timeframe,
      clientCompany: plan.metadata?.clientCompany,
      strategies: plan.plan?.strategies?.length || 0,
      tokensUsed: plan.metadata?.tokensUsed || 0,
      consultant: plan.metadata?.consultant?.name
    },
    actions: ['view', 'export', 'edit', 'delete'],
    rawData: plan
  });

  const transformPricingCalc = (calc: any): WorkItem => ({
    id: `pricing-calc-${calc.id}`,
    type: 'pricing-calc',
    title: calc.title || calc.projectName || 'Pricing Calculation',
    subtitle: `${calc.clientName || 'Client'} • $${calc.recommendedRetainer?.toLocaleString() || '0'}`,
    status: 'completed',
    createdAt: calc.createdAt || calc.created_at || new Date().toISOString(),
    metadata: {
      clientName: calc.clientName,
      projectName: calc.projectName,
      annualSavings: calc.annualSavings,
      recommendedRetainer: calc.recommendedRetainer,
      hourlyRate: calc.hourlyRate,
      roiPercentage: calc.roiPercentage,
      industry: calc.industry
    },
    actions: ['view', 'export', 'duplicate', 'delete'],
    rawData: calc
  });

  const transformNicheReport = (report: any): WorkItem => ({
    id: `niche-research-${report.id}`,
    type: 'niche-research',
    title: report.title || 'Niche Research Report',
    subtitle: `${report.nicheName} • ${report.marketType}`,
    status: 'completed',
    createdAt: report.createdAt || report.created_at || new Date().toISOString(),
    metadata: {
      nicheName: report.nicheName,
      marketSize: report.marketSize,
      primaryObjective: report.primaryObjective,
      marketType: report.marketType,
      budget: report.budget,
      tokensUsed: report.tokensUsed,
      opportunity: 'Medium' // Default since it's not in the hook data
    },
    actions: ['view', 'export', 'update', 'delete'],
    rawData: report
  });

  const transformColdEmail = (generation: any): WorkItem => ({
    id: `cold-email-${generation.id}`,
    type: 'cold-email',
    title: generation.title || 'Cold Email Campaign',
    subtitle: `${generation.emails?.length || 0} emails • ${generation.industry || 'General'}`,
    status: 'completed',
    createdAt: generation.createdAt || generation.created_at || new Date().toISOString(),
    metadata: {
      emailCount: generation.emails?.length || 0,
      industry: generation.industry,
      tone: generation.tone,
      method: generation.method,
      firstName: generation.firstName,
      lastName: generation.lastName,
      companyName: generation.companyName
    },
    actions: ['view', 'copy', 'optimize', 'delete'],
    rawData: generation
  });

  const transformOffer = (offer: any): WorkItem => ({
    id: `offer-creator-${offer.id}`,
    type: 'offer-creator',
    title: offer.title || 'Signature Offers',
    subtitle: `${offer.industry || 'General'} • ${offer.packages?.length || 3} Packages`,
    status: 'completed',
    createdAt: offer.createdAt || offer.created_at || new Date().toISOString(),
    metadata: {
      industry: offer.industry,
      packages: offer.packages?.length || 0,
      priceRange: offer.priceRange,
      deliveryModel: offer.deliveryModel,
      targetMarket: offer.targetMarket,
      consultant: offer.consultant
    },
    actions: ['view', 'export', 'optimize', 'delete'],
    rawData: offer
  });

  // Fetch all work items from different sources
  const fetchAllWorkItems = useCallback(async (showLoadingState = true) => {
    if (showLoadingState) {
      setLoading(true);
    }
    setError(null);
    
    const allItems: WorkItem[] = [];
    const errors: string[] = [];

    try {
      // Fetch Sales Call Analyses
      try {
        console.log('📞 Fetching sales call analyses...');
        const salesCalls = await salesCallAnalyzer.getUserAnalyses(workspaceId);
        console.log(`📞 Found ${salesCalls.length} sales calls`);
        salesCalls.forEach((call: any) => {
          allItems.push(transformSalesCall(call));
        });
      } catch (err) {
        console.warn('Failed to fetch sales calls:', err);
        errors.push('sales calls');
      }

      // Fetch Growth Plans
      try {
        console.log('🚀 Fetching growth plans...');
        const growthPlans = await growthPlan.fetchPlans();
        console.log(`🚀 Found ${growthPlans.length} growth plans`);
        growthPlans.forEach((plan: any) => {
          allItems.push(transformGrowthPlan(plan));
        });
      } catch (err) {
        console.warn('Failed to fetch growth plans:', err);
        errors.push('growth plans');
      }

      // Fetch Pricing Calculations
      try {
        console.log('💰 Fetching pricing calculations...');
        await savedCalculations.fetchCalculations(workspaceId);
        console.log(`💰 Found ${savedCalculations.calculations.length} pricing calculations`);
        savedCalculations.calculations.forEach((calc: any) => {
          allItems.push(transformPricingCalc(calc));
        });
      } catch (err) {
        console.warn('Failed to fetch pricing calculations:', err);
        errors.push('pricing calculations');
      }

      // Fetch Niche Research Reports
      try {
        console.log('🔍 Fetching niche research reports...');
        const nicheReports = await nicheResearcher.getUserReports(workspaceId);
        console.log(`🔍 Found ${nicheReports.length} niche reports`);
        nicheReports.forEach((report: any) => {
          allItems.push(transformNicheReport(report));
        });
      } catch (err) {
        console.warn('Failed to fetch niche research:', err);
        errors.push('niche research');
      }

      // Fetch Cold Email Generations
      try {
        console.log('📧 Fetching cold email generations...');
        const emailGenerations = await coldEmail.getEmailGenerations(workspaceId);
        console.log(`📧 Found ${emailGenerations.length} email generations`);
        emailGenerations.forEach((generation: any) => {
          allItems.push(transformColdEmail(generation));
        });
      } catch (err) {
        console.warn('Failed to fetch cold emails:', err);
        errors.push('cold emails');
      }

      // Fetch Offer Creator Results
      try {
        console.log('✨ Fetching signature offers...');
        await savedOffers.fetchOffers(workspaceId);
        console.log(`✨ Found ${savedOffers.offers.length} offers`);
        savedOffers.offers.forEach((offer: any) => {
          allItems.push(transformOffer(offer));
        });
      } catch (err) {
        console.warn('Failed to fetch offers:', err);
        errors.push('signature offers');
      }

      // Sort by creation date (newest first)
      allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      console.log(`✅ Successfully fetched ${allItems.length} total work items`);
      setWorkItems(allItems);
      setLastUpdated(new Date());

      // Show warning if some sources failed
      if (errors.length > 0 && errors.length < 6) {
        message.warning(`Some data couldn't be loaded: ${errors.join(', ')}`);
      } else if (errors.length === 0 && showLoadingState) {
        message.success(`Loaded ${allItems.length} work items`);
      }

    } catch (globalError) {
      console.error('Global error fetching work items:', globalError);
      setError('Failed to load work items');
      message.error('Failed to load your work. Please try refreshing.');
    } finally {
      if (showLoadingState) {
        setLoading(false);
      }
    }
  }, [workspaceId, salesCallAnalyzer, growthPlan, savedCalculations, nicheResearcher, coldEmail, savedOffers]);

  // Handle individual item actions
  const handleAction = useCallback(async (action: string, item: WorkItem) => {
    try {
      switch (action) {
        case 'view':
          // Navigate to the specific tool's view page
          const viewUrls = {
            'sales-call': `/sales-call-analyzer/${item.rawData.id}`,
            'growth-plan': `/growth-plans/${item.rawData.id}`,
            'pricing-calc': `/pricing-calculator/${item.rawData.id}`,
            'niche-research': `/niche-research/${item.rawData.id}`,
            'cold-email': `/cold-email/${item.rawData.id}`,
            'offer-creator': `/offer-creator/${item.rawData.id}`,
            'ad-writer': `/ad-writer/${item.rawData.id}`
          };
          window.location.href = viewUrls[item.type] || '/';
          break;

        case 'delete':
          // Call appropriate delete function
          switch (item.type) {
            case 'sales-call':
              await salesCallAnalyzer.deleteAnalysis(item.rawData.id);
              break;
            case 'growth-plan':
              await growthPlan.deletePlan(item.rawData.id);
              break;
            case 'pricing-calc':
              await savedCalculations.deleteCalculation(item.rawData.id);
              break;
            case 'niche-research':
              await nicheResearcher.deleteNicheReport(item.rawData.id);
              break;
            case 'cold-email':
              await coldEmail.deleteEmailGeneration(item.rawData.id);
              break;
            case 'offer-creator':
              await savedOffers.deleteOffer(item.rawData.id);
              break;
          }
          
          // Remove from local state immediately for better UX
          setWorkItems(prev => prev.filter(workItem => workItem.id !== item.id));
          message.success('Item deleted successfully');
          break;

        case 'export':
          // Call appropriate export function
          switch (item.type) {
            case 'sales-call':
              await salesCallAnalyzer.exportAnalysis(item.rawData.id);
              break;
            case 'growth-plan':
              await growthPlan.exportPlan(item.rawData.id);
              break;
            case 'niche-research':
              await nicheResearcher.exportNicheReport(item.rawData.id);
              break;
            case 'cold-email':
              await coldEmail.exportEmails(item.rawData.id);
              break;
          }
          message.success('Export completed successfully');
          break;

        case 'copy':
          if (item.type === 'cold-email' && item.rawData.emails) {
            const emailsText = item.rawData.emails.map((email: any, index: number) => 
              `Email ${index + 1}:\nSubject: ${email.subject}\n\n${email.body}\n\n---\n\n`
            ).join('');
            
            await navigator.clipboard.writeText(emailsText);
            message.success('Emails copied to clipboard');
          }
          break;

        default:
          message.info(`${action} functionality coming soon`);
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      message.error(`Failed to ${action} item`);
    }
  }, [salesCallAnalyzer, growthPlan, savedCalculations, nicheResearcher, coldEmail, savedOffers]);

  // Calculate summary statistics
  const calculateSummary = useCallback((): WorkSummary => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    const thisMonthItems = workItems.filter(item => new Date(item.createdAt) >= thisMonth);
    const lastMonthItems = workItems.filter(item => {
      const date = new Date(item.createdAt);
      return date >= lastMonth && date < thisMonth;
    });
    
    const byType = workItems.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusCounts = workItems.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalItems: workItems.length,
      thisMonth: thisMonthItems.length,
      lastMonth: lastMonthItems.length,
      processing: statusCounts.processing || 0,
      completed: statusCounts.completed || 0,
      failed: statusCounts.failed || 0,
      byType,
      recentActivity: workItems.slice(0, 10) // Last 10 items
    };
  }, [workItems]);

  // Filter functions
  const filterByType = useCallback((type: string) => {
    if (type === 'all') return workItems;
    return workItems.filter(item => item.type === type);
  }, [workItems]);

  const filterByStatus = useCallback((status: string) => {
    if (status === 'all') return workItems;
    return workItems.filter(item => item.status === status);
  }, [workItems]);

  const searchItems = useCallback((query: string) => {
    if (!query.trim()) return workItems;
    const lowerQuery = query.toLowerCase();
    return workItems.filter(item => 
      item.title.toLowerCase().includes(lowerQuery) ||
      item.subtitle.toLowerCase().includes(lowerQuery) ||
      Object.values(item.metadata).some(value => 
        typeof value === 'string' && value.toLowerCase().includes(lowerQuery)
      )
    );
  }, [workItems]);

  // Auto refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAllWorkItems(false); // Don't show loading state for auto-refresh
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchAllWorkItems]);

  // Initial load
  useEffect(() => {
    fetchAllWorkItems();
  }, [fetchAllWorkItems]);

  return {
    // Data
    workItems,
    summary: calculateSummary(),
    
    // State
    loading,
    error,
    lastUpdated,
    
    // Actions
    refresh: fetchAllWorkItems,
    handleAction,
    
    // Filters
    filterByType,
    filterByStatus, 
    searchItems,
    
    // Utils
    clearError: useCallback(() => setError(null), [])
  };
}