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
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  BulbOutlined,
  SettingOutlined,
  ProjectOutlined,
  AuditOutlined,
  ThunderboltOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined
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
  Table,
  Statistic,
  notification,
  Row,
  Col,
  message,
  Spin,
  Modal,
  Tooltip,
  DatePicker,
  InputNumber,
  Switch,
  Collapse,
  List,
  Steps,
  Progress,
  Checkbox
} from "antd";

import { useWorkspaceContext } from '../hooks/useWorkspaceContext';
import { useRouter } from 'next/navigation';
import {
  useProposalCreator,
  useProposalValidation,
  useSavedProposals,
  useProposalExport,
  useProposalTemplates
} from '../hooks/useProposalCreator';
import {
  ProposalInput,
  ProposalType,
  IndustryType,
  ContractLength,
  PricingModel,
  ClientInformation,
  ServiceProvider,
  ProjectScope,
  PricingStructure,
  ProposalTerms,
  ProposalCustomizations,
  Deliverable,
  Milestone,
  ProposalPackage
} from '../../types/proposalCreator';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Step } = Steps;

export default function ProposalGeneratorPage() {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<"inputs" | "preview" | "history">("inputs");
  const [generatedProposal, setGeneratedProposal] = useState<ProposalPackage | null>(null);
  const [savedProposalId, setSavedProposalId] = useState<string | null>(null);
  const [activePanels, setActivePanels] = useState<string[]>(["1", "2", "3", "4", "5", "6"]);
  const [inputsChanged, setInputsChanged] = useState(false);

  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  const router = useRouter();

  // Hook implementations
  const { generateProposal, generating, error: generateError, getProposalInsights } = useProposalCreator();
  const { proposals, loading: proposalsLoading, fetchProposals, deleteProposal, getProposal } = useSavedProposals();
  const { validateProposalProgressive, calculatePricingMetrics } = useProposalValidation();
  const { exportProposal, loading: exportLoading } = useProposalExport();
  const [localError, setLocalError] = useState<string | null>(null);
  const { getIndustryTemplates } = useProposalTemplates();

  // Form state - properly typed
  const [proposalType, setProposalType] = useState<ProposalType>('service-agreement');
  
  const [clientInfo, setClientInfo] = useState<ClientInformation>({
    legalName: "",
    stateOfIncorporation: "",
    entityType: "corporation",
    address: "",
    signatoryName: "",
    signatoryTitle: "",
    industry: "technology",
    companySize: "medium",
    decisionMaker: ""
  });

  const [serviceProvider, setServiceProvider] = useState<ServiceProvider>({
    name: "", // Initialize empty, will be set in useEffect
  legalName: "",
  address: "",
  signatoryName: "",
  signatoryTitle: "",
  businessStructure: "",
  credentials: [],
  specializations: []
});

  const [projectScope, setProjectScope] = useState<ProjectScope>({
    description: "",
    objectives: [],
    deliverables: [],
    timeline: "",
    milestones: [],
    exclusions: [],
    assumptions: [],
    dependencies: []
  });

  const [pricing, setPricing] = useState<PricingStructure>({
    model: "fixed-price",
    totalAmount: 0,
    currency: "USD",
    breakdown: [],
    paymentSchedule: [],
    expensePolicy: "",
    lateFeePercentage: 1.5,
    discounts: []
  });

  const [terms, setTerms] = useState<ProposalTerms>({
    proposalValidityDays: 30,
    contractLength: "one-time",
    terminationNotice: 30,
    intellectualProperty: "work-for-hire",
    confidentiality: true,
    liabilityLimit: 0,
    warranty: "",
    governingLaw: "Delaware",
    disputeResolution: "arbitration",
    forceMarjeure: true,
    amendments: ""
  });

  const [customizations, setCustomizations] = useState<ProposalCustomizations>({
    includeExecutiveSummary: true,
    includeCaseStudies: true,
    includeTeamBios: false,
    includeTestimonials: true,
    includeRiskAssessment: false,
    includeTimeline: true,
    includeNextSteps: true,
    customSections: [],
    branding: {
      useCompanyColors: true,
      includeLogo: true,
      customHeader: "",
      customFooter: "",
      fontStyle: "professional"
    }
  });

const handleTemplateSelect = (templateId: string) => {
  const templates = getIndustryTemplates(clientInfo.industry);
  const template = templates.find(t => t.id === templateId);
  
  if (template) {
    // Since we don't have the actual template data structure,
    // let's create some basic template data based on the template type
    const templateData = generateTemplateData(template);
    
    if (templateData.client) {
      setClientInfo(prev => ({ ...prev, ...templateData.client }));
    }
    if (templateData.project) {
      setProjectScope(prev => ({ ...prev, ...templateData.project }));
    }
    if (templateData.pricing) {
      setPricing(prev => ({ ...prev, ...templateData.pricing }));
    }
    
    message.success(`Template "${template.name}" applied successfully!`);
  }
};

// Add this helper function
const generateTemplateData = (template: { id: string; name: string; description: string; proposalType: ProposalType }) => {
  // Create basic template data based on proposal type and industry
  const baseTemplateData = {
    client: {
      industry: clientInfo.industry,
      companySize: 'medium' as const,
      entityType: 'corporation' as const
    },
    project: {
      objectives: getDefaultObjectives(template.proposalType, clientInfo.industry),
      timeline: getDefaultTimeline(template.proposalType),
      deliverables: getDefaultDeliverables(template.proposalType)
    },
    pricing: {
      model: getDefaultPricingModel(template.proposalType),
      totalAmount: getDefaultAmount(template.proposalType, clientInfo.industry)
    }
  };
  
  return baseTemplateData;
};

// Helper functions for template defaults
const getDefaultObjectives = (proposalType: ProposalType, industry: IndustryType): string[] => {
  const objectiveMap: Record<ProposalType, Record<IndustryType, string[]>> = {
    'service-agreement': {
      'technology': ['Implement scalable technical solution', 'Improve system performance', 'Enhance security protocols'],
      'healthcare': ['Improve patient outcomes', 'Ensure regulatory compliance', 'Streamline operations'],
      'finance': ['Enhance financial reporting', 'Improve risk management', 'Ensure compliance'],
      'consulting': ['Optimize business processes', 'Improve operational efficiency', 'Drive strategic growth'],
      'marketing': ['Increase brand awareness', 'Generate qualified leads', 'Improve conversion rates'],
      'ecommerce': ['Increase online sales', 'Improve customer experience', 'Optimize conversion funnel'],
      'manufacturing': ['Improve production efficiency', 'Reduce operational costs', 'Enhance quality control'],
      'real-estate': ['Improve property value', 'Enhance market positioning', 'Streamline transactions'],
      'education': ['Improve learning outcomes', 'Enhance student engagement', 'Modernize curriculum'],
      'other': ['Achieve business objectives', 'Improve operational efficiency', 'Drive measurable results']
    },
    'project-proposal': {
      'technology': ['Deliver technical project on time and budget', 'Meet all functional requirements', 'Provide comprehensive documentation'],
      'healthcare': ['Complete project within compliance requirements', 'Ensure patient safety standards', 'Deliver measurable improvements'],
      'finance': ['Meet regulatory requirements', 'Improve financial processes', 'Deliver secure solution'],
      'consulting': ['Complete strategic analysis', 'Provide actionable recommendations', 'Enable successful implementation'],
      'marketing': ['Launch successful campaign', 'Achieve target metrics', 'Build brand recognition'],
      'ecommerce': ['Launch new online platform', 'Integrate payment systems', 'Optimize for mobile'],
      'manufacturing': ['Implement new system', 'Improve production capacity', 'Reduce waste and costs'],
      'real-estate': ['Complete property development', 'Meet zoning requirements', 'Achieve target returns'],
      'education': ['Implement new program', 'Train staff effectively', 'Measure learning outcomes'],
      'other': ['Complete project deliverables', 'Meet quality standards', 'Deliver on time and budget']
    },
    'retainer-agreement': {
      'technology': ['Provide ongoing technical support', 'Monitor system performance', 'Implement regular updates'],
      'healthcare': ['Ongoing compliance monitoring', 'Regular system maintenance', 'Continuous improvement'],
      'finance': ['Monthly financial analysis', 'Regular compliance review', 'Ongoing risk assessment'],
      'consulting': ['Strategic guidance', 'Monthly business reviews', 'Continuous optimization'],
      'marketing': ['Ongoing campaign management', 'Monthly performance analysis', 'Continuous optimization'],
      'ecommerce': ['Monthly platform optimization', 'Performance monitoring', 'Ongoing support'],
      'manufacturing': ['Regular process optimization', 'Monthly performance review', 'Continuous improvement'],
      'real-estate': ['Ongoing market analysis', 'Regular portfolio review', 'Investment optimization'],
      'education': ['Monthly program review', 'Ongoing curriculum support', 'Performance monitoring'],
      'other': ['Regular strategic review', 'Ongoing optimization', 'Monthly performance analysis']
    },
    'consulting-proposal': {
      'technology': ['Analyze current technical architecture', 'Recommend optimization strategies', 'Create implementation roadmap'],
      'healthcare': ['Assess current operations', 'Identify improvement opportunities', 'Develop compliance strategy'],
      'finance': ['Review financial processes', 'Identify risk factors', 'Recommend improvements'],
      'consulting': ['Conduct business analysis', 'Develop strategic recommendations', 'Create action plan'],
      'marketing': ['Analyze current marketing effectiveness', 'Develop marketing strategy', 'Create implementation plan'],
      'ecommerce': ['Assess online performance', 'Identify growth opportunities', 'Optimize customer journey'],
      'manufacturing': ['Analyze production processes', 'Identify efficiency gains', 'Develop improvement plan'],
      'real-estate': ['Market analysis', 'Investment strategy development', 'Risk assessment'],
      'education': ['Assess current programs', 'Identify improvement areas', 'Develop enhancement plan'],
      'other': ['Comprehensive business analysis', 'Strategic recommendations', 'Implementation roadmap']
    },
    'custom-proposal': {
      'technology': ['Custom technical requirements', 'Specialized implementation', 'Tailored solution delivery'],
      'healthcare': ['Custom healthcare solution', 'Specialized compliance requirements', 'Tailored patient outcomes'],
      'finance': ['Custom financial solution', 'Specialized regulatory compliance', 'Tailored risk management'],
      'consulting': ['Customized business solution', 'Specialized strategic guidance', 'Tailored implementation'],
      'marketing': ['Custom marketing strategy', 'Specialized campaign approach', 'Tailored brand solutions'],
      'ecommerce': ['Custom e-commerce solution', 'Specialized platform needs', 'Tailored customer experience'],
      'manufacturing': ['Custom production solution', 'Specialized manufacturing needs', 'Tailored efficiency gains'],
      'real-estate': ['Custom real estate solution', 'Specialized market approach', 'Tailored investment strategy'],
      'education': ['Custom educational solution', 'Specialized learning approach', 'Tailored curriculum'],
      'other': ['Custom business solution', 'Specialized requirements', 'Tailored approach']
    }
  };
  
  return objectiveMap[proposalType]?.[industry] || objectiveMap[proposalType]?.['other'] || ['Achieve project objectives', 'Deliver quality results'];
};

const getDefaultTimeline = (proposalType: ProposalType): string => {
  const timelineMap: Record<ProposalType, string> = {
    'service-agreement': '6-8 weeks',
    'project-proposal': '8-12 weeks',
    'retainer-agreement': 'Ongoing monthly',
    'consulting-proposal': '4-6 weeks',
    'custom-proposal': '8-10 weeks'
  };
  
  return timelineMap[proposalType] || '8-10 weeks';
};

const getDefaultDeliverables = (proposalType: ProposalType): any[] => {
  const deliverableMap: Record<ProposalType, any[]> = {
    'service-agreement': [
      { name: 'Service Delivery', description: 'Complete professional service as specified', format: 'Service', quantity: 1, acceptanceCriteria: ['Client approval', 'Quality standards met'] }
    ],
    'project-proposal': [
      { name: 'Project Deliverable', description: 'Primary project outcome', format: 'Document', quantity: 1, acceptanceCriteria: ['Functional requirements met', 'Client acceptance'] },
      { name: 'Documentation', description: 'Project documentation and user guides', format: 'Document', quantity: 1, acceptanceCriteria: ['Complete documentation', 'Training materials'] }
    ],
    'retainer-agreement': [
      { name: 'Monthly Services', description: 'Ongoing monthly advisory services', format: 'Service', quantity: 12, acceptanceCriteria: ['Monthly deliveries', 'Performance standards'] }
    ],
    'consulting-proposal': [
      { name: 'Analysis Report', description: 'Comprehensive business analysis', format: 'Report', quantity: 1, acceptanceCriteria: ['Thorough analysis', 'Actionable recommendations'] },
      { name: 'Strategic Recommendations', description: 'Implementation roadmap and next steps', format: 'Presentation', quantity: 1, acceptanceCriteria: ['Clear action items', 'Timeline provided'] }
    ],
    'custom-proposal': [
      { name: 'Custom Solution', description: 'Tailored solution for specific requirements', format: 'Custom', quantity: 1, acceptanceCriteria: ['Requirements met', 'Quality standards'] }
    ]
  };
  
  return deliverableMap[proposalType] || [];
};

const getDefaultPricingModel = (proposalType: ProposalType): PricingModel => {
  const pricingMap: Record<ProposalType, PricingModel> = {
    'service-agreement': 'fixed-price',
    'project-proposal': 'milestone-based',
    'retainer-agreement': 'retainer',
    'consulting-proposal': 'value-based',
    'custom-proposal': 'fixed-price'
  };
  
  return pricingMap[proposalType] || 'fixed-price';
};

const getDefaultAmount = (proposalType: ProposalType, industry: IndustryType): number => {
  const baseAmounts: Record<ProposalType, number> = {
    'service-agreement': 15000,
    'project-proposal': 25000,
    'retainer-agreement': 5000, // Monthly
    'consulting-proposal': 35000,
    'custom-proposal': 20000
  };
  
  const industryMultipliers: Record<IndustryType, number> = {
    'technology': 1.3,
    'healthcare': 1.4,
    'finance': 1.5,
    'consulting': 1.2,
    'marketing': 1.0,
    'ecommerce': 1.1,
    'manufacturing': 1.2,
    'real-estate': 1.1,
    'education': 0.8,
    'other': 1.0
  };
  
  const baseAmount = baseAmounts[proposalType] || 15000;
  const multiplier = industryMultipliers[industry] || 1.0;
  
  return Math.round(baseAmount * multiplier);
};

// Complete Proposal Tab - combines everything

  // Load proposals on mount
  useEffect(() => {
    if (isWorkspaceReady && currentWorkspace) {
      fetchProposals();
    }
  }, [isWorkspaceReady, currentWorkspace?.id]);

  // Update service provider when workspace changes
// useEffect(() => {
//   if (currentWorkspace) {
//     setServiceProvider(prev => ({
//       ...prev,
//       name: currentWorkspace?.name || "",
//       legalName: (currentWorkspace as any)?.legalName || "",
//       address: (currentWorkspace as any)?.address || "",
//       signatoryName: (currentWorkspace as any)?.signatoryName || "",
//       signatoryTitle: (currentWorkspace as any)?.signatoryTitle || ""
//     }));
//   }
// }, [currentWorkspace]);


  // Create complete input object
  const completeInput: Partial<ProposalInput> = useMemo(() => {
    return {
      proposalType,
      client: clientInfo,
      serviceProvider,
      project: projectScope,
      pricing,
      terms,
      customizations,
      workspaceId: currentWorkspace?.id || '',
      userId: '' // Will be set by API
    };
  }, [proposalType, clientInfo, serviceProvider, projectScope, pricing, terms, customizations, currentWorkspace?.id]);

  // Validation results
  const validationResults = useMemo(() => {
    return validateProposalProgressive(completeInput);
  }, [completeInput, validateProposalProgressive]);

  // Pricing metrics
  const pricingMetrics = useMemo(() => {
    if (!pricing.totalAmount || !projectScope.deliverables?.length) return null;
    return calculatePricingMetrics(completeInput as ProposalInput);
  }, [pricing, projectScope, calculatePricingMetrics, completeInput]);

  // Proposal insights
  const proposalInsights = useMemo(() => {
    if (!completeInput.client || !completeInput.project || !completeInput.pricing) return null;
    return getProposalInsights(completeInput as ProposalInput);
  }, [completeInput, getProposalInsights]);

  // Workspace validation
  if (!isWorkspaceReady) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <Spin size="large" tip="Loading workspace..." />
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
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
    if (generatedProposal) {
      setInputsChanged(true);
    }

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
      case 'pricing':
        setPricing(prev => ({ ...prev, [field]: value }));
        break;
      case 'terms':
        setTerms(prev => ({ ...prev, [field]: value }));
        break;
      case 'customizations':
        setCustomizations(prev => ({ ...prev, [field]: value }));
        break;
    }
  };


  

  const addDeliverable = () => {
    const newDeliverable: Deliverable = {
      name: "",
      description: "",
      format: "Document",
      quantity: 1,
      acceptanceCriteria: [""]
    };
    setProjectScope(prev => ({
      ...prev,
      deliverables: [...prev.deliverables, newDeliverable]
    }));
  };

  const removeDeliverable = (index: number) => {
    setProjectScope(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index)
    }));
  };

  const updateDeliverable = (index: number, field: keyof Deliverable, value: any) => {
    setProjectScope(prev => ({
      ...prev,
      deliverables: prev.deliverables.map((del, i) => 
        i === index ? { ...del, [field]: value } : del
      )
    }));
  };

  const addMilestone = () => {
    const newMilestone: Milestone = {
      name: "",
      description: "",
      dueDate: "",
      deliverables: [],
      acceptanceCriteria: [""]
    };
    setProjectScope(prev => ({
      ...prev,
      milestones: [...prev.milestones, newMilestone]
    }));
  };

  const removeMilestone = (index: number) => {
    setProjectScope(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const updateMilestone = (index: number, field: keyof Milestone, value: any) => {
    setProjectScope(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) => 
        i === index ? { ...milestone, [field]: value } : milestone
      )
    }));
  };

  const onFinish = async () => {
    try {
      const fullValidation = validateProposalProgressive(completeInput, true);
      if (!fullValidation.isReadyToGenerate) {
        message.error("Please complete essential fields before generating");
        return;
      }

      console.log('🚀 Generating proposal with input:', completeInput);

      const result = await generateProposal(completeInput as ProposalInput);

      if (result) {
        setGeneratedProposal(result.proposal);
        setSavedProposalId(result.proposalId);
        setActiveTab("preview");
        await fetchProposals();
        
        notification.success({
          message: "Proposal Generated Successfully",
          description: `Your professional proposal is ready for review.`,
          duration: 5,
        });
      }
    } catch (error) {
      console.error("Generation error:", error);
      message.error("Failed to generate proposal. Please try again.");
    }
  };

  const handleClearAll = () => {
    setGeneratedProposal(null);
    setSavedProposalId(null);
    setInputsChanged(false);
    
    // Reset all form state
    setProposalType('service-agreement');
    setClientInfo({
      legalName: "",
      stateOfIncorporation: "",
      entityType: "corporation",
      address: "",
      signatoryName: "",
      signatoryTitle: "",
      industry: "technology",
      companySize: "medium",
      decisionMaker: ""
    });
    setProjectScope({
      description: "",
      objectives: [],
      deliverables: [],
      timeline: "",
      milestones: [],
      exclusions: [],
      assumptions: [],
      dependencies: []
    });
    setPricing({
      model: "fixed-price",
      totalAmount: 0,
      currency: "USD",
      breakdown: [],
      paymentSchedule: [],
      expensePolicy: "",
      lateFeePercentage: 1.5,
      discounts: []
    });
    
    setActiveTab("inputs");
    message.success("All fields cleared successfully!");
  };

  const handleExport = async (format: 'json' | 'html') => {
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
      if (proposalData && proposalData.proposal) {
        const originalInput = proposalData.proposal.originalInput;
        
        if (originalInput) {
          setProposalType(originalInput.proposalType || 'service-agreement');
          setClientInfo(originalInput.client || clientInfo);
          setServiceProvider(originalInput.serviceProvider || serviceProvider);
          setProjectScope(originalInput.project || projectScope);
          setPricing(originalInput.pricing || pricing);
          setTerms(originalInput.terms || terms);
          setCustomizations(originalInput.customizations || customizations);
        }
        
        setGeneratedProposal(proposalData.proposal);
        setSavedProposalId(proposalId);
        setActiveTab("preview");
        
        message.success("Proposal loaded successfully");
      } else {
        message.error("Proposal data not found");
      }
    } catch (error) {
      console.error("Load proposal error:", error);
      message.error("Failed to load proposal");
    }
  };

  const isFormValid = validationResults.isReadyToGenerate;
  const hasMinimumData = clientInfo.legalName && projectScope.description && pricing.totalAmount > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={handleBack}
        className="mb-4"
      >
        Back to Workspace
      </Button>

      <div className="text-center mb-8">
        <Title level={2} className="flex items-center justify-center">
          <AuditOutlined className="mr-2" />
          Professional Proposal Generator
        </Title>
        <Text type="secondary" className="text-lg">
          Create comprehensive business proposals with AI-powered contract generation
        </Text>
      </div>

    {(generateError || localError) && (
  <div className="mb-4">
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
  size="large"
  items={[
    {
      key: "inputs",
      label: (
        <span>
          <EditOutlined />
          Proposal Details
          {!isFormValid && hasMinimumData && <Badge dot style={{ marginLeft: 8 }} />}
        </span>
      ),
    },
    {
      key: "preview",
      label: (
        <span>
          <EyeOutlined />
          Generated Proposal
          {generatedProposal && <Badge dot style={{ marginLeft: 8 }} />}
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
          <Badge count={proposals.length} style={{ marginLeft: 8 }} />
        </span>
      ),
    },
  ]}
/>

      {activeTab === "inputs" && (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card title="Proposal Configuration" className="mb-6">
              <Form form={form} layout="vertical">
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Proposal Type">
                      <Select
                        value={proposalType}
                        onChange={(value) => setProposalType(value)}
                        size="large"
                      >
                        <Option value="service-agreement">Service Agreement</Option>
                        <Option value="project-proposal">Project Proposal</Option>
                        <Option value="retainer-agreement">Retainer Agreement</Option>
                        <Option value="consulting-proposal">Consulting Proposal</Option>
                        <Option value="custom-proposal">Custom Proposal</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Contract Length">
                      <Select
                        value={terms.contractLength}
                        onChange={(value) => handleInputChange('terms', 'contractLength', value)}
                        size="large"
                      >
                        <Option value="one-time">One-time Project</Option>
                        <Option value="monthly">Monthly</Option>
                        <Option value="3-months">3 Months</Option>
                        <Option value="6-months">6 Months</Option>
                        <Option value="annual">Annual</Option>
                        <Option value="ongoing">Ongoing</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Card>

            <Card title="Quick Start Templates" className="mb-6">
        <Select
          placeholder="Choose a template for your industry"
          style={{ width: '100%' }}
          onChange={handleTemplateSelect}
        >
          {getIndustryTemplates(clientInfo.industry).map(template => (
            <Option key={template.id} value={template.id}>
              {template.name} - {template.description}
            </Option>
          ))}
        </Select>
      </Card>

                 <Collapse activeKey={activePanels} onChange={setActivePanels} bordered={false} className="mb-6">
              <Panel
                header={
                  <div className="flex items-center">
                    <UserOutlined className="mr-2" />
                    <span className="font-medium">Client Information</span>
                    {validationResults.errors['client.legalName'] && 
                     <Badge status="error" style={{ marginLeft: 8 }} />}
                  </div>
                }
                key="1"
                extra={<Badge status="processing" text="Required" />}
              >
                <Row gutter={16}>
                  <Col span={12}>
                  <Form.Item label="Client Legal Name" required>
  <Input 
    value={clientInfo.legalName}
    onChange={(e) => handleInputChange('client', 'legalName', e.target.value)}
    placeholder="ABC Corporation Inc."
  />
</Form.Item>

                  </Col>
                  <Col span={12}>
                    <Form.Item label="Industry">
                      <Select
                        value={clientInfo.industry}
                        onChange={(value) => handleInputChange('client', 'industry', value)}
                      >
                        <Option value="technology">Technology</Option>
                        <Option value="healthcare">Healthcare</Option>
                        <Option value="finance">Finance</Option>
                        <Option value="marketing">Marketing</Option>
                        <Option value="consulting">Consulting</Option>
                        <Option value="ecommerce">E-commerce</Option>
                        <Option value="manufacturing">Manufacturing</Option>
                        <Option value="real-estate">Real Estate</Option>
                        <Option value="education">Education</Option>
                        <Option value="other">Other</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Company Size">
                      <Select
                        value={clientInfo.companySize}
                        onChange={(value) => handleInputChange('client', 'companySize', value)}
                      >
                        <Option value="startup">Startup (1-10)</Option>
                        <Option value="small">Small (11-50)</Option>
                        <Option value="medium">Medium (51-200)</Option>
                        <Option value="enterprise">Enterprise (200+)</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="State of Incorporation">
                      <Input 
                        value={clientInfo.stateOfIncorporation}
                        onChange={(e) => handleInputChange('client', 'stateOfIncorporation', e.target.value)}
                        placeholder="Delaware"
                      />
                    </Form.Item>
                  </Col>
                </Row>

<Form.Item label="Client Address (recommended)"> {/* Removed required */}
  <TextArea 
    rows={2}
    value={clientInfo.address}
    onChange={(e) => handleInputChange('client', 'address', e.target.value)}
    placeholder="Auto-filled if left blank"
  />
</Form.Item>


                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Authorized Signatory Name" required>
                      <Input 
                        value={clientInfo.signatoryName}
                        onChange={(e) => handleInputChange('client', 'signatoryName', e.target.value)}
                        placeholder="John Smith"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Signatory Title" required>
                      <Input 
                        value={clientInfo.signatoryTitle}
                        onChange={(e) => handleInputChange('client', 'signatoryTitle', e.target.value)}
                        placeholder="CEO"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Panel>
<Panel
  header={
    <div className="flex items-center">
      <ProjectOutlined className="mr-2" />
      <span className="font-medium">Service Provider (Your Company)</span>
      {validationResults.errors['serviceProvider.name'] && 
       <Badge status="error" style={{ marginLeft: 8 }} />}
    </div>
  }
  key="2"
  extra={<Badge status="processing" text="Required" />}
>

                <Row gutter={16}>
                 <Col span={12}>
      <Form.Item label="Company Name" required>
        <Input 
          value={serviceProvider.name}
          onChange={(e) => handleInputChange('serviceProvider', 'name', e.target.value)}
          placeholder="Your Company Name"
        />
      </Form.Item>
    </Col>
                  <Col span={12}>
                    <Form.Item label="Legal Name">
                      <Input 
                        value={serviceProvider.legalName}
                        onChange={(e) => handleInputChange('serviceProvider', 'legalName', e.target.value)}
                        placeholder="Your Company Legal Name LLC"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="Business Address">
                  <TextArea 
                    rows={2}
                    value={serviceProvider.address}
                    onChange={(e) => handleInputChange('serviceProvider', 'address', e.target.value)}
                    placeholder="456 Service St, Suite 200, City, State 12345"
                  />
                </Form.Item>

                <Form.Item label="Specializations">
                  <Select
                    mode="tags"
                    value={serviceProvider.specializations}
                    onChange={(value) => handleInputChange('serviceProvider', 'specializations', value)}
                    placeholder="Add your key specializations"
                  />
                </Form.Item>

                <Form.Item label="Credentials & Certifications">
                  <Select
                    mode="tags"
                    value={serviceProvider.credentials}
                    onChange={(value) => handleInputChange('serviceProvider', 'credentials', value)}
                    placeholder="Add relevant credentials and certifications"
                  />
                </Form.Item>
              </Panel>

              <Panel
                header={
                  <div className="flex items-center">
                    <ProjectOutlined className="mr-2" />
                    <span className="font-medium">Project Scope & Deliverables</span>
                    {validationResults.errors['project.description'] && 
                     <Badge status="error" style={{ marginLeft: 8 }} />}
                  </div>
                }
                key="3"
                extra={<Badge status="processing" text="Required" />}
              >

             <Form.Item label="Project Description" required>
  <TextArea 
    rows={4}
    value={projectScope.description}
    onChange={(e) => handleInputChange('project', 'description', e.target.value)}
    placeholder="Describe the project objectives, scope, and expected outcomes (minimum 20 characters)"
    showCount
    minLength={20}
  />
</Form.Item>


                <Form.Item label="Project Objectives">
                  <Select
                    mode="tags"
                    value={projectScope.objectives}
                    onChange={(value) => handleInputChange('project', 'objectives', value)}
                    placeholder="Add specific project objectives"
                  />
                </Form.Item>

          
<Divider>Deliverables (optional - basic deliverable will be auto-created)</Divider>
{projectScope.deliverables.map((deliverable, index) => (
  <Card key={index} size="small" className="mb-4">
    <div className="flex justify-between items-start mb-4">
      <Title level={5}>Deliverable {index + 1}</Title>
      <Button 
        type="text" 
        danger 
        icon={<DeleteOutlined />}
        onClick={() => removeDeliverable(index)}
      />
    </div>
    
    {/* Simplified deliverable form */}
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="Name">
          <Input 
            value={deliverable.name}
            onChange={(e) => updateDeliverable(index, 'name', e.target.value)}
            placeholder="Brief deliverable name"
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="Description">
          <Input 
            value={deliverable.description}
            onChange={(e) => updateDeliverable(index, 'description', e.target.value)}
            placeholder="What will be delivered"
          />
        </Form.Item>
      </Col>
    </Row>
    
    {/* Optional: Keep format field but make it simpler */}
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item label="Format (optional)">
          <Select
            value={deliverable.format}
            onChange={(value) => updateDeliverable(index, 'format', value)}
            placeholder="Document type"
            allowClear
          >
            <Option value="Document">Document</Option>
            <Option value="Presentation">Presentation</Option>
            <Option value="Report">Report</Option>
            <Option value="Website">Website</Option>
            <Option value="Application">Application</Option>
            <Option value="Other">Other</Option>
          </Select>
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="Quantity (optional)">
          <InputNumber
            value={deliverable.quantity}
            onChange={(value) => updateDeliverable(index, 'quantity', value || 1)}
            min={1}
            style={{ width: '100%' }}
            placeholder="1"
          />
        </Form.Item>
      </Col>
    </Row>
  </Card>
))}

<Button 
  type="dashed" 
  onClick={addDeliverable}
  className="w-full mb-4"
  icon={<EditOutlined />}
>
  Add Deliverable (Optional)
</Button>

{/* Add helpful tip */}
<Alert
  message="Pro Tip"
  description="Add your deliverables here. If you leave this blank, we’ll suggest professional deliverables based on your project description."
  type="info"
  showIcon
  className="mb-4"
/>

                <Row gutter={16}>

                 <Col span={12}>
  <Form.Item label="Project Timeline">
    <Input 
      value={projectScope.timeline}
      onChange={(e) => handleInputChange('project', 'timeline', e.target.value)}
      placeholder="e.g., 12 weeks, 3 months, Q2 2024"
    />
  </Form.Item>
</Col>
<Col span={12}>
  <Form.Item label="Project Exclusions">
    <Select
      mode="tags"
      value={projectScope.exclusions}
      onChange={(value) => handleInputChange('project', 'exclusions', value)}
      placeholder="What's NOT included"
    />
  </Form.Item>
</Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Assumptions">
                      <Select
                        mode="tags"
                        value={projectScope.assumptions}
                        onChange={(value) => handleInputChange('project', 'assumptions', value)}
                        placeholder="Project assumptions"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Dependencies">
                      <Select
                        mode="tags"
                        value={projectScope.dependencies}
                        onChange={(value) => handleInputChange('project', 'dependencies', value)}
                        placeholder="External dependencies"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider>Project Milestones</Divider>
                {projectScope.milestones.map((milestone, index) => (
                  <Card key={index} size="small" className="mb-4">
                    <div className="flex justify-between items-start mb-4">
                      <Title level={5}>Milestone {index + 1}</Title>
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />}
                        onClick={() => removeMilestone(index)}
                      />
                    </div>
                    
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="Name">
                          <Input 
                            value={milestone.name}
                            onChange={(e) => updateMilestone(index, 'name', e.target.value)}
                            placeholder="Milestone name"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="Due Date">
                          <Input 
                            value={milestone.dueDate}
                            onChange={(e) => updateMilestone(index, 'dueDate', e.target.value)}
                            placeholder="e.g., Week 4, March 15"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    
                    <Form.Item label="Description">
                      <TextArea 
                        rows={2}
                        value={milestone.description}
                        onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                        placeholder="Milestone description and criteria"
                      />
                    </Form.Item>
                    
                    <Form.Item label="Acceptance Criteria">
                      <Select
                        mode="tags"
                        value={milestone.acceptanceCriteria}
                        onChange={(value) => updateMilestone(index, 'acceptanceCriteria', value)}
                        placeholder="Add acceptance criteria for this milestone"
                      />
                    </Form.Item>
                  </Card>
                ))}
                
                <Button 
                  type="dashed" 
                  onClick={addMilestone}
                  className="w-full"
                  icon={<CalendarOutlined />}
                >
                  Add Milestone
                </Button>
              </Panel>

              <Panel
                header={
                  <div className="flex items-center">
                    <DollarOutlined className="mr-2" />
                    <span className="font-medium">Pricing & Payment Structure</span>
                    {validationResults.errors['pricing.totalAmount'] && 
                     <Badge status="error" style={{ marginLeft: 8 }} />}
                  </div>
                }
                key="4"
                extra={<Badge status="processing" text="Required" />}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Pricing Model" required>
                      <Select
                        value={pricing.model}
                        onChange={(value) => handleInputChange('pricing', 'model', value)}
                      >
                        <Option value="fixed-price">Fixed Price</Option>
                        <Option value="hourly-rate">Hourly Rate</Option>
                        <Option value="milestone-based">Milestone-Based</Option>
                        <Option value="value-based">Value-Based</Option>
                        <Option value="retainer">Retainer</Option>
                        <Option value="hybrid">Hybrid Model</Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                  <Form.Item label="Total Amount" required>
  <InputNumber
    value={pricing.totalAmount}
    onChange={(value) => handleInputChange('pricing', 'totalAmount', value || 0)}
    formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
    parser={(value) => Number(value?.replace(/\$\s?|(,*)/g, '') || 0)}
    style={{ width: '100%' }}
    min={100}
    step={1000}
  />
</Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Currency">
                      <Select
                        value={pricing.currency}
                        onChange={(value) => handleInputChange('pricing', 'currency', value)}
                      >
                        <Option value="USD">USD ($)</Option>
                        <Option value="EUR">EUR (€)</Option>
                        <Option value="GBP">GBP (£)</Option>
                        <Option value="CAD">CAD (C$)</Option>
                        <Option value="AUD">AUD (A$)</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Late Fee Percentage">
                      <InputNumber
                        value={pricing.lateFeePercentage}
                        onChange={(value) => handleInputChange('pricing', 'lateFeePercentage', value || 1.5)}
                        formatter={(value) => `${value}%`}
                        parser={(value) => Number(value?.replace('%', '') || 1.5)}
                        style={{ width: '100%' }}
                        min={0}
                        max={10}
                        step={0.5}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="Expense Policy">
                  <TextArea 
                    rows={2}
                    value={pricing.expensePolicy}
                    onChange={(e) => handleInputChange('pricing', 'expensePolicy', e.target.value)}
                    placeholder="Client reimburses pre-approved expenses exceeding $500..."
                  />
                </Form.Item>

                <Divider>Payment Schedule</Divider>
                <Text type="secondary" className="block mb-4">
                  Define when payments are due. This will be incorporated into your contract.
                </Text>
                
                {pricing.paymentSchedule.map((payment, index) => (
                  <Card key={index} size="small" className="mb-4">
                    <div className="flex justify-between items-start mb-4">
                      <Title level={5}>Payment {index + 1}</Title>
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />}
                        onClick={() => {
                          const newSchedule = pricing.paymentSchedule.filter((_, i) => i !== index);
                          handleInputChange('pricing', 'paymentSchedule', newSchedule);
                        }}
                      />
                    </div>
                    
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item label="Description">
                          <Input 
                            value={payment.description}
                            onChange={(e) => {
                              const newSchedule = [...pricing.paymentSchedule];
                              newSchedule[index] = { ...payment, description: e.target.value };
                              handleInputChange('pricing', 'paymentSchedule', newSchedule);
                            }}
                            placeholder="e.g., Upfront, Milestone 1"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="Amount">
                          <InputNumber
                            value={payment.amount}
                            onChange={(value) => {
                              const newSchedule = [...pricing.paymentSchedule];
                              newSchedule[index] = { ...payment, amount: value || 0 };
                              handleInputChange('pricing', 'paymentSchedule', newSchedule);
                            }}
                            formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={(value) => Number(value?.replace(/\$\s?|(,*)/g, '') || 0)}
                            style={{ width: '100%' }}
                            min={0}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="Due Date">
                          <Input 
                            value={payment.dueDate}
                            onChange={(e) => {
                              const newSchedule = [...pricing.paymentSchedule];
                              newSchedule[index] = { ...payment, dueDate: e.target.value };
                              handleInputChange('pricing', 'paymentSchedule', newSchedule);
                            }}
                            placeholder="Upon signing, Week 4"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                
                <Button 
                  type="dashed" 
                  onClick={() => {
                    const newPayment = {
                      description: "",
                      amount: 0,
                      dueDate: "",
                      conditions: [],
                      status: "pending" as const
                    };
                    handleInputChange('pricing', 'paymentSchedule', [...pricing.paymentSchedule, newPayment]);
                  }}
                  className="w-full"
                  icon={<DollarOutlined />}
                >
                  Add Payment
                </Button>
              </Panel>

              <Panel
                header={
                  <div className="flex items-center">
                    <SafetyCertificateOutlined className="mr-2" />
                    <span className="font-medium">Terms & Legal Conditions</span>
                  </div>
                }
                key="5"
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Proposal Validity (Days)">
                      <InputNumber
                        value={terms.proposalValidityDays}
                        onChange={(value) => handleInputChange('terms', 'proposalValidityDays', value || 30)}
                        style={{ width: '100%' }}
                        min={1}
                        max={365}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Termination Notice (Days)">
                      <InputNumber
                        value={terms.terminationNotice}
                        onChange={(value) => handleInputChange('terms', 'terminationNotice', value || 30)}
                        style={{ width: '100%' }}
                        min={1}
                        max={180}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Intellectual Property Rights">
                      <Select
                        value={terms.intellectualProperty}
                        onChange={(value) => handleInputChange('terms', 'intellectualProperty', value)}
                      >
                        <Option value="work-for-hire">Work for Hire (Client Owns)</Option>
                        <Option value="client-owns">Client Owns Upon Payment</Option>
                        <Option value="service-provider-owns">Service Provider Retains</Option>
                        <Option value="shared">Shared Ownership</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Liability Limit">
                      <InputNumber
                        value={terms.liabilityLimit}
                        onChange={(value) => handleInputChange('terms', 'liabilityLimit', value || 0)}
                        formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => Number(value?.replace(/\$\s?|(,*)/g, '') || 0)}
                        style={{ width: '100%' }}
                        min={0}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Governing Law">
                      <Select
                        value={terms.governingLaw}
                        onChange={(value) => handleInputChange('terms', 'governingLaw', value)}
                      >
                        <Option value="Delaware">Delaware</Option>
                        <Option value="California">California</Option>
                        <Option value="New York">New York</Option>
                        <Option value="Texas">Texas</Option>
                        <Option value="Florida">Florida</Option>
                        <Option value="Illinois">Illinois</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Dispute Resolution">
                      <Select
                        value={terms.disputeResolution}
                        onChange={(value) => handleInputChange('terms', 'disputeResolution', value)}
                      >
                        <Option value="arbitration">Arbitration</Option>
                        <Option value="mediation">Mediation</Option>
                    

                        <Option value="litigation">Litigation</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item label="Warranty Terms">
                  <TextArea 
                    rows={2}
                    value={terms.warranty}
                    onChange={(e) => handleInputChange('terms', 'warranty', e.target.value)}
                    placeholder="Service Provider warrants professional performance..."
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Confidentiality">
                      <Switch
                        checked={terms.confidentiality}
                        onChange={(checked) => handleInputChange('terms', 'confidentiality', checked)}
                      />
                      <Text className="ml-2">Include confidentiality clause</Text>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Force Majeure">
                      <Switch
                        checked={terms.forceMarjeure}
                        onChange={(checked) => handleInputChange('terms', 'forceMarjeure', checked)}
                      />
                      <Text className="ml-2">Include force majeure clause</Text>
                    </Form.Item>
                  </Col>
                </Row>
              </Panel>

              <Panel
                header={
                  <div className="flex items-center">
                    <SettingOutlined className="mr-2" />
                    <span className="font-medium">Customizations & Branding</span>
                  </div>
                }
                key="6"
              >
                <Title level={5}>Document Sections</Title>
                <Row gutter={16}>
                  <Col span={12}>
                    <Checkbox
                      checked={customizations.includeExecutiveSummary}
                      onChange={(e) => handleInputChange('customizations', 'includeExecutiveSummary', e.target.checked)}
                    >
                      Executive Summary
                    </Checkbox>
                  </Col>
                  <Col span={12}>
                    <Checkbox
                      checked={customizations.includeCaseStudies}
                      onChange={(e) => handleInputChange('customizations', 'includeCaseStudies', e.target.checked)}
                    >
                      Case Studies
                    </Checkbox>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Checkbox
                      checked={customizations.includeTeamBios}
                      onChange={(e) => handleInputChange('customizations', 'includeTeamBios', e.target.checked)}
                    >
                      Team Biographies
                    </Checkbox>
                  </Col>
                  <Col span={12}>
                    <Checkbox
                      checked={customizations.includeTestimonials}
                      onChange={(e) => handleInputChange('customizations', 'includeTestimonials', e.target.checked)}
                    >
                      Client Testimonials
                    </Checkbox>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Checkbox
                      checked={customizations.includeRiskAssessment}
                      onChange={(e) => handleInputChange('customizations', 'includeRiskAssessment', e.target.checked)}
                    >
                      Risk Assessment
                    </Checkbox>
                  </Col>
                  <Col span={12}>
                    <Checkbox
                      checked={customizations.includeTimeline}
                      onChange={(e) => handleInputChange('customizations', 'includeTimeline', e.target.checked)}
                    >
                      Project Timeline
                    </Checkbox>
                  </Col>
                </Row>

                <Divider />

                <Title level={5}>Branding Options</Title>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label="Font Style">
                      <Select
                        value={customizations.branding.fontStyle}
                        onChange={(value) => handleInputChange('customizations', 'branding', {
                          ...customizations.branding,
                          fontStyle: value
                        })}
                      >
                        <Option value="professional">Professional</Option>
                        <Option value="modern">Modern</Option>
                        <Option value="classic">Classic</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Company Colors">
                      <Switch
                        checked={customizations.branding.useCompanyColors}
                        onChange={(checked) => handleInputChange('customizations', 'branding', {
                          ...customizations.branding,
                          useCompanyColors: checked
                        })}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Include Logo">
                      <Switch
                        checked={customizations.branding.includeLogo}
                        onChange={(checked) => handleInputChange('customizations', 'branding', {
                          ...customizations.branding,
                          includeLogo: checked
                        })}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Panel>
            </Collapse>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Generation Controls" className="mb-6">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button 
  type="primary" 
  size="large" 
  icon={<ThunderboltOutlined />}
  onClick={onFinish}
  loading={generating}
  disabled={!validationResults.isReadyToGenerate} // Changed from isFormValid
  block
       style={{
    backgroundColor: '#5CC49D',
    borderColor: '#5CC49D',
    color: '#000000',
    fontWeight: '500'
  }}
>
  {generating ? 'Generating...' : 'Generate Proposal'}
</Button>


{validationResults.isReadyToGenerate && !validationResults.isValid && (
  <Alert
    message="Auto-Fill Active"
    description="Missing optional fields will be automatically filled with professional defaults during generation."
    type="info"
    showIcon
    className="mb-4"
  />
)}

                
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={handleClearAll}
                  disabled={generating}
                  block
                >
                  Clear All Fields
                </Button>

                {generatedProposal && (
                  <Button 
                    icon={<EyeOutlined />}
                    onClick={() => setActiveTab('preview')}
                    block
                  >
                    View Generated Proposal
                  </Button>
                )}
              </Space>

              {inputsChanged && generatedProposal && (
                <Alert
                  message="Inputs Changed"
                  description="You've made changes since generating. Regenerate to update the proposal."
                  type="info"
                  showIcon
                  className="mt-4"
                />
              )}

            </Card>
<Card title="Validation Status" className="mb-6">
  <div className="mb-4">
    <Progress 
      percent={validationResults.completionPercentage} 
      status={validationResults.isValid ? "success" : validationResults.isReadyToGenerate ? "active" : "exception"}
      strokeColor={validationResults.isValid ? "#52c41a" : validationResults.isReadyToGenerate ? "#1890ff" : "#ff4d4f"}
    />
    <Text type="secondary" className="text-sm">
      {validationResults.completedFields}/{validationResults.totalRequiredFields} essential fields completed
    </Text>
  </div>

             
  <div className="space-y-2">
    {/* **UPDATED: Only show critical errors** */}
    {Object.entries(validationResults.errors).length > 0 && (
      <div>
        <Text type="danger" strong>Required:</Text>
        {Object.entries(validationResults.errors).map(([field, error]) => (
          <div key={field} className="flex items-start mt-1">
            <ExclamationCircleOutlined className="text-red-500 mr-1 mt-1" />
            <Text type="danger" className="text-sm">{error}</Text>
          </div>
        ))}
      </div>
    )}

        {Object.entries(validationResults.warnings).length > 0 && (
      <div>
        <Text type="warning" strong>Suggestions:</Text>
        {Object.entries(validationResults.warnings).map(([field, warning]) => (
          <div key={field} className="flex items-start mt-1">
            <InfoCircleOutlined className="text-orange-500 mr-1 mt-1" />
            <Text type="warning" className="text-sm">{warning}</Text>
          </div>
        ))}
      </div>
    )}


  {validationResults.isReadyToGenerate && (
      <div className="flex items-center text-green-600">
        <CheckCircleOutlined className="mr-1" />
        <Text type="success">Ready to generate! Optional fields will be auto-filled.</Text>
      </div>
    )}
  </div>
</Card>


            <Card title="Proposal Summary" className="mb-6">
              <div className="space-y-3">
                <Statistic
                  title="Total Value"
                  value={pricing.totalAmount}
                  precision={2}
                  prefix="$"
                  valueStyle={{ color: '#3f8600' }}
                />
                
                <Divider />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Text type="secondary">Type:</Text>
                    <Tag color="blue">{proposalType.replace('-', ' ').toUpperCase()}</Tag>
                  </div>
                  
                  <div className="flex justify-between">
                    <Text type="secondary">Client:</Text>
                    <Text>{clientInfo.legalName || 'Not specified'}</Text>
                  </div>
                  
                  <div className="flex justify-between">
                    <Text type="secondary">Timeline:</Text>
                    <Text>{projectScope.timeline || 'Not specified'}</Text>
                  </div>
                  
                  <div className="flex justify-between">
                    <Text type="secondary">Deliverables:</Text>
                    <Text>{projectScope.deliverables.length}</Text>
                  </div>
                  
                  <div className="flex justify-between">
                    <Text type="secondary">Model:</Text>
                    <Tag>{pricing.model.replace('-', ' ')}</Tag>
                  </div>
                </div>
              </div>
            </Card>

            {pricingMetrics && (
              <Card title="Pricing Analysis" className="mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Text type="secondary">Per Deliverable:</Text>
                    <Text strong>${pricingMetrics.pricePerDeliverable.toLocaleString()}</Text>
                  </div>
                  
                  <div className="flex justify-between">
                    <Text type="secondary">Weekly Rate:</Text>
                    <Text strong>${pricingMetrics.weeklyRate.toLocaleString()}</Text>
                  </div>
                  
                  <div className="flex justify-between">
                    <Text type="secondary">Upfront:</Text>
                    <Text strong>{pricingMetrics.upfrontPercentage}%</Text>
                  </div>
                </div>
                
                <Divider />
                
                <div className="space-y-1">
                  <Text strong className="text-sm">Recommendations:</Text>
                  <div className="text-xs text-gray-600">
                    <div>• {pricingMetrics.recommendations.pricePerDeliverable}</div>
                    <div>• {pricingMetrics.recommendations.paymentStructure}</div>
                  </div>
                </div>
              </Card>
            )}

          {proposalInsights && (
  <Card title="Business Insights" className="mb-6">
    <div className="space-y-3">
      {proposalInsights.strengths.length > 0 && (
        <div>
          <Text strong className="text-green-600">Strengths:</Text>
          <ul className="text-sm mt-1 space-y-1">
            {proposalInsights.strengths.map((strength, index) => (
              <li key={index} className="text-green-600">• {strength}</li>
            ))}
          </ul>
        </div>
      )}

                  
                {proposalInsights.weaknesses.length > 0 && (
        <div>
          <Text strong className="text-orange-600">Areas to Improve:</Text>
          <ul className="text-sm mt-1 space-y-1">
            {proposalInsights.weaknesses.map((weakness, index) => (
              <li key={index} className="text-orange-600">• {weakness}</li>
            ))}
          </ul>
        </div>
      )}
               
                 {proposalInsights.recommendations.length > 0 && (
        <div>
          <Text strong className="text-purple-600">Recommendations:</Text>
          <ul className="text-sm mt-1 space-y-1">
            {proposalInsights.recommendations.map((rec, index) => (
              <li key={index} className="text-purple-600">• {rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  </Card>
)}

          </Col>
        </Row>
      )}

      {activeTab === "preview" && generatedProposal && (
        <ProposalPreview 
          proposal={generatedProposal}
          clientInfo={clientInfo}
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


function CompleteProposalTab({ 
  proposal, 
  copyToClipboard 
}: { 
  proposal: ProposalPackage;
  copyToClipboard: (content: string, type: string) => void;
}) {
  const generateCompleteProposal = () => {
    const sections = [
      "=".repeat(60),
      "BUSINESS PROPOSAL",
      "=".repeat(60),
      "",
      "EXECUTIVE SUMMARY",
      "-".repeat(30),
      proposal.proposal.executiveSummary || "Executive summary not included in this proposal.",
      "",
      "PROJECT OVERVIEW",
      "-".repeat(30),
      proposal.proposal.projectOverview,
      "",
      "SCOPE OF WORK",
      "-".repeat(30),
      proposal.proposal.scopeOfWork,
      "",
      "DELIVERABLES",
      "-".repeat(30),
      proposal.proposal.deliverables,
      "",
      "TIMELINE & MILESTONES",
      "-".repeat(30),
      proposal.proposal.timeline,
      "",
      "INVESTMENT & PRICING",
      "-".repeat(30),
      proposal.proposal.pricing,
      "",
      "TERMS & CONDITIONS",
      "-".repeat(30),
      proposal.proposal.terms,
      "",
      "NEXT STEPS",
      "-".repeat(30),
      proposal.proposal.nextSteps,
      "",
      "=".repeat(60),
      "LEGAL CONTRACTS",
      "=".repeat(60),
      "",
      "SERVICE AGREEMENT",
      "-".repeat(30),
      proposal.proposal.contractTemplates.serviceAgreement,
      "",
      "=".repeat(60),
      "",
      "STATEMENT OF WORK",
      "-".repeat(30),
      proposal.proposal.contractTemplates.statementOfWork,
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
            onClick={() => copyToClipboard(completeProposalText, 'Complete Proposal')}
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
              link.download = `proposal-${Date.now()}.txt`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              message.success('Proposal downloaded as text file!');
            }}
          >
            Download as Text
          </Button>
        </Space>
      </div>
      
      <Alert
        message="Complete Proposal Ready"
        description="This document contains your full business proposal including executive summary, project details, pricing, terms, service agreement, and statement of work. Perfect for sending to clients or saving as a complete reference."
        type="info"
        showIcon
        className="mb-4"
      />

      <div className=" p-6 rounded border">
        <div className="font-mono text-sm whitespace-pre-wrap overflow-auto max-h-[600px] border  p-4 rounded">
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
}


// Proposal Preview Component
function ProposalPreview({ 
  proposal, 
  clientInfo, 
  onExport,
  savedProposalId,
  exportLoading
}: { 
  proposal: ProposalPackage;
  clientInfo: ClientInformation;
  onExport: (format: 'json' | 'html') => void;
  savedProposalId: string | null;
  exportLoading: boolean;
}) {

const [activeSection, setActiveSection] = useState<'overview' | 'complete' | 'agreement' | 'sow' | 'analysis'>('overview');

  const copyToClipboard = (content: string, type: string) => {
    navigator.clipboard.writeText(content).then(() => {
      message.success(`${type} copied to clipboard!`);
    });
  };



  const getDocumentTitle = (proposalType: ProposalType) => {
  const titles = {
    'service-agreement': 'Service Agreement',
    'project-proposal': 'Project Proposal', 
    'retainer-agreement': 'Retainer Agreement',
    'consulting-proposal': 'Consulting Proposal',
    'custom-proposal': 'Custom Proposal'
  };
  return titles[proposalType] || 'Service Agreement';
};

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <Title level={3}>Generated Proposal</Title>
            <Text type="secondary">
              Created for {clientInfo.legalName} • 
              Win Probability: <Tag color="green">{proposal.analysis.winProbability.score}%</Tag> •
              Risk Level: <Tag color={proposal.analysis.riskLevel === 'low' ? 'green' : proposal.analysis.riskLevel === 'medium' ? 'orange' : 'red'}>
                {proposal.analysis.riskLevel.toUpperCase()}
              </Tag>
            </Text>
          </div>
          <Space>
            <Button 
              icon={<CopyOutlined />} 
              onClick={() => copyToClipboard(JSON.stringify(proposal, null, 2), 'Proposal data')}
            >
              Copy JSON
            </Button>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={() => onExport('html')}
              loading={exportLoading}
            >
              Export HTML
            </Button>
            <Button 
              type="primary" 
              icon={<SaveOutlined />}
              disabled={!savedProposalId}
            >
              {savedProposalId ? 'Saved' : 'Save Proposal'}
            </Button>
          </Space>
        </div>
      </Card>

    

      <Tabs
        activeKey={activeSection}
        onChange={setActiveSection as any}
        type="card"
        items={[
          {
            key: 'overview',
            label: 'Executive Overview',
            children: <ProposalOverviewTab proposal={proposal} />,
          },
          {
            key: 'agreement',
              label: getDocumentTitle(proposal.originalInput.proposalType), // Dynamic title
            children: <ServiceAgreementTab proposal={proposal} copyToClipboard={copyToClipboard} />,
          },
          {
            key: 'sow',
            label: 'Statement of Work',
            children: <StatementOfWorkTab proposal={proposal} copyToClipboard={copyToClipboard} />,
          },
            {
      key: 'complete', // ADD THIS NEW TAB
      label: 'Complete Proposal',
      children: <CompleteProposalTab proposal={proposal} copyToClipboard={copyToClipboard} />,
    },
          {
            key: 'analysis',
            label: 'Analysis & Insights',
            children: <AnalysisTab proposal={proposal} />,
          },
        ]}

        
      />

         {proposal.alternativeOptions?.length > 0 && (
        <Card title="Alternative Options" className="mb-6">
          {proposal.alternativeOptions.map((option, index) => (
            <Card key={index} size="small" className="mb-4">
              <Title level={5} className="text-blue-600">{option.title}</Title>
              <Paragraph className="text-sm">{option.description}</Paragraph>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Price Adjustment: </Text>
                  <Tag color={option.pricingAdjustment < 0 ? 'green' : 'orange'}>
                    {option.pricingAdjustment > 0 ? '+' : ''}{(option.pricingAdjustment * 100).toFixed(0)}%
                  </Tag>
                </Col>
                <Col span={12}>
                  <Text strong>Timeline: </Text>
                  <Text>{option.timelineAdjustment}</Text>
                </Col>
              </Row>
              
              <Divider />
              
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong className="text-green-600">Pros:</Text>
                  <ul className="text-sm">
                    {option.pros.map((pro, i) => <li key={i}>• {pro}</li>)}
                  </ul>
                </Col>
                <Col span={12}>
                  <Text strong className="text-orange-600">Cons:</Text>
                  <ul className="text-sm">
                    {option.cons.map((con, i) => <li key={i}>• {con}</li>)}
                  </ul>
                </Col>
              </Row>
            </Card>
          ))}
        </Card>
      )}
    </div>
  );
}

// Proposal Overview Tab
function ProposalOverviewTab({ proposal }: { proposal: ProposalPackage }) {
  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} md={12}>
        <Card title="Project Overview" size="small">
          <Paragraph>
            {proposal.proposal.projectOverview}
          </Paragraph>
        </Card>
      </Col>
      
      <Col xs={24} md={12}>
        <Card title="Key Metrics" size="small">
          <div className="space-y-3">
            <Statistic
              title="Win Probability"
              value={proposal.analysis.winProbability.score}
              suffix="%"
              valueStyle={{ color: proposal.analysis.winProbability.score >= 70 ? '#3f8600' : '#cf1322' }}
            />
            <Divider />
            <div className="text-sm space-y-1">
              <div><Text strong>Risk Level:</Text> {proposal.analysis.riskLevel}</div>
              <div><Text strong>Pricing Position:</Text> {proposal.analysis.pricingAnalysis.competitiveness}</div>
              <div><Text strong>Tokens Used:</Text> {proposal.tokensUsed.toLocaleString()}</div>
              <div><Text strong>Generation Time:</Text> {(proposal.generationTime / 1000).toFixed(2)}s</div>
            </div>
          </div>
        </Card>
      </Col>

      <Col xs={24}>
        {/* <Card title="Executive Summary" size="small">
          <Paragraph>
            {proposal.proposal.executiveSummary || "Executive summary not included in this proposal."}
          </Paragraph>
        </Card> */}
      </Col>

      <Col xs={24}>
        <Card title="Scope of Work" size="small">
          <div className="whitespace-pre-wrap">
            {proposal.proposal.scopeOfWork}
          </div>
        </Card>
      </Col>

      <Col xs={24}>
        <Card title="Investment & Timeline" size="small">
          <Row gutter={16}>
            <Col span={12}>
              <Title level={5}>Pricing</Title>
              <div className="whitespace-pre-wrap">
                {proposal.proposal.pricing}
              </div>
            </Col>
            <Col span={12}>
              <Title level={5}>Timeline</Title>
              <div className="whitespace-pre-wrap">
                {proposal.proposal.timeline}
              </div>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );
}

// Service Agreement Tab
function ServiceAgreementTab({ 
  proposal, 
  copyToClipboard 
}: { 
  proposal: ProposalPackage;
  copyToClipboard: (content: string, type: string) => void;
}) {
  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <Title level={4}>Service Agreement</Title>
        <Button 
          icon={<CopyOutlined />}
          onClick={() => copyToClipboard(proposal.proposal.contractTemplates.serviceAgreement, 'Service Agreement')}
        >
          Copy Agreement
        </Button>
      </div>
      <div className=" p-4 rounded border font-mono text-sm whitespace-pre-wrap overflow-auto max-h-96">
        {proposal.proposal.contractTemplates.serviceAgreement}
      </div>
    </Card>
  );
}

// Statement of Work Tab
function StatementOfWorkTab({ 
  proposal, 
  copyToClipboard 
}: { 
  proposal: ProposalPackage;
  copyToClipboard: (content: string, type: string) => void;
}) {
  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <Title level={4}>Statement of Work</Title>
        <Button 
          icon={<CopyOutlined />}
          onClick={() => copyToClipboard(proposal.proposal.contractTemplates.statementOfWork, 'Statement of Work')}
        >
          Copy SOW
        </Button>
      </div>
      <div className=" p-4 rounded border font-mono text-sm whitespace-pre-wrap overflow-auto max-h-96">
        {proposal.proposal.contractTemplates.statementOfWork}
      </div>
    </Card>
  );
}

// Fix 6: Update the analysis tab to remove references to non-existent properties
function AnalysisTab({ proposal }: { proposal: ProposalPackage }) {
  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} md={12}>
        <Card title="Win Probability Analysis" size="small">
          <div className="mb-4">
            <Progress 
              percent={proposal.analysis.winProbability.score} 
              status={proposal.analysis.winProbability.score >= 70 ? "success" : "active"}
              strokeColor={proposal.analysis.winProbability.score >= 70 ? "#52c41a" : "#1890ff"}
            />
          </div>
          
          <div className="space-y-2">
            {proposal.analysis.winProbability.factors.map((factor, index) => (
              <div key={index} className="flex justify-between items-start">
                <div className="flex-1">
                  <Text strong>{factor.factor}</Text>
                  <div className="text-sm text-gray-600">{factor.description}</div>
                </div>
                <Tag color={factor.impact === 'High' ? 'red' : factor.impact === 'Medium' ? 'orange' : 'green'}>
                  {factor.impact}
                </Tag>
              </div>
            ))}
          </div>
        </Card>
      </Col>

      <Col xs={24} md={12}>
        <Card title="Pricing Analysis" size="small">
          <div className="space-y-3">
            <div>
              <Text strong>Competitiveness: </Text>
              <Tag color={
                proposal.analysis.pricingAnalysis.competitiveness === 'competitive' ? 'green' :
                proposal.analysis.pricingAnalysis.competitiveness === 'premium' ? 'orange' : 'red'
              }>
                {proposal.analysis.pricingAnalysis.competitiveness.toUpperCase()}
              </Tag>
            </div>
            
            <div>
              <Text strong>Value Justification:</Text>
              <Paragraph className="text-sm mt-1">
                {proposal.analysis.pricingAnalysis.valueJustification}
              </Paragraph>
            </div>
            
            <div>
              <Text strong>Recommendations:</Text>
              <ul className="text-sm mt-1 space-y-1">
                {proposal.analysis.pricingAnalysis.recommendations.map((rec, index) => (
                  <li key={index}>• {rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </Col>

      <Col xs={24}>
        <Card title="Strengths & Improvement Areas" size="small">
          <Row gutter={16}>
            <Col span={12}>
              <Title level={5} className="text-green-600">Strengths</Title>
              <ul className="text-sm space-y-1">
                {proposal.analysis.strengthsWeaknesses.strengths.map((strength, index) => (
                  <li key={index} className="text-green-600">• {strength}</li>
                ))}
              </ul>
            </Col>
            
            <Col span={12}>
              <Title level={5} className="text-orange-600">Weaknesses</Title>
              <ul className="text-sm space-y-1">
                {proposal.analysis.strengthsWeaknesses.weaknesses.map((weakness, index) => (
                  <li key={index} className="text-orange-600">• {weakness}</li>
                ))}
              </ul>
            </Col>
          </Row>
          
          <Row gutter={16} className="mt-4">
            <Col span={24}>
              <Title level={5} className="text-blue-600">Improvements</Title>
              <ul className="text-sm space-y-1">
                {proposal.analysis.strengthsWeaknesses.improvements.map((improvement, index) => (
                  <li key={index} className="text-blue-600">• {improvement}</li>
                ))}
              </ul>
            </Col>
          </Row>
        </Card>
      </Col>

      <Col xs={24}>
        <Card title="Recommendations" size="small">
          <List
            dataSource={proposal.recommendations}
            renderItem={(item, index) => (
              <List.Item>
                <div className="flex items-start">
                  <BulbOutlined className="text-yellow-500 mr-2 mt-1" />
                  <Text>{item}</Text>
                </div>
              </List.Item>
            )}
          />
        </Card>
      </Col>
         {proposal.riskAssessment && (
        <Col xs={24}>
          <Card title="Risk Assessment" size="small">
            <div className="space-y-3">
              <div>
                <Text strong>Overall Risk: </Text>
                <Tag color={
                  proposal.riskAssessment?.overallRisk === 'low' ? 'green' :
                  proposal.riskAssessment?.overallRisk === 'high' ? 'red' : 'orange'
                }>
                  {proposal.riskAssessment?.overallRisk?.toUpperCase()}
                </Tag>
              </div>
              
              {proposal.riskAssessment?.mitigationPlan && (
                <div>
                  <Text strong>Mitigation Strategies:</Text>
                  <ul className="text-sm mt-1 space-y-1">
                    {proposal.riskAssessment.mitigationPlan.map((strategy, index) => (
                      <li key={index}>• {strategy}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        </Col>
      )}

      {/* ADD COMPETITIVE ANALYSIS HERE TOO */}
      {proposal.competitiveAnalysis && (
        <Col xs={24}>
          <Card title="Competitive Analysis" size="small">
            <Row gutter={16}>
              <Col span={8}>
                <Title level={5} className="text-green-600">Positioning Advantages</Title>
                <ul className="text-sm space-y-1">
                  {proposal.competitiveAnalysis.positioningAdvantages.map((advantage, index) => (
                    <li key={index} className="text-green-600">• {advantage}</li>
                  ))}
                </ul>
              </Col>
              <Col span={8}>
                <Title level={5} className="text-orange-600">Potential Challenges</Title>
                <ul className="text-sm space-y-1">
                  {proposal.competitiveAnalysis.potentialChallenges.map((challenge, index) => (
                    <li key={index} className="text-orange-600">• {challenge}</li>
                  ))}
                </ul>
              </Col>
              <Col span={8}>
                <Title level={5} className="text-blue-600">Differentiation Points</Title>
                <ul className="text-sm space-y-1">
                  {proposal.competitiveAnalysis.differentiationPoints.map((point, index) => (
                    <li key={index} className="text-blue-600">• {point}</li>
                  ))}
                </ul>
              </Col>
            </Row>
          </Card>
        </Col>
      )}
    </Row>
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
                    <Tag color="blue">{proposal.proposalType.replace('-', ' ')}</Tag>
                    <Tag color="green">${proposal.totalValue.toLocaleString()}</Tag>
                    <Tag>{proposal.metadata.industry}</Tag>
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