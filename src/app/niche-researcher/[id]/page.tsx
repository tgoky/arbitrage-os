"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeftOutlined, DownloadOutlined } from "@ant-design/icons";
import { Tabs, Skeleton, message, notification } from "antd";
import { useParams, useRouter } from "next/navigation";
import { useNicheResearcher } from "../../hooks/useNicheResearcher";
import { GeneratedNicheReport, MultiNicheReport } from "@/types/nicheResearcher";

const { TabPane } = Tabs;

// Minimal pill component
const Pill = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-block px-2.5 py-0.5 text-sm rounded-full border border-white/10 text-gray-400 font-manrope ${className}`}>
    {children}
  </span>
);

// Section label
const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs uppercase tracking-widest text-gray-500 font-manrope mb-3 mt-0">{children}</p>
);

// Thin horizontal rule
const Rule = () => <div className="border-t border-white/5 my-10" />;

// Score level helper
const getLevelColor = (level: string | undefined) => {
  const l = (level || "").toLowerCase();
  if (l === "high" || l === "growing") return "text-green-400";
  if (l === "medium" || l === "plateauing") return "text-yellow-400";
  return "text-red-400";
};

const getLevelPercent = (level: string | undefined) => {
  const l = (level || "").toLowerCase();
  if (l === "high") return 90;
  if (l === "medium") return 60;
  return 30;
};

// Minimal progress bar
const Bar = ({ percent, color = "bg-gray-500" }: { percent: number; color?: string }) => (
  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
    <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
  </div>
);

const getBarColor = (level: string | undefined, invert = false) => {
  const l = (level || "").toLowerCase();
  if (!invert) {
    if (l === "high") return "bg-green-400";
    if (l === "medium") return "bg-yellow-400";
    return "bg-red-400";
  }
  // Inverted (high = bad, e.g. competition)
  if (l === "high") return "bg-red-400";
  if (l === "medium") return "bg-yellow-400";
  return "bg-green-400";
};

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

const isMultiNicheReport = (report: any): report is MultiNicheReport => {
  return report && report.niches && Array.isArray(report.niches) && report.niches.length > 1;
};

const isGeneratedNicheReport = (report: any): report is GeneratedNicheReport => {
  return report && report.nicheOverview !== undefined;
};

// ── Single niche detail renderer ──
const NicheDetail = ({ data }: { data: GeneratedNicheReport }) => (
  <div className="space-y-12">

    {/* Niche Overview */}
    <div>
      <h3 className="text-base font-medium text-gray-200 mb-6">Niche Overview</h3>
      <div className="space-y-4">
        <div className="border-b border-white/5 pb-3">
          <Label>Summary</Label>
          <p className="text-base text-gray-300 leading-relaxed">{data.nicheOverview?.summary || "N/A"}</p>
        </div>
        <div className="border-b border-white/5 pb-3">
          <Label>Why This Niche Fits</Label>
          <p className="text-base text-gray-300 leading-relaxed">{data.nicheOverview?.whyItFits || "N/A"}</p>
        </div>
      </div>
    </div>

    <Rule />

    {/* Market Demand */}
    <div>
      <h3 className="text-base font-medium text-gray-200 mb-6">Market Demand</h3>
      <div className="grid grid-cols-3 gap-8 text-center">
        <div>
          <p className="text-2xl font-light text-gray-100">{data.marketDemand?.marketSize || "N/A"}</p>
          <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">Market Size</p>
        </div>
        <div>
          <p className={`text-2xl font-light ${getLevelColor(data.marketDemand?.trend)}`}>
            {(data.marketDemand?.trend || "N/A").toUpperCase()}
          </p>
          <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">Trend</p>
        </div>
        <div>
          <p className="text-2xl font-light text-gray-100">{data.marketDemand?.willingnessToPay || "N/A"}</p>
          <p className="text-xs uppercase tracking-widest text-gray-500 mt-1">Willingness to Pay</p>
        </div>
      </div>
    </div>

    <Rule />

    {/* Pain Points */}
    {(data.painPoints || []).length > 0 && (
      <div>
        <h3 className="text-base font-medium text-gray-200 mb-6">Customer Pain Points</h3>
        <div className="space-y-5">
          {data.painPoints.map((point, i) => (
            <div key={i} className="pl-4 border-l border-white/10">
              <p className="text-base text-gray-200 mb-1">
                {i + 1}. {point.problem}
              </p>
              <Pill className={
                point.intensity?.toLowerCase() === "high" ? "border-red-400/30 text-red-400" :
                point.intensity?.toLowerCase() === "medium" ? "border-yellow-400/30 text-yellow-400" :
                "border-blue-400/30 text-blue-400"
              }>
                {point.intensity} intensity
              </Pill>
            </div>
          ))}
        </div>
      </div>
    )}

    <Rule />

    {/* Competitive Landscape */}
    <div>
      <h3 className="text-base font-medium text-gray-200 mb-6">Competitive Landscape</h3>

      {(data.competitiveLandscape?.competitors || []).length > 0 && (
        <div className="mb-8">
          <Label>Top Competitors</Label>
          <div className="space-y-4">
            {data.competitiveLandscape.competitors.map((comp, i) => (
              <div key={i} className="pl-4 border-l border-white/10">
                <p className="text-base text-gray-200">{comp.name}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{comp.description || "N/A"}</p>
                {comp.strength && <p className="text-xs text-gray-600 mt-0.5">Strength: {comp.strength}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="border-b border-white/5 pb-3">
          <Label>Gap Analysis</Label>
          <p className="text-base text-gray-300 leading-relaxed">{data.competitiveLandscape?.gapAnalysis || "N/A"}</p>
        </div>
        <div>
          <Label>Barrier to Entry</Label>
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <Bar
                percent={data.competitiveLandscape?.barrierToEntry === "High" ? 80 : data.competitiveLandscape?.barrierToEntry === "Medium" ? 50 : 20}
                color={getBarColor(data.competitiveLandscape?.barrierToEntry, true)}
              />
            </div>
            <Pill>{data.competitiveLandscape?.barrierToEntry || "N/A"}</Pill>
          </div>
        </div>
      </div>
    </div>

    <Rule />

    {/* Arbitrage Opportunity */}
    <div>
      <h3 className="text-base font-medium text-gray-200 mb-6">Arbitrage Opportunity</h3>
      <p className="text-base text-gray-300 leading-relaxed mb-4">{data.arbitrageOpportunity?.explanation || "N/A"}</p>
      {data.arbitrageOpportunity?.concreteAngle && (
        <div className="pl-4 border-l-2 border-white/10">
          <Label>Concrete Angle</Label>
          <p className="text-base text-gray-300 leading-relaxed">{data.arbitrageOpportunity.concreteAngle}</p>
        </div>
      )}
    </div>

    <Rule />

    {/* Entry Offers */}
    {(data.entryOffers || []).length > 0 && (
      <div>
        <h3 className="text-base font-medium text-gray-200 mb-6">Suggested Entry Offers</h3>
        <div className="space-y-6">
          {data.entryOffers.map((offer, i) => (
            <div key={i} className="border-b border-white/5 pb-4">
              <p className="text-base text-gray-200 mb-2">{offer.positioning || "N/A"}</p>
              <div className="space-y-1.5 text-sm text-gray-400">
                <p><span className="text-gray-500">Business Model:</span> {offer.businessModel || "N/A"}</p>
                <p><span className="text-gray-500">Price Point:</span> {offer.pricePoint || "N/A"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    <Rule />

    {/* GTM Strategy */}
    <div>
      <h3 className="text-base font-medium text-gray-200 mb-6">Go-To-Market Strategy</h3>
      <div className="space-y-4">
        <div className="border-b border-white/5 pb-3">
          <Label>Primary Channel</Label>
          <p className="text-xl font-light text-gray-100">{data.gtmStrategy?.primaryChannel || "N/A"}</p>
        </div>
        <div>
          <Label>Justification</Label>
          <p className="text-base text-gray-300 leading-relaxed">{data.gtmStrategy?.justification || "N/A"}</p>
        </div>
      </div>
    </div>

    <Rule />

    {/* Scalability & Exit */}
    <div>
      <h3 className="text-base font-medium text-gray-200 mb-6">Scalability & Exit Potential</h3>
      <div className="grid grid-cols-2 gap-8">
        <div>
          <Label>Scalability Score</Label>
          <p className={`text-3xl font-light ${getLevelColor(data.scalabilityExit?.scalabilityScore)}`}>
            {data.scalabilityExit?.scalabilityScore || "N/A"}
          </p>
        </div>
        <div>
          <Label>Exit Potential</Label>
          <p className="text-base text-gray-300 leading-relaxed">{data.scalabilityExit?.exitPotential || "N/A"}</p>
        </div>
      </div>
    </div>

    <Rule />

    {/* Risk Factors */}
    {(data.riskFactors || []).length > 0 && (
      <div>
        <h3 className="text-base font-medium text-gray-200 mb-6">Risk Factors</h3>
        <div className="space-y-4">
          {data.riskFactors.map((risk, i) => (
            <div key={i} className="pl-4 border-l border-white/10">
              <p className="text-base text-gray-200 mb-1">{risk.risk || "N/A"}</p>
              <Pill className={
                risk.impact?.toLowerCase().includes("high") ? "border-red-400/30 text-red-400" :
                risk.impact?.toLowerCase().includes("medium") ? "border-yellow-400/30 text-yellow-400" :
                "border-blue-400/30 text-blue-400"
              }>
                Impact: {risk.impact || "N/A"}
              </Pill>
            </div>
          ))}
        </div>
      </div>
    )}

    <Rule />

    {/* Scorecard */}
    <div>
      <h3 className="text-base font-medium text-gray-200 mb-6">Difficulty vs Reward Scorecard</h3>
      <div className="space-y-4">
        {[
          { label: "Market Demand", value: data.scorecard?.marketDemand, invert: false },
          { label: "Competition", value: data.scorecard?.competition, invert: true },
          { label: "Ease of Entry", value: data.scorecard?.easeOfEntry, invert: false },
          { label: "Profitability", value: data.scorecard?.profitability, invert: false },
        ].map(({ label, value, invert }) => (
          <div key={label}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm text-gray-400">{label}</span>
              <span className={`text-sm ${getLevelColor(value)}`}>{value || "N/A"}</span>
            </div>
            <Bar percent={getLevelPercent(value)} color={getBarColor(value, invert)} />
          </div>
        ))}
      </div>
    </div>
  </div>
);


export default function NicheResearchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getNicheReport } = useNicheResearcher();

  const [nicheReport, setNicheReport] = useState<SavedNiche | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNicheTab, setSelectedNicheTab] = useState("0");

  useEffect(() => {
    const fetchNicheReport = async () => {
      if (!params.id) return;
      try {
        setLoading(true);
        const response = await getNicheReport(params.id as string);
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
    router.push("/niche-researcher");
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

  if (loading) {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 font-manrope">
      <div className="max-w-screen-2xl mx-auto">
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    </div>
  );
}

  if (error || !nicheReport) {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 text-center font-manrope">
      <div className="max-w-screen-2xl mx-auto">
        <p className="text-xl text-gray-300 mb-2">Report not found</p>
        <p className="text-base text-gray-500 mb-6">{error || "The requested report could not be loaded."}</p>
        <button onClick={handleBack} className="text-base text-gray-400 hover:text-white transition-colors">
          <ArrowLeftOutlined className="mr-1" /> Back
        </button>
      </div>
    </div>
  );
}


  const content = nicheReport.content;
  const isMulti = isMultiNicheReport(content);
  const multiReport = isMulti ? (content as MultiNicheReport) : null;
  const singleReport = !isMulti && isGeneratedNicheReport(content) ? (content as GeneratedNicheReport) : null;

  return (
     <div className="w-full px-4 sm:px-6 lg:px-8 py-8" style={{ fontFamily: "'Manrope', sans-serif" }}>
  <div className="max-w-screen-2xl mx-auto">

      {/* Back */}
      <button
        onClick={handleBack}
        className="group flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 bg-white/5 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white mb-6"
      >
        <ArrowLeftOutlined className="text-xs" /> Back
      </button>

      {/* Title */}
      <h1 className="text-3xl font-semibold text-gray-100 mb-2 leading-tight">{nicheReport.title}</h1>
      <p className="text-base text-gray-500 mb-2">
        {new Date(nicheReport.createdAt).toLocaleDateString()}
        {nicheReport.metadata?.primaryObjective && <> &middot; {nicheReport.metadata.primaryObjective}</>}
        {nicheReport.metadata?.marketType && <> &middot; {nicheReport.metadata.marketType}</>}
      </p>

      {/* Meta pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {nicheReport.metadata?.nicheName && <Pill>{nicheReport.metadata.nicheName}</Pill>}
        {nicheReport.metadata?.budget && <Pill>{nicheReport.metadata.budget}</Pill>}
        {nicheReport.metadata?.marketSize && <Pill>{nicheReport.metadata.marketSize}</Pill>}
        {isMulti && nicheReport.metadata?.totalNiches && <Pill>{nicheReport.metadata.totalNiches} niches compared</Pill>}
      </div>

      {/* Export buttons */}
      <div className="flex gap-2 mb-10">
        <button onClick={() => handleExportReport("html")} className="text-sm text-gray-500 border border-white/10 rounded px-3 py-1.5 hover:text-gray-300 hover:border-white/20 transition-colors">
          <DownloadOutlined className="mr-1" /> Export HTML
        </button>
        <button onClick={() => handleExportReport("json")} className="text-sm text-gray-500 border border-white/10 rounded px-3 py-1.5 hover:text-gray-300 hover:border-white/20 transition-colors">
          <DownloadOutlined className="mr-1" /> Export JSON
        </button>
      </div>

      <Rule />

      {/* Multi-niche report */}
      {isMulti && multiReport && (
        <>
          {/* Recommendation banner */}
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Recommended Niche</p>
            <p className="text-2xl font-light text-gray-100 mb-2">
              {multiReport.niches[multiReport.recommendedNiche || 0]?.nicheOverview?.name || "N/A"}
            </p>
            <p className="text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
              {multiReport.recommendationReason || "No recommendation reason provided."}
            </p>
          </div>

          {/* Comparison overview */}
          {multiReport.comparisonMatrix?.scores?.length > 0 && (
            <div className="mb-10">
              <Label>Comparison Scores</Label>
              <div className="space-y-3">
                {multiReport.comparisonMatrix.scores.map((score, i) => {
                  const niche = multiReport.niches[score.nicheIndex || i];
                  const isRecommended = (score.nicheIndex || i) === (multiReport.recommendedNiche || 0);
                  return (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-sm text-gray-400 w-48 truncate">
                        {niche?.nicheOverview?.name || `Niche ${i + 1}`}
                        {isRecommended && <span className="text-green-400 ml-1 text-xs">*</span>}
                      </span>
                      <div className="flex-1">
                        <Bar percent={score.totalScore || 0} color="bg-gray-300" />
                      </div>
                      <span className="text-sm text-gray-300 w-10 text-right">{score.totalScore || 0}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Rule />

          {/* Tabbed niche details */}
          <Tabs
            activeKey={selectedNicheTab}
            onChange={setSelectedNicheTab}
            className="minimal-tabs mb-6"
            tabBarStyle={{ borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 32 }}
          >
            {multiReport.niches.map((niche, index) => (
              <TabPane
                key={index.toString()}
                tab={
                  <span className="font-manrope text-sm tracking-wide">
                    {niche.nicheOverview?.name || `Niche ${index + 1}`}
                    {index === (multiReport.recommendedNiche || 0) && (
                      <span className="text-green-400 ml-1 text-xs">*</span>
                    )}
                  </span>
                }
              >
                <NicheDetail data={niche} />
              </TabPane>
            ))}
          </Tabs>
        </>
      )}

      {/* Single niche report */}
      {!isMulti && singleReport && <NicheDetail data={singleReport} />}

      {/* Footer */}
      <Rule />
      <div className="flex justify-center gap-3 pb-12">
        <button onClick={handleBack} className="text-sm text-gray-500 border border-white/10 rounded px-4 py-2 hover:text-gray-300 hover:border-white/20 transition-colors">
          Back
        </button>
        <button onClick={() => handleExportReport("html")} className="text-sm text-gray-500 border border-white/10 rounded px-4 py-2 hover:text-gray-300 hover:border-white/20 transition-colors">
          Download Report
        </button>
      </div>
    </div>
    </div>
  );
}