// app/dashboard/[workspace]/offer-creator/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Card, 
  Typography, 
  Button, 
  Space, 
  Spin, 
  Alert, 
  Tabs, 
  Tag, 
  Divider,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  message,
  Descriptions,
  List,
  Collapse,
  Badge,
  Tooltip,
  Popconfirm,
  Modal
} from 'antd';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  EditOutlined,
  CopyOutlined,
  DeleteOutlined,
  EyeOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  BarChartOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  RocketOutlined
} from '@ant-design/icons';
import { useWorkspaceContext } from '../../../../hooks/useWorkspaceContext';
import './offer-detail.css';

import { ConfigProvider } from "antd";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

interface OfferData {
  id: string;
  title: string;
  content: any;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

// Tier color mapping function
const getTierColor = (tier: string): string => {
  switch(tier) {
    case 'starter': return 'blue';
    case 'core': return 'green';
    case 'premium': return 'gold';
    default: return 'blue';
  }
};

// Data validation and normalization functions
const validateOfferStructure = (offer: any): boolean => {
  if (!offer) return false;
  return !!(offer.signatureOffers && offer.pricing);
};

const normalizeOfferData = (offer: any): any => {
  if (!offer) return null;
  
  if (offer.signatureOffers && offer.pricing) {
    return offer;
  }
  
  if (offer.primaryOffer) {
    return {
      signatureOffers: offer.primaryOffer.signatureOffers,
      comparisonTable: offer.primaryOffer.comparisonTable,
      pricing: offer.primaryOffer.pricing,
      analysis: offer.analysis,
      tokensUsed: offer.tokensUsed,
      generationTime: offer.generationTime,
      originalInput: offer.originalInput
    };
  }
  
  return offer;
};

export default function OfferCreatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  
  const [offerData, setOfferData] = useState<OfferData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  const offerId = params.id as string;
  const workspace = params.workspace as string;

  useEffect(() => {
    if (isWorkspaceReady && currentWorkspace && offerId) {
      fetchOfferDetails();
    }
  }, [isWorkspaceReady, currentWorkspace, offerId]);

