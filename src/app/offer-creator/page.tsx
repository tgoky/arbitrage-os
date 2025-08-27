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

export default function OfferCreatorPage() {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<"inputs" | "outputs" | "history">("inputs");
  const [generatedOffer, setGeneratedOffer] = useState<GeneratedOfferPackage | null>(null);
  const [savedOfferId, setSavedOfferId] = useState<string | null>(null);
  const [activePanels, setActivePanels] = useState<string[]>(["1", "2", "3", "4", "5"]);




  // Hook implementations
 const { generateOffer, generating, error: generateError, getBusinessInsights,  } = useOfferCreator();
 
  const { offers, loading: offersLoading, fetchOffers, deleteOffer, getOffer } = useSavedOffers();
const { validateInput, validateInputProgressive, getOfferInsights, calculateCapacityMetrics } = useOfferValidation();
  const { exportOffer, loading: exportLoading } = useOfferExport();


  const isLoading = generating;

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
    fetchOffers();
  }, [fetchOffers]);

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

 

const onFinish = async () => {
  try {

       const fullValidation = validateInputProgressive(completeInput, true);
    if (!fullValidation.isValid) {
      message.error("Please complete all required fields before generating");
      return;
    }
    

 
    const offerInput: Partial<OfferCreatorInput> = {
      founder: founderInputs,
      market: marketInputs,
      business: businessInputs,
      pricing: pricingInputs,
      voice: voiceInputs,
      // userId is intentionally omitted
    };

    console.log("🚀 Generating signature offers with input:", offerInput);

    // Ensure generateOffer in useOfferCreator hook accepts Partial<OfferCreatorInput> or adjust the type here
    // Cast to OfferCreatorInput if the hook expects it, knowing userId will be added by the API
    const result = await generateOffer(offerInput as unknown as OfferCreatorInput); 

    if (result) {
      setGeneratedOffer(result.offer);
      setSavedOfferId(result.offerId);
      setActiveTab("outputs");
      
      // Refresh the offers list
      await fetchOffers(); // This will also use the authenticated user's ID
      
      notification.success({
        message: "Signature Offers Generated Successfully",
        description: "Your signature offers have been created and are ready to use.",
        duration: 5,
      });
    }
  } catch (error) {
    console.error("Generation error:", error);
    message.error("Failed to generate offers. Please try again.");
  }
};

  const handleInputChange = (
    section: "founder" | "market" | "business" | "pricing" | "voice",
    field: string,
    value: any
  ) => {
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
          // If we're viewing the deleted offer, clear it
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
        // Parse the offer content and populate the form
        const offerContent = offerData.offer;
        
        // If we have the original input data, populate the form
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
          setBusinessInputs(input.business || {
            deliveryModel: [],
            capacity: "",
            monthlyHours: "",
            acv: "",
            fulfillmentStack: [],
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
    <div className="max-w-7xl mx-auto px-4 py-8">
        <LoadingOverlay visible={isLoading} />
      <div className="text-center mb-8">
        <Title level={2} className="flex items-center justify-center">
          <ThunderboltOutlined className="mr-2" />
          Signature Offer Creator
        </Title>
        <Text type="secondary" className="text-lg">
          Transform your expertise into compelling signature offers that sell themselves
        </Text>
      </div>

      {/* Show generation error if any */}
      {generateError && (
        <div className="mb-4">
          <Card>
            <Text type="danger">Error: {generateError}</Text>
          </Card>
        </div>
      )}

      <Tabs activeKey={activeTab} onChange={handleTabChange} type="card" size="large">
        <TabPane
          tab={
            <span>
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
                      <span className="font-medium">Founder/Team Credibility</span>
                      {validationResults.errors['founder.signatureResults'] && 
                       <Badge status="error" style={{ marginLeft: 8 }} />}
                    </div>
                  }
                  key="1"
                  extra={<Badge status="processing" text="Required" />}
                >
                  <div className="space-y-4">
                    <div>
                      <Text strong>Your Signature Wins</Text>
                      <TextArea
                        placeholder="Highlight 1-2 results that prove your credibility (e.g revenue generated, leads delivered, ROI) "
                        rows={3}
                        value={founderInputs.signatureResults.join("\n")}
                        onChange={(e) => handleInputChange("founder", "signatureResults", 
                          e.target.value.split("\n").filter(line => line.trim()))}
                    
                      />
                      {validationResults.errors['founder.signatureResults'] && (
                        <Text type="danger" className="text-sm">
                          {validationResults.errors['founder.signatureResults']}
                        </Text>
                      )}
                    </div>
                    <div>
                      <Text strong>Your Teams Strengths</Text>
                      <Select
                        mode="tags"
                        style={{ width: "100%" }}
                        placeholder="Pick the skills your team is best at delivering (e.g workflow automation, sales optimization, content creation)."
                        value={founderInputs.coreStrengths}
                        onChange={(value) => handleInputChange("founder", "coreStrengths", value)}
                        // status={validationResults.errors['founder.coreStrengths'] ? 'error' : undefined}
                      />
                      {validationResults.errors['founder.coreStrengths'] && (
                        <Text type="danger" className="text-sm">
                          {validationResults.errors['founder.coreStrengths']}
                        </Text>
                      )}
                    </div>
                    <div>
                      <Text strong>Proven Processes You Run</Text>
                      <Select
                        mode="tags"
                        style={{ width: "100%" }}
                        placeholder="Select processses you can repeat for clients consistenstly y (e.g., inbound SDR, lead scoring, KPI reporting)"
                        value={founderInputs.processes}
                        onChange={(value) => handleInputChange("founder", "processes", value)}
                        // status={validationResults.errors['founder.processes'] ? 'error' : undefined}
                      />
                      {validationResults.errors['founder.processes'] && (
                        <Text type="danger" className="text-sm">
                          {validationResults.errors['founder.processes']}
                        </Text>
                      )}
                    </div>
                    <div>
                      <Text strong>Industries You Know Well</Text>
                      <Select
                        mode="tags"
                        style={{ width: "100%" }}
                        placeholder="Choose the industries you have direct experience in (e.g ecommerce, consulting, SaaS)"
                        value={founderInputs.industries}
                        onChange={(value) => handleInputChange("founder", "industries", value)}
                        maxTagCount={3}
                        // status={validationResults.errors['founder.industries'] ? 'error' : undefined}
                      />
                      {validationResults.errors['founder.industries'] && (
                        <Text type="danger" className="text-sm">
                          {validationResults.errors['founder.industries']}
                        </Text>
                      )}
                    </div>
                    <div>
                      <Text strong>Proof & Case Studies</Text>
                      <TextArea
                        placeholder="Add links or text for case studies, testimonials, logos, certifications or awards"
                        rows={2}
                        value={founderInputs.proofAssets.join("\n")}
                        onChange={(e) => handleInputChange("founder", "proofAssets", 
                          e.target.value.split("\n").filter(line => line.trim()))}
                      />
                    </div>
                  </div>
                </Panel>

                <Panel
                  header={
                    <div className="flex items-center">
                      <ShopOutlined className="mr-2" />
                      <span className="font-medium">Market & Buyer</span>
                      {(validationResults.errors['market.targetMarket'] || validationResults.errors['market.buyerRole']) && 
                       <Badge status="error" style={{ marginLeft: 8 }} />}
                    </div>
                  }
                  key="2"
                  extra={<Badge status="processing" text="Required" />}
                >
                  <div className="space-y-4">
                    <div>
                      <Text strong>Your Target Market</Text>
                      <Input
                        placeholder="Which type of businesses are you serving? (e.g SMBs, startups, enterprises). "
                        value={marketInputs.targetMarket}
                        onChange={(e) => handleInputChange("market", "targetMarket", e.target.value)}
                        // status={validationResults.errors['market.targetMarket'] ? 'error' : undefined}
                      />
                      {validationResults.errors['market.targetMarket'] && (
                        <Text type="danger" className="text-sm">
                          {validationResults.errors['market.targetMarket']}
                        </Text>
                      )}
                    </div>
                    <div>
                      <Text strong>Your Buyer Persona</Text>
                      <Input
                        placeholder="Who inside the company makes the decision to hire you? (e.g., CEO, COO, Ops Director)."
                        value={marketInputs.buyerRole}
                        onChange={(e) => handleInputChange("market", "buyerRole", e.target.value)}
                        // status={validationResults.errors['market.buyerRole'] ? 'error' : undefined}
                      />
                      {validationResults.errors['market.buyerRole'] && (
                        <Text type="danger" className="text-sm">
                          {validationResults.errors['market.buyerRole']}
                        </Text>
                      )}
                    </div>
                    <div>
                      <Text strong>Biggest Buyer Problems</Text>
                      <Select
                        mode="tags"
                        style={{ width: "100%" }}
                        placeholder="What are the top challenges your buyers face? (e.g  lack of leads, slow sales, poor conversion)."
                        value={marketInputs.pains}
                        onChange={(value) => handleInputChange("market", "pains", value)}
                        maxTagCount={5}
                        // status={validationResults.errors['market.pains'] ? 'error' : undefined}
                      />
                      {validationResults.errors['market.pains'] && (
                        <Text type="danger" className="text-sm">
                          {validationResults.errors['market.pains']}
                        </Text>
                      )}
                    </div>
                    <div>
                      <Text strong>Results Buyers Want</Text>
                      <Select
                        mode="tags"
                        style={{ width: "100%" }}
                        placeholder=": List the outcomes clients value enough to pay for (e.g., revenue lift, lower costs, faster response)."
                        value={marketInputs.outcomes}
                        onChange={(value) => handleInputChange("market", "outcomes", value)}
                        // status={validationResults.errors['market.outcomes'] ? 'error' : undefined}
                      />
                      {validationResults.errors['market.outcomes'] && (
                        <Text type="danger" className="text-sm">
                          {validationResults.errors['market.outcomes']}
                        </Text>
                      )}
                    </div>
                  </div>
                </Panel>

                <Panel
                  header={
                    <div className="flex items-center">
                      <SettingOutlined className="mr-2" />
                      <span className="font-medium">Business Model & Capacity</span>
                      {(validationResults.errors['business.deliveryModel'] || validationResults.errors['business.capacity']) && 
                       <Badge status="error" style={{ marginLeft: 8 }} />}
                    </div>
                  }
                  key="3"
                >
                  <div className="space-y-4">
                    <div>
                      <Text strong>How You Deliver</Text>
                      <Select
                        mode="multiple"
                        style={{ width: "100%" }}
                        placeholder="Select your service model (e.g done-for-you, coaching, SaaS, hybrid) "
                        value={businessInputs.deliveryModel}
                        onChange={(value) => handleInputChange("business", "deliveryModel", value)}
                        // status={validationResults.errors['business.deliveryModel'] ? 'error' : undefined}
                      >
                        <Option value="productized-service">Productized Service</Option>
                        <Option value="monthly-retainer">Monthly Retainer</Option>
                        <Option value="one-time-project">One-time Project</Option>
                        <Option value="training">Training</Option>
                        <Option value="advisory">Advisory</Option>
                        <Option value="licensing">Licensing</Option>
                      </Select>
                      {validationResults.errors['business.deliveryModel'] && (
                        <Text type="danger" className="text-sm">
                          {validationResults.errors['business.deliveryModel']}
                        </Text>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Text strong>Max Clients You Can Handle</Text>
                        <Input
                          placeholder="What's your concurrent client capacity (e.g 5 at once, 20 at once)?"
                          value={businessInputs.capacity}
                          onChange={(e) => handleInputChange("business", "capacity", e.target.value)}
                          // status={validationResults.errors['business.capacity'] ? 'error' : undefined}
                        />
                        {validationResults.errors['business.capacity'] && (
                          <Text type="danger" className="text-sm">
                            {validationResults.errors['business.capacity']}
                          </Text>
                        )}
                      </div>
                      <div>
                        <Text strong>Monthly Hours You will invest</Text>
                        <Input
                          placeholder="Roughly how many hours per month can your team put into delivery?"
                          value={businessInputs.monthlyHours}
                          onChange={(e) => handleInputChange("business", "monthlyHours", e.target.value)}
                          // status={validationResults.errors['business.monthlyHours'] ? 'error' : undefined}
                        />
                        {validationResults.errors['business.monthlyHours'] && (
                          <Text type="danger" className="text-sm">
                            {validationResults.errors['business.monthlyHours']}
                          </Text>
                        )}
                      </div>
                      <div>
                        <Text strong>Your Target Deal Size</Text>
                        <Input
                          placeholder="What's your ideal annual contract value per client (e.g $20k, $50k)? "
                          value={businessInputs.acv}
                          onChange={(e) => handleInputChange("business", "acv", e.target.value)}
                          // status={validationResults.errors['business.acv'] ? 'error' : undefined}
                        />
                        {validationResults.errors['business.acv'] && (
                          <Text type="danger" className="text-sm">
                            {validationResults.errors['business.acv']}
                          </Text>
                        )}
                      </div>
                    </div>
                    <div>
                      <Text strong>Your Fulfillment Tools</Text>
                      <Select
                        mode="tags"
                        style={{ width: "100%" }}
                        placeholder="List the main tools/softwate you'll use to deliver (e.g., HubSpot, Zapier, Figma). "
                        value={businessInputs.fulfillmentStack}
                        onChange={(value) => handleInputChange("business", "fulfillmentStack", value)}
                      />
                    </div>

                    {/* Show capacity metrics if available */}
                    {capacityMetrics && (
                      <div className="mt-4 p-4  rounded-lg">
                        <Text strong>Capacity Analysis:</Text>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                          <div>
                            <Text className="text-sm">Hours/Client</Text>
                            <div className="font-bold">{capacityMetrics.hoursPerClient}h</div>
                            <div className="text-xs text-gray-500">{capacityMetrics.recommendations.hoursPerClient}</div>
                          </div>
                          <div>
                            <Text className="text-sm">Monthly Rate</Text>
                            <div className="font-bold">${capacityMetrics.monthlyRate}</div>
                            <div className="text-xs text-gray-500">{capacityMetrics.recommendations.monthlyRate}</div>
                          </div>
                          <div>
                            <Text className="text-sm">Potential Revenue</Text>
                            <div className="font-bold">${capacityMetrics.potentialRevenue.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">{capacityMetrics.recommendations.potentialRevenue}</div>
                          </div>
                          <div>
                            <Text className="text-sm">Utilization</Text>
                            <div className="font-bold">{capacityMetrics.utilizationRate}%</div>
                            <div className="text-xs text-gray-500">Target: 80-90%</div>
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
                      <span className="font-medium">Pricing & Terms</span>
                    </div>
                  }
                  key="4"
                >
                  <div className="space-y-6">
                    <div>
                      <Text strong className="block mb-2">Your Pricing Style</Text>
                      <Select
                        value={pricingInputs.pricePosture}
                        onChange={(value) => handleInputChange("pricing", "pricePosture", value)}
                        style={{ width: "100%" }}
                        placeholder="Do you position as value-priced(ROI focus), premium or budget?"
                      >
                        <Option value="value-priced">Value-Priced (ROI focus)</Option>
                        <Option value="market-priced">Market-Priced (Competitive)</Option>
                        <Option value="premium">Premium (Premium positioning)</Option>
                      </Select>
                    </div>
                    <div>
                      <Text strong className="block mb-2">Contract setup</Text>
                      <Select
                        value={pricingInputs.contractStyle}
                        onChange={(value) => handleInputChange("pricing", "contractStyle", value)}
                        style={{ width: "100%" }}
                        placeholder="Do you prefer month-to-month, 6 month or anuual agreements"
                      >
                        <Option value="month-to-month">Month-to-Month</Option>
                        <Option value="3-month-min">3-Month Minimum</Option>
                        <Option value="6-month-min">6-Month Minimum</Option>
                        <Option value="project">Project-Based</Option>
                      </Select>
                    </div>
                    <div>
                      <Text strong className="block mb-2">Your Guarantee</Text>
                      <Select
                        value={pricingInputs.guarantee}
                        onChange={(value) => handleInputChange("pricing", "guarantee", value)}
                        style={{ width: "100%" }}
                        placeholder="Do you offer refunds, performance guarentees or none? "
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
                      <span className="font-medium">Voice & Positioning</span>
                      {validationResults.errors['voice.differentiators'] && 
                       <Badge status="error" style={{ marginLeft: 8 }} />}
                    </div>
                  }
                  key="5"
                >
                  <div className="space-y-6">
                    <div>
                      <Text strong className="block mb-2">Your Brand Voice</Text>
                      <Select
                        value={voiceInputs.brandTone}
                        onChange={(value) => handleInputChange("voice", "brandTone", value)}
                        style={{ width: "100%" }}
                        placeholder="How should your messaging sound? (e.g consultative, bold, advisory,friendly) "
                      >
                        <Option value="assertive">Assertive (Confident, direct)</Option>
                        <Option value="consultative">Consultative (Advisory, helpful)</Option>
                        <Option value="friendly">Friendly (Approachable, warm)</Option>
                        <Option value="elite">Elite (Exclusive, premium)</Option>
                      </Select>
                    </div>
                    <div>
                      <Text strong className="block mb-2">Your Core Angle</Text>
                      <Select
                        value={voiceInputs.positioning}
                        onChange={(value) => handleInputChange("voice", "positioning", value)}
                        style={{ width: "100%" }}
                        placeholder="What's the #1 lens you use to sell? (e.g ROI focus, compliance, time saved , quality"
                      >
                        <Option value="speed">Speed (Fast results, quick turnaround)</Option>
                        <Option value="certainty">Certainty (Guaranteed outcomes)</Option>
                        <Option value="specialization">Specialization (Deep expertise)</Option>
                        <Option value="done-for-you">Done-For-You (Hands-off solution)</Option>
                        <Option value="ROI">ROI (Return on investment focus)</Option>
                      </Select>
                    </div>
                    <div className="mt-6">
                      <Text strong className="block mb-2">Differentiators (required)</Text>
                      <Select
                        mode="tags"
                        style={{ width: "100%" }}
                        placeholder="3-5 unique differentiators that set you apart"
                        value={voiceInputs.differentiators}
                        onChange={(value) => handleInputChange("voice", "differentiators", value)}
                        maxTagCount={5}
                        className="w-full"
                      
                      />
                      {validationResults.errors['voice.differentiators'] && (
                        <Text type="danger" className="text-sm">
                          {validationResults.errors['voice.differentiators']}
                        </Text>
                      )}
                    </div>
                  </div>
                </Panel>
              </Collapse>

              <div className="text-center mt-6">
                <Button
                  type="primary"
                  size="large"
                  onClick={onFinish}
                  loading={generating}
                  icon={<RocketOutlined />}
                  className="min-w-48"
                  disabled={!isFormValid}
                >
                  {generating ? "Generating Offers..." : "Generate Signature Offers"}
                </Button>
                {!isFormValid && hasMinimumData && (
                  <div className="mt-2">
                    <Text type="danger" className="text-sm">
                      Please fix validation errors above before generating
                    </Text>
                  </div>
                )}
              </div>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                className="mb-6"
                title={
                  <div className="flex items-center">
                    <EyeOutlined className="mr-2" />
                    Live Preview
                  </div>
                }
              >
                {livePreview ? (
                  <div className="space-y-4">
                    <div className=" p-4 rounded-lg">
                      <Statistic
                        title="Offer Strength Score"
                        value={livePreview.offerStrength}
                        precision={0}
                        suffix="/100"
                        valueStyle={{ color: "#3f8600", fontSize: "1.5em" }}
                      />
                      <Progress
                        percent={livePreview.offerStrength}
                        status="active"
                        strokeColor={{
                          "0%": "#108ee9",
                          "100%": "#87d068",
                        }}
                      />
                    </div>
                    <Card title="Form Completion" className="mb-6">
  <div className="space-y-3">
    <div>
      <Text strong>Progress: {validationResults.completionPercentage}%</Text>
      <Progress 
        percent={validationResults.completionPercentage} 
        status={validationResults.completionPercentage === 100 ? "success" : "active"}
        strokeColor={{
          "0%": "#ff4d4f",
          "50%": "#faad14", 
          "100%": "#52c41a",
        }}
      />
    </div>
    <div className="text-sm text-gray-600">
      {validationResults.completedFields} of {validationResults.totalRequiredFields} required fields completed
    </div>
    {validationResults.isReadyToGenerate && !validationResults.isValid && (
      <div className="text-sm text-orange-600">
        Ready to generate! Complete remaining fields for best results.
      </div>
    )}
  </div>
</Card>
                    <div>
                      <Text strong>Confidence Score: </Text>
                      <Text>{livePreview.confidenceScore}%</Text>
                      <Progress percent={livePreview.confidenceScore} size="small" status="active" />
                    </div>
                    <div>
                      <Text strong>Recommendations:</Text>
                      <ul className="mt-2 text-sm space-y-1">
                        {livePreview.recommendations.length ? (
                          livePreview.recommendations.map((rec, idx) => (
                            <li key={idx}>• {rec}</li>
                          ))
                        ) : (
                          <li>No recommendations available</li>
                        )}
                      </ul>
                    </div>
                    <Divider />
                    <div>
                      <Text strong>Preview Details:</Text>
                      <div className="mt-2 text-sm space-y-2">
                        <div>
                          <Text strong>Target:</Text>{" "}
                          {marketInputs.targetMarket || "Not provided"}
                        </div>
                        <div>
                          <Text strong>Buyer:</Text>{" "}
                          {marketInputs.buyerRole || "Not provided"}
                        </div>
                        <div>
                          <Text strong>Pricing:</Text> {pricingInputs.pricePosture}
                        </div>
                        <div>
                          <Text strong>Tone:</Text> {voiceInputs.brandTone}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <BulbOutlined style={{ fontSize: "2em" }} />
                    <div className="mt-2">Fill in the form to see live preview</div>
                  </div>
                )}
              </Card>

              {/* Business Insights Card */}
              {businessInsights && (
                <Card title="Business Insights" className="mb-6">
                  <div className="space-y-3">
                    {businessInsights.strengths.length > 0 && (
                      <div>
                        <Text strong className="text-green-600">Strengths:</Text>
                        <ul className="mt-1 text-sm">
                          {businessInsights.strengths.map((strength, idx) => (
                            <li key={idx} className="text-green-700">✓ {strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {businessInsights.opportunities.length > 0 && (
                      <div>
                        <Text strong className="text-blue-600">Opportunities:</Text>
                        <ul className="mt-1 text-sm">
                          {businessInsights.opportunities.map((opp, idx) => (
                            <li key={idx} className="text-blue-700">→ {opp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {businessInsights.recommendations.length > 0 && (
                      <div>
                        <Text strong className="text-orange-600">Recommendations:</Text>
                        <ul className="mt-1 text-sm">
                          {businessInsights.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-orange-700">• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              <Card title="Input Summary">
                <div className="space-y-3">
                  <div>
                    <Text strong>Industries: </Text>
                    <div>
                      {founderInputs.industries.length ? (
                        founderInputs.industries.map((industry, idx) => (
                          <Tag key={idx} color="blue" className="mb-1">
                            {industry}
                          </Tag>
                        ))
                      ) : (
                        <Text type="secondary">None provided</Text>
                      )}
                    </div>
                  </div>
                  <div>
                    <Text strong>Buyer Pains: </Text>
                    <div>
                      {marketInputs.pains.length ? (
                        marketInputs.pains.map((pain, idx) => (
                          <Tag key={idx} color="red" className="mb-1">
                            {pain}
                          </Tag>
                        ))
                      ) : (
                        <Text type="secondary">None provided</Text>
                      )}
                    </div>
                  </div>
                  <div>
                    <Text strong>Delivery Models: </Text>
                    <div>
                      {businessInputs.deliveryModel.length ? (
                        businessInputs.deliveryModel.map((model, idx) => (
                          <Tag key={idx} color="green" className="mb-1">
                            {model}
                          </Tag>
                        ))
                      ) : (
                        <Text type="secondary">None provided</Text>
                      )}
                    </div>
                  </div>
                  <div>
                    <Text strong>Differentiators: </Text>
                    <div>
                      {voiceInputs.differentiators.length ? (
                        voiceInputs.differentiators.map((diff, idx) => (
                          <Tag key={idx} color="purple" className="mb-1">
                            {diff}
                          </Tag>
                        ))
                      ) : (
                        <Text type="secondary">None provided</Text>
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
            <span>
              <FileTextOutlined />
              Generated Offers
              {generatedOffer && <Badge dot style={{ marginLeft: 8 }} />}
            </span>
          }
          key="outputs"
          disabled={!generatedOffer}
        >
          {generatedOffer ? (
            <div className="space-y-8">
              <Card>
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <Title level={4}>Your Signature Offers</Title>
                  <Space>
                    <Button
                      icon={<CopyOutlined />}
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(generatedOffer, null, 2));
                        message.success("Copied to clipboard!");
                      }}
                    >
                      Copy JSON
                    </Button>
                    <Button 
                      icon={<DownloadOutlined />} 
                      onClick={() => handleExport("html")}
                      loading={exportLoading}
                    >
                      Export HTML
                    </Button>
                    <Button 
                      icon={<DownloadOutlined />} 
                      onClick={() => handleExport("json")}
                      loading={exportLoading}
                    >
                      Export JSON
                    </Button>
                  </Space>
                </div>
              </Card>

              <Card title="Signature Offers">
                <Tabs type="card">
                  <TabPane tab="Starter" key="starter">
                    <OfferPreview 
                      offer={generatedOffer.primaryOffer.signatureOffers.starter} 
                      pricing={generatedOffer.primaryOffer.pricing.starter} 
                    />
                  </TabPane>
                  <TabPane tab="Core" key="core">
                    <OfferPreview 
                      offer={generatedOffer.primaryOffer.signatureOffers.core} 
                      pricing={generatedOffer.primaryOffer.pricing.core} 
                    />
                  </TabPane>
                  <TabPane tab="Premium" key="premium">
                    <OfferPreview 
                      offer={generatedOffer.primaryOffer.signatureOffers.premium} 
                      pricing={generatedOffer.primaryOffer.pricing.premium} 
                    />
                  </TabPane>
                </Tabs>
              </Card>

              <Card title="Feature Comparison">
                <Table
                  dataSource={generatedOffer.primaryOffer.comparisonTable.features.map((feature, idx) => ({
                    ...feature,
                    key: idx,
                  }))}
                  pagination={false}
                  columns={[
                    {
                      title: "Feature",
                      dataIndex: "name",
                      key: "name",
                    },
                    {
                      title: "Starter",
                      dataIndex: "starter",
                      key: "starter",
                      render: (text: string) =>
                        text === "✓" ? (
                          <CheckCircleOutlined style={{ color: "green" }} />
                        ) : text === "✕" ? (
                          <span style={{ color: "red" }}>✕</span>
                        ) : (
                          text
                        ),
                    },
                    {
                      title: "Core",
                      dataIndex: "core",
                      key: "core",
                      render: (text: string) =>
                        text === "✓" ? (
                          <CheckCircleOutlined style={{ color: "green" }} />
                        ) : text === "✕" ? (
                          <span style={{ color: "red" }}>✕</span>
                        ) : (
                          text
                        ),
                    },
                    {
                      title: "Premium",
                      dataIndex: "premium",
                      key: "premium",
                      render: (text: string) =>
                        text === "✓" ? (
                          <CheckCircleOutlined style={{ color: "green" }} />
                        ) : text === "✕" ? (
                          <span style={{ color: "red" }}>✕</span>
                        ) : (
                          text
                        ),
                    },
                  ]}
                />
              </Card>

              <Card title="Pricing Summary">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded">
                    <Title level={4}>Starter</Title>
                    <Title level={2} className="text-blue-600">
                      {generatedOffer.primaryOffer.pricing.starter}
                    </Title>
                    <Text type="secondary">{generatedOffer.primaryOffer.signatureOffers.starter.term}</Text>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <Title level={4}>Core (Recommended)</Title>
                    <Title level={2} className="text-blue-800">
                      {generatedOffer.primaryOffer.pricing.core}
                    </Title>
                    <Text type="secondary">{generatedOffer.primaryOffer.signatureOffers.core.term}</Text>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <Title level={4}>Premium</Title>
                    <Title level={2} className="text-purple-600">
                      {generatedOffer.primaryOffer.pricing.premium}
                    </Title>
                    <Text type="secondary">{generatedOffer.primaryOffer.signatureOffers.premium.term}</Text>
                  </div>
                </div>
              </Card>

              {/* Analysis Results */}
              {generatedOffer.analysis && (
                <Card title="Offer Analysis">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Text strong>Conversion Potential Score</Text>
                      <div className="mt-2">
                        <Progress 
                          percent={generatedOffer.analysis.conversionPotential.score} 
                          status="active"
                          strokeColor="#52c41a"
                        />
                        <Text>{generatedOffer.analysis.conversionPotential.score}%</Text>
                      </div>
                    </div>
                    <div>
                      <Text strong>Key Factors</Text>
                      <ul className="mt-2 text-sm">
                        {generatedOffer.analysis.conversionPotential.factors.map((factor, idx) => (
                          <li key={idx} className={`
                            ${factor.impact === 'High' ? 'text-green-700' : 
                              factor.impact === 'Medium' ? 'text-yellow-700' : 'text-red-700'}
                          `}>
                            {factor.factor} ({factor.impact})
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              )}

              <Card title="Next Steps">
                <Steps progressDot current={0} direction="vertical">
                  <Step title="Review generated offers" description="Make any necessary adjustments to the offers" />
                  <Step title="Create sales collateral" description="Generate one-pagers and proposal templates" />
                  <Step title="Set up fulfillment systems" description="Prepare your delivery processes and tools" />
                  <Step title="Launch to market" description="Start promoting your new signature offers" />
                </Steps>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <BulbOutlined style={{ fontSize: "48px", color: "#ccc" }} />
              <Title level={3} type="secondary">
                No Offers Generated Yet
              </Title>
              <Text type="secondary">Fill out the input form and generate your signature offers to see them here.</Text>
              <div className="mt-4">
                <Button type="primary" onClick={() => setActiveTab("inputs")}>
                  Go to Inputs
                </Button>
              </div>
            </div>
          )}
        </TabPane>

        <TabPane
          tab={
            <span>
              <HistoryOutlined />
              History
              {offers.length > 0 && <Badge count={offers.length} style={{ marginLeft: 8 }} />}
            </span>
          }
          key="history"
        >
         <Card 
  title="Your Saved Offers" 
  extra={
    <Button 
      icon={<ReloadOutlined />} 
      onClick={() => fetchOffers()} // Wrap in an arrow function
      loading={offersLoading}
    >
      Refresh
    </Button>
  }
>
            {offersLoading ? (
              <div className="text-center py-8">
                <Spin size="large" />
                <div className="mt-4">Loading your offers...</div>
              </div>
            ) : offers.length > 0 ? (
              <div className="space-y-4">
                {offers.map((offer) => (
                  <Card 
                    key={offer.id} 
                    size="small"
                    className="border-l-4 border-l-blue-500"
                    title={
                      <div className="flex justify-between items-center">
                        <div>
                          <Text strong>{offer.title}</Text>
                          <div className="text-sm text-gray-500">
                            {offer.metadata?.targetMarket && (
                              <Tag color="blue">{offer.metadata.targetMarket}</Tag>
                            )}
                            {offer.metadata?.pricePosture && (
                              <Tag color="green">{offer.metadata.pricePosture}</Tag>
                            )}
                          </div>
                        </div>
                        <Space>
                          <Tooltip title="Load this offer">
                            <Button 
                              size="small" 
                              icon={<EyeOutlined />}
                              onClick={() => handleLoadOffer(offer.id)}
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
                        <Text className="text-sm font-medium">Industries:</Text>
                        <div className="mt-1">
                          {offer.metadata?.industries?.map((industry, idx) => (
                            <Tag key={idx}  color="purple">
                              {industry}
                            </Tag>
                          )) || <Text type="secondary">Not specified</Text>}
                        </div>
                      </div>
                      <div>
                        <Text className="text-sm font-medium">Created:</Text>
                        <div className="mt-1 text-sm">
                          {new Date(offer.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <Text className="text-sm font-medium">Conversion Score:</Text>
                        <div className="mt-1">
                          {offer.metadata?.conversionScore ? (
                            <Progress 
                              percent={offer.metadata.conversionScore} 
                              size="small"
                              showInfo={false}
                            />
                          ) : (
                            <Text type="secondary">Not analyzed</Text>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <HistoryOutlined style={{ fontSize: "48px", color: "#ccc" }} />
                <Title level={4} type="secondary">
                  No Saved Offers Yet
                </Title>
                <Text type="secondary">Your generated offers will appear here once you save them.</Text>
                <div className="mt-4">
                  <Button type="primary" onClick={() => setActiveTab("inputs")}>
                    Create Your First Offer
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
}

// Fixed OfferPreview component with proper type guards and fallbacks

function OfferPreview({ offer, pricing }: { offer: SignatureOffer; pricing: string }) {
  // Add type guards and fallbacks for all array properties
  const safeScope = Array.isArray(offer.scope) ? offer.scope : [];
  const safeProof = Array.isArray(offer.proof) ? offer.proof : [];
  const safeMilestones = Array.isArray(offer.milestones) ? offer.milestones : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Title level={3}>{offer.name || 'Untitled Offer'}</Title>
          <Title level={4} type="secondary">
            {pricing || 'Price not set'}
          </Title>
        </div>
        {/* <Button type="primary">Use This Offer</Button> */}
      </div>
      
      <div className="flex items-start gap-2">
        <div className="mt-1 text-green-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <Text strong>Who this is for:</Text>
          <div className="block mt-1">
            <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
              {offer.for || 'Target audience not specified'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-start gap-2">
        <div className="mt-1 text-green-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
        <div>
          <Text strong>Core promise:</Text>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mt-2">
            <p className="text-purple-800 font-medium">{offer.promise || 'Promise not defined'}</p>
          </div>
        </div>
      </div>
      
      <div>
        <Text strong>What you do:</Text>
        {safeScope.length > 0 ? (
          <ul className="list-disc pl-5 mt-2">
            {safeScope.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 mt-2">Scope not defined</p>
        )}
      </div>
      
      <div>
        <Text strong>Proof & differentiators:</Text>
        {safeProof.length > 0 ? (
          <ul className="list-disc pl-5 mt-2">
            {safeProof.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 mt-2">Proof elements not defined</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Text strong>Setup timeline:</Text>
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-4 rounded-lg border-l-4 border-green-500 mt-2">
            <p className="text-green-800 font-medium">{offer.timeline || 'Timeline not specified'}</p>
          </div>
        </div>
        <div>
          <Text strong>Success milestones:</Text>
          {safeMilestones.length > 0 ? (
            <ul className="list-disc pl-5 mt-2">
              {safeMilestones.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 mt-2">Milestones not defined</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="text-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
            </div>
            <Text strong>Pricing model:</Text>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-blue-700 font-medium">{offer.pricing || 'Pricing model not specified'}</p>
          </div>
        </div>

        <div className="text-center py-4">
          <div className="flex justify-center items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <Text strong className="text-lg font-semibold">
              Term:
            </Text>
          </div>
          <Paragraph className="text-xl font-bold">
            {offer.term || 'Term not specified'}
          </Paragraph>
        </div>
      </div>
      
      <div>
        <Text strong>Guarantee:</Text>
        <Paragraph>{offer.guarantee || 'Guarantee not specified'}</Paragraph>
      </div>
      
      <div>
        <Text strong>Client lift estimate:</Text>
        <Paragraph>{offer.clientLift || 'Client impact not specified'}</Paragraph>
      </div>
      
      <div>
        <Text strong>Implementation requirements:</Text>
        <Paragraph>{offer.requirements || 'Requirements not specified'}</Paragraph>
      </div>
    </div>
  );
}