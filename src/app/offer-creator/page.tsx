"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ThunderboltOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  RocketOutlined,
  FileTextOutlined,
  CopyOutlined,
  DownloadOutlined,
  BulbOutlined,
  SaveOutlined,
  HistoryOutlined,
  EyeOutlined,
  EditOutlined,
  UserOutlined,
  ShopOutlined,
  SettingOutlined,
  GlobalOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Typography,
  Divider,
  Radio,
  Space,
  Tag,
  Badge,
  Collapse,
  Tabs,
  Alert,
  Table,
  Statistic,
  Progress,
  notification,
  Row,
  Col,
  message,
  Steps,
  Spin,
  Empty,
  Tooltip,
  Modal,
  ConfigProvider,
  theme,
} from "antd";

// Import the hooks and types
import {
  useOfferCreator,
  useSavedOffers,
  useOfferValidation,
  useOfferExport,
  type OfferCreatorInput,
  type GeneratedOfferPackage,
  type UserOffer,
} from "../hooks/useOfferCreator";

import { useWorkspaceContext } from '../hooks/useWorkspaceContext';
import { useRouter } from 'next/navigation';

import {
  FounderInputs,
  MarketInputs,
  BusinessInputs,
  PricingInputs,
  VoiceInputs,
  GeneratedOffer,
  LivePreview,
  SignatureOffer,
  calculateLivePreview,
} from "@/types/offerCreator";
import LoadingOverlay from './LoadingOverlay'

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Step } = Steps;

// Color constants
const SPACE_COLOR = '#9DA2B3';
const BRAND_GREEN = '#5CC49D';
const DARK_BG = '#0f172a';
const SURFACE_BG = '#1e293b';
const SURFACE_LIGHTER = '#334155';
const TEXT_PRIMARY = '#f1f5f9';
const TEXT_SECONDARY = '#94a3b8';
const BORDER_COLOR = '#334155';

