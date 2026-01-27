"use client";

import { useSavedNiche, SavedNiche } from "../hooks/useSavedNiche";
import { useNicheResearcher } from "../hooks/useNicheResearcher";
import { useWorkspaceContext } from "../hooks/useWorkspaceContext";
import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Spin,
  Modal,
  Typography,
  Space,
  Tag,
  message,
  Tooltip,
  Alert,
  Select,
  Row,
  Col,
  Progress,
  Avatar,
  List,
  Tabs,
  Table
} from "antd";
import {
  EyeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  HistoryOutlined,
  CopyOutlined,
  DownloadOutlined,
  DollarOutlined,
  RiseOutlined,
  WalletOutlined,
  WarningOutlined,
  StarOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { GeneratedNicheReport, MultiNicheReport } from "@/types/nicheResearcher";

import { ConfigProvider } from "antd";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

import { useRouter } from 'next/navigation';

interface SavedNicheHistoryProps {
  compactMode?: boolean;
}


export const SavedNicheHistory: React.FC<SavedNicheHistoryProps> = ({ compactMode = false }) => {
  const { niches, loading, fetchNiches } = useSavedNiche();
  const { getNicheReport } = useNicheResearcher();
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState<SavedNiche | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<"createdAt" | "title">("createdAt");
  const [sortOrder, setSortOrder] = useState<"ascend" | "descend">("descend");
  const [selectedNicheTab, setSelectedNicheTab] = useState(0);
  const [viewLoadingStates, setViewLoadingStates] = useState<{[key: string]: boolean}>({});

  const pageSize = 1;

      const router = useRouter();

  useEffect(() => {
    if (isWorkspaceReady && currentWorkspace) {
      fetchNiches();
    }
  }, [fetchNiches, isWorkspaceReady, currentWorkspace?.id]);

 const showNicheDetails = async (niche: SavedNiche) => {
  setViewLoadingStates(prev => ({ ...prev, [niche.id]: true }));
  console.log("Selected Niche:", niche);
  setModalLoading(true);
  setModalError(null);
  try {
    const report = await getNicheReport(niche.id);
    console.log("Fetched Report:", report);
    setSelectedNiche({ ...niche, content: report.report });
    setIsModalVisible(true);
    // Reset to first tab when opening a new report
    setSelectedNicheTab(0);
  } catch (error) {
    console.error("Failed to fetch niche report:", error);
    setModalError("Failed to load niche report details. Please try again.");
  } finally {
    setModalLoading(false);
    setViewLoadingStates(prev => ({ ...prev, [niche.id]: false }));
  }
};

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedNiche(null);
    setModalError(null);
    setSelectedNicheTab(0);
  };

  const handleDeleteNiche = (nicheId: string) => {
    Modal.confirm({
      title: "Delete Niche Report",
      content: "Are you sure you want to delete this niche report? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          const response = await fetch(`/api/niche-research/${nicheId}`, {
            method: "DELETE",
          });
          if (response.ok) {
            await fetchNiches();
            message.success("Niche report deleted successfully");
            if (selectedNiche?.id === nicheId) {
              handleModalClose();
            }
            if (niches.length % pageSize === 1 && currentPage > 1) {
              setCurrentPage(currentPage - 1);
            }
          } else {
            throw new Error("Failed to delete niche report");
          }
        } catch (error) {
          console.error("Delete niche error:", error);
          message.error("Failed to delete niche report");
        }
      },
    });
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success("Text copied to clipboard!");
    }).catch(() => {
      message.error("Failed to copy text");
    });
  };

  const handleExportReport = async (reportId: string, format: "html" | "json") => {
    try {
      const response = await fetch(`/api/niche-research/export/${reportId}?format=${format}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `niche-report-${reportId}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
        message.success(`Report exported as ${format.toUpperCase()}`);
      } else {
        throw new Error("Failed to export report");
      }
    } catch (error) {
      console.error("Export report error:", error);
      message.error("Failed to export report");
    }
  };

  // Check if a report is a multi-niche report
 const isMultiNicheReport = (report: any): report is MultiNicheReport => {
  return report && report.niches && Array.isArray(report.niches) && report.niches.length > 1 && 
         report.recommendedNiche !== undefined && report.recommendationReason !== undefined;
};


// Check if a report is a single niche report (legacy format stored in niches array)
const isLegacySingleNicheReport = (report: any): report is { niches: GeneratedNicheReport[] } => {
  return report && report.niches && Array.isArray(report.niches) && report.niches.length === 1;
};

// Check if a report is a regular single niche report
const isSingleNicheReport = (report: any): report is GeneratedNicheReport => {
  return report && report.nicheOverview !== undefined;
};


  // Render multi-niche report view
