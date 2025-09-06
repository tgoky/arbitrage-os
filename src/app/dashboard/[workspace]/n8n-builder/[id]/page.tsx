// app/dashboard/[workspace]/n8n-builder/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { 
  ThunderboltOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  ApiOutlined,
  SaveOutlined,
  ShareAltOutlined,
  CodeOutlined,
  PlayCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
  ReloadOutlined,
  WarningOutlined,
  SecurityScanOutlined,
  RocketOutlined
} from '@ant-design/icons';
import { 
  Button, 
  Card, 
  Typography, 
  Divider, 
  Space,
  Tag,
  Alert,
  Tabs,
  Modal,
  Spin,
  Row,
  Col,
  Statistic,
  Progress,
  Badge,
  Tooltip,
  message,
  Collapse
} from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useWorkspaceContext } from '../../../../hooks/useWorkspaceContext';
import { useWorkflowExport } from '../../../../hooks/useN8nWorkflowBuilder';
import { SavedWorkflow, ExportFormat } from '@/types/n8nWorkflowBuilder';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const N8nWorkflowDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  const { downloadWorkflow, copyToClipboard } = useWorkflowExport();
  
  const [workflow, setWorkflow] = useState<SavedWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const workflowId = params.id as string;

  useEffect(() => {
    if (isWorkspaceReady && workflowId) {
      fetchWorkflow();
    }
  }, [isWorkspaceReady, workflowId]);

  const fetchWorkflow = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/n8n-workflow-builder?workflowId=${workflowId}`, {
        headers: {
          'X-Workspace-Id': currentWorkspace?.id || ''
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch workflow: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setWorkflow(data.data);
      } else {
        throw new Error(data.error || 'Failed to load workflow');
      }
    } catch (err) {
      console.error('Error fetching workflow:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      message.error('Failed to load workflow details');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: ExportFormat) => {
    if (!workflow) return;
    
    let content = '';
    switch (format) {
      case 'json':
        content = JSON.stringify(workflow.workflowConfig, null, 2);
        break;
      case 'summary':
        content = generateWorkflowSummary(workflow);
        break;
      case 'setup-guide':
        content = generateSetupGuide(workflow);
        break;
      default:
        content = JSON.stringify(workflow.workflowConfig, null, 2);
    }
    
    downloadWorkflow(workflow.workflowName, content, format);
  };
  

     const handleBack = () => {
    router.push(`/submissions`);
  };

  const handleDelete = async () => {
    Modal.confirm({
      title: 'Delete Workflow',
      content: 'Are you sure you want to delete this workflow? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await fetch(`/api/n8n-workflow-builder?workflowId=${workflowId}`, {
            method: 'DELETE',
            headers: {
              'X-Workspace-Id': currentWorkspace?.id || ''
            }
          });

          if (!response.ok) {
            throw new Error(`Failed to delete workflow: ${response.status}`);
          }

          const data = await response.json();
          
          if (data.success) {
            message.success('Workflow deleted successfully');
            router.push(`/dashboard/${currentWorkspace?.slug}/submissions`);
          } else {
            throw new Error(data.error || 'Failed to delete workflow');
          }
        } catch (err) {
          console.error('Error deleting workflow:', err);
          message.error('Failed to delete workflow');
        }
      }
    });
  };

  const handleEdit = () => {
    router.push(`/dashboard/${currentWorkspace?.slug}/n8n-builder?load=${workflowId}`);
  };

  const generateWorkflowSummary = (workflow: SavedWorkflow): string => {
    return `# ${workflow.workflowName}

**Type**: ${workflow.triggerType.toUpperCase()} Workflow
**Complexity**: ${workflow.complexity.toUpperCase()}
**Nodes**: ${workflow.nodeCount}
**Status**: ${workflow.status.toUpperCase()}
**Created**: ${workflow.createdAt.toLocaleDateString()}

## Description
${workflow.workflowDescription || 'No description provided'}

## Integrations
${workflow.integrations.map(integration => `• ${integration}`).join('\n')}

## Setup Requirements
${workflow.setupInstructions.credentialSetup.map((cred: any) => `• ${cred.name} (${cred.type})`).join('\n')}

## Analysis
• **Estimated Execution Time**: ${workflow.analysis.estimatedExecutionTime} seconds
• **Complexity**: ${workflow.analysis.complexity}
• **Security Level**: ${workflow.analysis.securityConsiderations.length > 2 ? 'High' : 'Medium'}

## Quick Setup
1. Import the workflow JSON into n8n
2. Configure required credentials
3. Test the workflow
4. Activate when ready

---
*Generated by n8n Workflow Builder*`;
  };

  const generateSetupGuide = (workflow: SavedWorkflow): string => {
    return `# Setup Guide: ${workflow.workflowName}

## Prerequisites
- n8n instance (cloud or self-hosted)
- Admin access to configure credentials
- Access to required third-party services

