// app/proposal-creator/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileTextOutlined, 
  ArrowLeftOutlined, 
  DownloadOutlined, 
  CopyOutlined,
  EditOutlined,
  EyeOutlined,
  DollarOutlined,
  CalendarOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  ProjectOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { 
  Button, 
  Card, 
  Typography, 
  Divider, 
  Space, 
  Tag, 
  Alert, 
  Spin, 
  message,
  Badge,
  Descriptions,
  Collapse,
  List,
  Modal,
  Tooltip,
  Table,
  Avatar,
  Progress,
  Row,
  Col,
  Statistic,
  Tabs
} from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useWorkspaceContext } from '../../../../hooks/useWorkspaceContext';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { TabPane } = Tabs;

interface ProposalAnalysis {
  winProbability: {
    score: number;
    factors: Array<{
      factor: string;
      impact: 'High' | 'Medium' | 'Low';
      description: string;
    }>;
  };
  pricingAnalysis: {
    competitiveness: 'low' | 'competitive' | 'premium';
    valueJustification: string;
    recommendations: string[];
  };
  riskLevel: 'low' | 'medium' | 'high';
  strengthsWeaknesses: {
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
  };
}

interface ProposalPackage {
  proposal: {
    projectOverview: string;
    scopeOfWork: string;
    pricing: string;
    timeline: string;
    deliverables: string;
    terms: string;
    nextSteps: string;
    contractTemplates: {
      serviceAgreement: string;
      statementOfWork: string;
    };
    alternativeOptions?: Array<{
      title: string;
      description: string;
      pricingAdjustment: number;
      timelineAdjustment: string;
      scopeChanges: string[];
      pros: string[];
      cons: string[];
    }>;
  };
  analysis: ProposalAnalysis;
  recommendations: string[];
  alternativeOptions: any[];
  riskAssessment: any;
  competitiveAnalysis: any;
  tokensUsed: number;
  generationTime: number;
  originalInput: any;
}

interface ProposalDetail {
  id: string;
  title: string;
  proposalData: ProposalPackage;
  proposalType: string;
  clientName: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  totalValue: number;
  createdAt: string;
  updatedAt: string;
  metadata: {
    industry: string;
    projectSize: 'small' | 'medium' | 'large';
    complexity: 'low' | 'moderate' | 'high';
    winProbability: number;
    version: string;
  };
  workspace: {
    id: string;
    name: string;
  };
}

const ProposalDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  const [loading, setLoading] = useState(true);
  const [proposalDetail, setProposalDetail] = useState<ProposalDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const proposalId = params.id as string;

  useEffect(() => {
    if (isWorkspaceReady && currentWorkspace) {
      fetchProposalDetail();
    }
  }, [isWorkspaceReady, currentWorkspace, proposalId]);

  const fetchProposalDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/proposal-creator/${proposalId}?workspaceId=${currentWorkspace?.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch proposal details: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setProposalDetail(data.data);
      } else {
        throw new Error(data.error || 'Failed to load proposal details');
      }
    } catch (err) {
      console.error('Error fetching proposal detail:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      message.error('Failed to load proposal details');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('Copied to clipboard!');
    } catch (error) {
      message.error('Failed to copy to clipboard');
    }
  };

  const exportProposal = async (format: 'html' | 'pdf' | 'json' = 'html') => {
  if (!proposalDetail) return;
  
  try {
    setExportLoading(true);
    
    if (format === 'html') {
      // FIX: Just open the URL in new tab like the generator does
      const url = `/api/proposal-creator/${proposalId}/export?format=html`;
      window.open(url, '_blank');
      message.success('Proposal opened in new tab!');
      return;
    }
    
    // For other formats, use the existing download logic
    const response = await fetch(`/api/proposal-creator/${proposalId}/export?format=${format}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    if (format === 'json') {
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `proposal-${proposalId}-${new Date().toISOString().split('T')[0]}.json`;
      anchor.style.display = 'none';
      
      document.body.appendChild(anchor);
      anchor.click();
      
      URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
    } else if (format === 'pdf') {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `proposal-${proposalId}-${new Date().toISOString().split('T')[0]}.pdf`;
      anchor.style.display = 'none';
      
      document.body.appendChild(anchor);
      anchor.click();
      
      URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
    }
    
    message.success(`Proposal exported successfully as ${format.toUpperCase()}!`);
  } catch (error) {
    console.error('Export error:', error);
    message.error('Failed to export proposal');
  } finally {
    setExportLoading(false);
  }
};


  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return '#52c41a';
      case 'medium': return '#faad14';
      case 'high': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  const getCompetitivenessColor = (level: string) => {
    switch (level) {
      case 'competitive': return '#52c41a';
      case 'premium': return '#faad14';
      case 'low': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  const handleBack = () => {
   router.back();
  };

  const handleEditProposal = () => {
    if (proposalDetail) {
      router.push(`/proposal-creator?edit=${proposalId}`);
    }
  };

  if (!isWorkspaceReady) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <Spin size="large" tip="Loading workspace..." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <Spin size="large" tip="Loading proposal details..." />
      </div>
    );
  }

  if (error || !proposalDetail) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Alert
          message="Error Loading Proposal"
          description={error || "Could not find the requested proposal"}
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={fetchProposalDetail}>
              Try Again
            </Button>
          }
        />
        <div className="mt-4 text-center">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.push('/proposal-creator')}
          >
            Back to Proposals
          </Button>
        </div>
      </div>
    );
  }

  const { proposalData, metadata } = proposalDetail;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
        >
          Back to Proposals
        </Button>
        
<Space>
  {/* <Button 
    icon={<EditOutlined />}
    onClick={handleEditProposal}
  >
    Edit Proposal
  </Button> */}
  {/* <Button 
    icon={<DownloadOutlined />}
    loading={exportLoading}
    onClick={() => exportProposal('json')}
  >
    Export JSON
  </Button> */}
  <Button 
    type="primary" 
    icon={<EyeOutlined />}
    onClick={() => exportProposal('html')}
    loading={exportLoading}
  >
    View Full Proposal
  </Button>
  {/* <Button 
    type="default"
    icon={<DownloadOutlined />}
    onClick={() => exportProposal('pdf')}
    loading={exportLoading}
  >
    Download PDF
  </Button> */}
</Space>

      </div>

      <div className="text-center mb-8">
        <Title level={2} className="flex items-center justify-center">
          <FileTextOutlined className="mr-2" />
          Proposal Details
        </Title>
        <Text type="secondary">
          Created on {new Date(proposalDetail.createdAt).toLocaleDateString()}
        </Text>
      </div>

      {/* Proposal Stats */}
      <Row gutter={24} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Value"
              value={proposalDetail.totalValue}
              prefix="$"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Win Probability"
              value={metadata.winProbability}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ 
                color: metadata.winProbability >= 70 ? '#3f8600' : 
                       metadata.winProbability >= 50 ? '#faad14' : '#cf1322' 
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Project Size"
              value={metadata.projectSize}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Complexity"
              value={metadata.complexity}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Proposal Info */}
      <Card className="mb-6">
        <Descriptions title="Proposal Information" bordered column={1}>
          <Descriptions.Item label="Proposal Title">
            {proposalDetail.title}
          </Descriptions.Item>
          <Descriptions.Item label="Client">
            <Space>
              <TeamOutlined />
              {proposalDetail.clientName}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Industry">
            <Tag color="blue">{metadata.industry}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Proposal Type">
            <Tag color="green">{proposalDetail.proposalType}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Badge 
              status={
                proposalDetail.status === 'accepted' ? 'success' :
                proposalDetail.status === 'rejected' ? 'error' :
                proposalDetail.status === 'sent' ? 'processing' : 'default'
              } 
              text={proposalDetail.status.toUpperCase()}
            />
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            <Space>
              <CalendarOutlined />
              {new Date(proposalDetail.createdAt).toLocaleString()}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Last Updated">
            <Space>
              <CalendarOutlined />
              {new Date(proposalDetail.updatedAt).toLocaleString()}
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Proposal Content Tabs */}
      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          type="card"
          items={[
            {
              key: 'overview',
              label: 'Executive Overview',
              children: <OverviewTab proposalData={proposalData} />,
            },
            {
              key: 'analysis',
              label: 'Analysis',
              children: <AnalysisTab proposalData={proposalData} />,
            },
            {
              key: 'documents',
              label: 'Legal Documents',
              children: <DocumentsTab proposalData={proposalData} copyToClipboard={copyToClipboard} />,
            },
             {
        key: 'complete', // ADD THIS TAB
        label: 'Complete Proposal',
        children: <CompleteProposalTab proposalData={proposalData} copyToClipboard={copyToClipboard} />,
      },
            {
              key: 'alternatives',
              label: 'Alternative Options',
              children: <AlternativesTab proposalData={proposalData} />,
            }
          ]}
        />
      </Card>
    </div>
  );
};

// Add this component to your detail page file
const CompleteProposalTab = ({ 
  proposalData, 
  copyToClipboard 
}: { 
  proposalData: ProposalPackage;
  copyToClipboard: (text: string) => void;
}) => {
  const generateCompleteProposal = () => {
    const sections = [
      "=".repeat(60),
      "PROJECT PROPOSAL",
      "=".repeat(60),
      "",
      "PROJECT OVERVIEW",
      "-".repeat(30),
      proposalData.proposal.projectOverview,
      "",
      "SCOPE OF WORK", 
      "-".repeat(30),
      proposalData.proposal.scopeOfWork,
      "",
      "DELIVERABLES",
      "-".repeat(30),
      proposalData.proposal.deliverables,
      "",
      "TIMELINE & MILESTONES",
      "-".repeat(30),
      proposalData.proposal.timeline,
      "",
      "INVESTMENT & PRICING",
      "-".repeat(30),
      proposalData.proposal.pricing,
      "",
      "TERMS & CONDITIONS",
      "-".repeat(30),
      proposalData.proposal.terms,
      "",
      "NEXT STEPS",
      "-".repeat(30),
      proposalData.proposal.nextSteps,
      "",
      "=".repeat(60),
      "LEGAL CONTRACTS", 
      "=".repeat(60),
      "",
      "SERVICE AGREEMENT",
      "-".repeat(30),
      proposalData.proposal.contractTemplates.serviceAgreement,
      "",
      "=".repeat(60),
      "",
      "STATEMENT OF WORK",
      "-".repeat(30),
      proposalData.proposal.contractTemplates.statementOfWork,
      "",
      "=".repeat(60),
      "END OF PROPOSAL",
      "=".repeat(60)
    ];

    return sections.join("\n");
  };

  const completeProposalText = generateCompleteProposal();

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <div>
          <Title level={4}>Complete Proposal Document</Title>
          <Text type="secondary">
            Full proposal including business sections and legal contracts
          </Text>
        </div>
        <Space>
          <Button 
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(completeProposalText)}
            type="primary"
          >
            Copy Complete Proposal
          </Button>
          <Button 
            icon={<DownloadOutlined />}
            onClick={() => {
              const blob = new Blob([completeProposalText], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `proposal-complete-${Date.now()}.txt`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              message.success('Complete proposal downloaded as text file!');
            }}
          >
            Download as Text
          </Button>
        </Space>
      </div>
      
      <Alert
        message="Complete Proposal Ready"
        description="This document contains your full business proposal including executive summary, project details, pricing, terms, service agreement, and statement of work."
        type="info"
        showIcon
        className="mb-4"
      />

      <div className=" p-6 rounded border">
        <div className="font-mono text-sm whitespace-pre-wrap overflow-auto max-h-[600px] border border-gray-200  p-4 rounded">
          {completeProposalText}
        </div>
      </div>
      
      <div className="mt-4 p-4  rounded">
        <Text strong>Document Statistics:</Text>
        <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
          <div>
            <Text type="secondary">Word Count: </Text>
            <Text strong>{completeProposalText.split(/\s+/).length.toLocaleString()}</Text>
          </div>
          <div>
            <Text type="secondary">Character Count: </Text>
            <Text strong>{completeProposalText.length.toLocaleString()}</Text>
          </div>
          <div>
            <Text type="secondary">Estimated Pages: </Text>
            <Text strong>{Math.ceil(completeProposalText.split(/\s+/).length / 250)}</Text>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Tab Components
const OverviewTab = ({ proposalData }: { proposalData: ProposalPackage }) => {
  return (
    <div className="space-y-6">
      <Card title="Project Overview" size="small">
        <Paragraph className="whitespace-pre-wrap">
          {proposalData.proposal.projectOverview}
        </Paragraph>
      </Card>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="Scope of Work" size="small">
            <Paragraph className="whitespace-pre-wrap">
              {proposalData.proposal.scopeOfWork}
            </Paragraph>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Deliverables" size="small">
            <Paragraph className="whitespace-pre-wrap">
              {proposalData.proposal.deliverables}
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="Pricing & Investment" size="small">
            <Paragraph className="whitespace-pre-wrap">
              {proposalData.proposal.pricing}
            </Paragraph>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Timeline" size="small">
            <Paragraph className="whitespace-pre-wrap">
              {proposalData.proposal.timeline}
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Card title="Next Steps" size="small">
        <Paragraph className="whitespace-pre-wrap">
          {proposalData.proposal.nextSteps}
        </Paragraph>
      </Card>
    </div>
  );
};

const AnalysisTab = ({ proposalData }: { proposalData: ProposalPackage }) => {
  const { analysis } = proposalData;

  return (
    <div className="space-y-6">
      {/* Win Probability */}
      <Card title="Win Probability Analysis" size="small">
        <div className="mb-4">
          <Progress 
            percent={analysis.winProbability.score} 
            status={analysis.winProbability.score >= 70 ? "success" : "active"}
            strokeColor={analysis.winProbability.score >= 70 ? "#52c41a" : "#1890ff"}
          />
          <Text className="block text-center mt-2">
            {analysis.winProbability.score}% Probability of Winning
          </Text>
        </div>
        
        <Divider />
        
        <Title level={5}>Key Factors</Title>
        <List
          dataSource={analysis.winProbability.factors}
          renderItem={(factor) => (
            <List.Item>
              <div className="flex justify-between items-start w-full">
                <div className="flex-1">
                  <Text strong>{factor.factor}</Text>
                  <div className="text-sm text-gray-600">{factor.description}</div>
                </div>
                <Tag color={
                  factor.impact === 'High' ? 'red' : 
                  factor.impact === 'Medium' ? 'orange' : 'green'
                }>
                  {factor.impact}
                </Tag>
              </div>
            </List.Item>
          )}
        />
      </Card>

      {/* Pricing Analysis */}
      <Card title="Pricing Analysis" size="small">
        <div className="mb-4">
          <Text strong>Competitiveness: </Text>
          <Tag color={getCompetitivenessColor(analysis.pricingAnalysis.competitiveness)}>
            {analysis.pricingAnalysis.competitiveness.toUpperCase()}
          </Tag>
        </div>
        
        <Paragraph>
          {analysis.pricingAnalysis.valueJustification}
        </Paragraph>
        
        <Divider />
        
        <Title level={5}>Recommendations</Title>
        <List
          dataSource={analysis.pricingAnalysis.recommendations}
          renderItem={(rec) => (
            <List.Item>
              <BulbOutlined className="text-yellow-500 mr-2" />
              {rec}
            </List.Item>
          )}
        />
      </Card>

      {/* Risk Assessment */}
      <Card title="Risk Assessment" size="small">
        <div className="mb-4">
          <Text strong>Overall Risk Level: </Text>
          <Tag color={getRiskColor(analysis.riskLevel)}>
            {analysis.riskLevel.toUpperCase()}
          </Tag>
        </div>
        
        <Row gutter={16}>
          <Col span={12}>
            <Title level={5} className="text-green-600">Strengths</Title>
            <List
              dataSource={analysis.strengthsWeaknesses.strengths}
              renderItem={(strength) => (
                <List.Item>
                  <CheckCircleOutlined className="text-green-500 mr-2" />
                  {strength}
                </List.Item>
              )}
            />
          </Col>
          <Col span={12}>
            <Title level={5} className="text-orange-600">Areas for Improvement</Title>
            <List
              dataSource={analysis.strengthsWeaknesses.weaknesses}
              renderItem={(weakness) => (
                <List.Item>
                  <ExclamationCircleOutlined className="text-orange-500 mr-2" />
                  {weakness}
                </List.Item>
              )}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
};

const DocumentsTab = ({ 
  proposalData, 
  copyToClipboard 
}: { 
  proposalData: ProposalPackage;
  copyToClipboard: (text: string) => void;
}) => {
  return (
    <div className="space-y-6">
      <Card 
        title="Service Agreement" 
        extra={
          <Button 
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(proposalData.proposal.contractTemplates.serviceAgreement)}
          >
            Copy Agreement
          </Button>
        }
      >
        <div className=" p-4 rounded border font-mono text-sm whitespace-pre-wrap overflow-auto max-h-96">
          {proposalData.proposal.contractTemplates.serviceAgreement}
        </div>
      </Card>

      <Card 
        title="Statement of Work" 
        extra={
          <Button 
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(proposalData.proposal.contractTemplates.statementOfWork)}
          >
            Copy SOW
          </Button>
        }
      >
        <div className="bg-gray-50 p-4 rounded border font-mono text-sm whitespace-pre-wrap overflow-auto max-h-96">
          {proposalData.proposal.contractTemplates.statementOfWork}
        </div>
      </Card>
    </div>
  );
};

const AlternativesTab = ({ proposalData }: { proposalData: ProposalPackage }) => {
  const alternatives = proposalData.proposal.alternativeOptions || [];

  if (alternatives.length === 0) {
    return (
      <div className="text-center py-8">
        <Text type="secondary">No alternative options generated for this proposal.</Text>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alternatives.map((option, index) => (
        <Card key={index} size="small" className="mb-4">
          <Title level={5} className="text-blue-600">{option.title}</Title>
          <Paragraph className="text-sm">{option.description}</Paragraph>
          
          <Row gutter={16} className="mb-3">
            <Col span={8}>
              <Text strong>Price Adjustment: </Text>
              <Tag color={option.pricingAdjustment < 0 ? 'green' : 'orange'}>
                {option.pricingAdjustment > 0 ? '+' : ''}{(option.pricingAdjustment * 100).toFixed(0)}%
              </Tag>
            </Col>
            <Col span={8}>
              <Text strong>Timeline: </Text>
              <Text>{option.timelineAdjustment}</Text>
            </Col>
            <Col span={8}>
              <Text strong>Scope Changes: </Text>
              <Text>{option.scopeChanges?.length || 0}</Text>
            </Col>
          </Row>
          
          <Divider />
          
          <Row gutter={16}>
            <Col span={12}>
              <Title level={5} className="text-green-600">Pros</Title>
              <ul className="text-sm">
                {option.pros.map((pro, i) => <li key={i}>• {pro}</li>)}
              </ul>
            </Col>
            <Col span={12}>
              <Title level={5} className="text-orange-600">Cons</Title>
              <ul className="text-sm">
                {option.cons.map((con, i) => <li key={i}>• {con}</li>)}
              </ul>
            </Col>
          </Row>
        </Card>
      ))}
    </div>
  );
};

// Helper function for risk color
const getRiskColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'low': return '#52c41a';
    case 'medium': return '#faad14';
    case 'high': return '#ff4d4f';
    default: return '#d9d9d9';
  }
};

// Helper function for competitiveness color
const getCompetitivenessColor = (level: string) => {
  switch (level) {
    case 'competitive': return '#52c41a';
    case 'premium': return '#faad14';
    case 'low': return '#ff4d4f';
    default: return '#d9d9d9';
  }
};

export default ProposalDetailPage;