const renderMultiNicheReport = (multiNicheReport: MultiNicheReport, reportId: string) => {
  return (
    <>
      {/* Recommendation Banner */}
      <Card className="mb-6 recommendation-banner">
        <div className="text-center">
          <Title level={2}>Your Top {multiNicheReport.niches.length} Niche Opportunities</Title>
          <Alert
            message={`Recommended: ${multiNicheReport.niches[multiNicheReport.recommendedNiche].nicheOverview?.name}`}
            description={multiNicheReport.recommendationReason}
            type="success"
            showIcon
            className="mb-4"
          />
        </div>
      </Card>

      {/* Comparison Matrix */}
      {renderComparisonMatrix(multiNicheReport)}

      {/* Niche Selection Tabs */}
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
                    <Tag color="gold" style={{ marginLeft: 8 }}>Recommended</Tag>
                  )}
                </span>
              }
            >
              {renderDetailedNicheReport(niche, reportId)}
            </TabPane>
          ))}
        </Tabs>
      </Card>

      <Card className="mb-4">
        <div className="text-center">
          <Space>
            {/* <Button
              key="export-html"
              icon={<DownloadOutlined />}
              onClick={() => handleExportReport(reportId, "html")}
              type="primary"
            >
              Download Full HTML Report
            </Button> */}
            {/* <Button
              key="export-json"
              icon={<DownloadOutlined />}
              onClick={() => handleExportReport(reportId, "json")}
            >
              Download JSON Data
            </Button> */}
          </Space>
        </div>
      </Card>
    </>
  );
};
  // Render comparison matrix for multi-niche reports
  const renderComparisonMatrix = (multiNicheReport: MultiNicheReport) => {
    if (!multiNicheReport.comparisonMatrix) return null;

    const columns = [
      {
        title: 'Criteria',
        dataIndex: 'criterion',
        key: 'criterion',
        width: '25%',
      },
      ...multiNicheReport.niches.map((niche, index) => ({
        title: (
          <div>
            {niche.nicheOverview?.name || `Niche ${index + 1}`}
            {index === multiNicheReport.recommendedNiche && (
              <Tag color="gold" style={{ marginLeft: 8 }}>Recommended</Tag>
            )}
          </div>
        ),
        dataIndex: `niche${index}`,
        key: `niche${index}`,
        render: (score: number) => (
          <Progress 
            type="circle" 
            percent={score} 
            width={50}
            format={percent => `${percent}%`}
          />
        ),
      })),
    ];

    const dataSource = multiNicheReport.comparisonMatrix.criteria.map((criterion, idx) => {
      const row: any = { key: idx, criterion };
      multiNicheReport.comparisonMatrix.scores.forEach((scoreObj, nicheIdx) => {
        row[`niche${nicheIdx}`] = Object.values(scoreObj.scores)[idx];
      });
      return row;
    });

    return (
      <Card title="Niche Comparison Matrix" className="mb-4">
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          size="small"
        />
      </Card>
    );
  };

  // Render detailed niche report for a single niche
