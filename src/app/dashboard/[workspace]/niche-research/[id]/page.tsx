"use client";

import React, { useState, useEffect } from 'react';
import {
  SearchOutlined,
  ArrowLeftOutlined,
  DownloadOutlined,
  CopyOutlined,
  EditOutlined,
  ShareAltOutlined,
  EyeOutlined,
  CalendarOutlined,
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  RiseOutlined,
  WarningOutlined,
  StarOutlined,
  TagOutlined,
  BarChartOutlined,
  PieChartOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
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
  Tabs,
  Timeline,
  Progress,
  Avatar,
  notification,
  Row,
  Col,
} from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { MultiNicheReport, NicheReportMetadata, GeneratedNicheReport } from '@/types/nicheResearcher';
import { useWorkspaceContext } from '../../../../hooks/useWorkspaceContext';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { TabPane } = Tabs;

interface NicheResearchDetail {
  id: string;
  title: string;
  report: MultiNicheReport;
  metadata: NicheReportMetadata;
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
  status: 'completed' | 'processing' | 'failed';
}

const NicheResearchDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  const [loading, setLoading] = useState(true);
  const [researchDetail, setResearchDetail] = useState<NicheResearchDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [exportLoading, setExportLoading] = useState(false);
  const [copying, setCopying] = useState<string | null>(null);

  const researchId = params.id as string;

  useEffect(() => {
    if (isWorkspaceReady && currentWorkspace) {
      fetchResearchDetail();
    }
  }, [isWorkspaceReady, currentWorkspace, researchId]);

  const fetchResearchDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/niche-research/${researchId}?workspaceId=${currentWorkspace?.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch research details: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response:', JSON.stringify(data, null, 2)); // Log for debugging

      if (data.success) {
        setResearchDetail(data.data);
      } else {
        throw new Error(data.error || 'Failed to load research details');
      }
    } catch (err) {
      console.error('Error fetching research detail:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      message.error('Failed to load research details');
    } finally {
      setLoading(false);
    }
  };


    const handleBack = () => {
    router.push(`/submissions`);
  };



  const copyToClipboard = async (text: string, context: string) => {
    setCopying(context);
    try {
      await navigator.clipboard.writeText(text);
      message.success('Copied to clipboard!');
    } catch (error) {
      message.error('Failed to copy to clipboard');
    } finally {
      setCopying(null);
    }
  };

  const downloadResearch = async (format: 'html' | 'json' = 'html') => {
    if (!researchDetail) return;

    setExportLoading(true);
    try {
      const response = await fetch(`/api/niche-research/${researchId}/export?format=${format}&workspaceId=${currentWorkspace?.id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to export research');
      }

      if (result.success && result.data) {
        const blob = new Blob([result.data.content], { type: result.data.mimeType });
        const url = URL.createObjectURL(blob);

        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = result.data.filename;
        anchor.style.display = 'none';

        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);

        URL.revokeObjectURL(url);

        message.success('Research exported successfully');
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (err) {
      console.error('Export error:', err);
      notification.error({
        message: 'Export Failed',
        description: err instanceof Error ? err.message : 'Please try again later',
        placement: 'topRight',
      });
    } finally {
      setExportLoading(false);
    }
  };

  const navigateToEditor = () => {
    if (researchDetail) {
      router.push(`/dashboard/${currentWorkspace?.slug}/niche-research?load=${researchId}`);
    }
  };

  const getObjectiveDisplay = (objective: string) => {
    const objectiveMap: Record<string, string> = {
      cashflow: 'Cashflow (Immediate revenue)',
      'equity-exit': 'Equity/Exit (Build to sell)',
      lifestyle: 'Lifestyle Business',
      'audience-build': 'Audience Building',
      saas: 'SaaS Business',
      agency: 'Agency Business',
      ecomm: 'E-commerce Business',
    };
    return objectiveMap[objective] || objective;
  };

  const getRiskDisplay = (risk: string) => {
    const riskMap: Record<string, string> = {
      low: 'Low Risk',
      medium: 'Medium Risk',
      high: 'High Risk',
    };
    return riskMap[risk] || risk;
  };

  const getMarketTypeDisplay = (marketType: string) => {
    const marketTypeMap: Record<string, string> = {
      'b2b-saas': 'B2B SaaS',
      'b2c-consumer': 'B2C Consumer',
      'professional-services': 'Professional Services',
      'local-business': 'Local Business',
      'info-education': 'Information/Education',
    };
    return marketTypeMap[marketType] || marketType;
  };

  // Component to render a single niche's details
  const renderNicheDetails = (niche: GeneratedNicheReport, nicheIndex: number, isRecommended: boolean) => (
    <div className="space-y-6">
      <Card>
        <Title level={4}>
          {niche.nicheOverview?.name} {isRecommended && <Tag color="green">Recommended</Tag>}
        </Title>
        <Row gutter={16}>
          <Col span={12}>
            <div className="mb-4">
              <Text strong>Summary:</Text>
              <Paragraph>
                {niche.nicheOverview?.summary}
                <Button
                  type="text"
                  icon={<CopyOutlined />}
                  loading={copying === `summary-${nicheIndex}`}
                  onClick={() => copyToClipboard(niche.nicheOverview?.summary || '', `summary-${nicheIndex}`)}
                  size="small"
                />
              </Paragraph>
            </div>
          </Col>
          <Col span={12}>
            <div className=" p-4 rounded-lg">
              <Text strong>Why This Niche Fits:</Text>
              <Paragraph>
                {niche.nicheOverview?.whyItFits}
                <Button
                  type="text"
                  icon={<CopyOutlined />}
                  loading={copying === `whyItFits-${nicheIndex}`}
                  onClick={() => copyToClipboard(niche.nicheOverview?.whyItFits || '', `whyItFits-${nicheIndex}`)}
                  size="small"
                />
              </Paragraph>
            </div>
          </Col>
        </Row>
      </Card>

      <Card>
        <Title level={4}>Market Demand</Title>
        <Row gutter={16}>
          <Col span={8}>
            <div className="text-center">
              <DollarOutlined className="text-3xl text-green-500 mb-2" />
              <Text strong>Market Size</Text>
              <div className="text-xl font-bold">{niche.marketDemand?.marketSize}</div>
            </div>
          </Col>
          <Col span={8}>
            <div className="text-center">
              <RiseOutlined className="text-3xl text-blue-500 mb-2" />
              <Text strong>Trend</Text>
              <div className="mt-2">
                <Tag
                  color={
                    niche.marketDemand?.trend === 'growing'
                      ? 'green'
                      : niche.marketDemand?.trend === 'plateauing'
                      ? 'orange'
                      : 'red'
                  }
                >
                  {niche.marketDemand?.trend?.toUpperCase()}
                </Tag>
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div className="text-center">
              <ThunderboltOutlined className="text-3xl text-orange-500 mb-2" />
              <Text strong>Willingness to Pay</Text>
              <div className="text-lg">{niche.marketDemand?.willingnessToPay}</div>
            </div>
          </Col>
        </Row>
      </Card>

      <Card>
        <Title level={4}>Pain Points</Title>
        <Row gutter={16}>
          {niche.painPoints?.map((point, index) => (
            <Col span={8} key={index}>
              <Card
                size="small"
                className={`border-l-4 ${
                  point.intensity === 'High' ? 'border-l-red-500' : point.intensity === 'Medium' ? 'border-l-orange-500' : 'border-l-blue-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <Text strong>{point.problem}</Text>
                    <div className="mt-2">
                      <Tag
                        color={point.intensity === 'High' ? 'red' : point.intensity === 'Medium' ? 'orange' : 'blue'}
                      >
                        {point.intensity} Intensity
                      </Tag>
                    </div>
                  </div>
                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    loading={copying === `pain-${nicheIndex}-${index}`}
                    onClick={() => copyToClipboard(point.problem, `pain-${nicheIndex}-${index}`)}
                    size="small"
                  />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card>
        <Title level={4}>Competitive Landscape</Title>
        <List
          dataSource={niche.competitiveLandscape?.competitors || []}
          renderItem={(competitor, index) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar
                    size="large"
                    style={{ backgroundColor: ['#f56a00', '#7265e6', '#ffbf00'][index % 3] }}
                  >
                    {competitor.name.charAt(0)}
                  </Avatar>
                }
                title={competitor.name}
                description={
                  <div>
                    <Paragraph>
                      {competitor.description}
                      <Button
                        type="text"
                        icon={<CopyOutlined />}
                        loading={copying === `competitor-${nicheIndex}-${index}`}
                        onClick={() => copyToClipboard(competitor.description, `competitor-${nicheIndex}-${index}`)}
                        size="small"
                      />
                    </Paragraph>
                    {competitor.strength && <Tag color="blue">Strength: {competitor.strength}</Tag>}
                  </div>
                }
              />
            </List.Item>
          )}
        />
        <div className="mt-4">
          <Text strong>Gap Analysis:</Text>
          <Paragraph>
            {niche.competitiveLandscape?.gapAnalysis}
            <Button
              type="text"
              icon={<CopyOutlined />}
              loading={copying === `gap-analysis-${nicheIndex}`}
              onClick={() => copyToClipboard(niche.competitiveLandscape?.gapAnalysis || '', `gap-analysis-${nicheIndex}`)}
              size="small"
            />
          </Paragraph>
        </div>
        <div className="mt-4">
          <Text strong>Barrier to Entry:</Text>
          <div className="flex items-center gap-4">
            <Progress
              percent={
                niche.competitiveLandscape?.barrierToEntry === 'High'
                  ? 80
                  : niche.competitiveLandscape?.barrierToEntry === 'Medium'
                  ? 50
                  : 20
              }
              status={
                niche.competitiveLandscape?.barrierToEntry === 'High'
                  ? 'exception'
                  : niche.competitiveLandscape?.barrierToEntry === 'Medium'
                  ? 'active'
                  : 'success'
              }
              style={{ width: 200 }}
            />
            <Tag
              color={
                niche.competitiveLandscape?.barrierToEntry === 'High'
                  ? 'red'
                  : niche.competitiveLandscape?.barrierToEntry === 'Medium'
                  ? 'orange'
                  : 'green'
              }
            >
              {niche.competitiveLandscape?.barrierToEntry}
            </Tag>
          </div>
        </div>
      </Card>

      <Card>
        <Title level={4}>Arbitrage Opportunity</Title>
        <Paragraph>
          {niche.arbitrageOpportunity?.explanation}
          <Button
            type="text"
            icon={<CopyOutlined />}
            loading={copying === `arbitrage-${nicheIndex}`}
            onClick={() => copyToClipboard(niche.arbitrageOpportunity?.explanation || '', `arbitrage-${nicheIndex}`)}
            size="small"
          />
        </Paragraph>
        {niche.arbitrageOpportunity?.concreteAngle && (
          <div className="mt-4  p-4 rounded-lg">
            <Text strong>Concrete Angle:</Text>
            <Paragraph>
              {niche.arbitrageOpportunity.concreteAngle}
              <Button
                type="text"
                icon={<CopyOutlined />}
                loading={copying === `concrete-angle-${nicheIndex}`}
                onClick={() => copyToClipboard(niche.arbitrageOpportunity?.concreteAngle || '', `concrete-angle-${nicheIndex}`)}
                size="small"
              />
            </Paragraph>
          </div>
        )}
      </Card>

      <Card>
        <Title level={4}>Entry Offers</Title>
        <Row gutter={16}>
          {niche.entryOffers?.map((offer, index) => (
            <Col span={12} key={index}>
              <Card
                type="inner"
                title={
                  <span>
                    <TagOutlined /> {offer.positioning}
                  </span>
                }
              >
                <div className="space-y-2">
                  <div>
                    <Text strong>Business Model:</Text>
                    <div>{offer.businessModel}</div>
                  </div>
                  <div>
                    <Text strong>Price Point:</Text>
                    <div>{offer.pricePoint}</div>
                  </div>
                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    loading={copying === `offer-${nicheIndex}-${index}`}
                    onClick={() =>
                      copyToClipboard(
                        `Positioning: ${offer.positioning}\nBusiness Model: ${offer.businessModel}\nPrice Point: ${offer.pricePoint}`,
                        `offer-${nicheIndex}-${index}`
                      )
                    }
                    size="small"
                  >
                    Copy Offer Details
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card>
        <Title level={4}>Go-to-Market Strategy</Title>
        <Row gutter={16}>
          <Col span={12}>
            <div className="text-center p-4 rounded-lg">
              <Title level={5}>Primary Channel</Title>
              <div className="text-lg font-semibold">{niche.gtmStrategy?.primaryChannel}</div>
            </div>
          </Col>
          <Col span={12}>
            <div className="p-4">
              <Title level={5}>Justification</Title>
              <Paragraph>
                {niche.gtmStrategy?.justification}
                <Button
                  type="text"
                  icon={<CopyOutlined />}
                  loading={copying === `gtm-justification-${nicheIndex}`}
                  onClick={() => copyToClipboard(niche.gtmStrategy?.justification || '', `gtm-justification-${nicheIndex}`)}
                  size="small"
                />
              </Paragraph>
            </div>
          </Col>
        </Row>
      </Card>

      <Card>
        <Title level={4}>Scalability & Exit Potential</Title>
        <Row gutter={16}>
          <Col span={12}>
            <div className="text-center">
              <Title level={5}>Scalability Score</Title>
              <Progress
                type="circle"
                percent={
                  niche.scalabilityExit?.scalabilityScore === 'High'
                    ? 80
                    : niche.scalabilityExit?.scalabilityScore === 'Medium'
                    ? 50
                    : 30
                }
                width={100}
                status={
                  niche.scalabilityExit?.scalabilityScore === 'High'
                    ? 'success'
                    : niche.scalabilityExit?.scalabilityScore === 'Medium'
                    ? 'normal'
                    : 'exception'
                }
              />
              <div className="mt-2">
                <Tag
                  color={
                    niche.scalabilityExit?.scalabilityScore === 'High'
                      ? 'green'
                      : niche.scalabilityExit?.scalabilityScore === 'Medium'
                      ? 'orange'
                      : 'blue'
                  }
                >
                  {niche.scalabilityExit?.scalabilityScore}
                </Tag>
              </div>
            </div>
          </Col>
          <Col span={12}>
            <div>
              <Title level={5}>Exit Potential</Title>
              <Paragraph>
                {niche.scalabilityExit?.exitPotential}
                <Button
                  type="text"
                  icon={<CopyOutlined />}
                  loading={copying === `exit-potential-${nicheIndex}`}
                  onClick={() => copyToClipboard(niche.scalabilityExit?.exitPotential || '', `exit-potential-${nicheIndex}`)}
                  size="small"
                />
              </Paragraph>
            </div>
          </Col>
        </Row>
      </Card>

      <Card>
        <Title level={4}>Risk Factors</Title>
        <Row gutter={16}>
          {niche.riskFactors?.map((risk, index) => (
            <Col span={8} key={index}>
              <Card size="small">
                <div className="flex justify-between items-start">
                  <div>
                    <WarningOutlined className="text-red-500 mr-2" />
                    <Text strong>{risk.risk}</Text>
                    <div className="mt-2">
                      <Tag
                        color={risk.impact?.includes('High') ? 'red' : risk.impact?.includes('Medium') ? 'orange' : 'blue'}
                      >
                        Impact: {risk.impact}
                      </Tag>
                    </div>
                  </div>
                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    loading={copying === `risk-${nicheIndex}-${index}`}
                    onClick={() => copyToClipboard(risk.risk, `risk-${nicheIndex}-${index}`)}
                    size="small"
                  />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card>
        <Title level={4}>Opportunity Scorecard</Title>
        <Row gutter={16}>
          <Col span={6}>
            <div className="text-center">
              <Title level={5}>Market Demand</Title>
              <Progress
                percent={
                  niche.scorecard?.marketDemand === 'High'
                    ? 90
                    : niche.scorecard?.marketDemand === 'Medium'
                    ? 60
                    : 30
                }
                status="active"
                strokeColor={
                  niche.scorecard?.marketDemand === 'High'
                    ? '#52c41a'
                    : niche.scorecard?.marketDemand === 'Medium'
                    ? '#faad14'
                    : '#f5222d'
                }
              />
              <Tag
                color={
                  niche.scorecard?.marketDemand === 'High'
                    ? 'green'
                    : niche.scorecard?.marketDemand === 'Medium'
                    ? 'orange'
                    : 'red'
                }
              >
                {niche.scorecard?.marketDemand}
              </Tag>
            </div>
          </Col>
          <Col span={6}>
            <div className="text-center">
              <Title level={5}>Competition</Title>
              <Progress
                percent={
                  niche.scorecard?.competition === 'High'
                    ? 90
                    : niche.scorecard?.competition === 'Medium'
                    ? 60
                    : 30
                }
                status="active"
                strokeColor={
                  niche.scorecard?.competition === 'High'
                    ? '#f5222d'
                    : niche.scorecard?.competition === 'Medium'
                    ? '#faad14'
                    : '#52c41a'
                }
              />
              <Tag
                color={
                  niche.scorecard?.competition === 'High'
                    ? 'red'
                    : niche.scorecard?.competition === 'Medium'
                    ? 'orange'
                    : 'green'
                }
              >
                {niche.scorecard?.competition}
              </Tag>
            </div>
          </Col>
          <Col span={6}>
            <div className="text-center">
              <Title level={5}>Ease of Entry</Title>
              <Progress
                percent={
                  niche.scorecard?.easeOfEntry === 'High'
                    ? 90
                    : niche.scorecard?.easeOfEntry === 'Medium'
                    ? 60
                    : 30
                }
                status="active"
                strokeColor={
                  niche.scorecard?.easeOfEntry === 'High'
                    ? '#52c41a'
                    : niche.scorecard?.easeOfEntry === 'Medium'
                    ? '#faad14'
                    : '#f5222d'
                }
              />
              <Tag
                color={
                  niche.scorecard?.easeOfEntry === 'High'
                    ? 'green'
                    : niche.scorecard?.easeOfEntry === 'Medium'
                    ? 'orange'
                    : 'red'
                }
              >
                {niche.scorecard?.easeOfEntry}
              </Tag>
            </div>
          </Col>
          <Col span={6}>
            <div className="text-center">
              <Title level={5}>Profitability</Title>
              <Progress
                percent={
                  niche.scorecard?.profitability === 'High'
                    ? 90
                    : niche.scorecard?.profitability === 'Medium'
                    ? 60
                    : 30
                }
                status="active"
                strokeColor={
                  niche.scorecard?.profitability === 'High'
                    ? '#52c41a'
                    : niche.scorecard?.profitability === 'Medium'
                    ? '#faad14'
                    : '#f5222d'
                }
              />
              <Tag
                color={
                  niche.scorecard?.profitability === 'High'
                    ? 'green'
                    : niche.scorecard?.profitability === 'Medium'
                    ? 'orange'
                    : 'red'
                }
              >
                {niche.scorecard?.profitability}
              </Tag>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );

  if (!isWorkspaceReady) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <Spin size="large" />
        <p className="mt-4">Loading workspace...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <Spin size="large" />
        <p className="mt-4">Loading niche research details...</p>
      </div>
    );
  }

  if (error || !researchDetail) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Alert
          message="Error Loading Niche Research"
          description={error || 'Could not find the requested niche research'}
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={fetchResearchDetail}>
              Try Again
            </Button>
          }
        />
        <div className="mt-4 text-center">
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push(`/dashboard/${currentWorkspace?.slug}/work`)}>
            Back to Work Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const reportData = researchDetail.report.niches[researchDetail.metadata.recommendedNicheIndex || 0]; // Recommended niche

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
          Back to Work
        </Button>

        <Space>
          {/* <Button icon={<EditOutlined />} onClick={navigateToEditor}>
            Edit & Regenerate
          </Button> */}
          {/* <Button type="primary" icon={<DownloadOutlined />} loading={exportLoading} onClick={() => downloadResearch('html')}>
            Export
          </Button> */}
        </Space>
      </div>

      <div className="text-center mb-8">
        <Title level={2} className="flex items-center justify-center">
          <SearchOutlined className="mr-2" />
          Niche Research Details
        </Title>
        <Text type="secondary">Generated on {new Date(researchDetail.createdAt).toLocaleDateString()}</Text>
      </div>

      {/* Research Information */}
      <Card className="mb-6">
        <Descriptions title="Research Information" bordered column={1}>
          <Descriptions.Item label="Title">
            <Text strong>{researchDetail.title}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Primary Objective">
            <Tag color="blue">{getObjectiveDisplay(researchDetail.metadata.primaryObjective)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Risk Appetite">
            <Tag
              color={
                (researchDetail.metadata.riskAppetite ?? 'low') === 'high'
                  ? 'red'
                  : (researchDetail.metadata.riskAppetite ?? 'low') === 'medium'
                  ? 'orange'
                  : 'green'
              }
            >
              {getRiskDisplay(researchDetail.metadata.riskAppetite ?? 'low')}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Market Type">
            <Tag color="purple">{getMarketTypeDisplay(researchDetail.metadata.marketType)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Customer Size">
            <Tag color="cyan">{researchDetail.metadata.customerSize}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Budget">
            <Tag color="gold">{researchDetail.metadata.budget}</Tag>
          </Descriptions.Item>
          {researchDetail.metadata.industries && researchDetail.metadata.industries.length > 0 && (
            <Descriptions.Item label="Industries">
              <Space wrap>
                {researchDetail.metadata.industries.map((industry, index) => (
                  <Tag key={index} color="blue">{industry}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
          )}
          {researchDetail.metadata.skills && researchDetail.metadata.skills.length > 0 && (
            <Descriptions.Item label="Skills">
              <Space wrap>
                {researchDetail.metadata.skills.map((skill, index) => (
                  <Tag key={index} color="green">{skill}</Tag>
                ))}
              </Space>
            </Descriptions.Item>
          )}
          {researchDetail.metadata.geographicFocus && (
            <Descriptions.Item label="Geographic Focus">
              <Tag color="purple">{researchDetail.metadata.geographicFocus}</Tag>
            </Descriptions.Item>
          )}
          {researchDetail.metadata.teamSize && (
            <Descriptions.Item label="Team Size">
              <Tag color="cyan">{researchDetail.metadata.teamSize}</Tag>
            </Descriptions.Item>
          )}
          {researchDetail.metadata.timeCommitment && (
            <Descriptions.Item label="Time Commitment">
              <Tag color="blue">{researchDetail.metadata.timeCommitment}</Tag>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Generated At">
            <Space>
              <CalendarOutlined />
              {researchDetail.metadata.generatedAt ? new Date(researchDetail.metadata.generatedAt).toLocaleString() : 'N/A'}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Tokens Used">
            <Tag color="orange">{researchDetail.metadata.tokensUsed ?? 'N/A'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Generation Time">
            <Tag color="blue">{researchDetail.metadata.generationTime ? `${researchDetail.metadata.generationTime}ms` : 'N/A'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            <Space>
              <CalendarOutlined />
              {new Date(researchDetail.createdAt).toLocaleString()}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Badge
              status={researchDetail.status === 'completed' ? 'success' : 'processing'}
              text={researchDetail.status ? researchDetail.status.toUpperCase() : 'UNKNOWN'}
            />
          </Descriptions.Item>
          <Descriptions.Item label="Recommendation Reason">
            <Paragraph>
              {researchDetail.report.recommendationReason || 'N/A'}
              <Button
                type="text"
                icon={<CopyOutlined />}
                loading={copying === 'recommendation-reason'}
                onClick={() => copyToClipboard(researchDetail.report.recommendationReason || '', 'recommendation-reason')}
                size="small"
              />
            </Paragraph>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Research Content */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} type="card" size="large">
          {/* Overview Tab (Recommended Niche) */}
          <TabPane
            key="overview"
            tab={
              <span>
                <EyeOutlined />
                Overview (Recommended)
              </span>
            }
          >
            {renderNicheDetails(reportData, researchDetail.metadata.recommendedNicheIndex || 0, true)}
          </TabPane>

          {/* All Niches Tab */}
          <TabPane
            key="all-niches"
            tab={
              <span>
                <BarChartOutlined />
                All Niches
              </span>
            }
          >
            <div className="space-y-8">
              {researchDetail.report.niches.map((niche, index) => (
                <div key={index}>
                  <Divider orientation="left">
                    <Title level={4}>
                      Niche {index + 1}: {niche.nicheOverview?.name}
                      {index === (researchDetail.metadata.recommendedNicheIndex || 0) && (
                        <Tag color="green" style={{ marginLeft: 8 }}>Recommended</Tag>
                      )}
                    </Title>
                  </Divider>
                  {renderNicheDetails(niche, index, index === (researchDetail.metadata.recommendedNicheIndex || 0))}
                </div>
              ))}
            </div>
          </TabPane>

          {/* Comparison Matrix Tab */}
          <TabPane
            key="comparison"
            tab={
              <span>
                <BarChartOutlined />
                Comparison Matrix
              </span>
            }
          >
            <Card>
              <Title level={4}>Niche Comparison Matrix</Title>
              <Row gutter={16}>
            
              </Row>
              <Card>
                <Title level={5}>Total Scores</Title>
                <Row gutter={16}>
                  {researchDetail.report.comparisonMatrix?.scores.map((score, index) => (
                    <Col span={8} key={index}>
                      <div className="text-center">
                        <Text strong>
                          Niche {score.nicheIndex + 1}
                          {score.nicheIndex === (researchDetail.metadata.recommendedNicheIndex || 0) && (
                            <Tag color="green" style={{ marginLeft: 8 }}>Recommended</Tag>
                          )}
                        </Text>
                        <Progress
                          type="circle"
                          percent={score.totalScore}
                          width={80}
                          strokeColor={['#52c41a', '#faad14', '#f5222d'][index % 3]}
                        />
                        <Text>Total: {score.totalScore}</Text>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Card>
          </TabPane>
        </Tabs>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mt-8">
        <Button
          icon={<DownloadOutlined />}
          loading={exportLoading}
          onClick={() => downloadResearch('html')}
          size="large"
        >
          Export Report
        </Button>
        <Button
          icon={<ShareAltOutlined />}
          onClick={() => {
            copyToClipboard(
              `${window.location.origin}/dashboard/${currentWorkspace?.slug}/niche-research/${researchId}`,
              'share-link'
            );
          }}
          size="large"
        >
          Share Link
        </Button>
        <Button icon={<ReloadOutlined />} onClick={fetchResearchDetail} size="large">
          Refresh
        </Button>
      </div>
    </div>
  );
};

export default NicheResearchDetailPage;