  const fetchOfferDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/deliverables/${offerId}?workspaceId=${currentWorkspace?.id}`, {
        credentials: 'include',
        headers: {
          'X-Workspace-Id': currentWorkspace?.id || '',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        let parsedContent = data.data.content;
        if (typeof parsedContent === 'string') {
          try {
            parsedContent = JSON.parse(parsedContent);
          } catch (parseError) {
            throw new Error('Invalid offer content format');
          }
        }
        
        const normalizedData = normalizeOfferData(parsedContent);
        
        if (!validateOfferStructure(normalizedData)) {
          throw new Error('Invalid offer data structure - missing required fields');
        }
        
        setOfferData({
          ...data.data,
          content: normalizedData
        });
      } else {
        throw new Error(data.error || 'Failed to load offer - no data returned');
      }
    } catch (error) {
      console.error('Error fetching offer:', error);
      setError(error instanceof Error ? error.message : 'Failed to load offer');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/${workspace}/offer-creator?load=${offerId}`);
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/deliverables/${offerId}?workspaceId=${currentWorkspace?.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-Workspace-Id': currentWorkspace?.id || '',
        }
      });

      if (response.ok) {
        message.success('Offer deleted successfully');
        router.push(`/dashboard/${workspace}`);
      } else {
        throw new Error('Failed to delete offer');
      }
    } catch (error) {
      console.error('Error deleting offer:', error);
      message.error('Failed to delete offer');
    }
  };

  const handleExport = (format: 'json' | 'html') => {
    if (!offerData) return;

    const filename = `${offerData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'json') {
      const dataStr = JSON.stringify(offerData.content, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      const htmlContent = generateHTMLExport(offerData);
      const dataBlob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.html`;
      link.click();
      URL.revokeObjectURL(url);
    }
    
    message.success(`Exported as ${format.toUpperCase()}`);
  };

   const handleBack = () => {
    router.push(`/submissions`);
  };


  const generateHTMLExport = (data: OfferData): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${data.title}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .offer-header { text-align: center; margin-bottom: 30px; }
          .offer-section { margin-bottom: 25px; }
          .offer-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
          .offer-card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }
          .price { font-size: 24px; font-weight: bold; color: #1890ff; }
        </style>
      </head>
      <body>
        <div class="offer-header">
          <h1>${data.title}</h1>
          <p>Generated on ${new Date(data.createdAt).toLocaleDateString()}</p>
        </div>
        <div class="offer-content">
          ${JSON.stringify(data.content, null, 2).replace(/\n/g, '<br>')}
        </div>
      </body>
      </html>
    `;
  };

  if (!isWorkspaceReady) {
    return (
      <div className="flex justify-center items-center min-h-screen">

        <ConfigProvider
  theme={{
    token: {
      colorPrimary: '#5CC49D',
    },
  }}
>
 <Spin size="large" />
</ConfigProvider>
       
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">

          <ConfigProvider
  theme={{
    token: {
      colorPrimary: '#5CC49D',
    },
  }}
>
   <Spin size="large"  tip="Loading offer details.."/>
</ConfigProvider>
       
          <p className="mt-4">.</p>
        </div>
      </div>
    );
  }

  if (error || !offerData) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Alert
          message="Error Loading Offer"
          description={error || 'Offer not found'}
          type="error"
          showIcon
          action={
            <Space>
             <Button  onClick={handleBack}>
  Back to Dashboard
</Button>
              <Button type="primary" onClick={fetchOfferDetails}>
                Retry
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

  const offer = offerData.content;
  const metadata = offerData.metadata;

  return (
    <div className="max-w-7xl mx-auto p-6 offer-detail-container">
      {/* Header */}
      <div className="mb-8">
          <Button 
              icon={<ArrowLeftOutlined />}
             onClick={handleBack}
              className="back-button"
              size="large"
            >
              Back to Dashboard
            </Button>
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-6">
          <div className="flex items-center space-x-4">
          
            <div>
              <Title level={1} className="mb-0 offer-title">
                {offerData.title}
              </Title>
              <Text type="secondary" className="offer-dates">
                Created {new Date(offerData.createdAt).toLocaleDateString()} • 
                Updated {new Date(offerData.updatedAt).toLocaleDateString()}
              </Text>
            </div>
          </div>
          
          <Space size="middle" className="flex-wrap">
            {/* <Button 
              icon={<EyeOutlined />} 
              onClick={() => setPreviewVisible(true)}
              className="preview-button"
              size="middle"
            >
              Preview
            </Button> */}
            {/* <Button 
              icon={<EditOutlined />} 
              onClick={handleEdit}
              type="primary"
              className="edit-button"
              size="middle"
            >
              Edit Offer
            </Button> */}
            <Tooltip title="Copy JSON to clipboard">
              <Button 
                icon={<CopyOutlined />} 
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(offer, null, 2));
                  message.success('Copied to clipboard');
                }}
                size="large"
              />
            </Tooltip>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={() => handleExport('html')}
              className="export-button"
              size="middle"
            >
              Export HTML
            </Button>
            <Popconfirm
              title="Delete Offer"
              description="Are you sure you want to delete this offer? This action cannot be undone."
              onConfirm={handleDelete}
              okText="Yes"
              cancelText="No"
              placement="topRight"
            >
              <Button 
               type="primary"
                danger 
                icon={<DeleteOutlined />}
                className="delete-button"
                size="middle"
              >
                Delete
              </Button>
            </Popconfirm>
          </Space>
        </div>

        {/* Metadata Tags */}
        <div className="flex flex-wrap gap-3 mb-4">
          {metadata?.targetMarket && (
            <Tag color="blue" icon={<UserOutlined />} className="text-sm py-1 px-3">
              {metadata.targetMarket}
            </Tag>
          )}
          {metadata?.pricePosture && (
            <Tag color="green" icon={<DollarOutlined />} className="text-sm py-1 px-3">
              {metadata.pricePosture}
            </Tag>
          )}
          {metadata?.industries?.map((industry: string, idx: number) => (
            <Tag key={idx} color="purple" className="text-sm py-1 px-3">
              {industry}
            </Tag>
          ))}
        </div>
      </div>

      {/* Content */}
      <Tabs defaultActiveKey="offers" size="large" className="offer-tabs">
        <TabPane 
          tab={
            <span className="flex items-center">
              <FileTextOutlined className="mr-2" />
              Signature Offers
            </span>
          } 
          key="offers"
        >
          {offer?.signatureOffers ? (
            <div className="space-y-8">
              <Tabs type="card" className="tier-tabs" size="large">
                {Object.entries(offer.signatureOffers).map(([tier, offerData]: [string, any]) => (
                  <TabPane 
                    tab={
                      <span className="tier-tab flex items-center">
                        {tier === 'starter' && <Badge color="blue" className="mr-2" />}
                        {tier === 'core' && <Badge color="green" className="mr-2" />}
                        {tier === 'premium' && <Badge color="gold" className="mr-2" />}
                        {tier.charAt(0).toUpperCase() + tier.slice(1)}
                        <Tag color={getTierColor(tier)} className="ml-2">
                          {offer.pricing?.[tier] || 'Price TBD'}
                        </Tag>
                      </span>
                    } 
                    key={tier}
                  >
                    <OfferTierDisplay 
                      tier={tier}
                      offer={offerData} 
                      pricing={offer.pricing?.[tier]} 
                    />
                  </TabPane>
                ))}
              </Tabs>
            </div>
          ) : (
            <Alert message="No offer data available" type="warning" />
          )}
        </TabPane>

        <TabPane 
          tab={
            <span className="flex items-center">
              <BarChartOutlined className="mr-2" />
              Comparison Table
            </span>
          } 
          key="comparison"
        >
          {offer?.comparisonTable ? (
            <ComparisonTable comparison={offer.comparisonTable} />
          ) : (
            <Alert message="No comparison data available" type="warning" />
          )}
        </TabPane>

        <TabPane 
          tab={
            <span className="flex items-center">
              <SafetyCertificateOutlined className="mr-2" />
              Guarantees & Terms
            </span>
          } 
          key="guarantees"
        >
          <GuaranteesDisplay offer={offer} />
        </TabPane>

        <TabPane 
          tab={
            <span className="flex items-center">
              <BarChartOutlined className="mr-2" />
              Analysis
            </span>
          } 
          key="analysis"
        >
          {offer?.analysis ? (
            <AnalysisDisplay analysis={offer.analysis} />
          ) : (
            <Alert message="No analysis data available" type="warning" />
          )}
        </TabPane>

        {/* <TabPane 
          tab={
            <span className="flex items-center">
              <ExclamationCircleOutlined className="mr-2" />
              Raw Data
            </span>
          } 
          key="raw"
        >
          <Card className="raw-data-card">
            <pre className="whitespace-pre-wrap overflow-auto max-h-96 text-sm p-4 bg-gray-50 rounded-lg">
              {JSON.stringify(offer, null, 2)}
            </pre>
          </Card>
        </TabPane> */}
      </Tabs>

      {/* Preview Modal */}
      <Modal
        title="Offer Preview"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={1000}
        style={{ top: 20 }}
      >
        <div className="preview-content p-4">
          <h1 className="text-2xl font-bold text-center mb-4">{offerData.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: generateHTMLExport(offerData) }} />
        </div>
      </Modal>
    </div>
  );
}

// Components for displaying different sections
function OfferTierDisplay({ tier, offer, pricing }: { tier: string, offer: any; pricing: string }) {
  const safeScope = Array.isArray(offer?.scope) ? offer.scope : [];
  const safeProof = Array.isArray(offer?.proof) ? offer.proof : [];
  const safeMilestones = Array.isArray(offer?.milestones) ? offer.milestones : [];

  return (
    <div className="space-y-8">
      <Card className="tier-card shadow-lg">
        <div className="tier-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <Title level={2} className="tier-name mb-2">
              {offer?.name || 'Offer Name Not Available'}
            </Title>
            <div className="flex items-center gap-2">
              <Tag color={getTierColor(tier)} className="price-tag text-lg py-1 px-3">
                <DollarOutlined className="mr-1" /> {pricing || 'Price not set'}
              </Tag>
              <Tag color="blue" className="text-lg py-1 px-3">
                {offer?.term || 'Term not specified'}
              </Tag>
            </div>
          </div>
        </div>
        
        <Divider />
        
        <div className="space-y-8">
          <div className="target-section">
            <Title level={4} className="section-title flex items-center">
              <UserOutlined className="mr-2 text-blue-500" /> Who this is for:
            </Title>
            <div className="mt-3 p-4 rounded-lg border border-blue-200">
              <Text className="text-sm">{offer?.for || 'Target not specified'}</Text>
            </div>
          </div>
          
          <div className="promise-section">
            <Title level={4} className="section-title flex items-center">
              <CheckCircleOutlined className="mr-2 text-green-500" /> Core Promise:
            </Title>
            <div className="promise-content mt-3 p-4  rounded-lg border-l-4 border-green-500">
              <Paragraph className="text-sm font-medium">{offer?.promise || 'Promise not defined'}</Paragraph>
            </div>
          </div>
          
          <div className="scope-section">
            <Title level={4} className="section-title flex items-center">
              <FileTextOutlined className="mr-2 text-purple-500" /> What is included:
            </Title>
            {safeScope.length > 0 ? (
          <List
  className="scope-list"
  dataSource={safeScope}
  renderItem={(item: string) => (
    <List.Item className="border-0 py-3 !px-0">
      <div className="flex items-center">
        <CheckCircleOutlined className="list-icon text-green-500 mr-3 text-lg" />
        <Text className="text-sm">{item}</Text>
      </div>
    </List.Item>
  )}
/>

            ) : (
              <Alert message="Scope not defined" type="info" className="mt-3" />
            )}
          </div>
          
          <div className="proof-section">
            <Title level={4} className="section-title flex items-center">
              <SafetyCertificateOutlined className="mr-2 text-orange-500" /> Proof & Evidence:
            </Title>
            {safeProof.length > 0 ? (
              <div className="mt-3">
               <List
  className="proof-list"
  dataSource={safeProof}
  renderItem={(item: string) => (
    <List.Item className="border-0 py-3 !px-0">
      <div className="flex items-center">
        <CheckCircleOutlined className="list-icon text-green-500 mr-3 text-lg" />
        <Text className="text-sm">{item}</Text>
      </div>
    </List.Item>
  )}
/>

              </div>
            ) : (
              <Alert message="Proof not provided" type="info" className="mt-3" />
            )}
          </div>
          
          <div className="timeline-section">
            <Title level={4} className="section-title flex items-center">
              <ClockCircleOutlined className="mr-2 text-red-500" /> Timeline:
            </Title>
            <div className="timeline-content mt-3 p-4 rounded-lg border-l-4 border-red-500">
              <Text className="text-sm">{offer?.timeline || 'Timeline not specified'}</Text>
            </div>
          </div>
          
          <div className="milestones-section">
            <Title level={4} className="section-title flex items-center">
              <RocketOutlined className="mr-2 text-purple-500" /> Key Milestones:
            </Title>
            {safeMilestones.length > 0 ? (
              <div className="mt-3">
                <List
  className="milestones-list"
  dataSource={safeMilestones}
  renderItem={(item: string) => (
    <List.Item className="border-0 py-3 !px-0">
      <div className="flex items-center">
        <CheckCircleOutlined className="list-icon text-green-500 mr-3 text-lg" />
        <Text className="text-sm">{item}</Text>
      </div>
    </List.Item>
  )}
/>

              </div>
            ) : (
              <Alert message="Milestones not defined" type="info" className="mt-3" />
            )}
          </div>
          
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Card title="Guarantee" className="h-full">
                <div className="p-3  rounded-lg">
                  <Text className="text-sm">{offer?.guarantee || 'Not specified'}</Text>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Client Requirements" className="h-full">
                <div className="p-3 rounded-lg">
                  <Text className="text-sm">{offer?.requirements || 'Not specified'}</Text>
                </div>
              </Card>
            </Col>
          </Row>
          
          {offer?.clientLift && (
            <div className="client-impact">
              <Title level={4} className="section-title flex items-center">
                <RocketOutlined className="mr-2 text-green-500" /> Expected Client Impact:
              </Title>
              <div className="mt-3 p-4  rounded-lg border border-green-200">
                <Text className="text-sm">{offer.clientLift}</Text>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function ComparisonTable({ comparison }: { comparison: any }) {
  const columns = [
    { 
      title: 'Feature', 
      dataIndex: 'name', 
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
      width: '25%'
    },
    { 
      title: 'Starter', 
      dataIndex: 'starter', 
      key: 'starter',
      render: (text: string) => (
        <div className="text-center">
          {text === 'Included' || text === '✓' ? (
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
          ) : text === 'Not Included' || text === '✕' ? (
            <span style={{ color: '#ff4d4f', fontSize: '18px' }}>✕</span>
          ) : (
            <Text>{text}</Text>
          )}
        </div>
      ),
      width: '25%'
    },
    { 
      title: 'Core', 
      dataIndex: 'core', 
      key: 'core',
      render: (text: string) => (
        <div className="text-center">
          {text === 'Included' || text === '✓' ? (
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
          ) : text === 'Not Included' || text === '✕' ? (
            <span style={{ color: '#ff4d4f', fontSize: '18px' }}>✕</span>
          ) : (
            <Text>{text}</Text>
          )}
        </div>
      ),
      width: '25%'
    },
    { 
      title: 'Premium', 
      dataIndex: 'premium', 
      key: 'premium',
      render: (text: string) => (
        <div className="text-center">
          {text === 'Included' || text === '✓' ? (
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
          ) : text === 'Not Included' || text === '✕' ? (
            <span style={{ color: '#ff4d4f', fontSize: '18px' }}>✕</span>
          ) : (
            <Text>{text}</Text>
          )}
        </div>
      ),
      width: '25%'
    },
  ];

  return (
    <Card title="Feature Comparison" className="comparison-card shadow-lg">
      <Table 
        dataSource={comparison?.features || []} 
        columns={columns}
        pagination={false}
        rowKey={(record, index) => index?.toString() || Math.random().toString()}
        className="comparison-table"
        scroll={{ x: true }}
      />
    </Card>
  );
}

function GuaranteesDisplay({ offer }: { offer: any }) {
  return (
    <div className="space-y-6">
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <Card title="Guarantees" className="guarantee-card shadow-lg">
            <div className="space-y-4">
              {offer?.signatureOffers ? (
                Object.entries(offer.signatureOffers).map(([tier, offerData]: [string, any]) => (
                  <div key={tier} className="guarantee-item p-4 border-b last:border-b-0">
                    <Title level={4} className="mb-2 capitalize">{tier} Tier Guarantee</Title>
                    <div className="p-3  rounded-lg">
                      <Text className="text-sm">{offerData?.guarantee || 'No guarantee specified'}</Text>
                    </div>
                  </div>
                ))
              ) : (
                <Alert message="No guarantees specified" type="info" />
              )}
            </div>
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[24, 24]} className="mt-6">
        <Col xs={24}>
          <Card title="Terms & Conditions" className="terms-card shadow-lg">
            <div className="space-y-6">
              {offer?.signatureOffers ? (
                <Collapse defaultActiveKey={['1']}>
                  <Panel header="Payment Terms" key="1">
                    {Object.entries(offer.signatureOffers).map(([tier, offerData]: [string, any]) => (
                      <div key={tier} className="mb-4 p-3  rounded-lg">
                        <Text strong className="capitalize">{tier}: </Text>
                        <Text className="text-sm">{offerData?.term || 'Not specified'}</Text>
                      </div>
                    ))}
                  </Panel>
                  <Panel header="Client Requirements" key="2">
                    {Object.entries(offer.signatureOffers).map(([tier, offerData]: [string, any]) => (
                      <div key={tier} className="mb-4 p-3  rounded-lg">
                        <Text strong className="capitalize">{tier}: </Text>
                        <Text className="text-sm">{offerData?.requirements || 'Not specified'}</Text>
                      </div>
                    ))}
                  </Panel>
                </Collapse>
              ) : (
                <Alert message="No terms specified" type="info" />
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

function AnalysisDisplay({ analysis }: { analysis: any }) {
  return (
    <div className="space-y-8">
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="Conversion Analysis" className="analysis-card shadow-lg h-full">
            <Row gutter={[24, 24]}>
              <Col xs={24}>
                <Statistic 
                  title="Conversion Potential Score" 
                  value={analysis?.conversionPotential?.score || 0} 
                  suffix="%" 
                  valueStyle={{ 
                    color: analysis?.conversionPotential?.score > 70 ? '#3f8600' : 
                           analysis?.conversionPotential?.score > 40 ? '#faad14' : '#cf1322',
                    fontSize: '24px'
                  }}
                />
                <Progress 
                  percent={analysis?.conversionPotential?.score || 0} 
                  status="active" 
                  strokeColor={
                    analysis?.conversionPotential?.score > 70 ? '#52c41a' : 
                    analysis?.conversionPotential?.score > 40 ? '#faad14' : '#ff4d4f'
                  }
                  className="mt-3"
                />
              </Col>
              <Col xs={24}>
                <Title level={4}>Key Factors</Title>
                <div className="mt-3 space-y-3">
                  {analysis?.conversionPotential?.factors?.map((factor: any, idx: number) => (
                    <div key={idx} className="factor-item p-3  rounded-lg">
                      <div className="flex items-center justify-between">
                        <Text>{factor.factor}</Text>
                        <Tag color={factor.impact === 'High' ? 'green' : factor.impact === 'Medium' ? 'orange' : 'red'}>
                          {factor.impact}
                        </Tag>
                      </div>
                      {factor.recommendation && (
                        <Text type="secondary" className="block mt-1">{factor.recommendation}</Text>
                      )}
                    </div>
                  )) || <Alert message="No factors available" type="info" />}
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="Market Analysis" className="market-card shadow-lg h-full">
            {analysis?.marketAnalysis ? (
              <div className="space-y-6">
                <div>
                  <Title level={5}>Competitive Positioning</Title>
                  <div className="p-3 bg-blue-50 rounded-lg mt-2">
                    <Text>{analysis.marketAnalysis.positioning || 'Not specified'}</Text>
                  </div>
                </div>
                <div>
                  <Title level={5}>Target Audience Response</Title>
                  <div className="p-3 bg-green-50 rounded-lg mt-2">
                    <Text>{analysis.marketAnalysis.audienceResponse || 'Not specified'}</Text>
                  </div>
                </div>
                <div>
                  <Title level={5}>Recommended Adjustments</Title>
                  <div className="mt-2">
                    <List
                      dataSource={analysis.marketAnalysis.adjustments || []}
                      renderItem={(item: string) => (
                        <List.Item className="border-0 py-2">
                          <div className="flex items-start">
                            <ExclamationCircleOutlined style={{ color: '#1890ff', marginRight: '12px', marginTop: '4px' }} />
                            <Text>{item}</Text>
                          </div>
                        </List.Item>
                      )}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <Alert message="No market analysis available" type="info" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}