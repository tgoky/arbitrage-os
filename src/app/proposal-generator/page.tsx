"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  FileTextOutlined,
  EditOutlined,
  DownloadOutlined,
  CopyOutlined,
  SaveOutlined,
  HistoryOutlined,
  UserOutlined,
  CalendarOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Typography,
  Divider,
  Space,
  Tag,
  Badge,
  Tabs,
  Alert,
  Row,
  Col,
  message,
  Spin,
  Modal,
  DatePicker,
  Steps,
  Progress
} from "antd";

import { useWorkspaceContext } from '../hooks/useWorkspaceContext';
import { useRouter } from 'next/navigation';
import {
  useProposalCreator,
  useProposalValidation,
  useSavedProposals,
  useProposalExport
} from '../hooks/useProposalCreator';


import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

export default function ProposalGeneratorPage() {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<"inputs" | "preview" | "history">("inputs");
  const [generatedProposal, setGeneratedProposal] = useState<any>(null);
  const [savedProposalId, setSavedProposalId] = useState<string | null>(null);

  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  const router = useRouter();

  const { generateProposal, generating, error: generateError } = useProposalCreator();
  const { proposals, loading: proposalsLoading, fetchProposals, deleteProposal, getProposal } = useSavedProposals();
  const { validateProposalProgressive } = useProposalValidation();
  const { exportProposal, loading: exportLoading } = useProposalExport();
  const [localError, setLocalError] = useState<string | null>(null);

  // Form state
const [effectiveDate, setEffectiveDate] = useState<string>(dayjs().format("MMMM D, YYYY"));
  
  const [serviceProvider, setServiceProvider] = useState({
    name: "",
    address: "",
    signatoryName: "",
    signatoryTitle: ""
  });

  const [clientInfo, setClientInfo] = useState({
    legalName: "",
    stateOfIncorporation: "Delaware",
    entityType: "corporation",
    address: "",
    signatoryName: "",
    signatoryTitle: ""
  });

  const [projectScope, setProjectScope] = useState({
    description: "",
    scopeOfServices: "",
    timeline: "",
    fees: "",
    serviceProviderResponsibilities: "",
    clientResponsibilities: "",
    acceptanceCriteria: "",
    additionalTerms: ""
  });

  // Create complete input object
  const completeInput = useMemo(() => {
    return {
      serviceProvider,
      clientInfo,
      projectScope,
      effectiveDate,
      workspaceId: currentWorkspace?.id || '',
    };
  }, [serviceProvider, clientInfo, projectScope, effectiveDate, currentWorkspace?.id]);

  // // Validation results
  // const validationResults = useMemo(() => {
  //   return validateProposalProgressive(completeInput);
  // }, [completeInput, validateProposalProgressive]);

  // Load proposals on mount
  useEffect(() => {
    if (isWorkspaceReady && currentWorkspace) {
      fetchProposals();
    }
  }, [isWorkspaceReady, currentWorkspace?.id]);

  // Workspace validation
  if (!isWorkspaceReady) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <Spin size="large" tip="Loading workspace..." />
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Alert
          message="Workspace Required"
          description="The proposal generator must be accessed from within a workspace."
          type="error"
          showIcon
          action={
            <Button type="primary" href="/dashboard">
              Go to Dashboard
            </Button>
          }
        />
      </div>
    );
  }

  const handleBack = () => {
    router.push(`/dashboard/${currentWorkspace?.slug}`);
  };

  const handleInputChange = (section: string, field: string, value: any) => {
    switch (section) {
      case 'client':
        setClientInfo(prev => ({ ...prev, [field]: value }));
        break;
      case 'serviceProvider':
        setServiceProvider(prev => ({ ...prev, [field]: value }));
        break;
      case 'project':
        setProjectScope(prev => ({ ...prev, [field]: value }));
        break;
    }
  };

  // const onFinish = async () => {
  //   try {
  //     const fullValidation = validateProposalProgressive(completeInput, true);
  //     if (!fullValidation.isReadyToGenerate) {
  //       message.error("Please complete essential fields before generating");
  //       return;
  //     }

  //     const result = await generateProposal(completeInput);

  //     if (result) {
  //       setGeneratedProposal(result.proposal);
  //       setSavedProposalId(result.proposalId);
  //       setActiveTab("preview");
  //       await fetchProposals();
        
  //       // notification.success({
  //       //   message: "Proposal Generated Successfully",
  //       //   description: `Your professional proposal is ready for review.`,
  //       //   duration: 5,
  //       // });
  //     }
  //   } catch (error) {
  //     console.error("Generation error:", error);
  //     message.error("Failed to generate proposal. Please try again.");
  //   }
  // };

  const handleClearAll = () => {
    setGeneratedProposal(null);
    setSavedProposalId(null);
    
    setServiceProvider({
      name: "",
      address: "",
      signatoryName: "",
      signatoryTitle: ""
    });
    setClientInfo({
      legalName: "",
      stateOfIncorporation: "Delaware",
      entityType: "corporation",
      address: "",
      signatoryName: "",
      signatoryTitle: ""
    });
    setProjectScope({
      description: "",
      scopeOfServices: "",
      timeline: "",
      fees: "",
      serviceProviderResponsibilities: "",
      clientResponsibilities: "",
      acceptanceCriteria: "",
      additionalTerms: ""
    });
    
    setActiveTab("inputs");
    message.success("All fields cleared successfully!");
  };

  const handleExport = async (format: 'html' | 'pdf') => {
    if (!savedProposalId) {
      message.error("No proposal to export. Please generate a proposal first.");
      return;
    }

    try {
      await exportProposal(savedProposalId, format);
    } catch (error) {
      console.error("Export error:", error);
      message.error(`Failed to export as ${format.toUpperCase()}`);
    }
  };

  const handleDeleteProposal = async (proposalId: string) => {
    Modal.confirm({
      title: "Delete Proposal",
      content: "Are you sure you want to delete this proposal? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        const success = await deleteProposal(proposalId);
        if (success) {
          if (savedProposalId === proposalId) {
            setGeneratedProposal(null);
            setSavedProposalId(null);
            setActiveTab("inputs");
          }
        }
      },
    });
  };

  const handleLoadProposal = async (proposalId: string) => {
    try {
      const proposalData = await getProposal(proposalId);
      
      if (proposalData && proposalData.proposalData) {
        const proposalPackage = proposalData.proposalData;
        const originalInput = proposalPackage.originalInput;
        
        if (originalInput) {
          setClientInfo(originalInput.clientInfo || clientInfo);
          setServiceProvider(originalInput.serviceProvider || serviceProvider);
          setProjectScope(originalInput.projectScope || projectScope);
        }
        
        setGeneratedProposal(proposalPackage);
        setSavedProposalId(proposalId);
        setActiveTab("preview");
        
        message.success("Proposal loaded successfully");
      }
    } catch (error) {
      console.error("Load proposal error:", error);
      message.error("Failed to load proposal");
    }
  };

  // const isFormValid = validationResults.isReadyToGenerate;
  // const hasMinimumData = clientInfo.legalName && serviceProvider.name;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* <LoadingOverlay visible={generating} /> */}
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={handleBack}
        className="mb-6"
      >
        Back to Workspace
      </Button>

      <div className="text-center mb-8">
        <Title level={1} className="mb-2">
          Proposal Generator
        </Title>
        <Text type="secondary" className="text-lg">
          Generate customized service agreements and statements of work
        </Text>
      </div>

      {(generateError || localError) && (
        <div className="mb-6">
          <Alert
            message="Generation Error"
            description={generateError || localError}
            type="error"
            showIcon
            closable
            onClose={() => setLocalError(null)}
          />
        </div>
      )}

      <Tabs 
        activeKey={activeTab} 
        onChange={(key) => setActiveTab(key as "inputs" | "preview" | "history")} 
        type="card"
        items={[
          {
            key: "inputs",
            label: (
              <span>
                <EditOutlined />
                Proposal Details
              </span>
            ),
          },
          {
            key: "preview",
            label: (
              <span>
                <EyeOutlined />
                Generated Proposal
              </span>
            ),
            disabled: !generatedProposal,
          },
          {
            key: "history",
            label: (
              <span>
                <HistoryOutlined />
                Saved Proposals
              </span>
            ),
          },
        ]}
      />

      {activeTab === "inputs" && (
        <Form form={form} layout="vertical" >    {/* onFinish={onFinish} */}
          <div className="space-y-8">
            {/* Service Agreement Details */}
            <Card>
              <Title level={3}>Service Agreement Details</Title>
              <Text type="secondary" className="block mb-6">
                Fill in the main contract information
              </Text>

              <div className="space-y-6">
             <Form.Item label="Effective Date">
  <DatePicker
    format="MMMM D, YYYY"
    value={effectiveDate ? dayjs(effectiveDate, "MMMM D, YYYY") : null}
    onChange={(date) => {
      if (date) {
        setEffectiveDate(date.format("MMMM D, YYYY"));
      } else {
        setEffectiveDate("");
      }
    }}
    style={{ width: '100%' }}
    placeholder="Select effective date"
  />
</Form.Item>

                <Form.Item label="Service Provider Address" required>
                  <TextArea 
                    rows={2}
                    value={serviceProvider.address}
                    onChange={(e) => handleInputChange('serviceProvider', 'address', e.target.value)}
                    placeholder="8 the Green, STE A, Dover, DE, 19901"
                  />
                </Form.Item>
              </div>
            </Card>

            {/* Client Information */}
            <Card>
              <Title level={3}>Client Information</Title>

              <div className="space-y-4">
                <Form.Item label="Client Legal Name" required>
                  <Input 
                    value={clientInfo.legalName}
                    onChange={(e) => handleInputChange('client', 'legalName', e.target.value)}
                    placeholder="ABC Corporation"
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label="State of Incorporation">
                      <Input 
                        value={clientInfo.stateOfIncorporation}
                        onChange={(e) => handleInputChange('client', 'stateOfIncorporation', e.target.value)}
                        placeholder="Delaware"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Entity Type">
                      <Select
                        value={clientInfo.entityType}
                        onChange={(value) => handleInputChange('client', 'entityType', value)}
                      >
                        <Option value="corporation">Corporation</Option>
                        <Option value="llc">LLC</Option>
                        <Option value="partnership">Partnership</Option>
                        <Option value="sole-proprietorship">Sole Proprietorship</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="Client Address">
                  <TextArea 
                    rows={2}
                    value={clientInfo.address}
                    onChange={(e) => handleInputChange('client', 'address', e.target.value)}
                    placeholder="456 Business Ave, City, State 67890"
                  />
                </Form.Item>
              </div>
            </Card>

            {/* Authorized Signatories */}
            <Card>
              <Title level={3}>Authorized Signatories</Title>

              <Row gutter={16}>
                <Col span={12}>
                  <div className="space-y-4">
                    <Form.Item label="Service Provider Signatory Name" required>
                      <Input 
                        value={serviceProvider.signatoryName}
                        onChange={(e) => handleInputChange('serviceProvider', 'signatoryName', e.target.value)}
                        placeholder="John Doe"
                      />
                    </Form.Item>
                    <Form.Item label="Service Provider Signatory Title" required>
                      <Input 
                        value={serviceProvider.signatoryTitle}
                        onChange={(e) => handleInputChange('serviceProvider', 'signatoryTitle', e.target.value)}
                        placeholder="Managing Director"
                      />
                    </Form.Item>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="space-y-4">
                    <Form.Item label="Client Signatory Name" required>
                      <Input 
                        value={clientInfo.signatoryName}
                        onChange={(e) => handleInputChange('client', 'signatoryName', e.target.value)}
                        placeholder="Jane Smith"
                      />
                    </Form.Item>
                    <Form.Item label="Client Signatory Title" required>
                      <Input 
                        value={clientInfo.signatoryTitle}
                        onChange={(e) => handleInputChange('client', 'signatoryTitle', e.target.value)}
                        placeholder="CEO"
                      />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Statement of Work */}
            <Card>
              <Title level={3}>Statement of Work (SOW)</Title>
              <Text type="secondary" className="block mb-6">
                Define the specific project details and scope
              </Text>

              <div className="space-y-6">
                <Form.Item label="1. Project Description" required>
                  <TextArea 
                    rows={4}
                    value={projectScope.description}
                    onChange={(e) => handleInputChange('project', 'description', e.target.value)}
                    placeholder="Provide a detailed description of the project, objectives, and background..."
                  />
                </Form.Item>

                <Form.Item label="2. Scope of Services">
                  <TextArea 
                    rows={3}
                    value={projectScope.scopeOfServices}
                    onChange={(e) => handleInputChange('project', 'scopeOfServices', e.target.value)}
                    placeholder="Define the specific services and deliverables to be provided..."
                  />
                </Form.Item>

                <Form.Item label="3. Timeline & Milestones">
                  <TextArea 
                    rows={3}
                    value={projectScope.timeline}
                    onChange={(e) => handleInputChange('project', 'timeline', e.target.value)}
                    placeholder="Specify the start date, end date, and key milestones..."
                  />
                </Form.Item>

                <Form.Item label="4. Fees & Payment">
                  <TextArea 
                    rows={3}
                    value={projectScope.fees}
                    onChange={(e) => handleInputChange('project', 'fees', e.target.value)}
                    placeholder="Set forth the fees for this SOW, payment schedule, and any expense reimbursement terms..."
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Service Provider Responsibilities">
                      <TextArea 
                        rows={3}
                        value={projectScope.serviceProviderResponsibilities}
                        onChange={(e) => handleInputChange('project', 'serviceProviderResponsibilities', e.target.value)}
                        placeholder="Outline service provider responsibilities..."
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Client Responsibilities">
                      <TextArea 
                        rows={3}
                        value={projectScope.clientResponsibilities}
                        onChange={(e) => handleInputChange('project', 'clientResponsibilities', e.target.value)}
                        placeholder="Outline the client's responsibilities..."
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="6. Acceptance Criteria">
                  <TextArea 
                    rows={3}
                    value={projectScope.acceptanceCriteria}
                    onChange={(e) => handleInputChange('project', 'acceptanceCriteria', e.target.value)}
                    placeholder="Specify the criteria and process for Client acceptance of deliverables..."
                  />
                </Form.Item>

                <Form.Item label="7. Additional Terms">
                  <TextArea 
                    rows={3}
                    value={projectScope.additionalTerms}
                    onChange={(e) => handleInputChange('project', 'additionalTerms', e.target.value)}
                    placeholder="Include any additional terms specific to this SOW not already in the Agreement..."
                  />
                </Form.Item>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t">
              <Button 
                icon={<ReloadOutlined />}
                onClick={handleClearAll}
                disabled={generating}
              >
                Clear All
              </Button>

              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  disabled={generating}
                  icon={<BulbOutlined />}
                  loading={generating}
                  size="large"
                  style={{
                    backgroundColor: '#1890ff',
                    borderColor: '#1890ff',
                  }}
                >
                  {generating ? 'Generating...' : 'Generate Proposal'}
                </Button>
              </Space>
            </div>
          </div>
        </Form>
      )}

      {activeTab === "preview" && generatedProposal && (
        <ProposalPreview 
          proposal={generatedProposal}
          clientInfo={clientInfo}
          serviceProvider={serviceProvider}
          projectScope={projectScope}
          effectiveDate={effectiveDate}
          onExport={handleExport}
          savedProposalId={savedProposalId}
          exportLoading={exportLoading}
        />
      )}

      {activeTab === "history" && (
        <ProposalHistory 
          proposals={proposals}
          loading={proposalsLoading}
          onLoadProposal={handleLoadProposal}
          onDeleteProposal={handleDeleteProposal}
          onRefresh={fetchProposals}
        />
      )}
    </div>
  );
}

