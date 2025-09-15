"use client";

import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Typography,
  Space,
  Tag,
  Alert,
  Row,
  Col,
  Progress,
  Avatar,
  Tabs,
  Spin,
  notification,
  Divider,
} from "antd";
import {
  EyeOutlined,
  DownloadOutlined,
  CopyOutlined,
  StarOutlined,
  DollarOutlined,
  RiseOutlined,
  WalletOutlined,
  WarningOutlined,
  TagOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import { useWorkspaceContext } from "../../hooks/useWorkspaceContext";
import { useNicheResearcher } from "../../hooks/useNicheResearcher";
import { GeneratedNicheReport, MultiNicheReport } from "@/types/nicheResearcher";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface SavedNiche {
  id: string;
  title: string;
  content: GeneratedNicheReport | MultiNicheReport;
  createdAt: string;
  metadata?: {
    nicheName?: string;
    primaryObjective?: string;
    budget?: string;
    marketSize?: string;
    marketType?: string;
    totalNiches?: number;
  };
}

const NicheResearchDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { currentWorkspace } = useWorkspaceContext();
  const { getNicheReport } = useNicheResearcher();
  
  const [nicheReport, setNicheReport] = useState<SavedNiche | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNicheTab, setSelectedNicheTab] = useState(0);

useEffect(() => {
  const fetchNicheReport = async () => {
    if (!params.id) return;

    try {
      setLoading(true);
      const response = await getNicheReport(params.id as string);

      // Detailed debugging logs
      console.log("Raw API Response:", JSON.stringify(response, null, 2));
      if (isMultiNicheReport(response)) {
        console.log("MultiNicheReport detected. Comparison Matrix:", response.comparisonMatrix);
        console.log("Criteria:", response.comparisonMatrix?.criteria);
        console.log("Scores:", response.comparisonMatrix?.scores);
      }

      if (response) {
        const reportContent = response.report || response;
        const savedNiche: SavedNiche = {
          id: params.id as string,
          title: response.title || reportContent.title || "Niche Research Report",
          content: reportContent,
          createdAt: response.createdAt || new Date().toISOString(),
          metadata: {
            nicheName: isMultiNicheReport(reportContent)
              ? reportContent.niches[0]?.nicheOverview?.name
              : reportContent.nicheOverview?.name,
            primaryObjective: response.primaryObjective,
            budget: response.budget,
            marketSize: isMultiNicheReport(reportContent)
              ? reportContent.niches[0]?.marketDemand?.marketSize
              : reportContent.marketDemand?.marketSize,
            marketType: response.marketType,
            totalNiches: isMultiNicheReport(reportContent) ? reportContent.niches.length : 1,
          },
        };
        setNicheReport(savedNiche);
      } else {
        setError("Report not found");
      }
    } catch (err: any) {
      console.error("Failed to fetch niche report:", err);
      setError(err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  fetchNicheReport();
}, [params.id]);

  const handleBack = () => {
    router.push(`/niche-researcher`);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      notification.success({ message: "Text copied to clipboard!" });
    }).catch(() => {
      notification.error({ message: "Failed to copy text" });
    });
  };

  const handleExportReport = async (format: "html" | "json") => {
    try {
      const response = await fetch(`/api/niche-research/export/${params.id}?format=${format}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `niche-report-${params.id}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
        notification.success({ message: `Report exported as ${format.toUpperCase()}` });
      } else {
        throw new Error("Failed to export report");
      }
    } catch (err) {
      console.error("Export report error:", err);
      notification.error({ message: "Failed to export report" });
    }
  };

  // Type guards
  const isMultiNicheReport = (report: any): report is MultiNicheReport => {
    return report && report.niches && Array.isArray(report.niches) && report.niches.length > 1;
  };

  const isGeneratedNicheReport = (report: any): report is GeneratedNicheReport => {
    return report && report.nicheOverview !== undefined;
  };

  // Render detailed niche report
// Complete renderDetailedNicheReport function for NicheResearchDetailPage
const renderDetailedNicheReport = (reportData: GeneratedNicheReport) => {
  return (
    <>
      {/* Export buttons */}
      <Card className="mb-4">
        <div className="text-center">
          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleExportReport("html")}
              type="primary"
            >
              Download HTML Report
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => handleExportReport("json")}
            >
              Download JSON Data
            </Button>
          </Space>
        </div>
      </Card>

      {/* 1. Niche Overview */}
      <Card
        title="1. Niche Overview"
        className="mb-4 section-card"
        extra={<Tag color="blue">Overview</Tag>}
      >
        <Row gutter={16}>
          <Col span={12}>
            <div className="niche-header">
              <Title level={4} style={{ color: "#1890ff" }}>
                {reportData.nicheOverview?.name || "N/A"}
              </Title>
              <Space>
                <Text>{reportData.nicheOverview?.summary || "N/A"}</Text>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopyText(reportData.nicheOverview?.summary || "N/A")}
                >
                  Copy
                </Button>
              </Space>
            </div>
          </Col>
          <Col span={12}>
            <div className="fit-reason">
              <Title level={5}>Why This Niche Fits Your Inputs</Title>
              <div className="highlight-box">
                <Space>
                  <Text>{reportData.nicheOverview?.whyItFits || "N/A"}</Text>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyText(reportData.nicheOverview?.whyItFits || "N/A")}
                  >
                    Copy
                  </Button>
                </Space>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 2. Market Demand Snapshot */}
      <Card
        title="2. Market Demand Snapshot"
        className="mb-4 section-card"
        extra={<Tag color="green">Demand</Tag>}
      >
        <Row gutter={16}>
          <Col span={8}>
            <div className="metric-card">
              <div className="metric-icon">
                <DollarOutlined style={{ fontSize: "24px", color: "#52c41a" }} />
              </div>
              <Title level={5}>Market Size</Title>
              <Text className="metric-value">{reportData.marketDemand?.marketSize || "N/A"}</Text>
            </div>
          </Col>
          <Col span={8}>
            <div className="metric-card">
              <div className="metric-icon">
                <RiseOutlined style={{ fontSize: "24px", color: "#52c41a" }} />
              </div>
              <Title level={5}>Trend Signal</Title>
              <Tag
                color={
                  reportData.marketDemand?.trend === "growing"
                    ? "green"
                    : reportData.marketDemand?.trend === "plateauing"
                    ? "orange"
                    : "red"
                }
                className="trend-tag"
              >
                {reportData.marketDemand?.trend?.toUpperCase() || "N/A"}
              </Tag>
            </div>
          </Col>
          <Col span={8}>
            <div className="metric-card">
              <div className="metric-icon">
                <WalletOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
              </div>
              <Title level={5}>Willingness to Pay</Title>
              <Text className="metric-value">{reportData.marketDemand?.willingnessToPay || "N/A"}</Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 3. Customer Pain Points */}
      <Card
        title="3. Customer Pain Points"
        className="mb-4 section-card"
        extra={<Tag color="volcano">Pain Points</Tag>}
      >
        <Row gutter={16}>
          {reportData.painPoints?.map((point, index) => (
            <Col span={8} key={index}>
              <div className="pain-point-card">
                <div className="intensity-indicator">
                  <div
                    className={`intensity-level intensity-${point.intensity?.toLowerCase()}`}
                    title={`${point.intensity} intensity`}
                  ></div>
                </div>
                <Text strong>{point.problem || "N/A"}</Text>
                <div className="intensity-tag">
                  <Tag
                    color={
                      point.intensity?.toLowerCase() === "high"
                        ? "red"
                        : point.intensity?.toLowerCase() === "medium"
                        ? "orange"
                        : "blue"
                    }
                  >
                    {point.intensity} intensity
                  </Tag>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyText(point.problem || "N/A")}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </Col>
          )) || <Text>No pain points available</Text>}
        </Row>
      </Card>

      {/* 4. Competitive Landscape */}
      <Card
        title="4. Competitive Landscape"
        className="mb-4 section-card"
        extra={<Tag color="purple">Competition</Tag>}
      >
        <Title level={4}>Top Competitors</Title>
        <Row gutter={16} className="competitor-cards">
          {reportData.competitiveLandscape?.competitors.map((competitor, index) => (
            <Col span={8} key={index}>
              <Card
                className="competitor-card"
                size="small"
                actions={[
                  <span key="position">Market Position: {index + 1}</span>,
                  <span key="strength">Strength: {competitor.strength || "Unknown"}</span>,
                ]}
              >
                <Card.Meta
                  avatar={
                    <Avatar
                      size="large"
                      style={{ backgroundColor: ["#f56a00", "#7265e6", "#ffbf00", "#00a2ae"][index % 4] }}
                    >
                      {competitor.name.charAt(0)}
                    </Avatar>
                  }
                  title={competitor.name}
                  description={
                    <Space>
                      <Text ellipsis={{ tooltip: competitor.description }}>
                        {competitor.description || "N/A"}
                      </Text>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopyText(competitor.description || "N/A")}
                      >
                        Copy
                      </Button>
                    </Space>
                  }
                />
              </Card>
            </Col>
          )) || <Text>No competitors available</Text>}
        </Row>
        
        <Row gutter={16} className="mt-4">
          <Col span={12}>
            <Title level={4}>Gap Analysis</Title>
            <div className="highlight-box">
              <Space>
                <Text>{reportData.competitiveLandscape?.gapAnalysis || "N/A"}</Text>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopyText(reportData.competitiveLandscape?.gapAnalysis || "N/A")}
                >
                  Copy
                </Button>
              </Space>
            </div>
          </Col>
          <Col span={12}>
            <Title level={4}>Barrier to Entry</Title>
            <div className="barrier-indicator">
              <Progress
                percent={
                  reportData.competitiveLandscape?.barrierToEntry === "High"
                    ? 80
                    : reportData.competitiveLandscape?.barrierToEntry === "Medium"
                    ? 50
                    : 20
                }
                showInfo={false}
                status={
                  reportData.competitiveLandscape?.barrierToEntry === "High"
                    ? "exception"
                    : reportData.competitiveLandscape?.barrierToEntry === "Medium"
                    ? "active"
                    : "success"
                }
              />
              <Tag
                color={
                  reportData.competitiveLandscape?.barrierToEntry === "High"
                    ? "red"
                    : reportData.competitiveLandscape?.barrierToEntry === "Medium"
                    ? "orange"
                    : "green"
                }
                className="barrier-tag"
              >
                {reportData.competitiveLandscape?.barrierToEntry || "N/A"}
              </Tag>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 5. Arbitrage Opportunity */}
      <Card
        title="5. Arbitrage Opportunity"
        className="mb-4 section-card"
        extra={<Tag color="cyan">Opportunity</Tag>}
      >
        <Space>
          <Text>{reportData.arbitrageOpportunity?.explanation || "N/A"}</Text>
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopyText(reportData.arbitrageOpportunity?.explanation || "N/A")}
          >
            Copy
          </Button>
        </Space>
        <div className="mt-3 p-3 opportunity-highlight">
          <Title level={5}>Concrete Angle:</Title>
          <Space>
            <Text>{reportData.arbitrageOpportunity?.concreteAngle || "N/A"}</Text>
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopyText(reportData.arbitrageOpportunity?.concreteAngle || "N/A")}
            >
              Copy
            </Button>
          </Space>
        </div>
      </Card>

      {/* 6. Suggested Entry Offers */}
      <Card
        title="6. Suggested Entry Offers"
        className="mb-4 section-card"
        extra={<Tag color="gold">Offers</Tag>}
      >
        <Row gutter={16}>
          {reportData.entryOffers?.map((offer, index) => (
            <Col span={12} key={index}>
              <Card
                className="offer-card"
                type="inner"
                title={
                  <span>
                    <StarOutlined /> {offer.positioning || "N/A"}
                  </span>
                }
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <div className="offer-detail">
                      <DollarOutlined className="offer-icon" />
                      <div>
                        <Text strong>Business Model:</Text>
                        <br />
                        <Space>
                          <Text>{offer.businessModel || "N/A"}</Text>
                          <Button
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => handleCopyText(offer.businessModel || "N/A")}
                          >
                            Copy
                          </Button>
                        </Space>
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="offer-detail">
                      <TagOutlined className="offer-icon" />
                      <div>
                        <Text strong>Price Point:</Text>
                        <br />
                        <Space>
                          <Text>{offer.pricePoint || "N/A"}</Text>
                          <Button
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => handleCopyText(offer.pricePoint || "N/A")}
                          >
                            Copy
                          </Button>
                        </Space>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          )) || <Text>No entry offers available</Text>}
        </Row>
      </Card>

      {/* 7. Go-To-Market Strategy */}
      <Card
        title="7. Go-To-Market Strategy"
        className="mb-4 section-card"
        extra={<Tag color="lime">GTM</Tag>}
      >
        <Row gutter={16}>
          <Col span={12}>
            <div className="strategy-card primary">
              <Title level={5}>Primary Channel</Title>
              <Space>
                <Text className="channel-name">{reportData.gtmStrategy?.primaryChannel || "N/A"}</Text>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopyText(reportData.gtmStrategy?.primaryChannel || "N/A")}
                >
                  Copy
                </Button>
              </Space>
            </div>
          </Col>
          <Col span={12}>
            <div className="strategy-card">
              <Title level={5}>Justification</Title>
              <Space>
                <Text>{reportData.gtmStrategy?.justification || "N/A"}</Text>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopyText(reportData.gtmStrategy?.justification || "N/A")}
                >
                  Copy
                </Button>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 8. Scalability & Exit Potential */}
      <Card
        title="8. Scalability & Exit Potential"
        className="mb-4 section-card"
        extra={<Tag color="magenta">Growth</Tag>}
      >
        <Row gutter={16}>
          <Col span={12}>
            <div className="scalability-card">
              <Title level={5}>Scalability Score</Title>
              <div className="score-display">
                <Progress
                  type="circle"
                  percent={
                    reportData.scalabilityExit?.scalabilityScore === "High"
                      ? 80
                      : reportData.scalabilityExit?.scalabilityScore === "Medium"
                      ? 50
                      : 30
                  }
                  width={80}
                  status={
                    reportData.scalabilityExit?.scalabilityScore === "High"
                      ? "success"
                      : reportData.scalabilityExit?.scalabilityScore === "Medium"
                      ? "normal"
                      : "exception"
                  }
                />
                <Tag
                  color={
                    reportData.scalabilityExit?.scalabilityScore === "High"
                      ? "green"
                      : reportData.scalabilityExit?.scalabilityScore === "Medium"
                      ? "orange"
                      : "blue"
                  }
                  className="score-tag"
                >
                  {reportData.scalabilityExit?.scalabilityScore || "N/A"}
                </Tag>
              </div>
            </div>
          </Col>
          <Col span={12}>
            <div className="exit-card">
              <Title level={5}>Exit Potential</Title>
              <div className="highlight-box">
                <Space>
                  <Text>{reportData.scalabilityExit?.exitPotential || "N/A"}</Text>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyText(reportData.scalabilityExit?.exitPotential || "N/A")}
                  >
                    Copy
                  </Button>
                </Space>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 9. Risk Factors & Constraints */}
      <Card
        title="9. Risk Factors & Constraints"
        className="mb-4 section-card"
        extra={<Tag color="red">Risks</Tag>}
      >
        <Row gutter={16}>
          {reportData.riskFactors?.map((risk, index) => (
            <Col span={8} key={index}>
              <div className="risk-card">
                <WarningOutlined className="risk-icon" />
                <Text strong>{risk.risk || "N/A"}</Text>
                <div className="risk-impact">
                  <Tag
                    color={
                      risk.impact?.toLowerCase().includes("high")
                        ? "red"
                        : risk.impact?.toLowerCase().includes("medium")
                        ? "orange"
                        : "blue"
                    }
                  >
                    Impact: {risk.impact || "N/A"}
                  </Tag>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyText(risk.risk || "N/A")}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </Col>
          )) || <Text>No risk factors available</Text>}
        </Row>
      </Card>

      {/* 10. Difficulty vs Reward Scorecard */}
      <Card
        title="10. Difficulty vs Reward Scorecard"
        className="mb-4 section-card"
        extra={<Tag color="geekblue">Scorecard</Tag>}
      >
        <Row gutter={16}>
          <Col span={6}>
            <div className="scorecard-metric">
              <Title level={5}>Market Demand</Title>
              <div className="score-indicator">
                <Progress
                  percent={
                    reportData.scorecard?.marketDemand === "High"
                      ? 90
                      : reportData.scorecard?.marketDemand === "Medium"
                      ? 60
                      : 30
                  }
                  showInfo={false}
                  status="active"
                  strokeColor={
                    reportData.scorecard?.marketDemand === "High"
                      ? "#52c41a"
                      : reportData.scorecard?.marketDemand === "Medium"
                      ? "#faad14"
                      : "#f5222d"
                  }
                />
                <Tag
                  color={
                    reportData.scorecard?.marketDemand === "High"
                      ? "green"
                      : reportData.scorecard?.marketDemand === "Medium"
                      ? "orange"
                      : "red"
                  }
                  className="scorecard-tag"
                >
                  {reportData.scorecard?.marketDemand || "N/A"}
                </Tag>
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div className="scorecard-metric">
              <Title level={5}>Competition Intensity</Title>
              <div className="score-indicator">
                <Progress
                  percent={
                    reportData.scorecard?.competition === "High"
                      ? 90
                      : reportData.scorecard?.competition === "Medium"
                      ? 60
                      : 30
                  }
                  showInfo={false}
                  status="active"
                  strokeColor={
                    reportData.scorecard?.competition === "High"
                      ? "#f5222d"
                      : reportData.scorecard?.competition === "Medium"
                      ? "#faad14"
                      : "#52c41a"
                  }
                />
                <Tag
                  color={
                    reportData.scorecard?.competition === "High"
                      ? "red"
                      : reportData.scorecard?.competition === "Medium"
                      ? "orange"
                      : "green"
                  }
                  className="scorecard-tag"
                >
                  {reportData.scorecard?.competition || "N/A"}
                </Tag>
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div className="scorecard-metric">
              <Title level={5}>Ease of Entry</Title>
              <div className="score-indicator">
                <Progress
                  percent={
                    reportData.scorecard?.easeOfEntry === "High"
                      ? 90
                      : reportData.scorecard?.easeOfEntry === "Medium"
                      ? 60
                      : 30
                  }
                  showInfo={false}
                  status="active"
                  strokeColor={
                    reportData.scorecard?.easeOfEntry === "High"
                      ? "#52c41a"
                      : reportData.scorecard?.easeOfEntry === "Medium"
                      ? "#faad14"
                      : "#f5222d"
                  }
                />
                <Tag
                  color={
                    reportData.scorecard?.easeOfEntry === "High"
                      ? "green"
                      : reportData.scorecard?.easeOfEntry === "Medium"
                      ? "orange"
                      : "red"
                  }
                  className="scorecard-tag"
                >
                  {reportData.scorecard?.easeOfEntry || "N/A"}
                </Tag>
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div className="scorecard-metric">
              <Title level={5}>Profitability Potential</Title>
              <div className="score-indicator">
                <Progress
                  percent={
                    reportData.scorecard?.profitability === "High"
                      ? 90
                      : reportData.scorecard?.profitability === "Medium"
                      ? 60
                      : 30
                  }
                  showInfo={false}
                  status="active"
                  strokeColor={
                    reportData.scorecard?.profitability === "High"
                      ? "#52c41a"
                      : reportData.scorecard?.profitability === "Medium"
                      ? "#faad14"
                      : "#f5222d"
                  }
                />
                <Tag
                  color={
                    reportData.scorecard?.profitability === "High"
                      ? "green"
                      : reportData.scorecard?.profitability === "Medium"
                      ? "orange"
                      : "red"
                  }
                  className="scorecard-tag"
                >
                  {reportData.scorecard?.profitability || "N/A"}
                </Tag>
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    </>
  );
};
  // Render multi-niche report
 const renderMultiNicheReport = (multiNicheReport: MultiNicheReport) => {
const renderComparisonMatrix = (report: MultiNicheReport) => {
  // Map frontend criteria to backend scores keys
  const keyMap: Record<string, string> = {
    'Market Demand': 'marketDemand',
    'Competition Level': 'competitionLevel',
    'Skill Fit': 'skillFit',
    'Budget Alignment': 'budgetAlignment',
    'Time to Revenue': 'timeToRevenue',
  };

  // Debugging: Log the comparisonMatrix structure
  console.log("Rendering Comparison Matrix. Data:", JSON.stringify(report.comparisonMatrix, null, 2));
  report.comparisonMatrix?.scores?.forEach((score, index) => {
    console.log(`Niche ${index} scores keys:`, Object.keys(score.scores));
  });

  if (
    !report.comparisonMatrix ||
    !report.comparisonMatrix.criteria ||
    !report.comparisonMatrix.scores ||
    report.comparisonMatrix.criteria.length === 0 ||
    report.comparisonMatrix.scores.length === 0
  ) {
    return (
      <Card title="Comparison Matrix" className="mb-4">
        <Alert
          message="Comparison data not available"
          description="The comparison matrix data is missing or incomplete. Please check the API response or regenerate the report."
          type="warning"
          showIcon
        />
      </Card>
    );
  }

  return (
    <Card title="Compare All Niches" className="mb-4">
      <div className="comparison-table">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-3 text-left ">Criteria</th>
              {report.niches.map((niche, index) => (
                <th key={index} className="border p-3 text-center ">
                  {niche.nicheOverview?.name || `Niche ${index + 1}`}
                  {index === report.recommendedNiche && (
                    <Tag color="gold" className="ml-1">
                      ★
                    </Tag>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.comparisonMatrix.criteria.map((criterion, criterionIndex) => (
              <tr key={criterionIndex}>
                <td className="border p-3 font-medium">{criterion}</td>
                {report.comparisonMatrix.scores.map((score, scoreIndex) => {
                  // Use the keyMap to get the correct backend key
                  const backendKey = keyMap[criterion];
                  const scoreValue = backendKey ? score.scores[backendKey] : undefined;
                  // Debugging: Log each score access
                  console.log(
                    `Accessing score for niche ${score.nicheIndex}, criterion "${criterion}" (backendKey: "${backendKey}"):`,
                    scoreValue
                  );
                  return (
                    <td key={scoreIndex} className="border p-3 text-center">
                      {scoreValue !== undefined && scoreValue !== null ? (
                        <Progress
                          type="circle"
                          percent={Number(scoreValue)}
                          width={50}
                          format={() => `${scoreValue}%`}
                        />
                      ) : (
                        <Text type="secondary">N/A</Text>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

  return (
    <>
      <Card className="mb-6 recommendation-banner">
        <div className="text-center">
          <Title level={2}>Your Top {multiNicheReport.niches.length} Niche Opportunities</Title>
          <Alert
            message={`Recommended: ${
              multiNicheReport.niches[multiNicheReport.recommendedNiche || 0].nicheOverview?.name ||
              'N/A'
            }`}
            description={multiNicheReport.recommendationReason || 'No recommendation reason provided.'}
            type="success"
            showIcon
            className="mb-4"
          />
        </div>
      </Card>

      <Card className="mb-4">
        <Tabs
          activeKey={selectedNicheTab.toString()}
          onChange={(key) => setSelectedNicheTab(parseInt(key))}
          type="card"
        >
          {multiNicheReport.niches.map((niche, index) => (
            <TabPane
              key={index.toString()}
              tab={
                <span>
                  {niche.nicheOverview?.name || `Niche ${index + 1}`}
                  {index === multiNicheReport.recommendedNiche && (
                    <Tag color="gold" style={{ marginLeft: 8 }}>
                      Recommended
                    </Tag>
                  )}
                </span>
              }
            >
              {renderDetailedNicheReport(niche)}
            </TabPane>
          ))}
        </Tabs>
      </Card>

      {/* Place Comparison Matrix here, after the Tabs */}
      {renderComparisonMatrix(multiNicheReport)}
    </>
  );
};

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Spin size="large" tip="Loading niche report..." />
        </div>
      </div>
    );
  }

  if (error || !nicheReport) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Alert
          message="Error Loading Report"
          description={error || "The requested report could not be found."}
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={handleBack}>
              Back to Niche Researcher
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
          Back to Niche Researcher
        </Button>
        
        <div className="flex justify-between items-start">
          <div>
            <Title level={2}>{nicheReport.title}</Title>
            <Text type="secondary">
              Created on {new Date(nicheReport.createdAt).toLocaleDateString()}
            </Text>
            {nicheReport.metadata && (
              <div className="mt-2">
                {nicheReport.metadata.nicheName && (
                  <Tag color="blue">{nicheReport.metadata.nicheName}</Tag>
                )}
                {nicheReport.metadata.primaryObjective && (
                  <Tag color="green">{nicheReport.metadata.primaryObjective}</Tag>
                )}
                {nicheReport.metadata.budget && (
                  <Tag color="purple">{nicheReport.metadata.budget}</Tag>
                )}
                {nicheReport.metadata.totalNiches && (
                  <Tag color="gold">Multi-Niche Report ({nicheReport.metadata.totalNiches})</Tag>
                )}
              </div>
            )}
          </div>
          
          <Space>
            <Button 
              icon={<DownloadOutlined />}
              onClick={() => handleExportReport("html")}
              type="primary"
            >
              Export HTML
            </Button>
            <Button 
              icon={<DownloadOutlined />}
              onClick={() => handleExportReport("json")}
            >
              Export JSON
            </Button>
          </Space>
        </div>
      </div>

      {/* Report Content */}
      <div className="report-content">
        {isMultiNicheReport(nicheReport.content) ? (
          renderMultiNicheReport(nicheReport.content)
        ) : isGeneratedNicheReport(nicheReport.content) ? (
          renderDetailedNicheReport(nicheReport.content)
        ) : (
          <Alert
            message="Unknown Report Format"
            description="This report format is not recognized."
            type="warning"
            showIcon
          />
        )}
      </div>

      <Divider />

      <div className="text-center">
        <Space>
          <Button onClick={handleBack}>
            Back to List
          </Button>
          <Button 
            type="primary" 
            onClick={() => router.push(`/dashboard/${currentWorkspace?.slug}/niche-researcher`)}
          >
            Generate New Report
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default NicheResearchDetailPage;