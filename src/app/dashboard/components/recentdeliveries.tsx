// app/dashboard/components/RecentDeliverables.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Card, List, Button, Typography, Grid, Tag, Avatar, Spin, Empty } from 'antd';
import { 
  FileTextOutlined,
  PhoneOutlined,
  RocketOutlined,
  DollarCircleOutlined,
  BulbOutlined,
  MailOutlined,
  EditOutlined,
  TagOutlined,
  CalendarOutlined,
  EyeOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { useTheme } from '../../../providers/ThemeProvider';

// Import your existing hooks
// Import your existing hooks
import { useSalesCallAnalyzer } from '../../hooks/useSalesCallAnalyzer';
import { useGrowthPlan } from '../../hooks/useGrowthPlan';
import { useSavedCalculations } from '../../hooks/usePricingCalculator';
import { useNicheResearcher } from '../../hooks/useNicheResearcher';
import { useColdEmail } from '../../hooks/useColdEmail';
import { useSavedOffers } from '../../hooks/useOfferCreator';
import { useAdWriter } from '../../hooks/useAdWriter';


const { Text } = Typography;
const { useBreakpoint } = Grid;

// Define types
type WorkItemType = 'sales-call' | 'growth-plan' | 'pricing-calc' | 'niche-research' | 'cold-email' | 'offer-creator';
type WorkItemStatus = 'completed' | 'processing' | 'failed' | 'draft';

interface RecentWorkItem {
  id: string;
  type: WorkItemType;
  title: string;
  subtitle: string;
  status: WorkItemStatus;
  createdAt: string;
  metadata: Record<string, any>;
  rawData: any;
}

interface RecentDeliverablesProps {
  deliverables?: any[]; // Keep for backward compatibility
  workspaceId?: string;
  maxItems?: number;
}

const RecentDeliverables: React.FC<RecentDeliverablesProps> = ({ 
  deliverables = [], 
  workspaceId,
  maxItems = 6 
}) => {
  const screens = useBreakpoint();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [recentWorkItems, setRecentWorkItems] = useState<RecentWorkItem[]>([]);

  // Initialize all hooks
  const salesCallAnalyzer = useSalesCallAnalyzer();
  const growthPlan = useGrowthPlan();
  const savedCalculations = useSavedCalculations();
  const nicheResearcher = useNicheResearcher();
  const coldEmail = useColdEmail();
  const savedOffers = useSavedOffers();

  // Fetch recent work items
  const fetchRecentWorkItems = async () => {
    setLoading(true);
    const items: RecentWorkItem[] = [];

    try {
      // Fetch Sales Call Analyses
      try {
        const salesCalls = await salesCallAnalyzer.getUserAnalyses(workspaceId);
        salesCalls.slice(0, 2).forEach((call: any) => {
          items.push({
            id: `sales-call-${call.id}`,
            type: 'sales-call',
            title: call.title || 'Sales Call Analysis',
            subtitle: `${call.prospectName || 'Unknown'} • ${call.companyName || 'Company'}`,
            status: 'completed',
            createdAt: call.createdAt || call.created_at || new Date().toISOString(),
            metadata: {
              duration: call.duration || 'N/A',
              sentiment: call.sentiment || 'neutral',
              score: call.score || null
            },
            rawData: call
          });
        });
      } catch (err) {
        console.warn('Failed to fetch sales calls:', err);
      }

      // Fetch Growth Plans
      try {
        const growthPlans = await growthPlan.fetchPlans();
        growthPlans.slice(0, 2).forEach((plan: any) => {
          items.push({
            id: `growth-plan-${plan.id}`,
            type: 'growth-plan',
            title: plan.title || 'Growth Plan',
            subtitle: `${plan.metadata?.clientCompany || 'Company'} • ${plan.metadata?.industry || 'Industry'}`,
            status: 'completed',
           createdAt: plan.createdAt || plan.created_at || new Date().toISOString(),
            metadata: {
              industry: plan.metadata?.industry,
              strategies: plan.plan?.strategies?.length || 0
            },
            rawData: plan
          });
        });
      } catch (err) {
        console.warn('Failed to fetch growth plans:', err);
      }

           // Fetch Pricing Calculations
      try {
        console.log('💰 Fetching pricing calculations...');
        // --- MODIFIED: Call fetchCalculations and ASSIGN the RETURNED data ---
        const pricingCalculationsData = await savedCalculations.fetchCalculations(workspaceId);
        // --- MODIFIED: Use the returned data instead of the hook's internal state reference ---
        console.log('💳 Found pricing calculations:', pricingCalculationsData);
        // Check if data was actually returned and is an array
        if (Array.isArray(pricingCalculationsData)) {
          pricingCalculationsData.forEach((calc: any) => { // Use pricingCalculationsData here
            items.push({
              id: `pricing-calc-${calc.id}`,
              type: 'pricing-calc',
              title: calc.title || calc.projectName || 'Pricing Calculation',
              subtitle: `${calc.clientName || 'Client'} • $${calc.recommendedRetainer?.toLocaleString() || '0'}`,
              status: 'completed',
              // --- MODIFIED: Ensure createdAt is handled correctly ---
              // Assuming calc.createdAt is already an ISO string from the API
              createdAt: calc.createdAt || calc.created_at || new Date().toISOString(), // Use string directly
              // --- END OF MODIFICATION ---
              metadata: {
                annualSavings: calc.annualSavings,
                recommendedRetainer: calc.recommendedRetainer,
                hourlyRate: calc.hourlyRate,
                roiPercentage: calc.roiPercentage,
                industry: calc.industry
              },
        
              rawData: calc
            });
          });
          console.log(`✅ Added ${pricingCalculationsData.length} pricing calculation items`); // Use length here
        } else {
           console.warn('⚠️ fetchCalculations did not return an array:', pricingCalculationsData);
           // Handle case where data isn't an array (e.g., null if error occurred and function returns [])
        }
        // --- REMOVED: The old line that relied on hook's internal state ---
        // console.log(`✅ Added ${savedCalculations.calculations.length} pricing calculation items`);
      } catch (err) {
        console.warn('❌ Failed to fetch pricing calculations:', err);
      }


      // Fetch Niche Research Reports
      try {
        const nicheReports = await nicheResearcher.getUserReports(workspaceId);
        nicheReports.slice(0, 2).forEach((report: any) => {
          items.push({
            id: `niche-research-${report.id}`,
            type: 'niche-research',
            title: report.title || 'Niche Research Report',
            subtitle: `${report.nicheName} • ${report.marketType}`,
            status: 'completed',
            createdAt: report.createdAt || report.created_at || new Date().toISOString(),
            metadata: {
              marketSize: report.marketSize,
              primaryObjective: report.primaryObjective
            },
            rawData: report
          });
        });
      } catch (err) {
        console.warn('Failed to fetch niche research:', err);
      }

      // Fetch Cold Email Generations
      try {
        const emailGenerations = await coldEmail.getEmailGenerations(workspaceId);
        emailGenerations.slice(0, 2).forEach((generation: any) => {
          items.push({
            id: `cold-email-${generation.id}`,
            type: 'cold-email',
            title: generation.title || 'Cold Email Campaign',
            subtitle: `${generation.emails?.length || 0} emails • ${generation.industry || 'General'}`,
            status: 'completed',
            createdAt: generation.createdAt || generation.created_at || new Date().toISOString(),
            metadata: {
              emailCount: generation.emails?.length || 0,
              tone: generation.tone
            },
            rawData: generation
          });
        });
      } catch (err) {
        console.warn('Failed to fetch cold emails:', err);
      }

      // Fetch Offer Creator Results
      try {
        await savedOffers.fetchOffers(workspaceId);
        savedOffers.offers.slice(0, 2).forEach((offer: any) => {
          items.push({
            id: `offer-creator-${offer.id}`,
            type: 'offer-creator',
            title: offer.title || 'Signature Offers',
            subtitle: `${offer.industry || 'General'} • ${offer.packages?.length || 3} Packages`,
            status: 'completed',
            createdAt: offer.createdAt || offer.created_at || new Date().toISOString(),
            metadata: {
              packages: offer.packages?.length || 0,
              priceRange: offer.priceRange
            },
            rawData: offer
          });
        });
      } catch (err) {
        console.warn('Failed to fetch offers:', err);
      }

      // Sort by creation date (newest first) and limit
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentWorkItems(items.slice(0, maxItems));

    } catch (error) {
      console.error('Error fetching recent work items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchRecentWorkItems();
  }, [workspaceId]);

  // Get icon for work type
  const getTypeIcon = (type: WorkItemType) => {
    const icons: Record<WorkItemType, React.JSX.Element> = {
      'sales-call': <PhoneOutlined />,
      'growth-plan': <RocketOutlined />,
      'pricing-calc': <DollarCircleOutlined />,
      'niche-research': <BulbOutlined />,
      'cold-email': <MailOutlined />,
      'offer-creator': <EditOutlined />
    };
    return icons[type] || <FileTextOutlined />;
  };

  // Get type color
  const getTypeColor = (type: WorkItemType) => {
    const colors: Record<WorkItemType, string> = {
      'sales-call': '#722ed1',
      'growth-plan': '#1890ff',
      'pricing-calc': '#52c41a',
      'niche-research': '#fa8c16',
      'cold-email': '#eb2f96',
      'offer-creator': '#13c2c2'
    };
    return colors[type] || '#666';
  };

  // Get type display name
  const getTypeName = (type: WorkItemType) => {
    const names: Record<WorkItemType, string> = {
      'sales-call': 'Call Analysis',
      'growth-plan': 'Growth Plan',
      'pricing-calc': 'Pricing Calc',
      'niche-research': 'Research',
      'cold-email': 'Cold Email',
      'offer-creator': 'Offers'
    };
    return names[type] || type;
  };

  // Handle view action
  const handleView = (item: RecentWorkItem) => {
    const viewUrls = {
      'sales-call': `/sales-call-analyzer/${item.rawData.id}`,
      'growth-plan': `/growth-plans/${item.rawData.id}`,
      'pricing-calc': `/pricing-calculator/${item.rawData.id}`,
      'niche-research': `/niche-research/${item.rawData.id}`,
      'cold-email': `/cold-email/${item.rawData.id}`,
      'offer-creator': `/offer-creator/${item.rawData.id}`
    };
    window.location.href = viewUrls[item.type] || '/';
  };

  const getCardStyles = () => ({
    body: {
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
      padding: screens.xs ? '8px' : '12px',
    },
    header: {
      borderBottomColor: theme === 'dark' ? '#374151' : '#f0f0f0',
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
      padding: '8px 12px',
    },
  });

  return (
    <Card
      data-tour="recent-deliverables"
      title="Recent AI Work"
      styles={getCardStyles()}
      style={{
        backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
        borderColor: theme === 'dark' ? '#374151' : '#f0f0f0',
      }}
      extra={
        <Button
          type="text"
          size="small"
          onClick={() => window.location.href = '/ai-work-dashboard'}
          style={{
            color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
            padding: 0,
            height: 'auto',
          }}
        >
          View All
        </Button>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <Spin size="small" />
          <Text
            style={{
              color: theme === 'dark' ? '#9ca3af' : '#666666',
              display: 'block',
              marginTop: 8,
              fontSize: 12,
            }}
          >
            Loading your recent work...
          </Text>
        </div>
      ) : recentWorkItems.length > 0 ? (
        <List
          itemLayout="horizontal"
          dataSource={recentWorkItems}
          style={{
            backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
            borderColor: theme === 'dark' ? '#374151' : '#f0f0f0',
          }}
          renderItem={(item) => (
            <List.Item
              style={{
                borderBottomColor: theme === 'dark' ? '#374151' : '#f0f0f0',
                padding: '8px 0',
                backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
              }}
              actions={[
                <Button
                  type="text"
                  size="small"
                  key="view"
                  icon={<EyeOutlined />}
                  onClick={() => handleView(item)}
                  style={{
                    color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
                    padding: '0 4px',
                    height: 'auto',
                    fontSize: 12,
                  }}
                >
                  View
                </Button>,
                <Button
                  type="text"
                  size="small"
                  key="export"
                  icon={<DownloadOutlined />}
                  style={{
                    color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
                    padding: '0 4px',
                    height: 'auto',
                    fontSize: 12,
                  }}
                >
                  Export
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      backgroundColor: getTypeColor(item.type) + '15',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: getTypeColor(item.type),
                      fontSize: 14,
                    }}
                  >
                    {getTypeIcon(item.type)}
                  </div>
                }
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Text
                      strong
                      style={{
                        color: theme === 'dark' ? '#f9fafb' : '#1a1a1a',
                        fontSize: 13,
                      }}
                    >
                      {item.title}
                    </Text>
                    <Tag 
                      color={getTypeColor(item.type)} 
                      style={{ fontSize: 10, lineHeight: 1.2, padding: '0 4px' }}
                    >
                      {getTypeName(item.type)}
                    </Tag>
                  </div>
                }
                description={
                  <div>
                    <Text
                      style={{
                        color: theme === 'dark' ? '#9ca3af' : '#666666',
                        fontSize: 12,
                        display: 'block',
                        marginBottom: 2,
                      }}
                    >
                      {item.subtitle}
                    </Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Text style={{ color: theme === 'dark' ? '#6b7280' : '#999', fontSize: 10 }}>
                        <CalendarOutlined /> {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                      
                      {/* Type-specific metadata */}
                      {item.type === 'pricing-calc' && item.metadata.hourlyRate && (
                        <Tag color="green">${item.metadata.hourlyRate}/hr</Tag>
                      )}
                      {item.type === 'cold-email' && (
                        <Tag >{item.metadata.emailCount} emails</Tag>
                      )}
                      {item.type === 'growth-plan' && (
                        <Tag >{item.metadata.strategies} strategies</Tag>
                      )}
                      {item.type === 'offer-creator' && (
                        <Tag >{item.metadata.packages} packages</Tag>
                      )}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '16px 0',
            backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
          }}
        >
          <RocketOutlined
            style={{
              fontSize: 32,
              color: theme === 'dark' ? '#4b5563' : '#d1d5db',
              marginBottom: 8,
            }}
          />
          <Text
            style={{
              color: theme === 'dark' ? '#9ca3af' : '#666666',
              display: 'block',
              marginBottom: 4,
              fontSize: 12,
            }}
          >
            No AI work generated yet
          </Text>
          <Button
            type="text"
            size="small"
            onClick={() => window.location.href = '/tools'}
            style={{
              color: theme === 'dark' ? '#a78bfa' : '#6d28d9',
              padding: 0,
              height: 'auto',
              fontSize: 12,
            }}
          >
            Start using AI tools
          </Button>
        </div>
      )}
    </Card>
  );
};

export default RecentDeliverables;