// Proposal Preview Component
function ProposalPreview({ 
  proposal, 
  clientInfo, 
  serviceProvider,
  projectScope,
  effectiveDate,
  onExport,
  savedProposalId,
  exportLoading
}: { 
  proposal: any;
  clientInfo: any;
  serviceProvider: any;
  projectScope: any;
  effectiveDate: string;
  onExport: (format: 'html' | 'pdf') => void;
  savedProposalId: string | null;
  exportLoading: boolean;
}) {
  const copyToClipboard = (content: string, type: string) => {
    navigator.clipboard.writeText(content).then(() => {
      message.success(`${type} copied to clipboard!`);
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <Title level={3}>Generated Proposal</Title>
            <Text type="secondary">
              Created for {clientInfo.legalName} • Effective {effectiveDate}
            </Text>
          </div>
          <Space>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={() => onExport('html')}
              loading={exportLoading}
              type="primary"
            >
              Export Proposal
            </Button>
            
            <Button 
              type="default" 
              icon={<SaveOutlined />}
              disabled={!savedProposalId}
            >
              {savedProposalId ? 'Saved' : 'Save Proposal'}
            </Button>
          </Space>
        </div>
      </Card>

      {/* Service Agreement Preview */}
      <Card>
        <Title level={3}>Service Agreement</Title>
        <div className="space-y-4">
          <div>
            <Text strong>Effective Date: </Text>
            <Text>{effectiveDate}</Text>
          </div>
          
          <div>
            <Text strong>Service Provider Address: </Text>
            <Text>{serviceProvider.address}</Text>
          </div>

          <Divider />

          <Title level={4}>Client Information</Title>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Text strong>Legal Name: </Text>
              <Text>{clientInfo.legalName}</Text>
            </div>
            <div>
              <Text strong>State of Incorporation: </Text>
              <Text>{clientInfo.stateOfIncorporation}</Text>
            </div>
            <div>
              <Text strong>Entity Type: </Text>
              <Text>{clientInfo.entityType}</Text>
            </div>
            <div>
              <Text strong>Address: </Text>
              <Text>{clientInfo.address}</Text>
            </div>
          </div>

          <Divider />

          <Title level={4}>Authorized Signatories</Title>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Text strong>Service Provider: </Text>
              <Text>{serviceProvider.signatoryName}, {serviceProvider.signatoryTitle}</Text>
            </div>
            <div>
              <Text strong>Client: </Text>
              <Text>{clientInfo.signatoryName}, {clientInfo.signatoryTitle}</Text>
            </div>
          </div>
        </div>
      </Card>

      {/* Statement of Work Preview */}
      <Card>
        <Title level={3}>Statement of Work</Title>
        <div className="space-y-6">
          {projectScope.description && (
            <div>
              <Title level={4}>1. Project Description</Title>
              <Text>{projectScope.description}</Text>
            </div>
          )}

          {projectScope.scopeOfServices && (
            <div>
              <Title level={4}>2. Scope of Services</Title>
              <Text>{projectScope.scopeOfServices}</Text>
            </div>
          )}

          {projectScope.timeline && (
            <div>
              <Title level={4}>3. Timeline & Milestones</Title>
              <Text>{projectScope.timeline}</Text>
            </div>
          )}

          {projectScope.fees && (
            <div>
              <Title level={4}>4. Fees & Payment</Title>
              <Text>{projectScope.fees}</Text>
            </div>
          )}

          {(projectScope.serviceProviderResponsibilities || projectScope.clientResponsibilities) && (
            <div>
              <Title level={4}>Responsibilities</Title>
              <Row gutter={16}>
                {projectScope.serviceProviderResponsibilities && (
                  <Col span={12}>
                    <Text strong>Service Provider: </Text>
                    <Text>{projectScope.serviceProviderResponsibilities}</Text>
                  </Col>
                )}
                {projectScope.clientResponsibilities && (
                  <Col span={12}>
                    <Text strong>Client: </Text>
                    <Text>{projectScope.clientResponsibilities}</Text>
                  </Col>
                )}
              </Row>
            </div>
          )}

          {projectScope.acceptanceCriteria && (
            <div>
              <Title level={4}>6. Acceptance Criteria</Title>
              <Text>{projectScope.acceptanceCriteria}</Text>
            </div>
          )}

          {projectScope.additionalTerms && (
            <div>
              <Title level={4}>7. Additional Terms</Title>
              <Text>{projectScope.additionalTerms}</Text>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// Proposal History Component
function ProposalHistory({ 
  proposals, 
  loading,
  onLoadProposal, 
  onDeleteProposal,
  onRefresh
}: { 
  proposals: any[];
  loading: boolean;
  onLoadProposal: (id: string) => void;
  onDeleteProposal: (id: string) => void;
  onRefresh: () => void;
}) {
  return (
    <Card
      title="Saved Proposals"
      extra={
        <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
          Refresh
        </Button>
      }
    >
      {loading ? (
        <div className="text-center py-12">
          <Spin size="large" tip="Loading proposals..." />
        </div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-12">
          <FileTextOutlined style={{ fontSize: 48, color: '#ccc' }} />
          <Title level={4} type="secondary">
            No Proposals Yet
          </Title>
          <Text type="secondary">
            Your generated proposals will appear here once you save them.
          </Text>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map(proposal => (
            <Card key={proposal.id} size="small" hoverable>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Title level={5} className="mb-1">{proposal.title}</Title>
                  <div className="space-x-2 mb-2">
                    <Tag color="blue">Service Agreement</Tag>
                    <Tag>{proposal.metadata?.industry || 'General'}</Tag>
                  </div>
                  <Text type="secondary" className="text-sm">
                    Created {new Date(proposal.createdAt).toLocaleDateString()}
                  </Text>
                </div>
                <Space>
                  <Button 
                    size="small" 
                    icon={<EyeOutlined />}
                    onClick={() => onLoadProposal(proposal.id)}
                  >
                    Load
                  </Button>
                  <Button 
                    size="small" 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={() => onDeleteProposal(proposal.id)}
                  >
                    Delete
                  </Button>
                </Space>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}