export default function OfferCreatorPage() {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<"inputs" | "outputs" | "history">("inputs");
  const [generatedOffer, setGeneratedOffer] = useState<GeneratedOfferPackage | null>(null);
  const [savedOfferId, setSavedOfferId] = useState<string | null>(null);
  const [activePanels, setActivePanels] = useState<string[]>(["1", "2", "3", "4", "5"]);
  const [inputsChanged, setInputsChanged] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  const router = useRouter();

  // Hook implementations
  const { generateOffer, generating, error: generateError, getBusinessInsights } = useOfferCreator();
  const { offers, loading: offersLoading, fetchOffers, deleteOffer, getOffer } = useSavedOffers();
  const { validateInput, validateInputProgressive, getOfferInsights, calculateCapacityMetrics } = useOfferValidation();
  const { exportOffer, loading: exportLoading } = useOfferExport();

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

  // Form sections initialized empty
  const [founderInputs, setFounderInputs] = useState<FounderInputs>({
    signatureResults: [],
    coreStrengths: [],
    processes: [],
    industries: [],
    proofAssets: [],
  });

  const [marketInputs, setMarketInputs] = useState<MarketInputs>({
    targetMarket: "",
    buyerRole: "",
    pains: [],
    outcomes: [],
  });

  const [businessInputs, setBusinessInputs] = useState<BusinessInputs>({
    deliveryModel: [],
    capacity: "",
    monthlyHours: "",
    acv: "",
    acvPeriod: "monthly", 
    fulfillmentStack: [],
  });

  const [pricingInputs, setPricingInputs] = useState<PricingInputs>({
    pricePosture: "value-priced",
    contractStyle: "month-to-month",
    guarantee: "none",
  });

  const [voiceInputs, setVoiceInputs] = useState<VoiceInputs>({
    brandTone: "consultative",
    positioning: "ROI",
    differentiators: [],
  });

  // Load saved offers on component mount
  useEffect(() => {
    if (isWorkspaceReady && currentWorkspace) {
      fetchOffers();
    }
  }, [isWorkspaceReady, currentWorkspace?.id]);

  useEffect(() => {
    const handleWorkspaceChange = () => {
      if (currentWorkspace) {
        fetchOffers();
      }
    };

    window.addEventListener('workspaceChanged', handleWorkspaceChange);
    return () => window.removeEventListener('workspaceChanged', handleWorkspaceChange);
  }, [currentWorkspace]);

  // Fix the tab change handler type issue
  const handleTabChange = (activeKey: string) => {
    setActiveTab(activeKey as "inputs" | "outputs" | "history");
  };

  // Create the complete input object for validation and submission
  const completeInput: Partial<OfferCreatorInput> = useMemo(() => {
    return {
      founder: founderInputs,
      market: marketInputs,
      business: businessInputs,
      pricing: pricingInputs,
      voice: voiceInputs,
    };
  }, [founderInputs, marketInputs, businessInputs, pricingInputs, voiceInputs]);

  // Live preview calculation using the imported function
  const livePreview = useMemo<LivePreview | null>(() => {
    return calculateLivePreview({
      founder: founderInputs,
      market: marketInputs,
      business: businessInputs,
      pricing: pricingInputs,
      voice: voiceInputs,
    });
  }, [founderInputs, marketInputs, businessInputs, pricingInputs, voiceInputs]);

  // Validation results
  const validationResults = useMemo(() => {
    return validateInputProgressive(completeInput);
  }, [completeInput, validateInputProgressive]);

  // Business insights
  const businessInsights = useMemo(() => {
    if (!completeInput.founder || !completeInput.market || !completeInput.business || 
        !completeInput.pricing || !completeInput.voice) {
      return null;
    }
    return getBusinessInsights(completeInput as OfferCreatorInput);
  }, [completeInput, getBusinessInsights]);

  // Capacity metrics
  const capacityMetrics = useMemo(() => {
    if (!completeInput.founder || !completeInput.market || !completeInput.business || 
        !completeInput.pricing || !completeInput.voice) {
      return null;
    }
    return calculateCapacityMetrics(completeInput as OfferCreatorInput);
  }, [completeInput, calculateCapacityMetrics]);

  // ADD WORKSPACE VALIDATION (same as other components)
  if (!isWorkspaceReady) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <Spin size="large" tip="Loading workspace.." />
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Alert
          message="Workspace Required"
          description="The offer creator must be accessed from within a workspace. Please navigate to a workspace first."
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

  const isLoading = generating;

  const onFinish = async () => {
    try {
      const fullValidation = validateInputProgressive(completeInput, true);
      if (!fullValidation.isReadyToGenerate) {
        message.error("Please complete essential fields before generating");
        return;
      }
      
      const offerInput: Partial<OfferCreatorInput> = {
        founder: founderInputs,
        market: marketInputs,
        business: businessInputs,
        pricing: pricingInputs,
        voice: voiceInputs,
      };

      console.log("🚀 Generating signature offers with input:", offerInput);

      const result = await generateOffer(offerInput as unknown as OfferCreatorInput);

      if (result) {
        setGeneratedOffer(result.offer);
        setSavedOfferId(result.offerId);
        setActiveTab("outputs");
        await fetchOffers();
        
        notification.success({
          message: "Signature Offers Generated Successfully",
          description: `Your offers have been generated and saved to your history.`,
          duration: 5,
        });
      }
    } catch (error) {
      console.error("Generation error:", error);
      message.error("Failed to generate offers. Please try again.");
    }
  };

  const hasValidOfferStructure = (offer: GeneratedOfferPackage | null): boolean => {
    return !!(
      offer?.signatureOffers?.starter &&
      offer?.signatureOffers?.core &&
      offer?.signatureOffers?.premium &&
      offer?.pricing
    );
  };

  const handleBack = () => {
    router.push(`/dashboard/${currentWorkspace?.slug}`);
  };

  const handleInputChange = (
    section: "founder" | "market" | "business" | "pricing" | "voice",
    field: string,
    value: any
  ) => {
    if (generatedOffer) {
      setInputsChanged(true);
    }

    switch (section) {
      case "founder":
        setFounderInputs((prev) => ({ ...prev, [field]: value }));
        break;
      case "market":
        setMarketInputs((prev) => ({ ...prev, [field]: value }));
        break;
      case "business":
        setBusinessInputs((prev) => ({ ...prev, [field]: value }));
        break;
      case "pricing":
        setPricingInputs((prev) => ({ ...prev, [field]: value }));
        break;
      case "voice":
        setVoiceInputs((prev) => ({ ...prev, [field]: value }));
        break;
      default:
        break;
    }
  };

  const handleClearAll = () => {
    setGeneratedOffer(null);
    setSavedOfferId(null);
    setInputsChanged(false);
    
    setTimeout(() => {
      setFounderInputs({
        signatureResults: [],
        coreStrengths: [],
        processes: [],
        industries: [],
        proofAssets: [],
      });
      
      setMarketInputs({
        targetMarket: "",
        buyerRole: "",
        pains: [],
        outcomes: [],
      });
      
      setBusinessInputs({
        deliveryModel: [],
        capacity: "",
        monthlyHours: "",
        acv: "",
        acvPeriod: "monthly",
        fulfillmentStack: [],
      });
      
      setPricingInputs({
        pricePosture: "value-priced",
        contractStyle: "month-to-month",
        guarantee: "none",
      });
      
      setVoiceInputs({
        brandTone: "consultative",
        positioning: "ROI",
        differentiators: [],
      });
    }, 50);
    
    setActiveTab("inputs");
    message.success("All fields cleared successfully!");
  };

  const handleExport = async (format: 'json' | 'html') => {
    if (!savedOfferId) {
      message.error("No offer to export. Please generate an offer first.");
      return;
    }

    try {
      await exportOffer(savedOfferId, format);
    } catch (error) {
      console.error("Export error:", error);
      message.error(`Failed to export as ${format.toUpperCase()}`);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    Modal.confirm({
      title: "Delete Offer",
      content: "Are you sure you want to delete this offer? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        const success = await deleteOffer(offerId);
        if (success) {
          if (savedOfferId === offerId) {
            setGeneratedOffer(null);
            setSavedOfferId(null);
            setActiveTab("inputs");
          }
        }
      },
    });
  };

  const handleLoadOffer = async (offerId: string) => {
    try {
      const offerData = await getOffer(offerId);
      if (offerData && offerData.offer) {
        const offerContent = offerData.offer;
        
        if (offerContent.originalInput) {
          const input = offerContent.originalInput;
          setFounderInputs(input.founder || {
            signatureResults: [],
            coreStrengths: [],
            processes: [],
            industries: [],
            proofAssets: [],
          });
          setMarketInputs(input.market || {
            targetMarket: "",
            buyerRole: "",
            pains: [],
            outcomes: [],
          });
          setBusinessInputs({
            deliveryModel: input.business?.deliveryModel || [],
            capacity: input.business?.capacity || "",
            monthlyHours: input.business?.monthlyHours || "",
            acv: input.business?.acv || "",
            acvPeriod: input.business?.acvPeriod || "monthly",
            fulfillmentStack: input.business?.fulfillmentStack || [],
          });
          setPricingInputs(input.pricing || {
            pricePosture: "value-priced",
            contractStyle: "month-to-month",
            guarantee: "none",
          });
          setVoiceInputs(input.voice || {
            brandTone: "consultative",
            positioning: "ROI",
            differentiators: [],
          });
        }
        
        setGeneratedOffer(offerContent);
        setSavedOfferId(offerId);
        setActiveTab("outputs");
        
        message.success("Offer loaded successfully");
      } else {
        message.error("Offer data not found");
      }
    } catch (error) {
      console.error("Load offer error:", error);
      message.error("Failed to load offer");
    }
  };

  const isFormValid = validationResults.isReadyToGenerate;
  const hasMinimumData = founderInputs.signatureResults.length > 0 && 
                        marketInputs.targetMarket && 
                        businessInputs.deliveryModel.length > 0;

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
            borderColor: SURFACE_LIGHTER,
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
          Radio: {
            buttonSolidCheckedColor: '#000',
            buttonSolidCheckedBg: BRAND_GREEN,
            colorBorder: BORDER_COLOR,
            colorPrimary: BRAND_GREEN,
            colorPrimaryHover: BRAND_GREEN,
          },
          Progress: {
            defaultColor: BRAND_GREEN,
            colorSuccess: BRAND_GREEN,
            remainingColor: SURFACE_LIGHTER,
          },
          Table: {
            headerBg: SURFACE_LIGHTER,
            headerColor: TEXT_PRIMARY,
            rowHoverBg: '#2d3748',
            colorBgContainer: SURFACE_BG,
            borderColor: BORDER_COLOR,
          }
        }
      }}
    >
      <div className="min-h-screen bg-gray-900 font-manrope">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <LoadingOverlay visible={isLoading} onComplete={() => setShowOverlay(false)} />
          
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
            className="mb-4 hover:text-white border-none shadow-none px-0"
            style={{ background: 'transparent', color: SPACE_COLOR }}
          >
            Back
          </Button>

          <div className="text-center mb-8">
            <Title level={2} className="flex items-center justify-center" style={{ color: TEXT_PRIMARY }}>
              <span style={{
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 600,
                fontSize: '18px',
              }}>
                <span style={{ color: BRAND_GREEN }}>a</span>rb
                <span style={{ color: BRAND_GREEN }}>i</span>trageOS Signature Offer Creator
              </span>
            </Title>
            <Text style={{ color: SPACE_COLOR }} className="text-lg">
              Transform your expertise into compelling signature offers that sell themselves
            </Text>
          </div>

          {/* Show generation error if any */}
          {generateError && (
            <div className="mb-4">
              <Card style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
                <Text type="danger">Error: {generateError}</Text>
              </Card>
            </div>
          )}

          <Tabs activeKey={activeTab} onChange={handleTabChange} type="card" size="large">
            <TabPane
              tab={
                <span style={{ color: SPACE_COLOR }}>
                  <EditOutlined />
                  Inputs
                  {!isFormValid && hasMinimumData && <Badge dot style={{ marginLeft: 8 }} />}
                </span>
              }
              key="inputs"
            >
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                  <Collapse activeKey={activePanels} onChange={setActivePanels} bordered={false} className="mb-6">
                    <Panel
                      header={
                        <div className="flex items-center">
                          <UserOutlined className="mr-2" />
                          <span className="font-medium" style={{ color: TEXT_PRIMARY }}>Founder/Team Credibility</span>
                          {validationResults.errors['founder.signatureResults'] && 
                           <Badge status="error" style={{ marginLeft: 8 }} />}
                        </div>
                      }
                      key="1"
                      extra={<Badge status="processing" text="Required" />}
                      style={{ background: SURFACE_BG, borderColor: BORDER_COLOR, marginBottom: '8px' }}
                    >
                      <div className="space-y-4">
                        <div>
                          <Text strong style={{ color: TEXT_SECONDARY }}>Your Signature Wins</Text>
                          <TextArea
                            placeholder="Highlight 1-2 results that prove your credibility (e.g revenue generated, leads delivered, ROI)"
                            rows={3}
                            value={founderInputs.signatureResults.join("\n")}
                            onChange={(e) => handleInputChange("founder", "signatureResults", 
                              e.target.value.split("\n").filter(line => line.trim()))}
                            className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                          />
                          {validationResults.errors['founder.signatureResults'] && (
                            <Text type="danger" className="text-sm">
                              {validationResults.errors['founder.signatureResults']}
                            </Text>
                          )}
                        </div>
                        <div>
                          <Text strong style={{ color: TEXT_SECONDARY }}>Your Teams Strengths</Text>
                          <Select
                            mode="tags"
                            style={{ width: "100%" }}
                            placeholder="Pick the skills your team is best at delivering (e.g workflow automation, sales optimization, content creation)."
                            value={founderInputs.coreStrengths}
                            onChange={(value) => handleInputChange("founder", "coreStrengths", value)}
                            className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                          />
                        </div>
                        <div>
                          <Text strong style={{ color: TEXT_SECONDARY }}>Proven Processes You Run: Required</Text>
                          <Select
                            mode="tags"
                            style={{ width: "100%" }}
                            placeholder="Select processses you can repeat for clients consistenstly y (e.g., inbound SDR, lead scoring, KPI reporting)"
                            value={founderInputs.processes}
                            onChange={(value) => handleInputChange("founder", "processes", value)}
                            className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                          />
                        </div>
                        <div>
                          <Text strong style={{ color: TEXT_SECONDARY }}>Industries You Know Well</Text>
                          <Select
                            mode="tags"
                            style={{ width: "100%" }}
                            placeholder="Choose the industries you have direct experience in (e.g ecommerce, consulting, SaaS)"
                            value={founderInputs.industries}
                            onChange={(value) => handleInputChange("founder", "industries", value)}
                            maxTagCount={3}
                            className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                          />
                        </div>
                        <div>
                          <Text strong style={{ color: TEXT_SECONDARY }}>Proof & Case Studies</Text>
                          <TextArea
                            placeholder="Add links or text for case studies, testimonials, logos, certifications or awards"
                            rows={2}
                            value={founderInputs.proofAssets.join("\n")}
                            onChange={(e) => handleInputChange("founder", "proofAssets", 
                              e.target.value.split("\n").filter(line => line.trim()))}
                            className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                          />
                        </div>
                      </div>
                    </Panel>

                    <Panel
                      header={
                        <div className="flex items-center">
                          <ShopOutlined className="mr-2" />
                          <span className="font-medium" style={{ color: TEXT_PRIMARY }}>Market & Buyer</span>
                          {(validationResults.errors['market.targetMarket'] || validationResults.errors['market.buyerRole']) && 
                           <Badge status="error" style={{ marginLeft: 8 }} />}
                        </div>
                      }
                      key="2"
                      extra={<Badge status="processing" text="Required" />}
                      style={{ background: SURFACE_BG, borderColor: BORDER_COLOR, marginBottom: '8px' }}
                    >
                      <div className="space-y-4">
                        <div>
                          <Text strong style={{ color: TEXT_SECONDARY }}>Your Target Market</Text>
                          <Input
                            placeholder="Which type of businesses are you serving? (e.g SMBs, startups, enterprises)."
                            value={marketInputs.targetMarket}
                            onChange={(e) => handleInputChange("market", "targetMarket", e.target.value)}
                            className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                          />
                        </div>
                        <div>
                          <Text strong style={{ color: TEXT_SECONDARY }}>Your Buyer Persona</Text>
                          <Input
                            placeholder="Who inside the company makes the decision to hire you? (e.g., CEO, COO, Ops Director)."
                            value={marketInputs.buyerRole}
                            onChange={(e) => handleInputChange("market", "buyerRole", e.target.value)}
                            className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                          />
                        </div>
                        <div>
                          <Text strong style={{ color: TEXT_SECONDARY }}>Biggest Buyer Problems (pain points): Required</Text>
                          <Select
                            mode="tags"
                            style={{ width: "100%" }}
                            placeholder="What are the top challenges your buyers face? (e.g  lack of leads, slow sales, poor conversion)."
                            value={marketInputs.pains}
                            onChange={(value) => handleInputChange("market", "pains", value)}
                            maxTagCount={5}
                            className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                          />
                        </div>
                        <div>
                          <Text strong style={{ color: TEXT_SECONDARY }}>Results Buyers Want (outcomes): Required</Text>
                          <Select
                            mode="tags"
                            style={{ width: "100%" }}
                            placeholder=": List the outcomes clients value enough to pay for (e.g., revenue lift, lower costs, faster response)."
                            value={marketInputs.outcomes}
                            onChange={(value) => handleInputChange("market", "outcomes", value)}
                            className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                          />
                        </div>
                      </div>
                    </Panel>

                    <Panel
                      header={
                        <div className="flex items-center">
                          <SettingOutlined className="mr-2" />
                          <span className="font-medium" style={{ color: TEXT_PRIMARY }}>Business Model & Capacity: Required Fields</span>
                          {(validationResults.errors['business.deliveryModel'] || validationResults.errors['business.capacity']) && 
                           <Badge status="error" style={{ marginLeft: 8 }} />}
                        </div>
                      }
                      key="3"
                      style={{ background: SURFACE_BG, borderColor: BORDER_COLOR, marginBottom: '8px' }}
                    >
                      <div className="space-y-4">
                        <div>
                          <Text strong style={{ color: TEXT_SECONDARY }}>How You Deliver</Text>
                          <Select
                            mode="multiple"
                            style={{ width: "100%" }}
                            placeholder="Select your service model (e.g done-for-you, coaching, SaaS, hybrid)"
                            value={businessInputs.deliveryModel}
                            onChange={(value) => handleInputChange("business", "deliveryModel", value)}
                            className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                          >
                            <Option value="productized-service">Productized Service</Option>
                            <Option value="monthly-retainer">Monthly Retainer</Option>
                            <Option value="one-time-project">One-time Project</Option>
                            <Option value="training">Training</Option>
                            <Option value="advisory">Advisory</Option>
                            <Option value="licensing">Licensing</Option>
                          </Select>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-3">
                            <Text strong style={{ color: TEXT_SECONDARY }}>Max Clients</Text>
                            <Input
                              placeholder="e.g., 5"
                              value={businessInputs.capacity}
                              onChange={(e) => handleInputChange("business", "capacity", e.target.value)}
                              type="number"
                              className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                            />
                          </div>
                          
                          <div className="md:col-span-3">
                            <Text strong style={{ color: TEXT_SECONDARY }}>Monthly Hours</Text>
                            <Input
                              placeholder="e.g., 160"
                              value={businessInputs.monthlyHours}
                              onChange={(e) => handleInputChange("business", "monthlyHours", e.target.value)}
                              type="number"
                              className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                            />
                          </div>

                          <div className="md:col-span-6">
                            <Text strong style={{ color: TEXT_SECONDARY }}>Total Target Revenue</Text>
                            <div className="flex gap-2">
                              <Input
                                placeholder="5000"
                                value={businessInputs.acv}
                                onChange={(e) => handleInputChange("business", "acv", e.target.value)}
                                prefix="$"
                                type="number"
                                style={{ flex: '1 1 65%' }}
                                className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                              />
                              <Select
                                value={businessInputs.acvPeriod || 'monthly'}
                                onChange={(value) => handleInputChange("business", "acvPeriod", value)}
                                style={{ flex: '1 1 35%', minWidth: '90px' }}
                                className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                              >
                                <Option value="monthly">monthly</Option>
                                <Option value="annual">yearly</Option>
                              </Select>
                            </div>
                            
                            <div className="text-xs mt-1" style={{ color: SPACE_COLOR }}>
                              {businessInputs.acv && businessInputs.capacity && businessInputs.acvPeriod === 'monthly' && (
                                <>Targeting ${Math.round(parseInt(businessInputs.acv.replace(/[^0-9]/g, '')) / parseInt(businessInputs.capacity)).toLocaleString()}/month per client</>
                              )}
                            </div>
                          </div>
                        </div>

                        {businessInputs.acv && businessInputs.capacity && (
                          <div className="p-2 font-black rounded text-sm" style={{ background: BRAND_GREEN, color: '#000' }}>
                            <strong>Calculated:</strong>{' '}
                            {(() => {
                              const totalAcv = parseInt(businessInputs.acv.replace(/[^0-9]/g, '') || '0');
                              const capacity = parseInt(businessInputs.capacity) || 1;
                              
                              if (businessInputs.acvPeriod === 'monthly') {
                                const perClient = Math.round(totalAcv / capacity);
                                return `$${totalAcv.toLocaleString()}/month total ($${perClient.toLocaleString()}/month per client)`;
                              } else {
                                const monthlyTotal = Math.round(totalAcv / 12);
                                const perClient = Math.round(totalAcv / 12 / capacity);
                                return `$${totalAcv.toLocaleString()}/year total ($${monthlyTotal.toLocaleString()}/month = $${perClient.toLocaleString()}/month per client)`;
                              }
                            })()}
                          </div>
                        )}

                        <div>
                          <Text strong style={{ color: TEXT_SECONDARY }}>Your Fulfillment Tools</Text>
                          <Select
                            mode="tags"
                            style={{ width: "100%" }}
                            placeholder="List the main tools/software you'll use to deliver (e.g., HubSpot, Zapier, Figma)."
                            value={businessInputs.fulfillmentStack}
                            onChange={(value) => handleInputChange("business", "fulfillmentStack", value)}
                            className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                          />
                        </div>

                        {capacityMetrics && (
                          <div className="mt-4 p-4 text-sm rounded-lg" style={{ background: BRAND_GREEN, color: '#000' }}>
                            <Text strong>Capacity Analysis:</Text>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                              <div>
                                <Text className="text-sm">Hours/Client</Text>
                                <div className="font-bold">{capacityMetrics.hoursPerClient}h</div>
                                <div className="text-xs">{capacityMetrics.recommendations.hoursPerClient}</div>
                              </div>
                              <div>
                                <Text className="text-sm">Monthly Rate</Text>
                                <div className="font-bold">${capacityMetrics.monthlyRate}</div>
                                <div className="text-xs">{capacityMetrics.recommendations.monthlyRate}</div>
                              </div>
                              <div>
                                <Text className="text-sm">Potential Revenue</Text>
                                <div className="font-bold">${capacityMetrics.potentialRevenue.toLocaleString()}</div>
                                <div className="text-xs">{capacityMetrics.recommendations.potentialRevenue}</div>
                              </div>
                              <div>
                                <Text className="text-sm">Utilization</Text>
                                <div className="font-bold">{capacityMetrics.utilizationRate}%</div>
                                <div className="text-xs">Target: 80-90%</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </Panel>

                    <Panel
                      header={
                        <div className="flex items-center">
                          <DollarOutlined className="mr-2" />
                          <span className="font-medium" style={{ color: TEXT_PRIMARY }}>Pricing</span>
                        </div>
                      }
                      key="4"
                      style={{ background: SURFACE_BG, borderColor: BORDER_COLOR, marginBottom: '8px' }}
                    >
                      <div className="space-y-6">
                        <div>
                          <Text strong className="block mb-2" style={{ color: TEXT_SECONDARY }}>Your Pricing Style</Text>
                          <Select
                            value={pricingInputs.pricePosture}
                            onChange={(value) => handleInputChange("pricing", "pricePosture", value)}
                            style={{ width: "100%" }}
                            placeholder="Do you position as value-priced(ROI focus), premium or budget?"
                            className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                          >
                            <Option value="value-priced">Value-Priced (ROI focus)</Option>
                            <Option value="market-priced">Market-Priced (Competitive)</Option>
                            <Option value="premium">Premium (Premium positioning)</Option>
                          </Select>
                        </div>
                        <div>
                          <Text strong className="block mb-2" style={{ color: TEXT_SECONDARY }}>Contract setup</Text>
                          <Select
                            value={pricingInputs.contractStyle}
                            onChange={(value) => handleInputChange("pricing", "contractStyle", value)}
                            style={{ width: "100%" }}
                            placeholder="Do you prefer month-to-month, 6 month or anuual agreements"
                            className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                          >
                            <Option value="month-to-month">Month-to-Month</Option>
                            <Option value="3-month-min">3-Month Minimum</Option>
                            <Option value="6-month-min">6-Month Minimum</Option>
                            <Option value="project">Project-Based</Option>
                          </Select>
                        </div>
                        <div>
                          <Text strong className="block mb-2" style={{ color: TEXT_SECONDARY }}>Your Guarantee</Text>
                          <Select
                            value={pricingInputs.guarantee}
                            onChange={(value) => handleInputChange("pricing", "guarantee", value)}
                            style={{ width: "100%" }}
                            placeholder="Do you offer refunds, performance guarentees or none?"
                            className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                          >
                            <Option value="none">None</Option>
                            <Option value="conditional">Conditional (if client follows process)</Option>
                            <Option value="strong-guarantee">Strong Guarantee (results or refund)</Option>
                          </Select>
                        </div>
                      </div>
                    </Panel>

                    <Panel
                      header={
                        <div className="flex items-center">
                          <GlobalOutlined className="mr-2" />
                          <span className="font-medium" style={{ color: TEXT_PRIMARY }}>Voice & Positioning</span>
                          {validationResults.errors['voice.differentiators'] && 
                           <Badge status="error" style={{ marginLeft: 8 }} />}
                        </div>
                      }
                      key="5"
                      style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
                    >
                      <div className="space-y-6">
                        <div>
                          <Text strong className="block mb-2" style={{ color: TEXT_SECONDARY }}>Your Brand Voice</Text>
                          <Select
                            value={voiceInputs.brandTone}
                            onChange={(value) => handleInputChange("voice", "brandTone", value)}
                            style={{ width: "100%" }}
                            placeholder="How should your messaging sound? (e.g consultative, bold, advisory,friendly)"
                            className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                          >
                            <Option value="assertive">Assertive (Confident, direct)</Option>
                            <Option value="consultative">Consultative (Advisory, helpful)</Option>
                            <Option value="friendly">Friendly (Approachable, warm)</Option>
                            <Option value="elite">Elite (Exclusive, premium)</Option>
                          </Select>
                        </div>
                        <div>
                          <Text strong className="block mb-2" style={{ color: TEXT_SECONDARY }}>Your Core Angle</Text>
                          <Select
                            value={voiceInputs.positioning}
                            onChange={(value) => handleInputChange("voice", "positioning", value)}
                            style={{ width: "100%" }}
                            placeholder="What's the #1 lens you use to sell? (e.g ROI focus, compliance, time saved , quality"
                            className="hover:border-[#5CC49D] focus:border-[#5CC49D]"
                          >
                            <Option value="speed">Speed (Fast results, quick turnaround)</Option>
                            <Option value="certainty">Certainty (Guaranteed outcomes)</Option>
                            <Option value="specialization">Specialization (Deep expertise)</Option>
                            <Option value="done-for-you">Done-For-You (Hands-off solution)</Option>
                            <Option value="ROI">ROI (Return on investment focus)</Option>
                          </Select>
                        </div>
                        <div className="mt-6">
                          <Text strong className="block mb-2" style={{ color: TEXT_SECONDARY }}>Differentiators (required)</Text>
                          <Select
                            mode="tags"
                            style={{ width: "100%" }}
                            placeholder="3-5 unique differentiators that set you apart"
                            value={voiceInputs.differentiators}
                            onChange={(value) => handleInputChange("voice", "differentiators", value)}
                            maxTagCount={5}
                            className="hover:border-[#5CC49D] focus:border-[#5CC49D] w-full"
                          />
                        </div>
                      </div>
                    </Panel>
                  </Collapse>

                  <div className="text-center mt-6">
                    {inputsChanged && generatedOffer && (
                      <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgb(251, 191, 36)' }}>
                        <Text style={{ color: '#f59e0b' }}>
                          You made changes to your inputs. Generate new offers to see updated results.
                        </Text>
                      </div>
                    )}
                    
                    {Object.keys(validationResults.warnings || {}).length > 0 && (
                      <div className="mb-4 p-4 border-l-4 rounded-lg shadow-sm" style={{ 
                        borderColor: BRAND_GREEN, 
                        background: BRAND_GREEN,
                        color: '#000'
                      }}>
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-black" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-black font-black">Suggestions to improve your offers</h3>
                            <div className="mt-2 text-sm text-black">
                              <ul className="list-disc pl-5 space-y-1">
                                {Object.entries(validationResults.warnings || {}).slice(0, 3).map(([field, warning]) => (
                                  <li key={field}>{warning}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="mt-3 text-xs font-black italic" style={{ color: '#000' }}>
                              These are suggestions - you can still generate offers.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <Space>
                      {generatedOffer && (
                        <Button
                          size="large"
                          onClick={handleClearAll}
                          icon={<ReloadOutlined />}
                          className="min-w-48"
                          style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                        >
                          Clear & Start Fresh
                        </Button>
                      )}
                      
                      <Button
                        type="primary"
                        size="large"
                        onClick={onFinish}
                        loading={generating}
                        icon={<RocketOutlined />}
                        className="min-w-48"
                        disabled={!isFormValid}
                        style={{
                          backgroundColor: BRAND_GREEN,
                          borderColor: BRAND_GREEN,
                          color: '#000000',
                          fontWeight: '500'
                        }}
                      >
                        {generating 
                          ? "Generating Offers..." 
                          : generatedOffer && !inputsChanged
                          ? "Regenerate Offers"
                          : "Generate Signature Offers"
                        }
                      </Button>
                    </Space>
                    
                    {!isFormValid && hasMinimumData && (
                      <div className="mt-2">
                        <Text type="danger" className="text-sm">
                          Please complete required fields to generate offers
                        </Text>
                      </div>
                    )}
                  </div>
                </Col>

                <Col xs={24} lg={8}>
                  <Card
                    className="mb-6"
                    title={
                      <div className="flex items-center" style={{ color: TEXT_PRIMARY }}>
                        <EyeOutlined className="mr-2" />
                        Live Preview
                      </div>
                    }
                    style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
                  >
                    {livePreview ? (
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg" style={{ background: SURFACE_LIGHTER }}>
                          <Statistic
                            title={<span style={{ color: TEXT_SECONDARY }}>Offer Strength Score</span>}
                            value={livePreview.offerStrength}
                            precision={0}
                            suffix="/100"
                            valueStyle={{ color: BRAND_GREEN, fontSize: "1.5em" }}
                          />
                          <Progress
                            percent={livePreview.offerStrength}
                            status="active"
                            strokeColor={BRAND_GREEN}
                          />
                        </div>
                        <Card title={<span style={{ color: TEXT_PRIMARY }}>Form Completion</span>} className="mb-6" style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}>
                          <div className="space-y-3">
                            <div>
                              <Text strong style={{ color: TEXT_PRIMARY }}>Progress: {validationResults.completionPercentage}%</Text>
                              <Progress 
                                percent={validationResults.completionPercentage} 
                                status={validationResults.completionPercentage === 100 ? "success" : "active"}
                                strokeColor={BRAND_GREEN}
                              />
                            </div>
                            <div className="text-sm" style={{ color: SPACE_COLOR }}>
                              {validationResults.completedFields} of {validationResults.totalRequiredFields} required fields completed
                            </div>
                            {validationResults.isReadyToGenerate && !validationResults.isValid && (
                              <div className="text-sm" style={{ color: BRAND_GREEN }}>
                                Ready to generate! Complete remaining fields for best results.
                              </div>
                            )}
                            {Object.keys(validationResults.warnings || {}).length > 0 && (
                              <div className="text-sm" style={{ color: '#f59e0b' }}>
                                Has suggestions for improvement
                              </div>
                            )}
                          </div>
                        </Card>
                        <div>
                          <Text strong style={{ color: TEXT_PRIMARY }}>Confidence Score: </Text>
                          <Text style={{ color: TEXT_SECONDARY }}>{livePreview.confidenceScore}%</Text>
                          <Progress percent={livePreview.confidenceScore} size="small" status="active" strokeColor={BRAND_GREEN} />
                        </div>
                        <div>
                          <Text strong style={{ color: TEXT_PRIMARY }}>Recommendations:</Text>
                          <ul className="mt-2 text-sm space-y-1">
                            {livePreview.recommendations.length ? (
                              livePreview.recommendations.map((rec, idx) => (
                                <li key={idx} style={{ color: TEXT_SECONDARY }}>• {rec}</li>
                              ))
                            ) : (
                              <li style={{ color: TEXT_SECONDARY }}>No recommendations available</li>
                            )}
                          </ul>
                        </div>
                        <Divider style={{ borderColor: BORDER_COLOR }} />
                        <div>
                          <Text strong style={{ color: TEXT_PRIMARY }}>Preview Details:</Text>
                          <div className="mt-2 text-sm space-y-2">
                            <div>
                              <Text strong style={{ color: TEXT_SECONDARY }}>Target:</Text>{" "}
                              <span style={{ color: TEXT_SECONDARY }}>{marketInputs.targetMarket || "Not provided"}</span>
                            </div>
                            <div>
                              <Text strong style={{ color: TEXT_SECONDARY }}>Buyer:</Text>{" "}
                              <span style={{ color: TEXT_SECONDARY }}>{marketInputs.buyerRole || "Not provided"}</span>
                            </div>
                            <div>
                              <Text strong style={{ color: TEXT_SECONDARY }}>Pricing:</Text>{" "}
                              <span style={{ color: TEXT_SECONDARY }}>{pricingInputs.pricePosture}</span>
                            </div>
                            <div>
                              <Text strong style={{ color: TEXT_SECONDARY }}>Tone:</Text>{" "}
                              <span style={{ color: TEXT_SECONDARY }}>{voiceInputs.brandTone}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8" style={{ color: SPACE_COLOR }}>
                        <BulbOutlined style={{ fontSize: "2em" }} />
                        <div className="mt-2">Fill in the form to see live preview</div>
                      </div>
                    )}
                  </Card>

                  {/* Business Insights Card */}
                  {businessInsights && (
                    <Card title={<span style={{ color: TEXT_PRIMARY }}>Business Insights</span>} className="mb-6" style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
                      <div className="space-y-3">
                        {businessInsights.strengths.length > 0 && (
                          <div>
                            <Text strong style={{ color: BRAND_GREEN }}>Strengths:</Text>
                            <ul className="mt-1 text-sm">
                              {businessInsights.strengths.map((strength, idx) => (
                                <li key={idx} style={{ color: BRAND_GREEN }}>✓ {strength}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {businessInsights.opportunities.length > 0 && (
                          <div>
                            <Text strong style={{ color: SPACE_COLOR }}>Opportunities:</Text>
                            <ul className="mt-1 text-sm">
                              {businessInsights.opportunities.map((opp, idx) => (
                                <li key={idx} style={{ color: SPACE_COLOR }}>→ {opp}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {businessInsights.recommendations.length > 0 && (
                          <div>
                            <Text strong style={{ color: '#f59e0b' }}>Recommendations:</Text>
                            <ul className="mt-1 text-sm">
                              {businessInsights.recommendations.map((rec, idx) => (
                                <li key={idx} style={{ color: '#f59e0b' }}>• {rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}

                  <Card title={<span style={{ color: TEXT_PRIMARY }}>Input Summary</span>} style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
                    <div className="space-y-3">
                      <div>
                        <Text strong style={{ color: TEXT_SECONDARY }}>Industries: </Text>
                        <div>
                          {founderInputs.industries.length ? (
                            founderInputs.industries.map((industry, idx) => (
                              <Tag key={idx} color="blue" className="mb-1" style={{ background: 'transparent', borderColor: SPACE_COLOR, color: SPACE_COLOR }}>
                                {industry}
                              </Tag>
                            ))
                          ) : (
                            <Text style={{ color: SPACE_COLOR }}>None provided</Text>
                          )}
                        </div>
                      </div>
                      <div>
                        <Text strong style={{ color: TEXT_SECONDARY }}>Buyer Pains: </Text>
                        <div>
                          {marketInputs.pains.length ? (
                            marketInputs.pains.map((pain, idx) => (
                              <Tag key={idx} color="red" className="mb-1" style={{ background: 'transparent', borderColor: SPACE_COLOR, color: SPACE_COLOR }}>
                                {pain}
                              </Tag>
                            ))
                          ) : (
                            <Text style={{ color: SPACE_COLOR }}>None provided</Text>
                          )}
                        </div>
                      </div>
                      <div>
                        <Text strong style={{ color: TEXT_SECONDARY }}>Delivery Models: </Text>
                        <div>
                          {businessInputs.deliveryModel.length ? (
                            businessInputs.deliveryModel.map((model, idx) => (
                              <Tag key={idx} color="green" className="mb-1" style={{ background: 'transparent', borderColor: SPACE_COLOR, color: SPACE_COLOR }}>
                                {model}
                              </Tag>
                            ))
                          ) : (
                            <Text style={{ color: SPACE_COLOR }}>None provided</Text>
                          )}
                        </div>
                      </div>
                      <div>
                        <Text strong style={{ color: TEXT_SECONDARY }}>Differentiators: </Text>
                        <div>
                          {voiceInputs.differentiators.length ? (
                            voiceInputs.differentiators.map((diff, idx) => (
                              <Tag key={idx} color="purple" className="mb-1" style={{ background: 'transparent', borderColor: SPACE_COLOR, color: SPACE_COLOR }}>
                                {diff}
                              </Tag>
                            ))
                          ) : (
                            <Text style={{ color: SPACE_COLOR }}>None provided</Text>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>
            </TabPane>

            <TabPane
              tab={
                <span style={{ color: SPACE_COLOR }}>
                  <FileTextOutlined />
                  Generated Offers
                  {generatedOffer && <Badge dot style={{ marginLeft: 8 }} />}
                </span>
              }
              key="outputs"
              disabled={!generatedOffer}
            >
              {generatedOffer && hasValidOfferStructure(generatedOffer) ? (
                <div className="space-y-8">
                  <Card style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
                    <div className="flex justify-between items-center flex-wrap gap-4">
                      <Title level={4} style={{ color: TEXT_PRIMARY }}>Your Signature Offers</Title>
                      <Space>
                        <Button
                          icon={<CopyOutlined />}
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(generatedOffer, null, 2));
                            message.success("Copied to clipboard!");
                          }}
                          style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                        >
                          Copy JSON
                        </Button>
                        <Button 
                          icon={<DownloadOutlined />} 
                          onClick={() => handleExport("html")}
                          loading={exportLoading}
                          style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                        >
                          Export HTML
                        </Button>
                        <Button 
                          icon={<DownloadOutlined />} 
                          onClick={() => handleExport("json")}
                          loading={exportLoading}
                          style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                        >
                          Export JSON
                        </Button>
                      </Space>
                    </div>
                  </Card>

                  <Card title={<span style={{ color: TEXT_PRIMARY }}>Signature Offers</span>} style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
                    <Tabs type="card">
                      <TabPane tab={<span style={{ color: TEXT_PRIMARY }}>Starter</span>} key="starter">
                        <OfferPreview 
                          offer={generatedOffer.signatureOffers.starter} 
                          pricing={generatedOffer.pricing.starter} 
                        />
                      </TabPane>
                      <TabPane tab={<span style={{ color: TEXT_PRIMARY }}>Core</span>} key="core">
                        <OfferPreview 
                          offer={generatedOffer.signatureOffers.core} 
                          pricing={generatedOffer.pricing.core} 
                        />
                      </TabPane>
                      <TabPane tab={<span style={{ color: TEXT_PRIMARY }}>Premium</span>} key="premium">
                        <OfferPreview 
                          offer={generatedOffer.signatureOffers.premium} 
                          pricing={generatedOffer.pricing.premium} 
                        />
                      </TabPane>
                    </Tabs>
                  </Card>

                  {generatedOffer.comparisonTable?.features && (
                    <Card title={<span style={{ color: TEXT_PRIMARY }}>Feature Comparison</span>} style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
                      <Table
                        dataSource={generatedOffer.comparisonTable.features.map((feature, idx) => ({
                          ...feature,
                          key: idx,
                        }))}
                        pagination={false}
                        columns={[
                          {
                            title: <span style={{ color: TEXT_PRIMARY }}>Feature</span>,
                            dataIndex: "name",
                            key: "name",
                            render: (text: string) => <span style={{ color: TEXT_PRIMARY }}>{text}</span>,
                          },
                          {
                            title: <span style={{ color: TEXT_PRIMARY }}>Starter</span>,
                            dataIndex: "starter",
                            key: "starter",
                            render: (text: string) =>
                              text === "✓" ? (
                                <CheckCircleOutlined style={{ color: BRAND_GREEN }} />
                              ) : text === "✕" ? (
                                <span style={{ color: "#ff4d4f" }}>✕</span>
                              ) : (
                                <span style={{ color: TEXT_SECONDARY }}>{text}</span>
                              ),
                          },
                          {
                            title: <span style={{ color: TEXT_PRIMARY }}>Core</span>,
                            dataIndex: "core",
                            key: "core",
                            render: (text: string) =>
                              text === "✓" ? (
                                <CheckCircleOutlined style={{ color: BRAND_GREEN }} />
                              ) : text === "✕" ? (
                                <span style={{ color: "#ff4d4f" }}>✕</span>
                              ) : (
                                <span style={{ color: TEXT_SECONDARY }}>{text}</span>
                              ),
                          },
                          {
                            title: <span style={{ color: TEXT_PRIMARY }}>Premium</span>,
                            dataIndex: "premium",
                            key: "premium",
                            render: (text: string) =>
                              text === "✓" ? (
                                <CheckCircleOutlined style={{ color: BRAND_GREEN }} />
                              ) : text === "✕" ? (
                                <span style={{ color: "#ff4d4f" }}>✕</span>
                              ) : (
                                <span style={{ color: TEXT_SECONDARY }}>{text}</span>
                              ),
                          },
                        ]}
                      />
                    </Card>
                  )}

                  {generatedOffer.pricing && generatedOffer.signatureOffers && (
                    <Card title={<span style={{ color: TEXT_PRIMARY }}>Pricing Summary</span>} style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 rounded" style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}>
                          <Title level={4} style={{ color: TEXT_PRIMARY }}>Starter</Title>
                          <Title level={2} style={{ color: SPACE_COLOR }}>
                            {generatedOffer.pricing.starter || 'Price TBD'}
                          </Title>
                          <Text style={{ color: SPACE_COLOR }}>
                            {generatedOffer.signatureOffers.starter?.term || 'Term TBD'}
                          </Text>
                        </div>
                        <div className="text-center p-4 rounded" style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}>
                          <Title level={4} style={{ color: TEXT_PRIMARY }}>Core (Recommended)</Title>
                          <Title level={2} style={{ color: BRAND_GREEN }}>
                            {generatedOffer.pricing.core || 'Price TBD'}
                          </Title>
                          <Text style={{ color: SPACE_COLOR }}>
                            {generatedOffer.signatureOffers.core?.term || 'Term TBD'}
                          </Text>
                        </div>
                        <div className="text-center p-4 rounded" style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}>
                          <Title level={4} style={{ color: TEXT_PRIMARY }}>Premium</Title>
                          <Title level={2} style={{ color: SPACE_COLOR }}>
                            {generatedOffer.pricing.premium || 'Price TBD'}
                          </Title>
                          <Text style={{ color: SPACE_COLOR }}>
                            {generatedOffer.signatureOffers.premium?.term || 'Term TBD'}
                          </Text>
                        </div>
                      </div>
                    </Card>
                  )}

                  {generatedOffer.analysis && (
                    <Card title={<span style={{ color: TEXT_PRIMARY }}>Offer Analysis</span>} style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Text strong style={{ color: TEXT_PRIMARY }}>Conversion Potential Score</Text>
                          <div className="mt-2">
                            <Progress 
                              percent={generatedOffer.analysis.conversionPotential?.score || 0} 
                              status="active"
                              strokeColor={BRAND_GREEN}
                            />
                            <Text style={{ color: TEXT_SECONDARY }}>{generatedOffer.analysis.conversionPotential?.score || 0}%</Text>
                          </div>
                        </div>
                        <div>
                          <Text strong style={{ color: TEXT_PRIMARY }}>Key Factors</Text>
                          <ul className="mt-2 text-sm">
                            {generatedOffer.analysis.conversionPotential?.factors?.map((factor, idx) => (
                              <li key={idx} style={{ 
                                color: factor.impact === 'High' ? BRAND_GREEN : 
                                      factor.impact === 'Medium' ? '#f59e0b' : '#ff4d4f'
                              }}>
                                {factor.factor} ({factor.impact})
                              </li>
                            )) || <li style={{ color: TEXT_SECONDARY }}>No factors available</li>}
                          </ul>
                        </div>
                      </div>
                    </Card>
                  )}

                  <Card title={<span style={{ color: TEXT_PRIMARY }}>Next Steps</span>} style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
                    <Steps progressDot current={0} direction="vertical">
                      <Step title="Review generated offers" description="Make any necessary adjustments to the offers" />
                      <Step title="Create sales collateral" description="Generate one-pagers and proposal templates" />
                      <Step title="Set up fulfillment systems" description="Prepare your delivery processes and tools" />
                      <Step title="Launch to market" description="Start promoting your new signature offers" />
                    </Steps>
                  </Card>
                </div>
              ) : generatedOffer ? (
                <div className="text-center py-12">
                  <Alert
                    message="Invalid Offer Structure"
                    description="The generated offer data appears to be incomplete or corrupted. Please try regenerating your offers."
                    type="error"
                    showIcon
                    action={
                      <Space>
                        <Button size="small" onClick={() => setActiveTab("inputs")} style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}>
                          Back to Inputs
                        </Button>
                        <Button size="small" type="primary" onClick={onFinish} loading={generating} style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' }}>
                          Regenerate Offers
                        </Button>
                      </Space>
                    }
                  />
                  <div className="mt-4">
                    <details>
                      <summary className="cursor-pointer text-sm" style={{ color: SPACE_COLOR }}>Show raw data (for debugging)</summary>
                      <pre className="mt-2 text-xs text-left p-4 rounded overflow-auto" style={{ background: SURFACE_LIGHTER, color: TEXT_SECONDARY }}>
                        {JSON.stringify(generatedOffer, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BulbOutlined style={{ fontSize: "48px", color: SPACE_COLOR }} />
                  <Title level={3} style={{ color: TEXT_PRIMARY }}>
                    No Offers Generated Yet
                  </Title>
                  <Text style={{ color: SPACE_COLOR }}>Fill out the input form and generate your signature offers to see them here.</Text>
                  <div className="mt-4">
                    <Button type="primary" onClick={() => setActiveTab("inputs")} style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' }}>
                      Go to Inputs
                    </Button>
                  </div>
                </div>
              )}
            </TabPane>

            <TabPane
              tab={
                <span style={{ color: SPACE_COLOR }}>
                  <HistoryOutlined />
                  History
                  {(offers.length > 0 || generatedOffer) && (
                    <Badge count={offers.length + (generatedOffer ? 1 : 0)} style={{ marginLeft: 8 }} />
                  )}
                </span>
              }
              key="history"
            >
              <Card 
                title={<span style={{ color: TEXT_PRIMARY }}>Your Saved Offers</span>} 
                extra={
                  <Button 
                    icon={<ReloadOutlined />} 
                    onClick={() => fetchOffers()}
                    loading={offersLoading}
                    style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                  >
                    Refresh
                  </Button>
                }
                style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
              >
                {offersLoading ? (
                  <div className="text-center py-8">
                    <Spin size="large" tip="Loading your offers..." />
                  </div>
                ) : (offers.length > 0 || generatedOffer) ? (
                  <div className="space-y-4">
                    {generatedOffer && (
                      <Card 
                        size="small"
                        className="border-l-4"
                        style={{ borderLeftColor: BRAND_GREEN, background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}
                        title={
                          <div className="flex justify-between items-center">
                            <div>
                              <Text strong style={{ color: BRAND_GREEN }}>
                                Current Generated Offer
                              </Text>
                              <div className="text-sm">
                                <Tag color="green" style={{ background: 'transparent', borderColor: BRAND_GREEN, color: BRAND_GREEN }}>Just Generated</Tag>
                                <Tag color="blue" style={{ background: 'transparent', borderColor: SPACE_COLOR, color: SPACE_COLOR }}>{marketInputs.targetMarket || 'Target Market'}</Tag>
                                <Tag color="purple" style={{ background: 'transparent', borderColor: SPACE_COLOR, color: SPACE_COLOR }}>{pricingInputs.pricePosture}</Tag>
                              </div>
                            </div>
                            <Space>
                              <Tooltip title="View this offer">
                                <Button 
                                  size="small" 
                                  type="primary"
                                  icon={<EyeOutlined />}
                                  onClick={() => setActiveTab("outputs")}
                                  style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' }}
                                >
                                  View
                                </Button>
                              </Tooltip>
                              {savedOfferId && (
                                <Tooltip title="This offer is saved">
                                  <Button 
                                    size="small" 
                                    icon={<SaveOutlined />}
                                    disabled
                                    style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                                  >
                                    Saved
                                  </Button>
                                </Tooltip>
                              )}
                            </Space>
                          </div>
                        }
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Text className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>Industries:</Text>
                            <div className="mt-1">
                              {founderInputs.industries?.map((industry, idx) => (
                                <Tag key={idx} color="purple" style={{ background: 'transparent', borderColor: SPACE_COLOR, color: SPACE_COLOR }}>
                                  {industry}
                                </Tag>
                              )) || <Text style={{ color: SPACE_COLOR }}>Not specified</Text>}
                            </div>
                          </div>
                          <div>
                            <Text className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>Generated:</Text>
                            <div className="mt-1 text-sm" style={{ color: SPACE_COLOR }}>
                              Just now
                            </div>
                          </div>
                          <div>
                            <Text className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>Conversion Score:</Text>
                            <div className="mt-1">
                              {generatedOffer.analysis?.conversionPotential?.score ? (
                                <Progress 
                                  percent={generatedOffer.analysis.conversionPotential.score} 
                                  size="small"
                                  showInfo={false}
                                  strokeColor={BRAND_GREEN}
                                />
                              ) : (
                                <Text style={{ color: SPACE_COLOR }}>Not analyzed</Text>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}

                    {offers.map((offer) => (
                      <Card 
                        key={offer.id} 
                        size="small"
                        className="border-l-4"
                        style={{ borderLeftColor: SPACE_COLOR, background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}
                        title={
                          <div className="flex justify-between items-center">
                            <div>
                              <Text strong style={{ color: TEXT_PRIMARY }}>{offer.title}</Text>
                              <div className="text-sm">
                                {offer.metadata?.targetMarket && (
                                  <Tag color="blue" style={{ background: 'transparent', borderColor: SPACE_COLOR, color: SPACE_COLOR }}>{offer.metadata.targetMarket}</Tag>
                                )}
                                {offer.metadata?.pricePosture && (
                                  <Tag color="green" style={{ background: 'transparent', borderColor: SPACE_COLOR, color: SPACE_COLOR }}>{offer.metadata.pricePosture}</Tag>
                                )}
                                {savedOfferId === offer.id && (
                                  <Tag color="gold" style={{ background: 'transparent', borderColor: SPACE_COLOR, color: SPACE_COLOR }}>Currently Viewing</Tag>
                                )}
                              </div>
                            </div>
                            <Space>
                              <Tooltip title="Load this offer">
                                <Button 
                                  size="small" 
                                  icon={<EyeOutlined />}
                                  type={savedOfferId === offer.id ? "primary" : "default"}
                                  onClick={() => handleLoadOffer(offer.id)}
                                  style={savedOfferId === offer.id ? 
                                    { background: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' } :
                                    { background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }
                                  }
                                >
                                  Load
                                </Button>
                              </Tooltip>
                              <Tooltip title="Delete this offer">
                                <Button 
                                  size="small" 
                                  danger 
                                  icon={<DeleteOutlined />}
                                  onClick={() => handleDeleteOffer(offer.id)}
                                >
                                  Delete
                                </Button>
                              </Tooltip>
                            </Space>
                          </div>
                        }
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Text className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>Industries:</Text>
                            <div className="mt-1">
                              {offer.metadata?.industries?.map((industry, idx) => (
                                <Tag key={idx} color="purple" style={{ background: 'transparent', borderColor: SPACE_COLOR, color: SPACE_COLOR }}>
                                  {industry}
                                </Tag>
                              )) || <Text style={{ color: SPACE_COLOR }}>Not specified</Text>}
                            </div>
                          </div>
                          <div>
                            <Text className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>Created:</Text>
                            <div className="mt-1 text-sm" style={{ color: SPACE_COLOR }}>
                              {new Date(offer.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <Text className="text-sm font-medium" style={{ color: TEXT_PRIMARY }}>Conversion Score:</Text>
                            <div className="mt-1">
                              {offer.metadata?.conversionScore ? (
                                <Progress 
                                  percent={offer.metadata.conversionScore} 
                                  size="small"
                                  showInfo={false}
                                  strokeColor={BRAND_GREEN}
                                />
                              ) : (
                                <Text style={{ color: SPACE_COLOR }}>Not analyzed</Text>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <HistoryOutlined style={{ fontSize: "48px", color: SPACE_COLOR }} />
                    <Title level={4} style={{ color: TEXT_PRIMARY }}>
                      No Saved Offers Yet
                    </Title>
                    <Text style={{ color: SPACE_COLOR }}>Your generated offers will appear here once you save them.</Text>
                    <div className="mt-4">
                      <Button type="primary" onClick={() => setActiveTab("inputs")} style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' }}>
                        Create Your First Offer
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </TabPane>
          </Tabs>
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
          
          .ant-radio-button-wrapper:hover {
            color: #5CC49D !important;
            border-color: #5CC49D !important;
          }
          
          .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled) {
            color: #000 !important;
            background: #5CC49D !important;
            border-color: #5CC49D !important;
          }
          
          .ant-radio-wrapper:hover .ant-radio-inner {
            border-color: #5CC49D !important;
          }
          
          .ant-radio-checked .ant-radio-inner {
            border-color: #5CC49D !important;
            background-color: #5CC49D !important;
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

function OfferPreview({ offer, pricing }: { offer: SignatureOffer; pricing: string }) {
  const safeScope = Array.isArray(offer.scope) ? offer.scope : [];
  const safeProof = Array.isArray(offer.proof) ? offer.proof : [];
  const safeMilestones = Array.isArray(offer.milestones) ? offer.milestones : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Title level={3} style={{ color: TEXT_PRIMARY }}>{offer.name || 'Untitled Offer'}</Title>
          <Title level={4} style={{ color: TEXT_SECONDARY }}>
            {pricing || 'Price not set'}
          </Title>
        </div>
      </div>
      
      <div className="flex items-start gap-2">
        <div className="mt-1" style={{ color: BRAND_GREEN }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <Text strong style={{ color: TEXT_PRIMARY }}>Who this is for:</Text>
          <div className="block mt-1">
            <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ background: 'rgba(92, 196, 157, 0.2)', color: BRAND_GREEN }}>
              {offer.for || 'Target audience not specified'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-start gap-2">
        <div className="mt-1" style={{ color: BRAND_GREEN }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
        <div>
          <Text strong style={{ color: TEXT_PRIMARY }}>Core promise:</Text>
          <div className="p-4 rounded-lg border mt-2" style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}>
            <p className="font-medium" style={{ color: TEXT_PRIMARY }}>{offer.promise || 'Promise not defined'}</p>
          </div>
        </div>
      </div>
      
      <div>
        <Text strong style={{ color: TEXT_PRIMARY }}>What you do:</Text>
        {safeScope.length > 0 ? (
          <ul className="list-disc pl-5 mt-2">
            {safeScope.map((item, idx) => (
              <li key={idx} style={{ color: TEXT_SECONDARY }}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2" style={{ color: SPACE_COLOR }}>Scope not defined</p>
        )}
      </div>
      
      <div>
        <Text strong style={{ color: TEXT_PRIMARY }}>Proof & differentiators:</Text>
        {safeProof.length > 0 ? (
          <ul className="list-disc pl-5 mt-2">
            {safeProof.map((item, idx) => (
              <li key={idx} style={{ color: TEXT_SECONDARY }}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2" style={{ color: SPACE_COLOR }}>Proof elements not defined</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Text strong style={{ color: TEXT_PRIMARY }}>Setup timeline:</Text>
          <div className="p-4 rounded-lg border-l-4 mt-2" style={{ 
            background: 'linear-gradient(to right, rgba(92, 196, 157, 0.1), rgba(92, 196, 157, 0.05))',
            borderLeftColor: BRAND_GREEN,
            borderColor: BORDER_COLOR
          }}>
            <p className="font-medium" style={{ color: BRAND_GREEN }}>{offer.timeline || 'Timeline not specified'}</p>
          </div>
        </div>
        <div>
          <Text strong style={{ color: TEXT_PRIMARY }}>Success milestones:</Text>
          {safeMilestones.length > 0 ? (
            <ul className="list-disc pl-5 mt-2">
              {safeMilestones.map((item, idx) => (
                <li key={idx} style={{ color: TEXT_SECONDARY }}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2" style={{ color: SPACE_COLOR }}>Milestones not defined</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div style={{ color: SPACE_COLOR }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
            </div>
            <Text strong style={{ color: TEXT_PRIMARY }}>Pricing model:</Text>
          </div>
          <div className="p-4 rounded-lg border" style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}>
            <p className="font-medium" style={{ color: TEXT_PRIMARY }}>{offer.pricing || 'Pricing model not specified'}</p>
          </div>
        </div>

        <div className="text-center py-4">
          <div className="flex justify-center items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: SPACE_COLOR }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <Text strong className="text-lg font-semibold" style={{ color: TEXT_PRIMARY }}>
              Term:
            </Text>
          </div>
          <Paragraph className="text-xl font-bold" style={{ color: TEXT_PRIMARY }}>
            {offer.term || 'Term not specified'}
          </Paragraph>
        </div>
      </div>
      
      <div>
        <Text strong style={{ color: TEXT_PRIMARY }}>Guarantee:</Text>
        <Paragraph style={{ color: TEXT_SECONDARY }}>{offer.guarantee || 'Guarantee not specified'}</Paragraph>
      </div>
      
      <div>
        <Text strong style={{ color: TEXT_PRIMARY }}>Client lift estimate:</Text>
        <Paragraph style={{ color: TEXT_SECONDARY }}>{offer.clientLift || 'Client impact not specified'}</Paragraph>
      </div>
      
      <div>
        <Text strong style={{ color: TEXT_PRIMARY }}>Implementation requirements:</Text>
        <Paragraph style={{ color: TEXT_SECONDARY }}>{offer.requirements || 'Requirements not specified'}</Paragraph>
      </div>
    </div>
  );
}