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
  Breadcrumb
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

      // Get filename from response headers
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

  if (!isWorkspaceReady) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Spin size="large" />
        <p>Loading workspace...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Spin size="large" tip="Loading pricing calculation..." />
      </div>
    );
  }

  if (error || !calculation) {
    return (
      <div style={{ padding: '40px' }}>
        <Alert
          message="Calculation Not Found"
          description={error || "The requested pricing calculation could not be found."}
          type="error"
          showIcon
          action={
            <Space>
              <Button onClick={handleBack} icon={<ArrowLeftOutlined />}>
                Back to Calculator
              </Button>
              <Button onClick={fetchCalculationDetail} icon={<ReloadOutlined />}>
                Try Again
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Breadcrumb */}
      <Breadcrumb style={{ marginBottom: '24px' }}>
        <Breadcrumb.Item>
          <a onClick={handleBack} style={{ cursor: 'pointer' }}>
            Pricing Calculator
          </a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>Calculation Details</Breadcrumb.Item>
      </Breadcrumb>

      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <CalculatorOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
            Pricing Calculation Details
          </Title>
          <Text type="secondary">
            Generated on {new Date().toLocaleDateString()} for {currentWorkspace?.name}
          </Text>
        </div>
        
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
          >
            Back
          </Button>
          <Button 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={() => handleExport('complete')}
            loading={exporting}
          >
            Export Package
          </Button>
        </Space>
      </div>

      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Monthly Retainer"
              value={calculation.calculations.recommendedRetainer}
              precision={0}
              prefix="$"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Client ROI"
              value={calculation.calculations.roiPercentage}
              precision={0}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Hourly Rate"
              value={calculation.calculations.hourlyRate}
              precision={0}
              prefix="$"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Project Value"
              value={calculation.calculations.totalProjectValue}
              precision={0}
              prefix="$"
            />
          </Card>
        </Col>
      </Row>

      {/* Export Options */}
      <Card style={{ marginBottom: '24px' }}>
        <Title level={4}>Export Options</Title>
        <Space wrap>
          <Button 
            icon={<FileTextOutlined />}
            onClick={() => handleExport('proposal')}
            loading={exporting}
          >
            Proposal
          </Button>
          <Button 
            icon={<BarChartOutlined />}
            onClick={() => handleExport('presentation')}
            loading={exporting}
          >
            Presentation
          </Button>
          <Button 
            icon={<ContainerOutlined />}
            onClick={() => handleExport('contract')}
            loading={exporting}
          >
            Contract
          </Button>
          <Button 
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => handleExport('complete')}
            loading={exporting}
          >
            Complete Package
          </Button>
        </Space>
      </Card>

      {/* Pricing Options */}
      <Card style={{ marginBottom: '24px' }}>
        <Title level={4}>Pricing Model Options</Title>
        <List
          dataSource={calculation.calculations.pricingOptions}
          renderItem={(option) => (
            <List.Item>
              <Card size="small" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <Title level={5} style={{ marginBottom: '8px' }}>
                      {option.model.charAt(0).toUpperCase() + option.model.slice(1)} Model
                    </Title>
                    <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>
                      ${option.price?.toLocaleString()}
                    </Text>
                    <Paragraph style={{ margin: '8px 0' }}>
                      {option.description}
                    </Paragraph>
                    <div>
                      <Text strong style={{ color: '#52c41a' }}>Pros: </Text>
                      <Text>{option.pros?.join(', ')}</Text>
                    </div>
                    <div>
                      <Text strong style={{ color: '#ff4d4f' }}>Cons: </Text>
                      <Text>{option.cons?.join(', ')}</Text>
                    </div>
                  </div>
                  <div style={{ marginLeft: '16px', textAlign: 'center' }}>
                    <Progress
                      type="circle"
                      size={60}
                      percent={option.recommendationScore}
                      format={(percent) => `${percent}`}
                    />
                    <div style={{ marginTop: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>Score</Text>
                    </div>
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      </Card>

      {/* Strategy Details */}
      <Collapse defaultActiveKey={['strategy']} style={{ marginBottom: '24px' }}>
        <Panel header="Pricing Strategy" key="strategy">
          <div style={{ padding: '16px 0' }}>
            <div style={{ marginBottom: '16px' }}>
              <Title level={5}>Recommended Approach</Title>
              <Paragraph>{calculation.strategy.recommendedApproach}</Paragraph>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <Title level={5}>Value Proposition</Title>
              <Paragraph>{calculation.strategy.valueProposition}</Paragraph>
            </div>

            <div>
              <Title level={5}>Negotiation Tactics</Title>
              <ul>
                {calculation.strategy.negotiationTactics.map((tactic, idx) => (
                  <li key={idx} style={{ marginBottom: '8px' }}>{tactic}</li>
                ))}
              </ul>
            </div>
          </div>
        </Panel>

        <Panel header="Implementation Phases" key="phases">
          <List
            dataSource={calculation.strategy.phases}
            renderItem={(phase, index) => (
              <List.Item>
                <Card size="small" style={{ width: '100%' }}>
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
                      <div>
                        <Text strong>Deliverables:</Text>
                        <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                          {phase.deliverables.map((deliverable, idx) => (
                            <li key={idx} style={{ fontSize: '12px' }}>{deliverable}</li>
                          ))}
                        </ul>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </List.Item>
            )}
          />
        </Panel>

        <Panel header="Objection Handling" key="objections">
          <List
            dataSource={calculation.objectionHandling}
            renderItem={(objection) => (
              <List.Item>
                <Card size="small" style={{ width: '100%' }}>
                  <Title level={5} style={{ color: '#fa8c16' }}>
                    {objection.objection}
                  </Title>
                  <div style={{ marginTop: '8px' }}>
                    <Text strong>Response: </Text>
                    <Paragraph style={{ margin: '8px 0' }}>{objection.response}</Paragraph>
                  </div>
                  <div>
                    <Text strong>Alternatives: </Text>
                    <Text>{objection.alternatives.join(', ')}</Text>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        </Panel>
      </Collapse>

      {/* Benchmarks */}
      {calculation.benchmarks && (
        <Card style={{ marginBottom: '24px' }}>
          <Title level={4}>Industry Benchmarks</Title>
          <Row gutter={16}>
            <Col span={12}>
              <div style={{ marginBottom: '16px' }}>
                <Text strong>Industry: </Text>
                <Tag color="blue">{calculation.benchmarks.industry}</Tag>
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
              // Implement sharing functionality
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
  );
};

export default PricingCalculationDetailPage;