"use client";

import React, { useState, useEffect } from 'react';
import {
  DollarOutlined,
  CalculatorOutlined,
  PieChartOutlined,
  DownloadOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  FileTextOutlined,
  BarChartOutlined,
  ContainerOutlined,
  ReloadOutlined,
  ShareAltOutlined
} from '@ant-design/icons';
import {
  Card,
  Typography,
  Button,
  Space,
  Row,
  Col,
  Statistic,
  Divider,
  List,
  Collapse,
  Alert,
  Spin,
  notification,
  Tag,
  Progress,
  Breadcrumb,
  ConfigProvider,
  theme as antTheme
} from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useWorkspaceContext } from '../../../../hooks/useWorkspaceContext';
import { GeneratedPricingPackage } from '../../../../hooks/usePricingCalculator';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const PricingCalculationDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();

  const [calculation, setCalculation] = useState<GeneratedPricingPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const calculationId = params.id as string;

  // --- GOOGLE FONT INJECTION ---
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    if (isWorkspaceReady && calculationId) {
      fetchCalculationDetail();
    }
  }, [calculationId, isWorkspaceReady]);

  const fetchCalculationDetail = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pricing-calculator/${calculationId}?workspaceId=${currentWorkspace?.id}`, {
        credentials: 'include',
        headers: {
          'X-Workspace-Id': currentWorkspace?.id || ''
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch calculation: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setCalculation(data.data.calculation);
      } else {
        throw new Error(data.error || 'Failed to load calculation');
      }
    } catch (err) {
      console.error('Error fetching calculation detail:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      notification.error({
        message: 'Failed to Load Calculation',
        description: 'Could not retrieve the pricing calculation details.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'proposal' | 'presentation' | 'contract' | 'complete') => {
    setExporting(true);

    try {
      const response = await fetch(`/api/pricing-calculator/export/${calculationId}?format=${format}&workspaceId=${currentWorkspace?.id}`, {
        credentials: 'include',
        headers: {
          'X-Workspace-Id': currentWorkspace?.id || ''
        }
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      const contentDisposition = response.headers.get('content-disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `pricing-${format}-${calculationId}.html`;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');

      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      notification.success({
        message: 'Export Successful',
        description: `${format.charAt(0).toUpperCase() + format.slice(1)} has been downloaded.`
      });
    } catch (err) {
      console.error('Export error:', err);
      notification.error({
        message: 'Export Failed',
        description: err instanceof Error ? err.message : 'Failed to export calculation'
      });
    } finally {
      setExporting(false);
    }
  };

  const handleBack = () => {
    router.push(`/submissions`);
  };

  const darkThemeConfig = {
    algorithm: antTheme.darkAlgorithm,
    token: {
      fontFamily: 'Manrope, sans-serif',
      colorPrimary: '#5CC49D',
      borderRadius: 8,
      colorTextHeading: '#f1f5f9',
      colorText: '#94a3b8',
      colorBgContainer: '#000000',
      colorBgElevated: '#000000',
      colorBorder: 'rgba(255, 255, 255, 0.08)',
    },
    components: {
      Card: {
        headerBg: '#000000',
        colorBgContainer: '#000000',
        colorTextHeading: '#ffffff',
        colorBorder: 'rgba(255, 255, 255, 0.08)',
      },
      Button: {
        colorPrimary: '#5CC49D',
        algorithm: true,
        fontWeight: 600,
        colorTextLightSolid: '#000000',
        defaultBorderColor: 'rgba(255, 255, 255, 0.08)',
        defaultColor: '#ffffff',
        defaultBg: 'rgba(255, 255, 255, 0.04)',
      },
      Collapse: {
        headerBg: '#000000',
        contentBg: '#000000',
        colorBorder: 'rgba(255, 255, 255, 0.08)',
      },
      Descriptions: {
        colorSplit: 'rgba(255, 255, 255, 0.08)',
        labelBg: 'rgba(255, 255, 255, 0.04)',
      },
      Pagination: {
        itemActiveBg: 'rgba(255, 255, 255, 0.04)',
        colorText: '#9DA2B3',
        colorPrimary: '#5CC49D',
      },
      Modal: {
        contentBg: '#000000',
        headerBg: '#000000',
        titleColor: '#ffffff',
      },
    },
  } as const;

  if (!isWorkspaceReady) {
    return (
      <ConfigProvider theme={darkThemeConfig}>
        <div style={{ backgroundColor: '#0B0C10', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" tip="Loading workspace..." />
        </div>
      </ConfigProvider>
    );
  }

  if (loading) {
    return (
      <ConfigProvider theme={darkThemeConfig}>
        <div style={{ backgroundColor: '#0B0C10', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" tip="Loading pricing calculation..." />
        </div>
      </ConfigProvider>
    );
  }

  if (error || !calculation) {
    return (
      <ConfigProvider theme={darkThemeConfig}>
        <div style={{ backgroundColor: '#0B0C10', minHeight: '100vh', padding: '40px' }}>
          <Alert
            message="Calculation Not Found"
            description={error || "The requested pricing calculation could not be found."}
            type="error"
            showIcon
            action={
              <Space>
                <Button onClick={handleBack} icon={<ArrowLeftOutlined />}>
                  Back to Submissions
                </Button>
                <Button onClick={fetchCalculationDetail} icon={<ReloadOutlined />}>
                  Try Again
                </Button>
              </Space>
            }
          />
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider theme={darkThemeConfig}>
    <div className="max-w-7xl mx-auto px-4 py-8" style={{ backgroundColor: '#0B0C10', minHeight: '100vh' }}>
      {/* Header */}
      <div className="mb-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          className="mb-4"
        >
          Back to Submissions
        </Button>

        <div className="flex justify-between items-start">
          <div>
            <Title level={2}>
              <CalculatorOutlined style={{ marginRight: '12px', color: '#5CC49D' }} />
              Pricing Calculation Details
            </Title>
            <Text type="secondary">
              Generated for {currentWorkspace?.name}
            </Text>
          </div>

          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleExport('complete')}
              loading={exporting}
            >
              Export Package
            </Button>
          </Space>
        </div>
      </div>

      {/* Export Actions */}
      <Card className="mb-6">
        <div className="flex justify-between items-center">
          <Title level={4}>Export This Pricing Package</Title>
          <Space wrap>
            <Button
              icon={<FileTextOutlined />}
              onClick={() => handleExport('proposal')}
              disabled={exporting}
            >
              Proposal
            </Button>
            <Button
              icon={<BarChartOutlined />}
              onClick={() => handleExport('presentation')}
              disabled={exporting}
            >
              Presentation
            </Button>
            <Button
              icon={<ContainerOutlined />}
              onClick={() => handleExport('contract')}
              disabled={exporting}
            >
              Contract
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => handleExport('complete')}
              disabled={exporting}
              loading={exporting}
            >
              Complete Package
            </Button>
          </Space>
        </div>
      </Card>

      {/* Pricing Summary */}
      <Card title="Pricing Summary" className="mb-6">
        <Row gutter={24}>
          <Col span={6}>
            <Statistic
              title="Monthly Retainer"
              value={calculation.calculations.recommendedRetainer}
              precision={0}
              prefix="$"
              valueStyle={{ color: '#5CC49D', fontSize: '1.5em' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Hourly Rate"
              value={calculation.calculations.hourlyRate}
              precision={0}
              prefix="$"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Client ROI"
              value={calculation.calculations.roiPercentage}
              precision={0}
              suffix="%"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Project Value"
              value={calculation.calculations.totalProjectValue}
              precision={0}
              prefix="$"
            />
          </Col>
        </Row>
      </Card>

      {/* Pricing Options */}
      <Card title="Pricing Model Options" className="mb-6">
        <List
          dataSource={calculation.calculations.pricingOptions}
          renderItem={(option) => (
            <List.Item>
              <Card size="small" className="w-full">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Title level={5} className="mb-2">
                      {option.model.charAt(0).toUpperCase() + option.model.slice(1)} Model
                    </Title>
                    <Text strong style={{ fontSize: '18px', color: '#5CC49D' }}>
                      ${option.price?.toLocaleString()}
                    </Text>
                    <Paragraph className="mt-2 mb-2">{option.description}</Paragraph>
                    {option.pros && option.pros.length > 0 && (
                      <div>
                        <Text strong style={{ color: '#5CC49D' }}>Pros: </Text>
                        <Text>{option.pros.join(', ')}</Text>
                      </div>
                    )}
                    {option.cons && option.cons.length > 0 && (
                      <div>
                        <Text strong style={{ color: '#ff4d4f' }}>Cons: </Text>
                        <Text>{option.cons.join(', ')}</Text>
                      </div>
                    )}
                  </div>
                  {option.recommendationScore && (
                    <div className="ml-4 text-center">
                      <Progress
                        type="circle"
                        size={60}
                        percent={option.recommendationScore}
                        format={(percent) => `${percent}`}
                      />
                      <div className="text-center mt-1">
                        <Text type="secondary" style={{ fontSize: '12px' }}>Score</Text>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </List.Item>
          )}
        />
      </Card>

      {/* Strategy Details */}
      <Collapse defaultActiveKey={['strategy']} className="mb-6">
        <Panel header="Pricing Strategy" key="strategy">
          <div className="space-y-4">
            <div>
              <Title level={5}>Recommended Approach</Title>
              <Paragraph>{calculation.strategy.recommendedApproach}</Paragraph>
            </div>

            {calculation.strategy.pricingFramework && (
              <div>
                <Title level={5}>Pricing Framework</Title>
                <Paragraph>{calculation.strategy.pricingFramework}</Paragraph>
              </div>
            )}

            <div>
              <Title level={5}>Value Proposition</Title>
              <Paragraph>{calculation.strategy.valueProposition}</Paragraph>
            </div>

            {calculation.strategy.negotiationTactics && calculation.strategy.negotiationTactics.length > 0 && (
              <div>
                <Title level={5}>Negotiation Tactics</Title>
                <ul style={{ paddingLeft: '20px' }}>
                  {calculation.strategy.negotiationTactics.map((tactic, idx) => (
                    <li key={idx} style={{ marginBottom: '8px', color: '#94a3b8' }}>{tactic}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Panel>

        {calculation.strategy.phases && calculation.strategy.phases.length > 0 && (
          <Panel header="Implementation Phases" key="phases">
            <List
              dataSource={calculation.strategy.phases}
              renderItem={(phase, index) => (
                <List.Item>
                  <Card size="small" className="w-full">
                    <Title level={5}>Phase {index + 1}: {phase.phase}</Title>
                    <Row gutter={16} style={{ marginTop: '12px' }}>
                      <Col span={8}>
                        <Statistic title="Duration" value={phase.duration} />
                      </Col>
                      <Col span={8}>
                        <Statistic
                          title="Payment"
                          value={phase.payment}
                          prefix="$"
                          precision={0}
                        />
                      </Col>
                      <Col span={8}>
                        {phase.deliverables && phase.deliverables.length > 0 && (
                          <>
                            <Text strong>Deliverables:</Text>
                            <ul className="mt-1" style={{ paddingLeft: '16px' }}>
                              {phase.deliverables.map((deliverable, idx) => (
                                <li key={idx} style={{ fontSize: '12px', color: '#94a3b8' }}>{deliverable}</li>
                              ))}
                            </ul>
                          </>
                        )}
                      </Col>
                    </Row>
                  </Card>
                </List.Item>
              )}
            />
          </Panel>
        )}

        {calculation.objectionHandling && calculation.objectionHandling.length > 0 && (
          <Panel header="Objection Handling" key="objections">
            <List
              dataSource={calculation.objectionHandling}
              renderItem={(objection) => (
                <List.Item>
                  <Card size="small" className="w-full">
                    <Title level={5} style={{ color: '#fa8c16' }}>
                      {objection.objection}
                    </Title>
                    <div className="mt-2">
                      <Text strong>Response: </Text>
                      <Paragraph>{objection.response}</Paragraph>
                    </div>
                    {objection.alternatives && objection.alternatives.length > 0 && (
                      <div>
                        <Text strong>Alternatives: </Text>
                        <Text>{objection.alternatives.join(', ')}</Text>
                      </div>
                    )}
                  </Card>
                </List.Item>
              )}
            />
          </Panel>
        )}
      </Collapse>

      {/* Benchmarks */}
      {calculation.benchmarks && (
        <Card className="mb-6">
          <Title level={4}>Industry Benchmarks</Title>
          <Row gutter={16}>
            <Col span={12}>
              <div style={{ marginBottom: '16px' }}>
                <Text strong>Industry: </Text>
                <Tag color="green">{calculation.benchmarks.industry}</Tag>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <Text strong>Average ROI Multiple: </Text>
                <Text>{calculation.benchmarks.averageRoiMultiple}x</Text>
              </div>
            </Col>
            <Col span={12}>
              <Title level={5}>Typical Hourly Rates</Title>
              <Row gutter={8}>
                <Col span={6}>
                  <Statistic title="Junior" value={calculation.benchmarks.typicalHourlyRates.junior} prefix="$" />
                </Col>
                <Col span={6}>
                  <Statistic title="Mid" value={calculation.benchmarks.typicalHourlyRates.mid} prefix="$" />
                </Col>
                <Col span={6}>
                  <Statistic title="Senior" value={calculation.benchmarks.typicalHourlyRates.senior} prefix="$" />
                </Col>
                <Col span={6}>
                  <Statistic title="Expert" value={calculation.benchmarks.typicalHourlyRates.expert} prefix="$" />
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>
      )}

      {/* Additional Actions */}
      <Card>
        <Title level={4}>Additional Actions</Title>
        <Space wrap>
          <Button
            icon={<ShareAltOutlined />}
            onClick={() => {
              notification.info({
                message: 'Share Feature',
                description: 'Sharing functionality will be implemented soon.'
              });
            }}
          >
            Share
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              router.push(`/dashboard/${currentWorkspace?.slug}/pricing-calculator?load=${calculationId}`);
            }}
          >
            Use as Template
          </Button>
          <Button
            icon={<EyeOutlined />}
            onClick={fetchCalculationDetail}
          >
            Refresh
          </Button>
        </Space>
      </Card>
    </div>
    </ConfigProvider>
  );
};

export default PricingCalculationDetailPage;
