"use client";

import React, { useState, useEffect } from 'react';
import {
  DollarOutlined,
  CalculatorOutlined,
  PieChartOutlined,
  DownloadOutlined,
  ArrowLeftOutlined,
  BulbOutlined,
  BarChartOutlined,
  ContainerOutlined,
  BankOutlined,
  FileTextOutlined,
  TrophyOutlined,
  InfoCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import {
  Button,
  Card,
  Typography,
  Divider,
  Space,
  Tag,
  Row,
  Col,
  Statistic,
  Progress,
  Spin,
  notification,
  Collapse,
  List,
  Alert
} from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useSavedCalculations } from '../../hooks/usePricingCalculator';
import { useWorkspaceContext } from '../../hooks/useWorkspaceContext';
import { GeneratedPricingPackage } from '../../hooks/usePricingCalculator';

import { ConfigProvider } from "antd";

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

// Define a type for the saved calculation with additional metadata
interface SavedCalculationWithMetadata extends GeneratedPricingPackage {
  id: string;
  createdAt?: string;
  clientName?: string;
  projectName?: string;
  industry?: string;
  annualSavings?: number;
  recommendedRetainer?: number;
  roiPercentage?: number;
}

const SavedCalculationDetail = () => {
  const params = useParams();
  const router = useRouter();
  const { currentWorkspace } = useWorkspaceContext();
  const { getCalculation } = useSavedCalculations();
  
  const [calculation, setCalculation] = useState<SavedCalculationWithMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    const fetchCalculation = async () => {
      if (!params.id) return;
      
      try {
        setLoading(true);
        const data = await getCalculation(params.id as string);
        
        if (data && data.calculation) {
          // Combine the calculation data with metadata
          const calculationWithMetadata: SavedCalculationWithMetadata = {
            ...(data.calculation as GeneratedPricingPackage),
            id: data.id,
            createdAt: data.createdAt,
            clientName: data.clientName,
            projectName: data.projectName,
            industry: data.industry,
            annualSavings: data.annualSavings,
            recommendedRetainer: data.recommendedRetainer,
            roiPercentage: data.roiPercentage
          };
          setCalculation(calculationWithMetadata);
        } else {
          notification.error({
            message: 'Error',
            description: 'Could not load calculation details'
          });
          router.back();
        }
      } catch (error) {
        console.error('Error fetching calculation:', error);
        notification.error({
          message: 'Error',
          description: 'Failed to load calculation details'
        });
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchCalculation();
  }, [params.id, getCalculation, router]);

  const handleBack = () => {
    router.back();
  };

  const handleExport = async (format: 'proposal' | 'presentation' | 'contract' | 'complete') => {
    setExportLoading(true);
    try {
      // Implement export functionality
      notification.info({
        message: 'Export Started',
        description: `Preparing ${format} for download...`
      });
      
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      notification.success({
        message: 'Export Ready',
        description: `${format} has been prepared for download`
      });
    } catch (error) {
      notification.error({
        message: 'Export Failed',
        description: 'Could not generate the export file'
      });
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">


<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#5CC49D',
    },
  }}
>
  <Spin size="large" tip="Loading calculation details..." />
</ConfigProvider>

        
        </div>
      </div>
    );
  }

  if (!calculation) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Alert
          message="Calculation Not Found"
          description="The requested calculation could not be found or loaded."
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={handleBack}>
              Go Back
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
          className="mb-4"
        >
          Back to Calculator
        </Button>
        
        <div className="flex justify-between items-start">
          <div>
            <Title level={2}>Pricing Calculation Details</Title>
            <Text type="secondary">
              Saved calculation from {calculation.createdAt ? new Date(calculation.createdAt).toLocaleDateString() : 'unknown date'}
            </Text>
            {calculation.clientName && (
              <div>
                <Text strong>Client: </Text>
                <Text>{calculation.clientName}</Text>
              </div>
            )}
            {calculation.projectName && (
              <div>
                <Text strong>Project: </Text>
                <Text>{calculation.projectName}</Text>
              </div>
            )}
          </div>
          
          <Space>
            <Button 
              icon={<DownloadOutlined />}
              onClick={() => handleExport('complete')}
              loading={exportLoading}
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
              disabled={exportLoading}
            >
              Proposal
            </Button>
            <Button 
              icon={<BarChartOutlined />} 
              onClick={() => handleExport('presentation')}
              disabled={exportLoading}
            >
              Presentation
            </Button>
            <Button 
              icon={<ContainerOutlined />} 
              onClick={() => handleExport('contract')}
              disabled={exportLoading}
            >
              Contract
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => handleExport('complete')}
              disabled={exportLoading}
              loading={exportLoading}
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
              valueStyle={{ color: '#3f8600', fontSize: '1.5em' }}
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
                    <Text className="text-lg font-semibold text-green-600">
                      ${option.price?.toLocaleString()}
                    </Text>
                    <Paragraph className="mt-2 mb-2">{option.description}</Paragraph>
                    {option.pros && option.pros.length > 0 && (
                      <div>
                        <Text strong className="text-green-600">Pros: </Text>
                        <Text>{option.pros.join(', ')}</Text>
                      </div>
                    )}
                    {option.cons && option.cons.length > 0 && (
                      <div>
                        <Text strong className="text-red-600">Cons: </Text>
                        <Text>{option.cons.join(', ')}</Text>
                      </div>
                    )}
                  </div>
                  {option.recommendationScore && (
                    <div className="ml-4">
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
            
            <div>
              <Title level={5}>Pricing Framework</Title>
              <Paragraph>{calculation.strategy.pricingFramework}</Paragraph>
            </div>
            
            <div>
              <Title level={5}>Value Proposition</Title>
              <Paragraph>{calculation.strategy.valueProposition}</Paragraph>
            </div>

            {calculation.strategy.negotiationTactics && calculation.strategy.negotiationTactics.length > 0 && (
              <div>
                <Title level={5}>Negotiation Tactics</Title>
                <ul>
                  {calculation.strategy.negotiationTactics.map((tactic, idx) => (
                    <li key={idx}>{tactic}</li>
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
                    <Row gutter={16}>
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
                            <ul className="mt-1">
                              {phase.deliverables.map((deliverable, idx) => (
                                <li key={idx} className="text-sm">{deliverable}</li>
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
                    <Title level={5} className="text-orange-600">
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

    </div>
  );
};

export default SavedCalculationDetail;