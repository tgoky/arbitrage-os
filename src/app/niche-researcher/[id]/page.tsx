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
  ConfigProvider,
  theme,
  Table
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

// Color constants
const SPACE_COLOR = '#9DA2B3';
const BRAND_GREEN = '#5CC49D';
const DARK_BG = '#000000';
const SURFACE_BG = '#000000';
const SURFACE_LIGHTER = '#000000';
const TEXT_PRIMARY = '#f1f5f9';
const TEXT_SECONDARY = '#94a3b8';
const BORDER_COLOR = '#334155';

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
  const renderDetailedNicheReport = (reportData: GeneratedNicheReport) => {
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
            }
          }
        }}
      >
        <>
          {/* Export buttons */}
          <Card className="mb-4" style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
            <div className="text-center">
              <Space>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => handleExportReport("html")}
                  type="primary"
                  style={{
                    backgroundColor: BRAND_GREEN,
                    borderColor: BRAND_GREEN,
                    color: '#000000',
                    fontWeight: '500'
                  }}
                >
                  Download HTML Report
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => handleExportReport("json")}
                  style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
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
            extra={<Tag color="blue" style={{ background: 'rgba(24, 144, 255, 0.1)', color: '#1890ff' }}>Overview</Tag>}
            style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <div className="niche-header">
                  <Title level={4} style={{ color: BRAND_GREEN }}>
                    {reportData.nicheOverview?.name || "N/A"}
                  </Title>
                  <Space>
                    <Text style={{ color: TEXT_PRIMARY }}>{reportData.nicheOverview?.summary || "N/A"}</Text>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => handleCopyText(reportData.nicheOverview?.summary || "N/A")}
                      style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                    >
                      Copy
                    </Button>
                  </Space>
                </div>
              </Col>
              <Col span={12}>
                <div className="fit-reason">
                  <Title level={5} style={{ color: TEXT_PRIMARY }}>Why This Niche Fits Your Inputs</Title>
                  <div className="highlight-box" style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}>
                    <Space>
                      <Text style={{ color: TEXT_PRIMARY }}>{reportData.nicheOverview?.whyItFits || "N/A"}</Text>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopyText(reportData.nicheOverview?.whyItFits || "N/A")}
                        style={{ background: SURFACE_BG, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
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
            extra={<Tag color="green" style={{ background: 'rgba(82, 196, 26, 0.1)', color: '#52c41a' }}>Demand</Tag>}
            style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <div className="metric-card" style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}>
                  <div className="metric-icon">
                    <DollarOutlined style={{ fontSize: "24px", color: BRAND_GREEN }} />
                  </div>
                  <Title level={5} style={{ color: TEXT_PRIMARY }}>Market Size</Title>
                  <Text className="metric-value" style={{ color: TEXT_PRIMARY }}>{reportData.marketDemand?.marketSize || "N/A"}</Text>
                </div>
              </Col>
              <Col span={8}>
                <div className="metric-card" style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}>
                  <div className="metric-icon">
                    <RiseOutlined style={{ fontSize: "24px", color: BRAND_GREEN }} />
                  </div>
                  <Title level={5} style={{ color: TEXT_PRIMARY }}>Trend Signal</Title>
                  <Tag
                    color={
                      reportData.marketDemand?.trend === "growing"
                        ? "green"
                        : reportData.marketDemand?.trend === "plateauing"
                        ? "orange"
                        : "red"
                    }
                    className="trend-tag"
                    style={{ 
                      background: reportData.marketDemand?.trend === "growing" 
                        ? 'rgba(82, 196, 26, 0.1)' 
                        : reportData.marketDemand?.trend === "plateauing"
                        ? 'rgba(250, 173, 20, 0.1)'
                        : 'rgba(255, 77, 79, 0.1)',
                      color: reportData.marketDemand?.trend === "growing" 
                        ? '#52c41a' 
                        : reportData.marketDemand?.trend === "plateauing"
                        ? '#faad14'
                        : '#ff4d4f'
                    }}
                  >
                    {reportData.marketDemand?.trend?.toUpperCase() || "N/A"}
                  </Tag>
                </div>
              </Col>
              <Col span={8}>
                <div className="metric-card" style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}>
                  <div className="metric-icon">
                    <WalletOutlined style={{ fontSize: "24px", color: BRAND_GREEN }} />
                  </div>
                  <Title level={5} style={{ color: TEXT_PRIMARY }}>Willingness to Pay</Title>
                  <Text className="metric-value" style={{ color: TEXT_PRIMARY }}>{reportData.marketDemand?.willingnessToPay || "N/A"}</Text>
                </div>
              </Col>
            </Row>
          </Card>

          {/* 3. Customer Pain Points */}
          <Card
            title="3. Customer Pain Points"
            className="mb-4 section-card"
            extra={<Tag color="volcano" style={{ background: 'rgba(250, 84, 28, 0.1)', color: '#fa541c' }}>Pain Points</Tag>}
            style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
          >
            <Row gutter={16}>
              {reportData.painPoints?.map((point, index) => (
                <Col span={8} key={index}>
                  <div className="pain-point-card" style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}>
                    <div className="intensity-indicator">
                      <div
                        className={`intensity-level intensity-${point.intensity?.toLowerCase()}`}
                        style={{
                          background: point.intensity?.toLowerCase() === "high" 
                            ? '#ff4d4f' 
                            : point.intensity?.toLowerCase() === "medium" 
                            ? '#faad14' 
                            : '#1890ff'
                        }}
                        title={`${point.intensity} intensity`}
                      ></div>
                    </div>
                    <Text strong style={{ color: TEXT_PRIMARY }}>{point.problem || "N/A"}</Text>
                    <div className="intensity-tag">
                      <Tag
                        color={
                          point.intensity?.toLowerCase() === "high"
                            ? "red"
                            : point.intensity?.toLowerCase() === "medium"
                            ? "orange"
                            : "blue"
                        }
                        style={{
                          background: point.intensity?.toLowerCase() === "high" 
                            ? 'rgba(255, 77, 79, 0.1)' 
                            : point.intensity?.toLowerCase() === "medium" 
                            ? 'rgba(250, 173, 20, 0.1)' 
                            : 'rgba(24, 144, 255, 0.1)',
                          color: point.intensity?.toLowerCase() === "high" 
                            ? '#ff4d4f' 
                            : point.intensity?.toLowerCase() === "medium" 
                            ? '#faad14' 
                            : '#1890ff'
                        }}
                      >
                        {point.intensity} intensity
                      </Tag>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopyText(point.problem || "N/A")}
                        style={{ background: SURFACE_BG, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                </Col>
              )) || <Text style={{ color: TEXT_PRIMARY }}>No pain points available</Text>}
            </Row>
          </Card>

          {/* 4. Competitive Landscape */}
          <Card
            title="4. Competitive Landscape"
            className="mb-4 section-card"
            extra={<Tag color="purple" style={{ background: 'rgba(114, 46, 209, 0.1)', color: BRAND_GREEN }}>Competition</Tag>}
            style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
          >
            <Title level={4} style={{ color: TEXT_PRIMARY }}>Top Competitors</Title>
            <Row gutter={16} className="competitor-cards">
              {reportData.competitiveLandscape?.competitors.map((competitor, index) => (
                <Col span={8} key={index}>
                  <Card
                    className="competitor-card"
                    size="small"
                    style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}
                    actions={[
                      <span key="position" style={{ color: TEXT_SECONDARY }}>Market Position: {index + 1}</span>,
                      <span key="strength" style={{ color: TEXT_SECONDARY }}>Strength: {competitor.strength || "Unknown"}</span>,
                    ]}
                  >
                    <Card.Meta
                      avatar={
                        <Avatar
                          size="large"
                          style={{ backgroundColor: [BRAND_GREEN, '#7265e6', '#ffbf00', '#00a2ae'][index % 4] }}
                        >
                          {competitor.name.charAt(0)}
                        </Avatar>
                      }
                      title={<span style={{ color: TEXT_PRIMARY }}>{competitor.name}</span>}
                      description={
                        <Space>
                          <Text ellipsis={{ tooltip: competitor.description }} style={{ color: TEXT_SECONDARY }}>
                            {competitor.description || "N/A"}
                          </Text>
                          <Button
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={() => handleCopyText(competitor.description || "N/A")}
                            style={{ background: SURFACE_BG, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                          >
                            Copy
                          </Button>
                        </Space>
                      }
                    />
                  </Card>
                </Col>
              )) || <Text style={{ color: TEXT_PRIMARY }}>No competitors available</Text>}
            </Row>
            <Row gutter={16} className="mt-4">
              <Col span={12}>
                <Title level={4} style={{ color: TEXT_PRIMARY }}>Gap Analysis</Title>
                <div className="highlight-box" style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}>
                  <Space>
                    <Text style={{ color: TEXT_PRIMARY }}>{reportData.competitiveLandscape?.gapAnalysis || "N/A"}</Text>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => handleCopyText(reportData.competitiveLandscape?.gapAnalysis || "N/A")}
                      style={{ background: SURFACE_BG, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                    >
                      Copy
                    </Button>
                  </Space>
                </div>
              </Col>
              <Col span={12}>
                <Title level={4} style={{ color: TEXT_PRIMARY }}>Barrier to Entry</Title>
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
                    strokeColor={
                      reportData.competitiveLandscape?.barrierToEntry === "High"
                        ? "#ff4d4f"
                        : reportData.competitiveLandscape?.barrierToEntry === "Medium"
                        ? "#faad14"
                        : BRAND_GREEN
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
                    style={{
                      background: reportData.competitiveLandscape?.barrierToEntry === "High"
                        ? 'rgba(255, 77, 79, 0.1)'
                        : reportData.competitiveLandscape?.barrierToEntry === "Medium"
                        ? 'rgba(250, 173, 20, 0.1)'
                        : 'rgba(82, 196, 26, 0.1)',
                      color: reportData.competitiveLandscape?.barrierToEntry === "High"
                        ? '#ff4d4f'
                        : reportData.competitiveLandscape?.barrierToEntry === "Medium"
                        ? '#faad14'
                        : '#52c41a'
                    }}
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
            extra={<Tag color="cyan" style={{ background: 'rgba(24, 144, 255, 0.1)', color: BRAND_GREEN }}>Opportunity</Tag>}
            style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
          >
            <Space>
              <Text style={{ color: TEXT_PRIMARY }}>{reportData.arbitrageOpportunity?.explanation || "N/A"}</Text>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopyText(reportData.arbitrageOpportunity?.explanation || "N/A")}
                style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
              >
                Copy
              </Button>
            </Space>
            <div className="mt-3 p-3 opportunity-highlight" style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}>
              <Title level={5} style={{ color: TEXT_PRIMARY }}>Concrete Angle:</Title>
              <Space>
                <Text style={{ color: TEXT_PRIMARY }}>{reportData.arbitrageOpportunity?.concreteAngle || "N/A"}</Text>
                <Button
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopyText(reportData.arbitrageOpportunity?.concreteAngle || "N/A")}
                  style={{ background: SURFACE_BG, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
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
            extra={<Tag color="gold" style={{ background: 'rgba(250, 173, 20, 0.1)', color: '#faad14' }}>Offers</Tag>}
            style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
          >
            <Row gutter={16}>
              {reportData.entryOffers?.map((offer, index) => (
                <Col span={12} key={index}>
                  <Card
                    className="offer-card"
                    type="inner"
                    style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}
                    title={
                      <span style={{ color: TEXT_PRIMARY }}>
                        <StarOutlined style={{ color: BRAND_GREEN }} /> {offer.positioning || "N/A"}
                      </span>
                    }
                  >
                    <Row gutter={16}>
                      <Col span={12}>
                        <div className="offer-detail">
                          <DollarOutlined className="offer-icon" style={{ color: BRAND_GREEN }} />
                          <div>
                            <Text strong style={{ color: TEXT_PRIMARY }}>Business Model:</Text>
                            <br />
                            <Space>
                              <Text style={{ color: TEXT_SECONDARY }}>{offer.businessModel || "N/A"}</Text>
                              <Button
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={() => handleCopyText(offer.businessModel || "N/A")}
                                style={{ background: SURFACE_BG, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                              >
                                Copy
                              </Button>
                            </Space>
                          </div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="offer-detail">
                          <TagOutlined className="offer-icon" style={{ color: BRAND_GREEN }} />
                          <div>
                            <Text strong style={{ color: TEXT_PRIMARY }}>Price Point:</Text>
                            <br />
                            <Space>
                              <Text style={{ color: TEXT_SECONDARY }}>{offer.pricePoint || "N/A"}</Text>
                              <Button
                                size="small"
                                icon={<CopyOutlined />}
                                onClick={() => handleCopyText(offer.pricePoint || "N/A")}
                                style={{ background: SURFACE_BG, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
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
              )) || <Text style={{ color: TEXT_PRIMARY }}>No entry offers available</Text>}
            </Row>
          </Card>

          {/* 7. Go-To-Market Strategy */}
          <Card
            title="7. Go-To-Market Strategy"
            className="mb-4 section-card"
            extra={<Tag color="lime" style={{ background: 'rgba(160, 217, 17, 0.1)', color: BRAND_GREEN }}>GTM</Tag>}
            style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <div className="strategy-card primary" style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}>
                  <Title level={5} style={{ color: TEXT_PRIMARY }}>Primary Channel</Title>
                  <Space>
                    <Text className="channel-name" style={{ color: TEXT_PRIMARY }}>{reportData.gtmStrategy?.primaryChannel || "N/A"}</Text>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => handleCopyText(reportData.gtmStrategy?.primaryChannel || "N/A")}
                      style={{ background: SURFACE_BG, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                    >
                      Copy
                    </Button>
                  </Space>
                </div>
              </Col>
              <Col span={12}>
                <div className="strategy-card" style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}>
                  <Title level={5} style={{ color: TEXT_PRIMARY }}>Justification</Title>
                  <Space>
                    <Text style={{ color: TEXT_PRIMARY }}>{reportData.gtmStrategy?.justification || "N/A"}</Text>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => handleCopyText(reportData.gtmStrategy?.justification || "N/A")}
                      style={{ background: SURFACE_BG, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
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
            extra={<Tag color="magenta" style={{ background: 'rgba(235, 47, 150, 0.1)', color: BRAND_GREEN }}>Growth</Tag>}
            style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <div className="scalability-card" style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}>
                  <Title level={5} style={{ color: TEXT_PRIMARY }}>Scalability Score</Title>
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
                      strokeColor={
                        reportData.scalabilityExit?.scalabilityScore === "High"
                          ? BRAND_GREEN
                          : reportData.scalabilityExit?.scalabilityScore === "Medium"
                          ? '#faad14'
                          : '#ff4d4f'
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
                      style={{
                        background: reportData.scalabilityExit?.scalabilityScore === "High"
                          ? 'rgba(82, 196, 26, 0.1)'
                          : reportData.scalabilityExit?.scalabilityScore === "Medium"
                          ? 'rgba(250, 173, 20, 0.1)'
                          : 'rgba(24, 144, 255, 0.1)',
                        color: reportData.scalabilityExit?.scalabilityScore === "High"
                          ? '#52c41a'
                          : reportData.scalabilityExit?.scalabilityScore === "Medium"
                          ? '#faad14'
                          : '#1890ff'
                      }}
                    >
                      {reportData.scalabilityExit?.scalabilityScore || "N/A"}
                    </Tag>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className="exit-card" style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}>
                  <Title level={5} style={{ color: TEXT_PRIMARY }}>Exit Potential</Title>
                  <div className="highlight-box">
                    <Space>
                      <Text style={{ color: TEXT_PRIMARY }}>{reportData.scalabilityExit?.exitPotential || "N/A"}</Text>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopyText(reportData.scalabilityExit?.exitPotential || "N/A")}
                        style={{ background: SURFACE_BG, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
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
            extra={<Tag color="red" style={{ background: 'rgba(255, 77, 79, 0.1)', color: '#ff4d4f' }}>Risks</Tag>}
            style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
          >
            <Row gutter={16}>
              {reportData.riskFactors?.map((risk, index) => (
                <Col span={8} key={index}>
                  <div className="risk-card" style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}>
                    <WarningOutlined className="risk-icon" style={{ color: BRAND_GREEN }} />
                    <Text strong style={{ color: TEXT_PRIMARY }}>{risk.risk || "N/A"}</Text>
                    <div className="risk-impact">
                      <Tag
                        color={
                          risk.impact?.toLowerCase().includes("high")
                            ? "red"
                            : risk.impact?.toLowerCase().includes("medium")
                            ? "orange"
                            : "blue"
                        }
                        style={{
                          background: risk.impact?.toLowerCase().includes("high")
                            ? 'rgba(255, 77, 79, 0.1)'
                            : risk.impact?.toLowerCase().includes("medium")
                            ? 'rgba(250, 173, 20, 0.1)'
                            : 'rgba(24, 144, 255, 0.1)',
                          color: risk.impact?.toLowerCase().includes("high")
                            ? '#ff4d4f'
                            : risk.impact?.toLowerCase().includes("medium")
                            ? '#faad14'
                            : '#1890ff'
                        }}
                      >
                        Impact: {risk.impact || "N/A"}
                      </Tag>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopyText(risk.risk || "N/A")}
                        style={{ background: SURFACE_BG, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                </Col>
              )) || <Text style={{ color: TEXT_PRIMARY }}>No risk factors available</Text>}
            </Row>
          </Card>

          {/* 10. Difficulty vs Reward Scorecard */}
          <Card
            title="10. Difficulty vs Reward Scorecard"
            className="mb-4 section-card"
            extra={<Tag color="geekblue" style={{ background: 'rgba(47, 84, 235, 0.1)', color: BRAND_GREEN }}>Scorecard</Tag>}
            style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
          >
            <Row gutter={16}>
              <Col span={6}>
                <div className="scorecard-metric" style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}>
                  <Title level={5} style={{ color: TEXT_PRIMARY }}>Market Demand</Title>
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
                          ? BRAND_GREEN
                          : reportData.scorecard?.marketDemand === "Medium"
                          ? '#faad14'
                          : '#f5222d'
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
                      style={{
                        background: reportData.scorecard?.marketDemand === "High"
                          ? 'rgba(82, 196, 26, 0.1)'
                          : reportData.scorecard?.marketDemand === "Medium"
                          ? 'rgba(250, 173, 20, 0.1)'
                          : 'rgba(255, 77, 79, 0.1)',
                        color: reportData.scorecard?.marketDemand === "High"
                          ? '#52c41a'
                          : reportData.scorecard?.marketDemand === "Medium"
                          ? '#faad14'
                          : '#ff4d4f'
                      }}
                    >
                      {reportData.scorecard?.marketDemand || "N/A"}
                    </Tag>
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div className="scorecard-metric" style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}>
                  <Title level={5} style={{ color: TEXT_PRIMARY }}>Competition Intensity</Title>
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
                          ? '#f5222d'
                          : reportData.scorecard?.competition === "Medium"
                          ? '#faad14'
                          : BRAND_GREEN
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
                      style={{
                        background: reportData.scorecard?.competition === "High"
                          ? 'rgba(255, 77, 79, 0.1)'
                          : reportData.scorecard?.competition === "Medium"
                          ? 'rgba(250, 173, 20, 0.1)'
                          : 'rgba(82, 196, 26, 0.1)',
                        color: reportData.scorecard?.competition === "High"
                          ? '#ff4d4f'
                          : reportData.scorecard?.competition === "Medium"
                          ? '#faad14'
                          : '#52c41a'
                      }}
                    >
                      {reportData.scorecard?.competition || "N/A"}
                    </Tag>
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div className="scorecard-metric" style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}>
                  <Title level={5} style={{ color: TEXT_PRIMARY }}>Ease of Entry</Title>
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
                          ? BRAND_GREEN
                          : reportData.scorecard?.easeOfEntry === "Medium"
                          ? '#faad14'
                          : '#f5222d'
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
                      style={{
                        background: reportData.scorecard?.easeOfEntry === "High"
                          ? 'rgba(82, 196, 26, 0.1)'
                          : reportData.scorecard?.easeOfEntry === "Medium"
                          ? 'rgba(250, 173, 20, 0.1)'
                          : 'rgba(255, 77, 79, 0.1)',
                        color: reportData.scorecard?.easeOfEntry === "High"
                          ? '#52c41a'
                          : reportData.scorecard?.easeOfEntry === "Medium"
                          ? '#faad14'
                          : '#ff4d4f'
                      }}
                    >
                      {reportData.scorecard?.easeOfEntry || "N/A"}
                    </Tag>
                  </div>
                </div>
              </Col>
              <Col span={6}>
                <div className="scorecard-metric" style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR }}>
                  <Title level={5} style={{ color: TEXT_PRIMARY }}>Profitability Potential</Title>
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
                          ? BRAND_GREEN
                          : reportData.scorecard?.profitability === "Medium"
                          ? '#faad14'
                          : '#f5222d'
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
                      style={{
                        background: reportData.scorecard?.profitability === "High"
                          ? 'rgba(82, 196, 26, 0.1)'
                          : reportData.scorecard?.profitability === "Medium"
                          ? 'rgba(250, 173, 20, 0.1)'
                          : 'rgba(255, 77, 79, 0.1)',
                        color: reportData.scorecard?.profitability === "High"
                          ? '#52c41a'
                          : reportData.scorecard?.profitability === "Medium"
                          ? '#faad14'
                          : '#ff4d4f'
                      }}
                    >
                      {reportData.scorecard?.profitability || "N/A"}
                    </Tag>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </>
      </ConfigProvider>
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

      if (
        !report.comparisonMatrix ||
        !report.comparisonMatrix.criteria ||
        !report.comparisonMatrix.scores ||
        report.comparisonMatrix.criteria.length === 0 ||
        report.comparisonMatrix.scores.length === 0
      ) {
        return (
          <Card 
            title="Comparison Matrix" 
            className="mb-4"
            style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
          >
            <Alert
              message="Comparison data not available"
              description="The comparison matrix data is missing or incomplete. Please check the API response or regenerate the report."
              type="warning"
              showIcon
              style={{ background: 'rgba(250, 173, 20, 0.1)', borderColor: '#faad14' }}
            />
          </Card>
        );
      }

      return (
        <Card 
          title="Compare All Niches" 
          className="mb-4"
          style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}
        >
          <Table
            dataSource={report.comparisonMatrix.criteria.map((criterion, criterionIndex) => {
              const row: any = { key: criterionIndex, criterion };
              report.comparisonMatrix.scores.forEach((score, scoreIndex) => {
                const backendKey = keyMap[criterion];
                const scoreValue = backendKey ? score.scores[backendKey] : undefined;
                row[`niche${scoreIndex}`] = scoreValue;
              });
              return row;
            })}
            columns={[
              {
                title: 'Criteria',
                dataIndex: 'criterion',
                key: 'criterion',
                width: '25%',
              },
              ...report.niches.map((niche, index) => ({
                title: (
                  <div style={{ color: TEXT_PRIMARY }}>
                    {niche.nicheOverview?.name || `Niche ${index + 1}`}
                    {index === report.recommendedNiche && (
                      <Tag color="gold" style={{ marginLeft: 8, background: 'rgba(250, 173, 20, 0.1)', color: '#faad14' }}>
                        Recommended
                      </Tag>
                    )}
                  </div>
                ),
                dataIndex: `niche${index}`,
                key: `niche${index}`,
                render: (score: number) => (
                  score !== undefined && score !== null ? (
                    <Progress
                      type="circle"
                      percent={Number(score)}
                      width={50}
                      format={() => `${score}%`}
                    />
                  ) : (
                    <Text type="secondary" style={{ color: TEXT_SECONDARY }}>N/A</Text>
                  )
                ),
              })),
            ]}
            pagination={false}
            size="small"
          />
        </Card>
      );
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
            Table: {
              colorBgContainer: SURFACE_LIGHTER,
              colorText: TEXT_PRIMARY,
              colorBorder: BORDER_COLOR,
            }
          }
        }}
      >
        <>
          <Card className="mb-6 recommendation-banner" style={{ 
            background: 'linear-gradient(135deg, rgba(92, 196, 157, 0.1) 0%, rgba(92, 196, 157, 0.05) 100%)',
            borderColor: BORDER_COLOR,
            borderLeft: `4px solid ${BRAND_GREEN}`
          }}>
            <div className="text-center">
              <Title level={2} style={{ color: TEXT_PRIMARY }}>Your Top {multiNicheReport.niches.length} Niche Opportunities</Title>
              <Alert
                message={`Recommended: ${
                  multiNicheReport.niches[multiNicheReport.recommendedNiche || 0].nicheOverview?.name ||
                  'N/A'
                }`}
                description={multiNicheReport.recommendationReason || 'No recommendation reason provided.'}
                type="success"
                showIcon
                className="mb-4"
                style={{ background: 'rgba(82, 196, 26, 0.1)', borderColor: '#52c41a' }}
              />
            </div>
          </Card>

          {renderComparisonMatrix(multiNicheReport)}

          <Card className="mb-4" style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
            <Tabs
              activeKey={selectedNicheTab.toString()}
              onChange={(key) => setSelectedNicheTab(parseInt(key))}
              type="card"
            >
              {multiNicheReport.niches.map((niche, index) => (
                <TabPane
                  key={index.toString()}
                  tab={
                    <span style={{ color: SPACE_COLOR }}>
                      {niche.nicheOverview?.name || `Niche ${index + 1}`}
                      {index === multiNicheReport.recommendedNiche && (
                        <Tag color="gold" style={{ marginLeft: 8, background: 'rgba(250, 173, 20, 0.1)', color: '#faad14' }}>
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
        </>
      </ConfigProvider>
    );
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
      <Spin size="large" tip="Loading niche report..." />
</ConfigProvider>
    
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
          style={{ background: 'rgba(255, 77, 79, 0.1)', borderColor: '#ff4d4f' }}
          action={
            <Button type="primary" onClick={handleBack} style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' }}>
              Back to Niche Researcher
            </Button>
          }
        />
      </div>
    );
  }

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
          }
        }
      }}
    >
      <div className="min-h-screen bg-black font-manrope">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBack}
              className="mb-4 hover:text-white border-none shadow-none px-0"
              style={{ background: 'transparent', color: SPACE_COLOR }}
            >
              Back to Niche Researcher
            </Button>
            
            <div className="flex justify-between items-start">
              <div>
                <Title level={2} style={{ color: TEXT_PRIMARY }}>{nicheReport.title}</Title>
                <Text style={{ color: SPACE_COLOR }}>
                  Created on {new Date(nicheReport.createdAt).toLocaleDateString()}
                </Text>
                {nicheReport.metadata && (
                  <div className="mt-2">
                    {nicheReport.metadata.nicheName && (
                      <Tag color="blue" style={{ background: 'rgba(24, 144, 255, 0.1)', color: '#1890ff' }}>{nicheReport.metadata.nicheName}</Tag>
                    )}
                    {nicheReport.metadata.primaryObjective && (
                      <Tag color="green" style={{ background: 'rgba(82, 196, 26, 0.1)', color: '#52c41a' }}>{nicheReport.metadata.primaryObjective}</Tag>
                    )}
                    {nicheReport.metadata.budget && (
                      <Tag color="purple" style={{ background: 'rgba(114, 46, 209, 0.1)', color: BRAND_GREEN }}>{nicheReport.metadata.budget}</Tag>
                    )}
                    {nicheReport.metadata.totalNiches && (
                      <Tag color="gold" style={{ background: 'rgba(250, 173, 20, 0.1)', color: '#faad14' }}>Multi-Niche Report ({nicheReport.metadata.totalNiches})</Tag>
                    )}
                  </div>
                )}
              </div>
              
              <Space>
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={() => handleExportReport("html")}
                  type="primary"
                  style={{
                    backgroundColor: BRAND_GREEN,
                    borderColor: BRAND_GREEN,
                    color: '#000000',
                    fontWeight: '500'
                  }}
                >
                  Export HTML
                </Button>
                <Button 
                  icon={<DownloadOutlined />}
                  onClick={() => handleExportReport("json")}
                  style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
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
                style={{ background: 'rgba(250, 173, 20, 0.1)', borderColor: '#faad14' }}
              />
            )}
          </div>

          <Divider style={{ borderColor: BORDER_COLOR }} />

          <div className="text-center">
            <Space>
              <Button onClick={handleBack} style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}>
                Back to List
              </Button>
              <Button 
                type="primary" 
                onClick={() => router.push(`/dashboard/${currentWorkspace?.slug}/niche-researcher`)}
                style={{
                  backgroundColor: BRAND_GREEN,
                  borderColor: BRAND_GREEN,
                  color: '#000000',
                  fontWeight: '500'
                }}
              >
                Generate New Report
              </Button>
            </Space>
          </div>
        </div>

        {/* Custom CSS for hover effects */}
        <style jsx global>{`
          .font-manrope {
            font-family: 'Manrope', sans-serif;
          }
          
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
          
          .ant-tabs-tab:hover {
            color: #5CC49D !important;
          }
          
          .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
            color: #5CC49D !important;
          }
          
          /* Custom styles for niche report */
          .highlight-box {
            padding: 12px;
            border-radius: 6px;
            margin: 8px 0;
          }
          
          .metric-card {
            padding: 16px;
            border-radius: 8px;
            text-align: center;
            transition: all 0.3s ease;
          }
          
          .metric-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          
          .metric-icon {
            margin-bottom: 8px;
          }
          
          .metric-value {
            font-size: 18px;
            font-weight: 600;
          }
          
          .pain-point-card {
            padding: 12px;
            border-radius: 6px;
            transition: all 0.3s ease;
          }
          
          .pain-point-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          
          .intensity-indicator {
            height: 4px;
            border-radius: 2px;
            margin-bottom: 8px;
            background: rgba(148, 163, 184, 0.2);
          }
          
          .intensity-level {
            height: 100%;
            border-radius: 2px;
          }
          
          .intensity-high {
            width: 100%;
          }
          
          .intensity-medium {
            width: 70%;
          }
          
          .intensity-low {
            width: 40%;
          }
          
          .competitor-card:hover {
            border-color: #5CC49D !important;
            transform: translateY(-2px);
            transition: all 0.3s ease;
          }
          
          .opportunity-highlight {
            border-left: 4px solid #5CC49D;
          }
          
          .offer-card {
            transition: all 0.3s ease;
          }
          
          .offer-card:hover {
            border-color: #5CC49D !important;
            transform: translateY(-2px);
          }
          
          .offer-icon {
            font-size: 24px;
            margin-bottom: 8px;
          }
          
          .strategy-card {
            padding: 16px;
            border-radius: 6px;
            transition: all 0.3s ease;
          }
          
          .strategy-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          
          .strategy-card.primary {
            border-left: 4px solid #5CC49D;
          }
          
          .scalability-card, .exit-card {
            padding: 16px;
            border-radius: 6px;
            transition: all 0.3s ease;
          }
          
          .scalability-card:hover, .exit-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          
          .score-display {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
          }
          
          .risk-card {
            padding: 12px;
            border-radius: 6px;
            transition: all 0.3s ease;
            text-align: center;
          }
          
          .risk-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          
          .risk-icon {
            font-size: 24px;
            margin-bottom: 8px;
          }
          
          .scorecard-metric {
            padding: 12px;
            border-radius: 6px;
            transition: all 0.3s ease;
          }
          
          .scorecard-metric:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          
          .score-indicator {
            margin-top: 8px;
          }
          
          .trend-tag, .barrier-tag, .score-tag, .scorecard-tag {
            margin-top: 8px;
          }
          
          .intensity-tag, .risk-impact {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 8px;
          }
          
          .channel-name {
            font-size: 16px;
            font-weight: 600;
          }
          
          .section-card {
            transition: all 0.3s ease;
          }
          
          .section-card:hover {
            border-color: #5CC49D !important;
          }
          
          .recommendation-banner {
            background: linear-gradient(135deg, rgba(92, 196, 157, 0.1) 0%, rgba(92, 196, 157, 0.05) 100%);
            border-left: 4px solid #5CC49D;
          }
        `}</style>
      </div>
    </ConfigProvider>
  );
};

export default NicheResearchDetailPage;