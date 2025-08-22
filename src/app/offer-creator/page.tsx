"use client";

import React, { useState, useMemo } from "react";
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
} from "antd";
import {
  FounderInputs,
  MarketInputs,
  BusinessInputs,
  PricingInputs,
  VoiceInputs,
  GeneratedOffer,
  LivePreview,
} from "./types/offerCreator"; // Adjust path to your types file

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Step } = Steps;

export default function OfferCreatorPage() {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<"inputs" | "outputs" | "history">("inputs");
  const [generatedOffer, setGeneratedOffer] = useState<GeneratedOffer | null>(null);
  const [savedOfferId, setSavedOfferId] = useState<string | null>(null);
  const [activePanels, setActivePanels] = useState<string[]>(["1", "2", "3", "4", "5"]);
  const [isLoading, setIsLoading] = useState(false);

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

  // Live preview calculation
  const calculateLivePreview = useMemo<LivePreview | null>(() => {
    if (
      !founderInputs.signatureResults.length ||
      !founderInputs.coreStrengths.length ||
      !founderInputs.processes.length ||
      !founderInputs.industries.length ||
      !marketInputs.targetMarket ||
      !marketInputs.buyerRole ||
      !marketInputs.pains.length ||
      !marketInputs.outcomes.length ||
      !businessInputs.deliveryModel.length
    ) {
      return null;
    }

    // Placeholder for actual logic (implement based on inputs)
    return {
      offerStrength: 0,
      confidenceScore: 0,
      recommendations: [],
    };
  }, [founderInputs, marketInputs, businessInputs, pricingInputs, voiceInputs]);

  const onFinish = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement actual API call to generate offers
      // Example:
      // const response = await fetch('/api/generate-offer', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ founderInputs, marketInputs, businessInputs, pricingInputs, voiceInputs }),
      // });
      // const data = await response.json() as GeneratedOffer;
      // setGeneratedOffer(data);

      throw new Error("API not implemented");

      setSavedOfferId(`offer-${Date.now()}`);
      setActiveTab("outputs");
      notification.success({
        message: "Offer Created Successfully",
        description: "Your signature offers have been generated and are ready to use.",
      });
    } catch (error) {
      message.error("Failed to generate offers. Please try again.");
    } finally {
      setIsLoading(false);
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

  const handleExport = (format: string) => {
    message.success(`Exported offer package as ${format.toUpperCase()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <Title level={2} className="flex items-center justify-center">
          <ThunderboltOutlined className="mr-2" />
          Offer Creator Blueprint
        </Title>
        <Text type="secondary" className="text-lg">
          Transform your expertise into compelling signature offers
        </Text>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card" size="large">
        <TabPane
          tab={
            <span>
              <EditOutlined />
              Inputs
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
                    </div>
                  }
                  key="1"
                  extra={<Badge status="processing" text="Required" />}
                >
                  <div className="space-y-4">
                    <div>
                      <Text strong>Signature results (required)</Text>
                      <TextArea
                        placeholder="3-5 bullet outcomes you've produced (with numbers if possible)"
                        rows={3}
                        value={founderInputs.signatureResults.join("\n")}
                        onChange={(e) => handleInputChange("founder", "signatureResults", e.target.value.split("\n"))}
                      />
                    </div>
                    <div>
                      <Text strong>Core strengths/skills (required)</Text>
                      <Select
                        mode="tags"
                        style={{ width: "100%" }}
                        placeholder="e.g., workflow automation, sales ops, media buying"
                        value={founderInputs.coreStrengths}
                        onChange={(value) => handleInputChange("founder", "coreStrengths", value)}
                      />
                    </div>
                    <div>
                      <Text strong>Repeatable processes you own (required)</Text>
                      <Select
                        mode="tags"
                        style={{ width: "100%" }}
                        placeholder="SOP names / frameworks"
                        value={founderInputs.processes}
                        onChange={(value) => handleInputChange("founder", "processes", value)}
                      />
                    </div>
                    <div>
                      <Text strong>Industry knowledge (required)</Text>
                      <Select
                        mode="tags"
                        style={{ width: "100%" }}
                        placeholder="Pick 1-3 industries you understand"
                        value={founderInputs.industries}
                        onChange={(value) => handleInputChange("founder", "industries", value)}
                      />
                    </div>
                    <div>
                      <Text strong>Proof assets (optional)</Text>
                      <TextArea
                        placeholder="Links or text: case studies, logos, testimonials, certifications, awards"
                        rows={2}
                        value={founderInputs.proofAssets.join("\n")}
                        onChange={(e) => handleInputChange("founder", "proofAssets", e.target.value.split("\n"))}
                      />
                    </div>
                  </div>
                </Panel>

                <Panel
                  header={
                    <div className="flex items-center">
                      <ShopOutlined className="mr-2" />
                      <span className="font-medium">Market & Buyer</span>
                    </div>
                  }
                  key="2"
                  extra={<Badge status="processing" text="Required" />}
                >
                  <div className="space-y-4">
                    <div>
                      <Text strong>Primary target market (required)</Text>
                      <Input
                        placeholder="e.g., SMB services, clinics, trades, agencies, local retail"
                        value={marketInputs.targetMarket}
                        onChange={(e) => handleInputChange("market", "targetMarket", e.target.value)}
                      />
                    </div>
                    <div>
                      <Text strong>Ideal buyer role (required)</Text>
                      <Input
                        placeholder="e.g., owner/operator, practice manager, GM, director"
                        value={marketInputs.buyerRole}
                        onChange={(e) => handleInputChange("market", "buyerRole", e.target.value)}
                      />
                    </div>
                    <div>
                      <Text strong>Top 3 buyer pains (required)</Text>
                      <Select
                        mode="tags"
                        style={{ width: "100%" }}
                        placeholder="Bullet points of customer pains"
                        value={marketInputs.pains}
                        onChange={(value) => handleInputChange("market", "pains", value)}
                        maxTagCount={3}
                      />
                    </div>
                    <div>
                      <Text strong>Outcomes they'll pay for (required)</Text>
                      <Select
                        mode="tags"
                        style={{ width: "100%" }}
                        placeholder="e.g., revenue lift, cost cut, time saved, compliance, lead volume"
                        value={marketInputs.outcomes}
                        onChange={(value) => handleInputChange("market", "outcomes", value)}
                      />
                    </div>
                  </div>
                </Panel>

                <Panel
                  header={
                    <div className="flex items-center">
                      <SettingOutlined className="mr-2" />
                      <span className="font-medium">Business Model & Capacity</span>
                    </div>
                  }
                  key="3"
                >
                  <div className="space-y-4">
                    <div>
                      <Text strong>Delivery model (required)</Text>
                      <Select
                        mode="multiple"
                        style={{ width: "100%" }}
                        placeholder="Choose 2-3 options"
                        value={businessInputs.deliveryModel}
                        onChange={(value) => handleInputChange("business", "deliveryModel", value)}
                      >
                        <Option value="productized-service">Productized Service</Option>
                        <Option value="monthly-retainer">Monthly Retainer</Option>
                        <Option value="one-time-project">One-time Project</Option>
                        <Option value="training">Training</Option>
                        <Option value="advisory">Advisory</Option>
                        <Option value="licensing">Licensing</Option>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Text strong>Capacity constraints</Text>
                        <Input
                          placeholder="Max concurrent clients"
                          value={businessInputs.capacity}
                          onChange={(e) => handleInputChange("business", "capacity", e.target.value)}
                        />
                      </div>
                      <div>
                        <Text strong>Monthly hours</Text>
                        <Input
                          placeholder="Monthly hours available"
                          value={businessInputs.monthlyHours}
                          onChange={(e) => handleInputChange("business", "monthlyHours", e.target.value)}
                        />
                      </div>
                      <div>
                        <Text strong>Preferred ACV</Text>
                        <Input
                          placeholder="Annual Contract Value"
                          value={businessInputs.acv}
                          onChange={(e) => handleInputChange("business", "acv", e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Text strong>Fulfillment stack (optional)</Text>
                      <Select
                        mode="tags"
                        style={{ width: "100%" }}
                        placeholder="Tech/tools you'll use internally"
                        value={businessInputs.fulfillmentStack}
                        onChange={(value) => handleInputChange("business", "fulfillmentStack", value)}
                      />
                    </div>
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
      <Text strong className="block mb-2">Price posture</Text>
      <Select
        value={pricingInputs.pricePosture}
        onChange={(value) => handleInputChange("pricing", "pricePosture", value)}
        style={{ width: "100%" }}
        placeholder="Select price posture"
      >
        <Option value="value-priced">Value-Priced</Option>
        <Option value="market-priced">Market-Priced</Option>
        <Option value="premium">Premium</Option>
      </Select>
    </div>
    <div>
      <Text strong className="block mb-2">Contract style</Text>
      <Select
        value={pricingInputs.contractStyle}
        onChange={(e) => handleInputChange("pricing", "contractStyle", e)}
        style={{ width: "100%" }}
        placeholder="Select contract style"
      >
        <Option value="month-to-month">Month-to-Month</Option>
        <Option value="3-month-min">3-Month Minimum</Option>
        <Option value="6-month-min">6-Month Minimum</Option>
        <Option value="project">Project-Based</Option>
      </Select>
    </div>
    <div>
      <Text strong className="block mb-2">Guarantee posture</Text>
      <Select
        value={pricingInputs.guarantee}
        onChange={(value) => handleInputChange("pricing", "guarantee", value)}
        style={{ width: "100%" }}
        placeholder="Select guarantee posture"
      >
        <Option value="none">None</Option>
        <Option value="conditional">Conditional</Option>
        <Option value="strong-guarantee">Strong Guarantee</Option>
      </Select>
    </div>
  </div>
</Panel>

<Panel
  header={
    <div className="flex items-center">
      <GlobalOutlined className="mr-2" />
      <span className="font-medium">Voice & Packaging</span>
    </div>
  }
  key="5"
>
  <div className="space-y-6">
    <div>
      <Text strong className="block mb-2">Brand tone</Text>
      <Select
        value={voiceInputs.brandTone}
        onChange={(value) => handleInputChange("voice", "brandTone", value)}
        style={{ width: "100%" }}
        placeholder="Select brand tone"
      >
        <Option value="assertive">Assertive</Option>
        <Option value="consultative">Consultative</Option>
        <Option value="friendly">Friendly</Option>
        <Option value="elite">Elite</Option>
      </Select>
    </div>
    <div>
      <Text strong className="block mb-2">Positioning angle</Text>
      <Select
        value={voiceInputs.positioning}
        onChange={(value) => handleInputChange("voice", "positioning", value)}
        style={{ width: "100%" }}
        placeholder="Select positioning angle"
      >
        <Option value="speed">Speed</Option>
        <Option value="certainty">Certainty</Option>
        <Option value="specialization">Specialization</Option>
        <Option value="done-for-you">Done-For-You</Option>
        <Option value="ROI">ROI</Option>
      </Select>
    </div>
    <div className="mt-6">
      <Text strong className="block mb-2">Differentiators (required)</Text>
      <Select
        mode="tags"
        style={{ width: "100%" }}
        placeholder="3 unique differentiators"
        value={voiceInputs.differentiators}
        onChange={(value) => handleInputChange("voice", "differentiators", value)}
        maxTagCount={3}
        className="w-full"
      />
    </div>
  </div>
</Panel>
              </Collapse>

              <div className="text-center mt-6">
                <Button
                  type="primary"
                  size="large"
                  onClick={onFinish}
                  loading={isLoading}
                  icon={<RocketOutlined />}
                  className="min-w-48"
                >
                  {isLoading ? "Generating Offers..." : "Generate Signature Offers"}
                </Button>
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
                {calculateLivePreview ? (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                      <Statistic
                        title="Offer Strength Score"
                        value={calculateLivePreview.offerStrength}
                        precision={0}
                        suffix="/100"
                        valueStyle={{ color: "#3f8600", fontSize: "1.5em" }}
                      />
                      <Progress
                        percent={calculateLivePreview.offerStrength}
                        status="active"
                        strokeColor={{
                          "0%": "#108ee9",
                          "100%": "#87d068",
                        }}
                      />
                    </div>
                    <div>
                      <Text strong>Confidence Score: </Text>
                      <Text>{calculateLivePreview.confidenceScore}%</Text>
                      <Progress percent={calculateLivePreview.confidenceScore} size="small" status="active" />
                    </div>
                    <div>
                      <Text strong>Recommendations:</Text>
                      <ul className="mt-2 text-sm space-y-1">
                        {calculateLivePreview.recommendations.length ? (
                          calculateLivePreview.recommendations.map((rec, idx) => (
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
              Outputs
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
                    <Button icon={<DownloadOutlined />} onClick={() => handleExport("html")}>
                      Export HTML
                    </Button>
                    <Button icon={<DownloadOutlined />} onClick={() => handleExport("pdf")}>
                      Export PDF
                    </Button>
                    <Button type="primary" icon={<SaveOutlined />} onClick={() => handleExport("json")}>
                      Save Package
                    </Button>
                  </Space>
                </div>
              </Card>

              <Card title="Signature Offers">
                <Tabs type="card">
                  <TabPane tab="Starter" key="starter">
                    <OfferPreview offer={generatedOffer.signatureOffers.starter} pricing={generatedOffer.pricing.starter} />
                  </TabPane>
                  <TabPane tab="Core" key="core">
                    <OfferPreview offer={generatedOffer.signatureOffers.core} pricing={generatedOffer.pricing.core} />
                  </TabPane>
                  <TabPane tab="Premium" key="premium">
                    <OfferPreview offer={generatedOffer.signatureOffers.premium} pricing={generatedOffer.pricing.premium} />
                  </TabPane>
                </Tabs>
              </Card>

              <Card title="Offer Comparison">
                <Table
                  dataSource={generatedOffer.comparisonTable.features}
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
                      {generatedOffer.pricing.starter}
                    </Title>
                    <Text type="secondary">{generatedOffer.signatureOffers.starter.term}</Text>
                  </div>
                  <div className="text-center p-4 border rounded bg-blue-50">
                    <Title level={4}>Core</Title>
                    <Title level={2} className="text-blue-800">
                      {generatedOffer.pricing.core}
                    </Title>
                    <Text type="secondary">{generatedOffer.signatureOffers.core.term}</Text>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <Title level={4}>Premium</Title>
                    <Title level={2} className="text-purple-600">
                      {generatedOffer.pricing.premium}
                    </Title>
                    <Text type="secondary">{generatedOffer.signatureOffers.premium.term}</Text>
                  </div>
                </div>
              </Card>

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
            </div>
          )}
        </TabPane>

        <TabPane
          tab={
            <span>
              <HistoryOutlined />
              History
            </span>
          }
          key="history"
        >
          <Card title="Your Saved Offers">
            <div className="text-center py-12">
              <HistoryOutlined style={{ fontSize: "48px", color: "#ccc" }} />
              <Title level={4} type="secondary">
                No Saved Offers Yet
              </Title>
              <Text type="secondary">Your generated offers will appear here once you save them.</Text>
            </div>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
}

function OfferPreview({ offer, pricing }: { offer: GeneratedOffer["signatureOffers"]["starter"]; pricing: string }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Title level={3}>{offer.name}</Title>
          <Title level={4} type="secondary">
            {pricing}
          </Title>
        </div>
        <Button type="primary">Use This Offer</Button>
      </div>
      <div>
        <Text strong>Who it&apos;s for:</Text>
        <Paragraph>{offer.for}</Paragraph>
      </div>
      <div>
        <Text strong>Core promise:</Text>
        <Paragraph>{offer.promise}</Paragraph>
      </div>
      <div>
        <Text strong>What you do:</Text>
        <ul className="list-disc pl-5 mt-2">
          {offer.scope.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
      <div>
        <Text strong>Proof & differentiators:</Text>
        <ul className="list-disc pl-5 mt-2">
          {offer.proof.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Text strong>Setup timeline:</Text>
          <Paragraph>{offer.timeline}</Paragraph>
        </div>
        <div>
          <Text strong>Success milestones:</Text>
          <ul className="list-disc pl-5 mt-2">
            {offer.milestones.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Text strong>Pricing model:</Text>
          <Paragraph>{offer.pricing}</Paragraph>
        </div>
        <div>
          <Text strong>Term:</Text>
          <Paragraph>{offer.term}</Paragraph>
        </div>
      </div>
      <div>
        <Text strong>Guarantee:</Text>
        <Paragraph>{offer.guarantee}</Paragraph>
      </div>
      <div>
        <Text strong>Client lift estimate:</Text>
        <Paragraph>{offer.clientLift}</Paragraph>
      </div>
      <div>
        <Text strong>Implementation requirements:</Text>
        <Paragraph>{offer.requirements}</Paragraph>
      </div>
    </div>
  );
}