## Step-by-Step Setup
${workflow.setupInstructions.steps.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n')}

## Required Credentials
${workflow.setupInstructions.credentialSetup.map((cred: any) => `### ${cred.name}
- **Type**: ${cred.type}
- **Service**: ${cred.service}
- **Setup Guide**: [${cred.setupLink}](${cred.setupLink})
- **Priority**: ${cred.priority}`).join('\n\n')}

## Testing Your Workflow
${workflow.setupInstructions.testingGuidance.map((test: string) => `• ${test}`).join('\n')}

## Troubleshooting
${workflow.setupInstructions.troubleshooting.map((trouble: string) => `• ${trouble}`).join('\n')}

---
*Setup completed? Return to n8n and activate your workflow!*`;
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Loading workflow details...</p>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Alert
          message="Error Loading Workflow"
          description={error || 'Workflow not found'}
          type="error"
          showIcon
        />
        <Button 
          type="primary" 
          onClick={fetchWorkflow}
          style={{ marginTop: 16 }}
        >
          Try Again
        </Button>
        <Button 
            onClick={handleBack}
          style={{ marginLeft: 8, marginTop: 16 }}
        >
          Back to Submissions
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
                onClick={handleBack}
          style={{ marginBottom: 16 }}
        >
          Back to Submissions
        </Button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={2}>{workflow.workflowName}</Title>
            <Text type="secondary">{workflow.workflowDescription}</Text>
          </div>
          
          <Space>
            {/* <Button icon={<EditOutlined />} onClick={handleEdit}>
              Edit
            </Button> */}
            <Button icon={<DownloadOutlined />} onClick={() => handleExport('json')}>
              Export
            </Button>
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Space>
        </div>
      </div>

      {/* Stats Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Nodes"
              value={workflow.nodeCount}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Complexity"
              value={workflow.complexity}
              valueRender={value => (
                <Tag color={
                  workflow.complexity === 'simple' ? 'green' :
                  workflow.complexity === 'moderate' ? 'orange' : 'red'
                }>
                  {value?.toString().toUpperCase()}
                </Tag>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Execution Time"
              value={workflow.analysis.estimatedExecutionTime}
              suffix="seconds"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab="Overview" key="overview">
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Card title="Workflow Details" style={{ marginBottom: 24 }}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Trigger Type: </Text>
                  <Tag color="blue">{workflow.triggerType}</Tag>
                </div>
                
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Integrations:</Text>
                  <div style={{ marginTop: 8 }}>
                    {workflow.integrations.map(integration => (
                      <Tag key={integration} color="purple" style={{ marginBottom: 4 }}>
                        {integration}
                      </Tag>
                    ))}
                  </div>
                </div>
                
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Created: </Text>
                  <Text>{new Date(workflow.createdAt).toLocaleDateString()}</Text>
                </div>
                
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Last Updated: </Text>
                  <Text>{new Date(workflow.updatedAt).toLocaleDateString()}</Text>
                </div>
                
                <div>
                  <Text strong>Status: </Text>
                  <Tag color={workflow.status === 'active' ? 'green' : 'default'}>
                    {workflow.status.toUpperCase()}
                  </Tag>
                </div>
              </Card>

              <Card title="Workflow Analysis">
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Performance Metrics</Text>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text>Estimated Execution Time</Text>
                      <Text>{workflow.analysis.estimatedExecutionTime} seconds</Text>
                    </div>
                    <Progress 
                      percent={Math.min(workflow.analysis.estimatedExecutionTime * 2, 100)} 
                      status="active" 
                    />
                  </div>
                </div>
                
                <Divider />
                
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Potential Issues</Text>
                  {workflow.analysis.potentialIssues.length > 0 ? (
                    <div style={{ marginTop: 8 }}>
                      {workflow.analysis.potentialIssues.map((issue, i) => (
                        <Alert
                          key={i}
                          message={issue}
                          type="warning"
                          showIcon
                          icon={<WarningOutlined />}
                          style={{ marginBottom: 8 }}
                        />
                      ))}
                    </div>
                  ) : (
                    <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                      No significant issues detected
                    </Text>
                  )}
                </div>
                
                <Divider />
                
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Optimization Suggestions</Text>
                  {workflow.analysis.optimizationSuggestions.length > 0 ? (
                    <div style={{ marginTop: 8 }}>
                      {workflow.analysis.optimizationSuggestions.map((suggestion, i) => (
                        <Alert
                          key={i}
                          message={suggestion}
                          type="info"
                          showIcon
                          icon={<RocketOutlined />}
                          style={{ marginBottom: 8 }}
                        />
                      ))}
                    </div>
                  ) : (
                    <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                      No optimization suggestions at this time
                    </Text>
                  )}
                </div>
                
                <Divider />
                
                <div>
                  <Text strong>Security Considerations</Text>
                  {workflow.analysis.securityConsiderations.length > 0 ? (
                    <div style={{ marginTop: 8 }}>
                      {workflow.analysis.securityConsiderations.map((consideration, i) => (
                        <Alert
                          key={i}
                          message={consideration}
                          type="warning"
                          showIcon
                          icon={<SecurityScanOutlined />}
                          style={{ marginBottom: 8 }}
                        />
                      ))}
                    </div>
                  ) : (
                    <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                      No major security concerns
                    </Text>
                  )}
                </div>
              </Card>
            </Col>
            
            <Col xs={24} lg={8}>
              <Card title="Quick Actions" style={{ marginBottom: 24 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button 
                    icon={<DownloadOutlined />} 
                    onClick={() => handleExport('json')}
                    block
                  >
                    Download n8n JSON
                  </Button>
                  {/* <Button 
                    icon={<EyeOutlined />} 
                    onClick={() => handleExport('summary')}
                    block
                  >
                    Download Summary
                  </Button> */}
                  <Button 
                    icon={<SaveOutlined />} 
                    onClick={() => handleExport('setup-guide')}
                    block
                  >
                    Download Setup Guide
                  </Button>
                  <Button 
                    icon={<ShareAltOutlined />} 
                    onClick={() => copyToClipboard(JSON.stringify(workflow.workflowConfig, null, 2))}
                    block
                  >
                    Copy JSON to Clipboard
                  </Button>
                </Space>
              </Card>
              
              <Card title="Workflow Status">
                <div style={{ textAlign: 'center' }}>
                  <Badge 
                    status={workflow.status === 'active' ? 'success' : 'default'} 
                    text={workflow.status.toUpperCase()} 
                  />
                  <div style={{ marginTop: 16 }}>
                    {/* <Button type="primary" icon={<PlayCircleOutlined />}>
                      {workflow.status === 'active' ? 'Running' : 'Activate'}
                    </Button> */}
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Tabs.TabPane>
        
        <Tabs.TabPane tab="JSON Configuration" key="json">
          <Card>
            <div style={{ padding: '16px', borderRadius: '8px' }}>
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word',
                fontSize: '12px',
                maxHeight: '600px',
                overflow: 'auto'
              }}>
                {JSON.stringify(workflow.workflowConfig, null, 2)}
              </pre>
            </div>
          </Card>
        </Tabs.TabPane>
        
        <Tabs.TabPane tab="Setup Instructions" key="setup">
          <Card title="Setup Guide">
            <Collapse defaultActiveKey={['1']}>
              <Panel header="Import Instructions" key="1">
                <ol>
                  {workflow.setupInstructions.steps.map((step: string, i: number) => (
                    <li key={i} style={{ marginBottom: '8px' }}>{step}</li>
                  ))}
                </ol>
              </Panel>
              
              <Panel header="Required Credentials" key="2">
                {workflow.setupInstructions.credentialSetup.map((cred: any, i: number) => (
                  <div key={i} style={{ marginBottom: '16px' }}>
                    <Text strong>{cred.name}</Text> ({cred.type})
                    <br />
                    {cred.setupLink && (
                      <a href={cred.setupLink} target="_blank" rel="noopener noreferrer">
                        Setup Guide →
                      </a>
                    )}
                    {cred.description && (
                      <div style={{ marginTop: '4px', color: '#666' }}>
                        {cred.description}
                      </div>
                    )}
                  </div>
                ))}
              </Panel>
              
              <Panel header="Testing Guidelines" key="3">
                <ul>
                  {workflow.setupInstructions.testingGuidance.map((test: string, i: number) => (
                    <li key={i} style={{ marginBottom: '8px' }}>{test}</li>
                  ))}
                </ul>
              </Panel>
              
              <Panel header="Troubleshooting" key="4">
                <ul>
                  {workflow.setupInstructions.troubleshooting.map((trouble: string, i: number) => (
                    <li key={i} style={{ marginBottom: '8px' }}>{trouble}</li>
                  ))}
                </ul>
              </Panel>
            </Collapse>
          </Card>
        </Tabs.TabPane>
        
        <Tabs.TabPane tab="Export Options" key="export">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="n8n JSON Export">
                <Text>
                  Download the complete n8n workflow configuration that can be imported directly into your n8n instance.
                </Text>
                <div style={{ marginTop: 16 }}>
                  <Button 
                    type="primary" 
                    icon={<DownloadOutlined />}
                    onClick={() => handleExport('json')}
                    block
                  >
                    Download n8n JSON
                  </Button>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} md={12}>
              <Card title="Documentation Export">
                <Text>
                  Download comprehensive documentation including setup instructions, troubleshooting, and analysis.
                </Text>
                <div style={{ marginTop: 16 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {/* <Button 
                      icon={<EyeOutlined />}
                      onClick={() => handleExport('summary')}
                      block
                    >
                      Download Summary
                    </Button> */}
                    <Button 
                      icon={<SaveOutlined />}
                      onClick={() => handleExport('setup-guide')}
                      block
                    >
                      Download Setup Guide
                    </Button>
                  </Space>
                </div>
              </Card>
            </Col>
          </Row>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default N8nWorkflowDetailsPage;