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
  Progress,
  ConfigProvider,
  theme
} from "antd";



import { useWorkspaceContext } from '../hooks/useWorkspaceContext';
import { useRouter } from 'next/navigation';
import {
  useProposalCreator,
  useProposalValidation,
  useSavedProposals,
  useProposalExport
} from '../hooks/useProposalCreator';

import LoadingOverlay from './LoadingOverlay';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

// Color constants
const SPACE_COLOR = '#9DA2B3';
const BRAND_GREEN = '#5CC49D';
const DARK_BG = '#0f172a';
const SURFACE_BG = '#000000';
const SURFACE_LIGHTER = '#000000';
const TEXT_PRIMARY = '#f1f5f9';
const TEXT_SECONDARY = '#94a3b8';
const BORDER_COLOR = '#334155';

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

  // Load Manrope font
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Form state
  const [effectiveDate, setEffectiveDate] = useState<string>(dayjs().format("MMMM D, YYYY"));
  
  const [serviceProvider, setServiceProvider] = useState({
    name: "",
    address: "",
    signatoryName: "",
    signatoryTitle: ""
  });

  const [clientInfo, setClientInfo] = useState<{
    legalName: string;
    stateOfIncorporation: string;
    entityType: 'corporation' | 'llc' | 'partnership' | 'sole-proprietorship';
    address: string;
    signatoryName: string;
    signatoryTitle: string;
  }>({
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

        <ConfigProvider
  theme={{
    token: {
      colorPrimary: '#5CC49D',
    },
  }}
>
  <Spin size="large" tip="Loading workspace..." />
</ConfigProvider>

      
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
            <Button type="primary" href="/dashboard" style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' }}>
              Go to Dashboard
            </Button>
          }
        />
      </div>
    );
  }

  const handleBack = () => {
    router.back();
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

  const onFinish = async () => {
    try {
      // Validate essential fields
      if (!clientInfo.legalName || clientInfo.legalName.length < 2) {
        message.error("Client legal name is required");
        return;
      }
      if (!projectScope.description || projectScope.description.length < 20) {
        message.error("Project description is required (minimum 20 characters)");
        return;
      }
      if (!serviceProvider.name || serviceProvider.name.length < 2) {
        message.error("Service provider name is required");
        return;
      }

      const result = await generateProposal(completeInput);

      if (result) {
        setGeneratedProposal(result.proposal);
        setSavedProposalId(result.proposalId);
        setActiveTab("preview");
        await fetchProposals();
      }
    } catch (error) {
      console.error("Generation error:", error);
      message.error("Failed to generate proposal. Please try again.");
    }
  };

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

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          fontFamily: 'Manrope, sans-serif',
          colorPrimary: BRAND_GREEN,
          borderRadius: 8,
          colorTextHeading: TEXT_PRIMARY,
          colorText: TEXT_SECONDARY,
          colorBgContainer: SURFACE_BG,
          colorBgElevated: SURFACE_BG,
          colorBorder: BORDER_COLOR,
        },
        components: {
          Button: {
            colorPrimary: BRAND_GREEN,
            algorithm: true,
            fontWeight: 600,
            colorTextLightSolid: '#000000',
            defaultBorderColor: SPACE_COLOR,
            defaultColor: TEXT_SECONDARY,
            defaultBg: SURFACE_BG,
          },
          Input: {
            paddingBlock: 10,
            // borderColor: SURFACE_LIGHTER,
            activeBorderColor: BRAND_GREEN,
            hoverBorderColor: BRAND_GREEN,
            colorBgContainer: SURFACE_BG,
            colorText: TEXT_PRIMARY,
          },
          Select: {
            controlHeight: 44,
            colorPrimary: BRAND_GREEN,
            optionSelectedBg: SURFACE_LIGHTER,
            colorBgContainer: SURFACE_BG,
            colorText: TEXT_PRIMARY,
            hoverBorderColor: BRAND_GREEN,
          },
          Card: {
            headerBg: SURFACE_BG,
            colorBgContainer: SURFACE_BG,
            colorTextHeading: TEXT_PRIMARY,
            colorBorder: BORDER_COLOR,
          },
          Tabs: {
            itemSelectedColor: BRAND_GREEN,
            itemHoverColor: BRAND_GREEN,
            inkBarColor: BRAND_GREEN,
          },
          DatePicker: {
            colorBgContainer: SURFACE_BG,
            colorText: TEXT_PRIMARY,
            colorBorder: SURFACE_LIGHTER,
            hoverBorderColor: BRAND_GREEN,
          }
        }
      }}
    >
      <div className="min-h-screen bg-black font-manrope">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <LoadingOverlay visible={generating} />
          
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
            className="mb-6 hover:text-white border-none shadow-none px-0"
            style={{ background: 'transparent', color: SPACE_COLOR }}
          >
            Back to Workspace
          </Button>

          <div className="text-center mb-8">
                    <Title level={1} className="m-0 mb-2" style={{ color: TEXT_PRIMARY }}>Proposal Generator</Title>
            <Text style={{ color: SPACE_COLOR }} className="text-lg">
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
                style={{ background: 'rgba(255, 77, 79, 0.1)', borderColor: '#ff4d4f' }}
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
                  <span style={{ color: SPACE_COLOR }}>
                    <EditOutlined />
                    Proposal Details
                  </span>
                ),
              },
              {
                key: "preview",
                label: (
                  <span style={{ color: SPACE_COLOR }}>
                    <EyeOutlined />
                    Generated Proposal
                  </span>
                ),
                disabled: !generatedProposal,
              },
              {
                key: "history",
                label: (
                  <span style={{ color: SPACE_COLOR }}>
                    <HistoryOutlined />
                    Saved Proposals
                  </span>
                ),
              },
            ]}
          />

          {activeTab === "inputs" && (
            <Form form={form} layout="vertical" onFinish={onFinish}>
              <div className="space-y-8">
                {/* Service Agreement Details */}
                <Card style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
                  <Title level={3} style={{ color: TEXT_PRIMARY }}>Service Agreement Details</Title>
                  <Text style={{ color: SPACE_COLOR }} className="block mb-6">
                    Fill in the main contract information
                  </Text>

                  <div className="space-y-6">
                    <Form.Item label={<span style={{ color: TEXT_SECONDARY }}>Effective Date</span>}>
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
                        className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                      />
                    </Form.Item>

                    <Form.Item label={<span style={{ color: TEXT_SECONDARY }}>Service Provider Name</span>} required>
                      <Input 
                        value={serviceProvider.name}
                        onChange={(e) => handleInputChange('serviceProvider', 'name', e.target.value)}
                        placeholder="Your Company Name"
                        className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                      />
                    </Form.Item>

                    <Form.Item label={<span style={{ color: TEXT_SECONDARY }}>Service Provider Address</span>} required>
                      <TextArea 
                        rows={2}
                        value={serviceProvider.address}
                        onChange={(e) => handleInputChange('serviceProvider', 'address', e.target.value)}
                        placeholder="8 the Green, STE A, Dover, DE, 19901"
                        className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                      />
                    </Form.Item>
                  </div>
                </Card>

                {/* Client Information */}
                <Card style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
                  <Title level={3} style={{ color: TEXT_PRIMARY }}>Client Information</Title>

                  <div className="space-y-4">
                    <Form.Item label={<span style={{ color: TEXT_SECONDARY }}>Client Legal Name</span>} required>
                      <Input 
                        value={clientInfo.legalName}
                        onChange={(e) => handleInputChange('client', 'legalName', e.target.value)}
                        placeholder="ABC Corporation"
                        className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                      />
                    </Form.Item>

                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item label={<span style={{ color: TEXT_SECONDARY }}>State of Incorporation</span>}>
                          <Input 
                            value={clientInfo.stateOfIncorporation}
                            onChange={(e) => handleInputChange('client', 'stateOfIncorporation', e.target.value)}
                            placeholder="Delaware"
                            className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label={<span style={{ color: TEXT_SECONDARY }}>Entity Type</span>}>
                          <Select
                            value={clientInfo.entityType}
                            onChange={(value) => handleInputChange('client', 'entityType', value)}
                            className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                          >
                            <Option value="corporation">Corporation</Option>
                            <Option value="llc">LLC</Option>
                            <Option value="partnership">Partnership</Option>
                            <Option value="sole-proprietorship">Sole Proprietorship</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item label={<span style={{ color: TEXT_SECONDARY }}>Client Address</span>}>
                      <TextArea 
                        rows={2}
                        value={clientInfo.address}
                        onChange={(e) => handleInputChange('client', 'address', e.target.value)}
                        placeholder="456 Business Ave, City, State 67890"
                        className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                      />
                    </Form.Item>
                  </div>
                </Card>

                {/* Authorized Signatories */}
                <Card style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
                  <Title level={3} style={{ color: TEXT_PRIMARY }}>Authorized Signatories</Title>

                  <Row gutter={16}>
                    <Col span={12}>
                      <div className="space-y-4">
                        <Form.Item label={<span style={{ color: TEXT_SECONDARY }}>Service Provider Signatory Name</span>} required>
                          <Input 
                            value={serviceProvider.signatoryName}
                            onChange={(e) => handleInputChange('serviceProvider', 'signatoryName', e.target.value)}
                            placeholder="John Doe"
                            className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                          />
                        </Form.Item>
                        <Form.Item label={<span style={{ color: TEXT_SECONDARY }}>Service Provider Signatory Title</span>} required>
                          <Input 
                            value={serviceProvider.signatoryTitle}
                            onChange={(e) => handleInputChange('serviceProvider', 'signatoryTitle', e.target.value)}
                            placeholder="Managing Director"
                            className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                          />
                        </Form.Item>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="space-y-4">
                        <Form.Item label={<span style={{ color: TEXT_SECONDARY }}>Client Signatory Name</span>} required>
                          <Input 
                            value={clientInfo.signatoryName}
                            onChange={(e) => handleInputChange('client', 'signatoryName', e.target.value)}
                            placeholder="Jane Smith"
                            className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                          />
                        </Form.Item>
                        <Form.Item label={<span style={{ color: TEXT_SECONDARY }}>Client Signatory Title</span>} required>
                          <Input 
                            value={clientInfo.signatoryTitle}
                            onChange={(e) => handleInputChange('client', 'signatoryTitle', e.target.value)}
                            placeholder="CEO"
                            className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                          />
                        </Form.Item>
                      </div>
                    </Col>
                  </Row>
                </Card>

                {/* Statement of Work */}
                <Card style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
                  <Title level={3} style={{ color: TEXT_PRIMARY }}>Statement of Work (SOW)</Title>
                  <Text style={{ color: SPACE_COLOR }} className="block mb-6">
                    Define the specific project details and scope
                  </Text>

                  <div className="space-y-6">
                    <Form.Item label={<span style={{ color: TEXT_SECONDARY }}>1. Project Description</span>} required>
                      <TextArea 
                        rows={4}
                        value={projectScope.description}
                        onChange={(e) => handleInputChange('project', 'description', e.target.value)}
                        placeholder="Provide a detailed description of the project, objectives, and background..."
                        className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                      />
                    </Form.Item>

                    <Form.Item label={<span style={{ color: TEXT_SECONDARY }}>2. Scope of Services</span>}>
                      <TextArea 
                        rows={3}
                        value={projectScope.scopeOfServices}
                        onChange={(e) => handleInputChange('project', 'scopeOfServices', e.target.value)}
                        placeholder="Define the specific services and deliverables to be provided..."
                        className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                      />
                    </Form.Item>

                    <Form.Item label={<span style={{ color: TEXT_SECONDARY }}>3. Timeline & Milestones</span>}>
                      <TextArea 
                        rows={3}
                        value={projectScope.timeline}
                        onChange={(e) => handleInputChange('project', 'timeline', e.target.value)}
                        placeholder="Specify the start date, end date, and key milestones..."
                        className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                      />
                    </Form.Item>

                    <Form.Item label={<span style={{ color: TEXT_SECONDARY }}>4. Fees & Payment</span>}>
                      <TextArea 
                        rows={3}
                        value={projectScope.fees}
                        onChange={(e) => handleInputChange('project', 'fees', e.target.value)}
                        placeholder="Set forth the fees for this SOW, payment schedule, and any expense reimbursement terms..."
                        className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                      />
                    </Form.Item>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label={<span style={{ color: TEXT_SECONDARY }}>Service Provider Responsibilities</span>}>
                          <TextArea 
                            rows={3}
                            value={projectScope.serviceProviderResponsibilities}
                            onChange={(e) => handleInputChange('project', 'serviceProviderResponsibilities', e.target.value)}
                            placeholder="Outline service provider responsibilities..."
                            className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label={<span style={{ color: TEXT_SECONDARY }}>Client Responsibilities</span>}>
                          <TextArea 
                            rows={3}
                            value={projectScope.clientResponsibilities}
                            onChange={(e) => handleInputChange('project', 'clientResponsibilities', e.target.value)}
                            placeholder="Outline the client's responsibilities..."
                            className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item label={<span style={{ color: TEXT_SECONDARY }}>6. Acceptance Criteria</span>}>
                      <TextArea 
                        rows={3}
                        value={projectScope.acceptanceCriteria}
                        onChange={(e) => handleInputChange('project', 'acceptanceCriteria', e.target.value)}
                        placeholder="Specify the criteria and process for Client acceptance of deliverables..."
                        className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                      />
                    </Form.Item>

                    <Form.Item label={<span style={{ color: TEXT_SECONDARY }}>7. Additional Terms</span>}>
                      <TextArea 
                        rows={3}
                        value={projectScope.additionalTerms}
                        onChange={(e) => handleInputChange('project', 'additionalTerms', e.target.value)}
                        placeholder="Include any additional terms specific to this SOW not already in the Agreement..."
                        className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                      />
                    </Form.Item>
                  </div>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-6 border-t" style={{ borderColor: BORDER_COLOR }}>
                  <Button 
                    icon={<ReloadOutlined />}
                    onClick={handleClearAll}
                    disabled={generating}
                    style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
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
                        backgroundColor: BRAND_GREEN,
                        borderColor: BRAND_GREEN,
                        color: '#000000',
                        fontWeight: '500'
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

        {/* Custom CSS for hover effects */}
        <style jsx global>{`
          .ant-input:hover, .ant-input:focus {
            border-color: #5CC49D !important;
            box-shadow: 0 0 0 2px rgba(92, 196, 157, 0.1) !important;
          }
          
          .ant-select-selector:hover, .ant-select-focused .ant-select-selector {
            border-color: #5CC49D !important;
            box-shadow: 0 0 0 2px rgba(92, 196, 157, 0.1) !important;
          }
          
          .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
            background-color: rgba(92, 196, 157, 0.1) !important;
          }
          
          .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
            background-color: rgba(92, 196, 157, 0.2) !important;
            color: #5CC49D !important;
          }
          
          .ant-picker:hover, .ant-picker-focused {
            border-color: #5CC49D !important;
            box-shadow: 0 0 0 2px rgba(92, 196, 157, 0.1) !important;
          }
          
          .ant-btn:hover, .ant-btn:focus {
            border-color: #5CC49D !important;
            color: #5CC49D !important;
          }
          
          .ant-btn-primary:hover, .ant-btn-primary:focus {
            background: #4cb08d !important;
            border-color: #4cb08d !important;
            color: #000 !important;
          }
          
          .ant-card-hoverable:hover {
            border-color: #5CC49D !important;
          }
          
          .ant-form-item-label > label {
            color: ${TEXT_SECONDARY} !important;
          }
          
          .ant-tabs-tab:hover {
            color: #5CC49D !important;
          }
          
          .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
            color: #5CC49D !important;
          }
        `}</style>
      </div>
    </ConfigProvider>
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
  const [activeDocTab, setActiveDocTab] = useState<'complete' | 'agreement' | 'sow'>('complete');
  
  const copyToClipboard = (content: string, type: string) => {
    navigator.clipboard.writeText(content).then(() => {
      message.success(`${type} copied to clipboard!`);
    });
  };

  // Get contracts from the generated proposal
  const contracts = proposal?.contracts;
  const serviceAgreementBase = contracts?.serviceAgreement;
  const statementOfWorkBase = contracts?.statementOfWork;

  // Function to generate HTML with side-by-side signatures
  const generateDocumentHTML = (documentText: string, documentType: 'agreement' | 'sow') => {
    if (!documentText) return '';

    const title = documentType === 'agreement' ? 'Service Agreement' : 'Statement of Work';
    
    return `
      <div style="font-family: 'Times New Roman', Times, serif; line-height: 1.6; white-space: pre-wrap; color: #333;">
        ${documentText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
      </div>
      
      <div style="margin-top: 60px;">
        <p style="font-weight: bold; margin-bottom: 30px; color: #333;">IN WITNESS WHEREOF, the Parties have executed this ${title} as of the Effective Date.</p>
        
        <div style="display: table; width: 100%; margin-top: 40px;">
          <div style="display: table-cell; width: 50%; vertical-align: top; padding-right: 20px;">
            <div><strong style="color: #333;">${(serviceProvider.name || 'SERVICE PROVIDER').toUpperCase()}</strong></div>
            <div style="font-size: 10pt; margin-top: 5px; color: #666;">${serviceProvider.address || ''}</div>
            <div style="border-top: 1px solid #000; margin: 40px 0 5px 0; padding-top: 5px;"></div>
            <div style="font-size: 10pt; margin: 3px 0; color: #333;">By: _________________________</div>
            <div style="font-size: 10pt; margin: 3px 0; color: #333;">Name: ${serviceProvider.signatoryName || '_________________________'}</div>
            <div style="font-size: 10pt; margin: 3px 0; color: #333;">Title: ${serviceProvider.signatoryTitle || '_________________________'}</div>
            <div style="font-size: 10pt; margin: 3px 0; color: #333;">Date: _________________________</div>
          </div>
          
          <div style="display: table-cell; width: 50%; vertical-align: top; padding-left: 20px;">
            <div><strong style="color: #333;">${(clientInfo.legalName || 'CLIENT').toUpperCase()}</strong></div>
            <div style="font-size: 10pt; margin-top: 5px; color: #666;">${clientInfo.address || ''}</div>
            <div style="border-top: 1px solid #000; margin: 40px 0 5px 0; padding-top: 5px;"></div>
            <div style="font-size: 10pt; margin: 3px 0; color: #333;">By: _________________________</div>
            <div style="font-size: 10pt; margin: 3px 0; color: #333;">Name: ${clientInfo.signatoryName || '_________________________'}</div>
            <div style="font-size: 10pt; margin: 3px 0; color: #333;">Title: ${clientInfo.signatoryTitle || '_________________________'}</div>
            <div style="font-size: 10pt; margin: 3px 0; color: #333;">Date: _________________________</div>
          </div>
        </div>
      </div>
    `;
  };

  // Generate HTML versions for display
  const serviceAgreementHTML = serviceAgreementBase ? generateDocumentHTML(serviceAgreementBase, 'agreement') : null;
  const statementOfWorkHTML = statementOfWorkBase ? generateDocumentHTML(statementOfWorkBase, 'sow') : null;

  // For copying - add plain text signatures
  const addSignatureBlocksPlainText = (documentText: string, documentType: 'agreement' | 'sow') => {
    if (!documentText) return documentText;

    const signatureBlock = `

IN WITNESS WHEREOF, the Parties have executed this ${documentType === 'agreement' ? 'Service Agreement' : 'Statement of Work'} as of the Effective Date.

${serviceProvider.name?.toUpperCase() || 'SERVICE PROVIDER'}
${serviceProvider.address || ''}

By: _________________________
Name: ${serviceProvider.signatoryName || '_________________________'}
Title: ${serviceProvider.signatoryTitle || '_________________________'}
Date: _________________________


${clientInfo.legalName?.toUpperCase() || 'CLIENT'}
${clientInfo.address || ''}

By: _________________________
Name: ${clientInfo.signatoryName || '_________________________'}
Title: ${clientInfo.signatoryTitle || '_________________________'}
Date: _________________________`;

    return documentText + signatureBlock;
  };

  const serviceAgreementPlainText = serviceAgreementBase ? addSignatureBlocksPlainText(serviceAgreementBase, 'agreement') : null;
  const statementOfWorkPlainText = statementOfWorkBase ? addSignatureBlocksPlainText(statementOfWorkBase, 'sow') : null;

  const completeProposalPlainText = serviceAgreementPlainText && statementOfWorkPlainText
    ? `${serviceAgreementPlainText}\n\n${'='.repeat(80)}\n\n${statementOfWorkPlainText}`
    : "Contracts not available. Please regenerate the proposal.";

  return (
    <div className="space-y-6">
      <Card style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <Title level={3} style={{ color: TEXT_PRIMARY }}>Generated Proposal</Title>
            <Text style={{ color: SPACE_COLOR }}>
              Created for {clientInfo.legalName} • Effective {effectiveDate}
            </Text>
          </div>
          <Space>
            <Button 
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(completeProposalPlainText, 'Complete Proposal')}
              style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
            >
              Copy Complete
            </Button>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={() => onExport('html')}
              loading={exportLoading}
              type="primary"
              style={{
                backgroundColor: BRAND_GREEN,
                borderColor: BRAND_GREEN,
                color: '#000000',
                fontWeight: '500'
              }}
            >
              Export & Download Proposal
            </Button>
            <Button 
              type="default" 
              icon={<SaveOutlined />}
              disabled={!savedProposalId}
              style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
            >
              {savedProposalId ? 'Saved' : 'Save Proposal'}
            </Button>
          </Space>
        </div>
      </Card>

      <Card style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
        <Tabs
          activeKey={activeDocTab}
          onChange={(key) => setActiveDocTab(key as 'complete' | 'agreement' | 'sow')}
          type="card"
          items={[
            {
              key: 'complete',
              label: 'Complete Proposal',
              children: (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Title level={4} style={{ color: TEXT_PRIMARY }}>Complete Proposal Document</Title>
                    <Button 
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(completeProposalPlainText, 'Complete Proposal')}
                      size="small"
                      style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                    >
                      Copy Complete
                    </Button>
                  </div>
                  <div 
                    className="border rounded p-6 bg-white"
                    style={{ maxHeight: '600px', overflowY: 'auto', borderColor: SURFACE_LIGHTER }}
                  >
                    {serviceAgreementHTML && (
                      <div dangerouslySetInnerHTML={{ __html: serviceAgreementHTML }} />
                    )}
                    <div style={{ margin: '40px 0', borderTop: '2px solid #000' }}></div>
                    {statementOfWorkHTML && (
                      <div dangerouslySetInnerHTML={{ __html: statementOfWorkHTML }} />
                    )}
                  </div>
                </div>
              ),
            },
            {
              key: 'agreement',
              label: 'Service Agreement',
              children: serviceAgreementHTML ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Title level={4} style={{ color: TEXT_PRIMARY }}>Service Agreement</Title>
                    <Button 
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(serviceAgreementPlainText || '', 'Service Agreement')}
                      size="small"
                      style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                    >
                      Copy Agreement
                    </Button>
                  </div>
                  <div 
                    className="border rounded p-6 bg-white"
                    style={{ maxHeight: '600px', overflowY: 'auto', borderColor: SURFACE_LIGHTER }}
                    dangerouslySetInnerHTML={{ __html: serviceAgreementHTML }}
                  />
                </div>
              ) : (
                <Alert
                  message="Service Agreement Not Available"
                  description="The service agreement could not be generated. Please try regenerating the proposal."
                  type="warning"
                  showIcon
                  style={{ background: 'rgba(250, 173, 20, 0.1)', borderColor: '#faad14' }}
                />
              ),
            },
            {
              key: 'sow',
              label: 'Statement of Work',
              children: statementOfWorkHTML ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Title level={4} style={{ color: TEXT_PRIMARY }}>Statement of Work</Title>
                    <Button 
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(statementOfWorkPlainText || '', 'Statement of Work')}
                      size="small"
                      style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                    >
                      Copy SOW
                    </Button>
                  </div>
                  <div 
                    className="border rounded p-6 bg-white"
                    style={{ maxHeight: '600px', overflowY: 'auto', borderColor: SURFACE_LIGHTER }}
                    dangerouslySetInnerHTML={{ __html: statementOfWorkHTML }}
                  />
                </div>
              ) : (
                <Alert
                  message="Statement of Work Not Available"
                  description="The statement of work could not be generated. Please try regenerating the proposal."
                  type="warning"
                  showIcon
                  style={{ background: 'rgba(250, 173, 20, 0.1)', borderColor: '#faad14' }}
                />
              ),
            },
          ]}
        />
      </Card>

      <Card style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
        <Title level={4} style={{ color: TEXT_PRIMARY }}>Proposal Summary</Title>
        <Divider style={{ borderColor: BORDER_COLOR }} />
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Text strong style={{ color: TEXT_SECONDARY }}>Client:</Text>
            <br />
            <Text style={{ color: TEXT_PRIMARY }}>{clientInfo.legalName}</Text>
          </Col>
          <Col span={12}>
            <Text strong style={{ color: TEXT_SECONDARY }}>Service Provider:</Text>
            <br />
            <Text style={{ color: TEXT_PRIMARY }}>{serviceProvider.name}</Text>
          </Col>
          <Col span={12}>
            <Text strong style={{ color: TEXT_SECONDARY }}>Effective Date:</Text>
            <br />
            <Text style={{ color: TEXT_PRIMARY }}>{effectiveDate}</Text>
          </Col>
          <Col span={12}>
            <Text strong style={{ color: TEXT_SECONDARY }}>Status:</Text>
            <br />
            <Tag color="blue" style={{ background: 'rgba(24, 144, 255, 0.1)', color: '#1890ff' }}>Draft</Tag>
          </Col>
          <Col span={12}>
            <Text strong style={{ color: TEXT_SECONDARY }}>Service Agreement:</Text>
            <br />
            <Tag color={serviceAgreementHTML ? "green" : "red"} 
              style={{ 
                background: serviceAgreementHTML ? 'rgba(82, 196, 26, 0.1)' : 'rgba(255, 77, 79, 0.1)',
                color: serviceAgreementHTML ? '#52c41a' : '#ff4d4f'
              }}
            >
              {serviceAgreementHTML ? "Generated" : "Not Available"}
            </Tag>
          </Col>
          <Col span={12}>
            <Text strong style={{ color: TEXT_SECONDARY }}>Statement of Work:</Text>
            <br />
            <Tag color={statementOfWorkHTML ? "green" : "red"}
              style={{ 
                background: statementOfWorkHTML ? 'rgba(82, 196, 26, 0.1)' : 'rgba(255, 77, 79, 0.1)',
                color: statementOfWorkHTML ? '#52c41a' : '#ff4d4f'
              }}
            >
              {statementOfWorkHTML ? "Generated" : "Not Available"}
            </Tag>
          </Col>
        </Row>
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
      title={<span style={{ color: TEXT_PRIMARY }}>Saved Proposals</span>}
      extra={
        <Button 
          icon={<ReloadOutlined />} 
          onClick={onRefresh} 
          loading={loading}
          style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
        >
          Refresh
        </Button>
      }
      style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
    >
      {loading ? (
        <div className="text-center py-12">

          <ConfigProvider
  theme={{
    token: {
      colorPrimary: '#5CC49D',
    },
  }}
>
     <Spin size="large" tip="Loading proposals..." />
</ConfigProvider>
     
        </div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-12">
          <FileTextOutlined style={{ fontSize: 48, color: SPACE_COLOR }} />
          <Title level={4} style={{ color: SPACE_COLOR, marginTop: 16 }}>
            No Proposals Yet
          </Title>
          <Text style={{ color: SPACE_COLOR }}>
            Your generated proposals will appear here once you save them.
          </Text>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map(proposal => (
            <Card 
              key={proposal.id} 
              size="small" 
              hoverable
              style={{ 
                background: SURFACE_LIGHTER, 
                borderColor: BORDER_COLOR,
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = BRAND_GREEN;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = BORDER_COLOR;
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Title level={5} style={{ color: TEXT_PRIMARY }} className="mb-1">{proposal.title}</Title>
                  <div className="space-x-2 mb-2">
                    <Tag color="blue" style={{ background: 'rgba(24, 144, 255, 0.1)', color: '#1890ff' }}>Service Agreement</Tag>
                    <Tag style={{ background: 'rgba(148, 163, 184, 0.1)', color: TEXT_SECONDARY }}>
                      {proposal.metadata?.industry || 'General'}
                    </Tag>
                  </div>
                  <Text style={{ color: SPACE_COLOR }} className="text-sm">
                    Created {new Date(proposal.createdAt).toLocaleDateString()}
                  </Text>
                </div>
                <Space>
                  <Button 
                    size="small" 
                    icon={<EyeOutlined />}
                    onClick={() => onLoadProposal(proposal.id)}
                    style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' }}
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