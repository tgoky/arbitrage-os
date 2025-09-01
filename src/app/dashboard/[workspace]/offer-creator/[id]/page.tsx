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
  message
} from 'antd';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  EditOutlined,
  CopyOutlined,
  ShareAltOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useWorkspaceContext } from '../../../../hooks/useWorkspaceContext';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface OfferData {
  id: string;
  title: string;
  content: any;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

export default function OfferCreatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  
  const [offerData, setOfferData] = useState<OfferData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        throw new Error('Failed to fetch offer details');
      }

      const data = await response.json();
      
      if (data.success) {
        setOfferData(data.data);
      } else {
        throw new Error(data.error || 'Failed to load offer');
      }
    } catch (error) {
      console.error('Error fetching offer:', error);
      setError(error instanceof Error ? error.message : 'Failed to load offer');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    // Navigate back to offer creator with this offer loaded
    router.push(`/dashboard/${workspace}/offer-creator?load=${offerId}`);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm('Are you sure you want to delete this offer? This action cannot be undone.');
    if (!confirmed) return;

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
      // Create HTML export
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

  const generateHTMLExport = (data: OfferData): string => {
    // Generate a clean HTML version of the offer
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
        <Spin size="large" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <Spin size="large" />
          <p className="mt-4">Loading offer details...</p>
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
              <Button onClick={() => router.push(`/submissions`)}>
                Back to submissions
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
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-4">
            <Button 
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push(`/dashboard/${workspace}`)}
            >
              Back to Dashboard
            </Button>
            <div>
              <Title level={2} className="mb-0">
                {offerData.title}
              </Title>
              <Text type="secondary">
                Created {new Date(offerData.createdAt).toLocaleDateString()} • 
                Updated {new Date(offerData.updatedAt).toLocaleDateString()}
              </Text>
            </div>
          </div>
          
          <Space>
            <Button icon={<EditOutlined />} onClick={handleEdit}>
              Edit
            </Button>
            <Button icon={<CopyOutlined />} onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(offer, null, 2));
              message.success('Copied to clipboard');
            }}>
              Copy
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => handleExport('html')}>
              Export HTML
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => handleExport('json')}>
              Export JSON
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
              Delete
            </Button>
          </Space>
        </div>

        {/* Metadata Tags */}
        <div className="flex flex-wrap gap-2">
          {metadata?.targetMarket && (
            <Tag color="blue">{metadata.targetMarket}</Tag>
          )}
          {metadata?.pricePosture && (
            <Tag color="green">{metadata.pricePosture}</Tag>
          )}
          {metadata?.industries?.map((industry: string, idx: number) => (
            <Tag key={idx} color="purple">{industry}</Tag>
          ))}
        </div>
      </div>

      {/* Content */}
      <Tabs defaultActiveKey="offers" size="large">
        <TabPane tab="Signature Offers" key="offers">
          {offer?.primaryOffer?.signatureOffers ? (
            <div className="space-y-8">
              <Tabs type="card">
                {Object.entries(offer.primaryOffer.signatureOffers).map(([tier, offerData]: [string, any]) => (
                  <TabPane 
                    tab={`${tier.charAt(0).toUpperCase() + tier.slice(1)}`} 
                    key={tier}
                  >
                    <OfferTierDisplay 
                      offer={offerData} 
                      pricing={offer.primaryOffer.pricing?.[tier]} 
                    />
                  </TabPane>
                ))}
              </Tabs>
            </div>
          ) : (
            <Alert message="No offer data available" type="warning" />
          )}
        </TabPane>

        <TabPane tab="Comparison Table" key="comparison">
          {offer?.primaryOffer?.comparisonTable ? (
            <ComparisonTable comparison={offer.primaryOffer.comparisonTable} />
          ) : (
            <Alert message="No comparison data available" type="warning" />
          )}
        </TabPane>

        <TabPane tab="Analysis" key="analysis">
          {offer?.analysis ? (
            <AnalysisDisplay analysis={offer.analysis} />
          ) : (
            <Alert message="No analysis data available" type="warning" />
          )}
        </TabPane>

        <TabPane tab="Raw Data" key="raw">
          <Card>
            <pre className="whitespace-pre-wrap overflow-auto max-h-96 text-sm">
              {JSON.stringify(offer, null, 2)}
            </pre>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
}

// Components for displaying different sections
function OfferTierDisplay({ offer, pricing }: { offer: any; pricing: string }) {
  return (
    <div className="space-y-6">
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card>
            <Title level={3}>{offer?.name || 'Offer Name'}</Title>
            <Title level={4} type="secondary">{pricing || 'Price not set'}</Title>
            
            <Divider />
            
            <div className="space-y-4">
              <div>
                <Text strong>Who this is for:</Text>
                <div className="mt-2">
                  <Tag color="green">{offer?.for || 'Target not specified'}</Tag>
                </div>
              </div>
              
              <div>
                <Text strong>Core Promise:</Text>
                <div className="bg-blue-50 p-4 rounded-lg mt-2">
                  <Text>{offer?.promise || 'Promise not defined'}</Text>
                </div>
              </div>
              
              <div>
                <Text strong>What's included:</Text>
                <ul className="mt-2 space-y-1">
                  {offer?.scope?.map((item: string, idx: number) => (
                    <li key={idx}>• {item}</li>
                  )) || <li>Scope not defined</li>}
                </ul>
              </div>
              
              <div>
                <Text strong>Timeline:</Text>
                <div className="bg-green-50 p-4 rounded-lg mt-2">
                  <Text>{offer?.timeline || 'Timeline not specified'}</Text>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title="Details">
            <div className="space-y-4">
              <div>
                <Text strong>Term:</Text>
                <div className="text-lg font-semibold">{offer?.term || 'Not specified'}</div>
              </div>
              
              <div>
                <Text strong>Guarantee:</Text>
                <div>{offer?.guarantee || 'Not specified'}</div>
              </div>
              
              <div>
                <Text strong>Client Requirements:</Text>
                <div>{offer?.requirements || 'Not specified'}</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

function ComparisonTable({ comparison }: { comparison: any }) {
  const columns = [
    { title: 'Feature', dataIndex: 'name', key: 'name' },
    { title: 'Starter', dataIndex: 'starter', key: 'starter' },
    { title: 'Core', dataIndex: 'core', key: 'core' },
    { title: 'Premium', dataIndex: 'premium', key: 'premium' },
  ];

  return (
    <Card title="Feature Comparison">
      <Table 
        dataSource={comparison?.features || []} 
        columns={columns}
        pagination={false}
        rowKey={(record, index) => index}
      />
    </Card>
  );
}

function AnalysisDisplay({ analysis }: { analysis: any }) {
  return (
    <div className="space-y-6">
      <Card title="Conversion Analysis">
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Statistic 
              title="Conversion Potential" 
              value={analysis?.conversionPotential?.score || 0} 
              suffix="%" 
            />
            <Progress 
              percent={analysis?.conversionPotential?.score || 0} 
              status="active" 
            />
          </Col>
          <Col xs={24} md={12}>
            <div>
              <Text strong>Key Factors:</Text>
              <div className="mt-2 space-y-1">
                {analysis?.conversionPotential?.factors?.map((factor: any, idx: number) => (
                  <div key={idx} className="text-sm">
                    <Tag color={factor.impact === 'High' ? 'green' : factor.impact === 'Medium' ? 'orange' : 'red'}>
                      {factor.impact}
                    </Tag>
                    {factor.factor}
                  </div>
                )) || <Text type="secondary">No factors available</Text>}
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}