// Render detailed niche report for a single niche
const renderDetailedNicheReport = (reportData: GeneratedNicheReport, reportId: string) => {
  return (
    <>
      <Card className="mb-4">
        <div className="text-center">
          <Space>
            <Button
              key="export-html"
              icon={<DownloadOutlined />}
              onClick={() => handleExportReport(reportId, "html")}
              type="primary"
            >
              Download HTML Report
            </Button>
            <Button
              key="export-json"
              icon={<DownloadOutlined />}
              onClick={() => handleExportReport(reportId, "json")}
            >
              Download JSON Data
            </Button>
          </Space>
        </div>
      </Card>

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

  // Sort niches based on sortKey and sortOrder
  const sortedNiches = [...niches].sort((a, b) => {
    if (sortKey === "title") {
      return sortOrder === "ascend" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
    }
    return sortOrder === "ascend"
      ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Paginate niches
  const paginatedNiches = sortedNiches.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (!isWorkspaceReady) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">


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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Alert
          message="Workspace Required"
          description="The niche report history must be accessed from within a workspace. Please navigate to a workspace first."
          type="error"
          showIcon
          action={
            <Button key="dashboard" type="primary" href="/dashboard">
              Go to Dashboard
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Card
        title="Your Saved Niche Reports"
        extra={
          <Space>
            <Select
              value={`${sortKey}-${sortOrder}`}
              style={{ width: 180 }}
              onChange={(value) => {
                const [key, order] = value.split("-") as ["createdAt" | "title", "ascend" | "descend"];
                setSortKey(key);
                setSortOrder(order);
                setCurrentPage(1);
              }}
            >
              <Option value="createdAt-descend">Newest First</Option>
              <Option value="createdAt-ascend">Oldest First</Option>
              <Option value="title-ascend">Title A-Z</Option>
              <Option value="title-descend">Title Z-A</Option>
            </Select>
            <Button
              key="refresh"
              icon={<ReloadOutlined />}
              onClick={() => {
                fetchNiches();
                setCurrentPage(1);
              }}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        }
      >
        {loading ? (
          <div className="text-center py-8">

            <ConfigProvider
  theme={{
    token: {
      colorPrimary: '#5CC49D',
    },
  }}
>
   <Spin size="large" tip="Loading your niche reports..." />
</ConfigProvider>
         
          </div>
        ) : niches.length === 0 ? (
          <div className="text-center py-12">
            <HistoryOutlined style={{ fontSize: "48px", color: "#ccc" }} />
            <Title level={4} type="secondary">
              No Saved Niche Reports Yet
            </Title>
            <Text type="secondary">
              Your generated niche reports will appear here.
            </Text>
            <div className="mt-4">
              <Button key="create-niche" type="primary" href="/niche-researcher">
                Create Your First Niche Report
              </Button>
            </div>
          </div>
        ) : (
          <List
            dataSource={paginatedNiches}
            renderItem={(niche: SavedNiche) => (
              <List.Item>
                <Card
                  key={niche.id}
                  size="small"
                  className="w-full border-l-4 border-l-green-500"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <Text strong>{niche.title}</Text>
                      <div className="text-sm">
                        {niche.metadata?.nicheName && (
                          <Tag color="blue">{niche.metadata.nicheName}</Tag>
                        )}
                        {niche.metadata?.primaryObjective && (
                          <Tag color="green">{niche.metadata.primaryObjective}</Tag>
                        )}
                        {niche.metadata?.budget && (
                          <Tag color="purple">{niche.metadata.budget}</Tag>
                        )}
                        {niche.metadata?.totalNiches && (
                          <Tag color="gold">
                            Multi-Niche Report ({niche.metadata.totalNiches})
                          </Tag>
                        )}
                        {selectedNiche?.id === niche.id && (
                          <Tag color="cyan">Currently Viewing</Tag>
                        )}
                      </div>
                    </div>
                    <Space>
                    <Tooltip title="View this niche report">
  <Button
    key="view"
    size="small"
    type={selectedNiche?.id === niche.id ? "primary" : "default"}
    icon={viewLoadingStates[niche.id] ? <Spin size="small" /> : <EyeOutlined />}
    loading={viewLoadingStates[niche.id]}
    onClick={() => router.push(`/niche-researcher/${niche.id}`)}
    disabled={viewLoadingStates[niche.id]}
  >
    View
  </Button>
</Tooltip>
                      <Tooltip title="Delete this niche report">
                        <Button
                          key="delete"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteNiche(niche.id)}
                        >
                          Delete
                        </Button>
                      </Tooltip>
                    </Space>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div>
                      <Text className="text-sm font-medium">Market Size:</Text>
                      <div>{niche.metadata?.marketSize || "N/A"}</div>
                    </div>
                    <div>
                      <Text className="text-sm font-medium">Created:</Text>
                      <div>{new Date(niche.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <Text className="text-sm font-medium">Market Type:</Text>
                      <div>{niche.metadata?.marketType || "N/A"}</div>
                    </div>
                  </div>
                </Card>
              </List.Item>
            )}
            pagination={{
              current: currentPage,
              pageSize,
              total: niches.length,
              onChange: (page) => setCurrentPage(page),
              showSizeChanger: false,
              position: "bottom",
              align: "center",
            }}
          />
        )}
      </Card>

      <Modal
        title={selectedNiche?.title || "Niche Report Details"}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={[
          <Button key="close" onClick={handleModalClose}>
            Close
          </Button>,
        ]}
        width={1200}
        style={{ top: 20 }}
      >
       {modalLoading ? (
  <div className="text-center py-4">

    <ConfigProvider
  theme={{
    token: {
      colorPrimary: '#5CC49D',
    },
  }}
>
<Spin size="large" tip="Loading niche report details..."/>
</ConfigProvider>
    
  </div>
) : modalError ? (
  <Alert
    message="Error"
    description={modalError}
    type="error"
    showIcon
  />
) : selectedNiche && selectedNiche.content ? (
  <div style={{ maxHeight: "80vh", overflowY: "auto" }}>
    {isMultiNicheReport(selectedNiche.content) ? (
      renderMultiNicheReport(selectedNiche.content, selectedNiche.id)
    ) : isLegacySingleNicheReport(selectedNiche.content) ? (
      // Handle legacy single niche reports that are stored in a niches array
      renderDetailedNicheReport(
        selectedNiche.content.niches[0],
        selectedNiche.id
      )
    ) : isSingleNicheReport(selectedNiche.content) ? (
      // Handle regular single niche reports
      renderDetailedNicheReport(selectedNiche.content, selectedNiche.id)
    ) : (
      <Alert
        message="Unknown Report Format"
        description="This report format is not recognized. It may be from an older version of the application."
        type="warning"
        showIcon
      />
    )}
  </div>
) : (
  <Alert
    message="No Content Available"
    description="The niche report content is missing or incomplete. This could be due to a data issue or an incomplete report generation. Try generating a new report or contact support."
    type="warning"
    showIcon
    action={
      <Button key="create-niche" type="primary" href="/niche-research">
        Create New Report
      </Button>
    }
  />
)}
      </Modal>
    </div>
  );
};