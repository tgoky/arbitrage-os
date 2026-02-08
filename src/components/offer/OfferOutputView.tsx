// src/components/offer/OfferOutputView.tsx
import React from 'react';
import {
  Card,
  Typography,
  Tabs,
  Table,
  Button,
  Space,
  Progress,
  Steps,
  Tag,
  Alert,
  Row,
  Col,
  Statistic,
  message,
} from 'antd';
import {
  CopyOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  BarChartOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Step } = Steps;

interface OfferPackage {
  signatureOffers: {
    starter?: any;
    core?: any;
    premium?: any;
  };
  pricing?: {
    starter?: string;
    core?: string;
    premium?: string;
  };
  comparisonTable?: {
    features?: Array<{
      name: string;
      starter: string;
      core: string;
      premium: string;
    }>;
  };
  analysis?: {
    conversionPotential?: {
      score?: number;
      factors?: Array<{
        factor: string;
        impact: string;
      }>;
    };
  };
}

interface OfferOutputViewProps {
  offer: OfferPackage;
  title?: string;
  onExport?: (format: 'json' | 'html') => void;
  onCopy?: () => void;
}

export const OfferOutputView: React.FC<OfferOutputViewProps> = ({
  offer,
  title = "Your Signature Offers",
  onExport,
  onCopy,
}) => {
  const hasValidOfferStructure = () => {
    return !!(
      offer?.signatureOffers?.starter &&
      offer?.signatureOffers?.core &&
      offer?.signatureOffers?.premium
    );
  };

  if (!hasValidOfferStructure()) {
    return (
      <div className="text-center py-12">
        <Alert
          message="Invalid Offer Structure"
          description="The offer data appears to be incomplete or corrupted."
          type="error"
          showIcon
        />
      </div>
    );
  }


  // OfferPreview component from your generator page
const OfferPreview = ({ offer, pricing }: { offer: any; pricing: string }) => {
  const safeScope = Array.isArray(offer.scope) ? offer.scope : [];
  const safeProof = Array.isArray(offer.proof) ? offer.proof : [];
  const safeMilestones = Array.isArray(offer.milestones) ? offer.milestones : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Title level={3} style={{ color: '#f1f5f9' }}>{offer.name || 'Untitled Offer'}</Title>
          <Title level={4} style={{ color: '#5CC49D' }}> {/* Changed from #000000 to #5CC49D */}
            {pricing || 'Price not set'}
          </Title>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <Text strong style={{ color: '#f1f5f9' }}>Who this is for:</Text>
          <div className="p-4 rounded-lg border mt-2" style={{ background: '#000000', borderColor: '#475569' }}>
            <Text style={{ color: '#94a3b8' }}>{offer.for || 'Target audience not specified'}</Text>
          </div>
        </div>
        
        <div>
          <Text strong style={{ color: '#f1f5f9' }}>Core promise:</Text>
          <div className="p-4 rounded-lg border mt-2" style={{ background: '#000000', borderColor: '#475569' }}>
            <Text strong style={{ color: '#f1f5f9' }}>{offer.promise || 'Promise not defined'}</Text>
          </div>
        </div>
        
        <div>
          <Text strong style={{ color: '#f1f5f9' }}>What you do:</Text>
          {safeScope.length > 0 ? (
            <ul className="list-disc pl-5 mt-2">
              {safeScope.map((item: string, idx: number) => ( // Add type annotation
                <li key={idx} style={{ color: '#94a3b8' }}>{item}</li>
              ))}
            </ul>
          ) : (
            <Text style={{ color: '#64748b' }}>Scope not defined</Text>
          )}
        </div>
        
        <div>
          <Text strong style={{ color: '#f1f5f9' }}>Proof & differentiators:</Text>
          {safeProof.length > 0 ? (
            <ul className="list-disc pl-5 mt-2">
              {safeProof.map((item: string, idx: number) => ( // Add type annotation
                <li key={idx} style={{ color: '#94a3b8' }}>{item}</li>
              ))}
            </ul>
          ) : (
            <Text style={{ color: '#64748b' }}>Proof elements not defined</Text>
          )}
        </div>
        
        <Row gutter={16}>
          <Col span={12}>
            <div>
              <Text strong style={{ color: '#f1f5f9' }}>Setup timeline:</Text>
              <div className="p-4 rounded-lg border-l-4 mt-2" style={{ 
                background: 'rgba(92, 196, 157, 0.1)',
                borderLeftColor: '#5CC49D',
                borderColor: '#475569'
              }}>
                <Text strong style={{ color: '#5CC49D' }}>{offer.timeline || 'Timeline not specified'}</Text>
              </div>
            </div>
          </Col>
          <Col span={12}>
            <div>
              <Text strong style={{ color: '#f1f5f9' }}>Success milestones:</Text>
              {safeMilestones.length > 0 ? (
                <ul className="list-disc pl-5 mt-2">
                  {safeMilestones.map((item: string, idx: number) => ( // Add type annotation
                    <li key={idx} style={{ color: '#94a3b8' }}>{item}</li>
                  ))}
                </ul>
              ) : (
                <Text style={{ color: '#64748b' }}>Milestones not defined</Text>
              )}
            </div>
          </Col>
        </Row>
        
        <div>
          <Text strong style={{ color: '#f1f5f9' }}>Guarantee:</Text>
          <Text style={{ color: '#94a3b8' }}>{offer.guarantee || 'Guarantee not specified'}</Text>
        </div>
        
        <div>
          <Text strong style={{ color: '#f1f5f9' }}>Client lift estimate:</Text>
          <Text style={{ color: '#94a3b8' }}>{offer.clientLift || 'Client impact not specified'}</Text>
        </div>
      </div>
    </div>
  );
};

  return (
    <div className="space-y-8">
      <Card style={{ background: '#000000', borderColor: '#334155' }}>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <Title level={4} style={{ color: '#f1f5f9' }}>{title}</Title>
          <Space>
            {onCopy && (
              <Button
                icon={<CopyOutlined />}
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(offer, null, 2));
                  message.success("Copied to clipboard!");
                }}
                style={{ background: '#000000', borderColor: '#475569', color: '#f1f5f9' }}
              >
                Copy JSON
              </Button>
            )}
            {onExport && (
              <>
                <Button 
                  icon={<DownloadOutlined />} 
                  onClick={() => onExport("html")}
                  style={{ background: '#000000', borderColor: '#475569', color: '#f1f5f9' }}
                >
                  Export HTML
                </Button>
                <Button 
                  icon={<DownloadOutlined />} 
                  onClick={() => onExport("json")}
                  style={{ background: '#000000', borderColor: '#475569', color: '#f1f5f9' }}
                >
                  Export JSON
                </Button>
              </>
            )}
          </Space>
        </div>
      </Card>

     <Card title={<span style={{ color: '#f1f5f9' }}>Signature Offers</span>} style={{ background: '#000000', borderColor: '#334155' }}>
  <Tabs 
    type="card"
    className="custom-tabs"
  >
    <TabPane 
      tab={
        <span className="custom-tab-text">
          Starter
        </span>
      } 
      key="starter"
    >
      <OfferPreview 
        offer={offer.signatureOffers.starter} 
        pricing={offer.pricing?.starter || ''} 
      />
    </TabPane>
    <TabPane 
      tab={
        <span className="custom-tab-text">
          Core
        </span>
      } 
      key="core"
    >
      <OfferPreview 
        offer={offer.signatureOffers.core} 
        pricing={offer.pricing?.core || ''} 
      />
    </TabPane>
    <TabPane 
      tab={
        <span className="custom-tab-text">
          Premium
        </span>
      } 
      key="premium"
    >
      <OfferPreview 
        offer={offer.signatureOffers.premium} 
        pricing={offer.pricing?.premium || ''} 
      />
    </TabPane>
  </Tabs>
</Card>

{/* Add this style tag in your component */}
<style jsx global>{`
  /* Custom tabs styling */
  .custom-tabs .ant-tabs-tab {
    background: #1a1a1a !important;
    border: 1px solid #334155 !important;
    border-bottom: none !important;
    border-radius: 8px 8px 0 0 !important;
    padding: 8px 16px !important;
    margin-right: 8px !important;
  }
  
  .custom-tabs .ant-tabs-tab .custom-tab-text {
    color: #94a3b8 !important;
    font-weight: 500;
  }
  
  .custom-tabs .ant-tabs-tab:hover {
    background: #1a1a1a !important;
    border-color: #5CC49D !important;
  }
  
  .custom-tabs .ant-tabs-tab:hover .custom-tab-text {
    color: #5CC49D !important;
  }
  
  .custom-tabs .ant-tabs-tab-active {
    background: #000000 !important;
    border-color: #5CC49D !important;
    border-bottom: 1px solid #000000 !important;
  }
  
  .custom-tabs .ant-tabs-tab-active .custom-tab-text {
    color: #5CC49D !important;
    font-weight: 600;
  }
  
  .custom-tabs .ant-tabs-ink-bar {
    background: #5CC49D !important;
    height: 3px !important;
  }
  
  /* Remove any gray background on hover/active */
  .custom-tabs .ant-tabs-tab:not(.ant-tabs-tab-disabled):hover {
    color: inherit !important;
  }
  
  .custom-tabs .ant-tabs-tab-btn:focus,
  .custom-tabs .ant-tabs-tab-remove:focus,
  .custom-tabs .ant-tabs-tab-btn:active,
  .custom-tabs .ant-tabs-tab-remove:active {
    color: inherit !important;
  }

  /* Custom table styling - ADD THIS SECTION */
  .custom-table .ant-table {
    background: #000000 !important;
    border: 1px solid #334155 !important;
    border-radius: 8px;
  }
  
  .custom-table .ant-table-thead > tr > th {
    background: #000000 !important; /* Black header background */
    border-bottom: 2px solid #334155 !important;
    color: #f1f5f9 !important;
    font-weight: 600;
    padding: 12px 16px;
  }
  
  .custom-table .ant-table-tbody > tr > td {
    background: #000000 !important;
    border-bottom: 1px solid #334155 !important;
    padding: 12px 16px;
  }
  
  .custom-table .ant-table-tbody > tr:hover > td {
    background: rgba(92, 196, 157, 0.1) !important;
  }
  
  .custom-table .ant-table-cell {
    border-color: #334155 !important;
  }
  
  /* Remove any default Ant Design header styling */
  .custom-table .ant-table-thead > tr > th::before {
    display: none !important;
  }
  
  .custom-table .ant-table-thead > tr > th.ant-table-cell-fix-left,
  .custom-table .ant-table-thead > tr > th.ant-table-cell-fix-right {
    background: #000000 !important;
  }

  /* Optional: Style for table rows */
  .custom-table .ant-table-tbody > tr > td:first-child {
    color: #f1f5f9 !important; /* Make feature names white */
  }
`}</style>
  

  {offer.comparisonTable?.features && (
  <Card title={<span style={{ color: '#f1f5f9' }}>Feature Comparison</span>} style={{ background: '#000000', borderColor: '#334155' }}>
    <Table
      dataSource={offer.comparisonTable.features.map((feature, idx) => ({
        ...feature,
        key: idx,
      }))}
      pagination={false}
      columns={[
        {
          title: <span style={{ color: '#f1f5f9' }}>Feature</span>,
          dataIndex: "name",
          key: "name",
          render: (text: string) => <span style={{ color: '#f1f5f9' }}>{text}</span>,
          onHeaderCell: () => ({
            style: {
              backgroundColor: '#000000', // Black header background
              borderColor: '#334155',
              color: '#f1f5f9',
            }
          }),
          onCell: () => ({
            style: {
              backgroundColor: '#000000',
              borderColor: '#334155',
              color: '#f1f5f9',
            }
          })
        },
        {
          title: <span style={{ color: '#f1f5f9' }}>Starter</span>,
          dataIndex: "starter",
          key: "starter",
          render: (text: string) =>
            text === "✓" ? (
              <CheckCircleOutlined style={{ color: '#5CC49D' }} />
            ) : text === "✕" ? (
              <span style={{ color: "#ff4d4f" }}>✕</span>
            ) : (
              <span style={{ color: '#94a3b8' }}>{text}</span>
            ),
          onHeaderCell: () => ({
            style: {
              backgroundColor: '#000000', // Black header background
              borderColor: '#334155',
              color: '#f1f5f9',
            }
          }),
          onCell: () => ({
            style: {
              backgroundColor: '#000000',
              borderColor: '#334155',
              color: '#94a3b8',
            }
          })
        },
        {
          title: <span style={{ color: '#f1f5f9' }}>Core</span>,
          dataIndex: "core",
          key: "core",
          render: (text: string) =>
            text === "✓" ? (
              <CheckCircleOutlined style={{ color: '#5CC49D' }} />
            ) : text === "✕" ? (
              <span style={{ color: "#ff4d4f" }}>✕</span>
            ) : (
              <span style={{ color: '#94a3b8' }}>{text}</span>
            ),
          onHeaderCell: () => ({
            style: {
              backgroundColor: '#000000', // Black header background
              borderColor: '#334155',
              color: '#f1f5f9',
            }
          }),
          onCell: () => ({
            style: {
              backgroundColor: '#000000',
              borderColor: '#334155',
              color: '#94a3b8',
            }
          })
        },
        {
          title: <span style={{ color: '#f1f5f9' }}>Premium</span>,
          dataIndex: "premium",
          key: "premium",
          render: (text: string) =>
            text === "✓" ? (
              <CheckCircleOutlined style={{ color: '#5CC49D' }} />
            ) : text === "✕" ? (
              <span style={{ color: "#ff4d4f" }}>✕</span>
            ) : (
              <span style={{ color: '#94a3b8' }}>{text}</span>
            ),
          onHeaderCell: () => ({
            style: {
              backgroundColor: '#000000', // Black header background
              borderColor: '#334155',
              color: '#f1f5f9',
            }
          }),
          onCell: () => ({
            style: {
              backgroundColor: '#000000',
              borderColor: '#334155',
              color: '#94a3b8',
            }
          })
        },
      ]}
      style={{
        background: '#000000',
        borderColor: '#334155',
      }}
      className="custom-table"
    />
  </Card>
)}

      {offer.pricing && offer.signatureOffers && (
        <Card title={<span style={{ color: '#f1f5f9' }}>Pricing Summary</span>} style={{ background: '#000000', borderColor: '#334155' }}>
          <Row gutter={16}>
            <Col span={8}>
              <div className="text-center p-4 rounded" style={{ background: '#000000', borderColor: '#475569' }}>
                <Title level={4} style={{ color: '#f1f5f9' }}>Starter</Title>
                <Title level={2} style={{ color: '#94a3b8' }}>
                  {offer.pricing.starter || 'Price TBD'}
                </Title>
                <Text style={{ color: '#94a3b8' }}>
                  {offer.signatureOffers.starter?.term || 'Term TBD'}
                </Text>
              </div>
            </Col>
            <Col span={8}>
              <div className="text-center p-4 rounded" style={{ background: '#000000', borderColor: '#475569' }}>
                <Title level={4} style={{ color: '#f1f5f9' }}>Core (Recommended)</Title>
                <Title level={2} style={{ color: '#5CC49D' }}>
                  {offer.pricing.core || 'Price TBD'}
                </Title>
                <Text style={{ color: '#94a3b8' }}>
                  {offer.signatureOffers.core?.term || 'Term TBD'}
                </Text>
              </div>
            </Col>
            <Col span={8}>
              <div className="text-center p-4 rounded" style={{ background: '#000000', borderColor: '#475569' }}>
                <Title level={4} style={{ color: '#f1f5f9' }}>Premium</Title>
                <Title level={2} style={{ color: '#94a3b8' }}>
                  {offer.pricing.premium || 'Price TBD'}
                </Title>
                <Text style={{ color: '#94a3b8' }}>
                  {offer.signatureOffers.premium?.term || 'Term TBD'}
                </Text>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {offer.analysis && (
        <Card title={<span style={{ color: '#f1f5f9' }}>Offer Analysis</span>} style={{ background: '#000000', borderColor: '#334155' }}>
          <Row gutter={16}>
            <Col span={12}>
              <div>
                <Text strong style={{ color: '#f1f5f9' }}>Conversion Potential Score</Text>
                <div className="mt-2">
                  <Progress 
                    percent={offer.analysis.conversionPotential?.score || 0} 
                    status="active"
                    strokeColor='#5CC49D'
                  />
                  <Text style={{ color: '#94a3b8' }}>{offer.analysis.conversionPotential?.score || 0}%</Text>
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div>
                <Text strong style={{ color: '#f1f5f9' }}>Key Factors</Text>
                <ul className="mt-2">
                  {offer.analysis.conversionPotential?.factors?.map((factor, idx) => (
                    <li key={idx} style={{ 
                      color: factor.impact === 'High' ? '#5CC49D' : 
                            factor.impact === 'Medium' ? '#f59e0b' : '#ff4d4f'
                    }}>
                      {factor.factor} ({factor.impact})
                    </li>
                  )) || <li style={{ color: '#94a3b8' }}>No factors available</li>}
                </ul>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      <Card title={<span style={{ color: '#f1f5f9' }}>Next Steps</span>} style={{ background: '#000000', borderColor: '#334155' }}>
        <Steps progressDot current={0} direction="vertical">
          <Step title="Review generated offers" description="Make any necessary adjustments to the offers" />
          <Step title="Create sales collateral" description="Generate one-pagers and proposal templates" />
          <Step title="Set up fulfillment systems" description="Prepare your delivery processes and tools" />
          <Step title="Launch to market" description="Start promoting your new signature offers" />
        </Steps>
      </Card>
    </div>
  );
};