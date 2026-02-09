// Shared component for viewing ad writer generation details
"use client";

import React, { useState, useEffect } from 'react';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  CopyOutlined,
  LeftOutlined,
  RightOutlined,
  VideoCameraOutlined,
  FontSizeOutlined,
  ThunderboltOutlined,
  PictureOutlined,
  BlockOutlined
} from '@ant-design/icons';
import {
  Button,
  Spin,
  message,

  ConfigProvider,
  Modal
} from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { GeneratedAd, FullScript } from '@/types/adWriter';
import { useWorkspaceContext } from '@/app/hooks/useWorkspaceContext';

// --- STYLES & HELPERS ---

const CUSTOM_CARD_BG = 'rgba(255, 255, 255, 0.06)';
const BORDER_COLOR = 'rgba(255, 255, 255, 0.08)';

const useManropeFont = () => {
  useEffect(() => {
    if (document.querySelector('link[href*="Manrope"]')) return;

    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    document.body.style.fontFamily = "'Manrope', sans-serif";

    return () => {
      document.head.removeChild(link);
      document.body.style.fontFamily = '';
    };
  }, []);
};

// --- COMPONENTS ---

const NavTab = ({ active, onClick, icon, label, count }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 font-manrope ${
      active
        ? "border-[#5CC49D] text-white"
        : "border-transparent text-gray-500 hover:text-gray-300 hover:border-white/10"
    }`}
  >
    {icon}
    <span>{label}</span>
    {count > 0 && (
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-manrope ${
        active ? 'bg-[#5CC49D] text-black' : 'bg-white/10 text-gray-500'
      }`}>
        {count}
      </span>
    )}
  </button>
);

const PlatformPill = ({ active, onClick, label }: any) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide transition-all font-manrope ${
      active
        ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]"
        : "bg-transparent border border-white/20 text-gray-400 hover:border-white/50 hover:text-white"
    }`}
  >
    {label}
  </button>
);

const CopyCard = ({ text, label, onCopy }: { text: string, label?: string, onCopy: () => void }) => (
  <div
    className="group relative p-5 rounded-xl border transition-all duration-300 hover:border-[#5CC49D]/50 hover:shadow-[0_0_20px_rgba(92,196,157,0.2)] font-manrope"
    style={{
      backgroundColor: CUSTOM_CARD_BG,
      borderColor: BORDER_COLOR
    }}
  >
    {label && (
      <span className="absolute top-4 right-4 text-[10px] text-gray-500 uppercase tracking-widest font-manrope">
        {label}
      </span>
    )}
    <p className="text-gray-200 text-base leading-relaxed pr-8 whitespace-pre-wrap font-manrope">
      {text}
    </p>

    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={onCopy}
        className="flex items-center gap-1.5 text-xs bg-black/50 hover:bg-[#5CC49D] hover:text-black text-white px-3 py-1.5 rounded-md backdrop-blur-md transition-all font-manrope"
      >
        <CopyOutlined /> Copy
      </button>
    </div>
  </div>
);

const ScriptDisplay = ({ scripts, onCopy }: { scripts: FullScript[], onCopy: (txt: string) => void }) => {
  const [index, setIndex] = useState(0);
  const current = scripts[index];

  if (!scripts || scripts.length === 0) return null;

  return (
    <div
      className="rounded-2xl border overflow-hidden hover:border-[#5CC49D]/30 transition-all duration-300 font-manrope"
      style={{ borderColor: BORDER_COLOR }}
    >
      {/* Script Header */}
      <div
        className="flex justify-between items-center p-4 border-b"
        style={{
          backgroundColor: 'rgba(0,0,0,0.3)',
          borderColor: BORDER_COLOR
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-[#5CC49D] font-bold text-sm border border-[#5CC49D]/30 px-3 py-1 rounded bg-[#5CC49D]/10 uppercase tracking-wider font-manrope">
            {current.framework}
          </span>
          <span className="text-gray-400 text-sm font-manrope">
            Script {index + 1} of {scripts.length}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<LeftOutlined className="text-gray-400" />}
            onClick={() => setIndex(Math.max(0, index - 1))}
            disabled={index === 0}
          />
          <Button
            type="text"
            icon={<RightOutlined className="text-gray-400" />}
            onClick={() => setIndex(Math.min(scripts.length - 1, index + 1))}
            disabled={index === scripts.length - 1}
          />
        </div>
      </div>

      {/* Script Body */}
      <div
        className="p-8"
        style={{ backgroundColor: CUSTOM_CARD_BG }}
      >
        <pre className="whitespace-pre-wrap text-base text-gray-200 leading-7 font-light font-manrope">
          {current.script}
        </pre>
      </div>

      {/* Script Footer Actions */}
      <div
        className="p-4 border-t flex justify-end gap-3"
        style={{
          backgroundColor: 'rgba(0,0,0,0.3)',
          borderColor: BORDER_COLOR
        }}
      >
         <Button
            icon={<CopyOutlined />}
            onClick={() => onCopy(current.script)}
            className="border-none text-white hover:text-[#5CC49D] hover:bg-white/10 transition-colors font-manrope"
            style={{ backgroundColor: CUSTOM_CARD_BG }}
         >
            Copy Script
         </Button>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

interface AdWriterGenerationDetail {
    id: string;
    title: string;
    inputData: any;
    ads: GeneratedAd[];
    createdAt: string;
    updatedAt: string;
    status: 'completed' | 'processing' | 'failed';
    metadata: {
      businessName: string;
      offerName: string;
      platforms: string[];
      adCount: number;
    };
}

interface AdWriterDetailViewProps {
  backPath: string;
}

const AdWriterDetailView = ({ backPath }: AdWriterDetailViewProps) => {
  useManropeFont();
  const params = useParams();
  const router = useRouter();
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();

  const [loading, setLoading] = useState(true);
  const [adDetail, setAdDetail] = useState<AdWriterGenerationDetail | null>(null);
  const [selectedPlatformIndex, setSelectedPlatformIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('scripts');
  const [previewVisible, setPreviewVisible] = useState(false);

  const generationId = params.id as string;

  useEffect(() => {
    if (isWorkspaceReady && currentWorkspace) {
      fetchAdDetail();
    }
  }, [isWorkspaceReady, currentWorkspace, generationId]);

  const fetchAdDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ad-writer/${generationId}?workspaceId=${currentWorkspace?.id}`);
      const data = await response.json();

      if (data.success) {
        setAdDetail(data.data);
        if (data.data.ads[0]?.fullScripts?.length > 0) {
            setActiveTab('scripts');
        } else {
            setActiveTab('headlines');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Copied to clipboard');
  };

  const downloadAll = () => {
    if (!adDetail) return;
    const content = JSON.stringify(adDetail.ads, null, 2);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ads-${generationId}.txt`;
    a.click();
  };

  const getPlatformName = (p: string) => {
    const map: Record<string, string> = {
      facebook: 'Facebook/IG',
      google: 'Google Ads',
      linkedin: 'LinkedIn',
      tiktok: 'TikTok'
    };
    return map[p] || p;
  };

  if (!isWorkspaceReady || loading) {
    return (
      <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center">

          <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#5CC49D',
            },
          }}
        >
            <Spin size="large"  />
        </ConfigProvider>
        {/* <Spin size="large" /> */}
      </div>
    );
  }

  if (!adDetail) return null;

  const currentAd = adDetail.ads[selectedPlatformIndex];

  const counts = {
    scripts: currentAd?.fullScripts?.length || 0,
    headlines: currentAd?.headlines?.length || 0,
    descriptions: currentAd?.descriptions?.length || 0,
    hooks: currentAd?.hooks?.length || 0,
    ctas: currentAd?.ctas?.length || 0,
    visuals: currentAd?.visualSuggestions?.length || 0,
  };

  return (
    <div className="min-h-screen bg-[#0B0C10] text-white pb-20 font-manrope">

      {/* --- COMPACT HEADER --- */}
      <div
        className="border-b sticky top-0 z-20 backdrop-blur-md bg-[#0B0C10]/80"
        style={{ borderColor: BORDER_COLOR }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
             <button
  onClick={() => router.push(backPath)}
  className={`
    group flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300
    bg-white/5 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white
    font-manrope
  `}
>
  <ArrowLeftOutlined className="text-xs" /> Back
</button>
                    <div className="font-manrope">
                        <h1 className="text-lg font-bold leading-tight">{adDetail.title}</h1>
                        <p className="text-xs text-gray-500">
                          {adDetail.metadata.businessName} • {new Date(adDetail.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                      onClick={downloadAll}
                      className="text-sm px-3 py-1.5 rounded text-white font-semibold hover:bg-white/10 transition-colors font-manrope"
                      style={{
                        backgroundColor: CUSTOM_CARD_BG,
                        borderColor: BORDER_COLOR
                      }}
                    >
                        <DownloadOutlined className="mr-2" /> Download
                    </button>
                </div>
            </div>

            {/* Platform Selector */}
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                {adDetail.ads.map((ad, idx) => (
                    <PlatformPill
                        key={idx}
                        label={getPlatformName(ad.platform)}
                        active={selectedPlatformIndex === idx}
                        onClick={() => {
                            setSelectedPlatformIndex(idx);
                            if (activeTab === 'scripts' && (!ad.fullScripts || ad.fullScripts.length === 0)) {
                                setActiveTab('headlines');
                            }
                        }}
                    />
                ))}
            </div>
        </div>
      </div>

      {/* --- CONTENT NAVIGATION --- */}
      <div
        className="sticky top-[105px] z-10 border-b"
        style={{
          borderColor: BORDER_COLOR,
          backgroundColor: '#0B0C10'
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-6 overflow-x-auto hide-scrollbar">
                {counts.scripts > 0 && (
                    <NavTab
                        active={activeTab === 'scripts'}
                        onClick={() => setActiveTab('scripts')}
                        icon={<VideoCameraOutlined />}
                        label="Ad Scripts"
                        count={counts.scripts}
                    />
                )}
                {counts.headlines > 0 && (
                    <NavTab
                        active={activeTab === 'headlines'}
                        onClick={() => setActiveTab('headlines')}
                        icon={<FontSizeOutlined />}
                        label="Headlines"
                        count={counts.headlines}
                    />
                )}
                {counts.hooks > 0 && (
                    <NavTab
                        active={activeTab === 'hooks'}
                        onClick={() => setActiveTab('hooks')}
                        icon={<ThunderboltOutlined />}
                        label="Hooks"
                        count={counts.hooks}
                    />
                )}
                {counts.descriptions > 0 && (
                    <NavTab
                        active={activeTab === 'descriptions'}
                        onClick={() => setActiveTab('descriptions')}
                        icon={<BlockOutlined />}
                        label="Body Copy"
                        count={counts.descriptions}
                    />
                )}
                {counts.visuals > 0 && (
                    <NavTab
                        active={activeTab === 'visuals'}
                        onClick={() => setActiveTab('visuals')}
                        icon={<PictureOutlined />}
                        label="Visual Ideas"
                        count={counts.visuals}
                    />
                )}
            </div>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Scripts View */}
        {activeTab === 'scripts' && (
            <div className="max-w-4xl mx-auto animate-fadeIn">
                <div className="mb-4 flex items-center gap-2 text-gray-400 text-sm font-manrope">
                    <VideoCameraOutlined />
                    <span>These scripts are formatted for {getPlatformName(currentAd.platform)}.</span>
                </div>
                <ScriptDisplay scripts={currentAd.fullScripts || []} onCopy={copyToClipboard} />
            </div>
        )}

        {/* Headlines / Hooks / CTAs */}
        {(activeTab === 'headlines' || activeTab === 'hooks' || activeTab === 'ctas') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                {(activeTab === 'headlines' ? currentAd.headlines : activeTab === 'hooks' ? currentAd.hooks : currentAd.ctas)?.map((text, i) => (
                    <CopyCard
                        key={i}
                        text={text}
                        label={`Option ${i+1}`}
                        onCopy={() => copyToClipboard(text)}
                    />
                ))}
            </div>
        )}

        {/* Descriptions */}
        {activeTab === 'descriptions' && (
            <div className="space-y-4 max-w-4xl mx-auto animate-fadeIn">
                {currentAd.descriptions?.map((text, i) => (
                    <CopyCard
                        key={i}
                        text={text}
                        label={`Variation ${i+1}`}
                        onCopy={() => copyToClipboard(text)}
                    />
                ))}
            </div>
        )}

        {/* Visual Suggestions */}
        {activeTab === 'visuals' && (
            <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto animate-fadeIn">
                {currentAd.visualSuggestions?.map((text, i) => (
                     <div
                        key={i}
                        className="flex gap-4 p-5 rounded-xl border items-start hover:border-[#5CC49D]/30 transition-all duration-300 font-manrope"
                        style={{
                          backgroundColor: CUSTOM_CARD_BG,
                          borderColor: BORDER_COLOR
                        }}
                     >
                        <div
                          className="mt-1 p-2 rounded-lg text-[#5CC49D] flex-shrink-0"
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.10)' }}
                        >
                            <PictureOutlined />
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-200 text-sm leading-relaxed">{text}</p>
                        </div>
                     </div>
                ))}
            </div>
        )}
      </div>

      {/* --- PREVIEW MODAL --- */}
      <Modal
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
        centered
        className="dark-modal font-manrope"
        styles={{
            content: {
              backgroundColor: '#141414',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontFamily: "'Manrope', sans-serif"
            },
            header: {
              backgroundColor: '#141414',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              color: 'white',
              fontFamily: "'Manrope', sans-serif"
            }
        }}
        title={<span className="text-white font-manrope">Quick Preview</span>}
      >
        <div className="text-gray-300 space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar font-manrope">
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: CUSTOM_CARD_BG,
                borderColor: BORDER_COLOR
              }}
            >
                <h3 className="text-white font-bold mb-2 font-manrope">Headlines</h3>
                <ul className="list-disc pl-5 space-y-1 font-manrope">
                  {currentAd?.headlines?.slice(0,3).map((h,i) => <li key={i}>{h}</li>)}
                </ul>
            </div>
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: CUSTOM_CARD_BG,
                borderColor: BORDER_COLOR
              }}
            >
                <h3 className="text-white font-bold mb-2 font-manrope">Primary Text</h3>
                <ul className="list-disc pl-5 space-y-1 font-manrope">
                  {currentAd?.descriptions?.slice(0,2).map((h,i) => <li key={i}>{h}</li>)}
                </ul>
            </div>
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: CUSTOM_CARD_BG,
                borderColor: BORDER_COLOR
              }}
            >
                <h3 className="text-white font-bold mb-2 font-manrope">Call to Action</h3>
                <ul className="list-disc pl-5 space-y-1 font-manrope">
                  {currentAd?.ctas?.slice(0,2).map((h,i) => <li key={i}>{h}</li>)}
                </ul>
            </div>
            <div className="pt-4 border-t border-white/10 text-right">
                <Button
                  onClick={() => setPreviewVisible(false)}
                  className="font-manrope"
                  style={{
                    backgroundColor: CUSTOM_CARD_BG,
                    borderColor: BORDER_COLOR,
                    color: 'white'
                  }}
                >
                  Close
                </Button>
            </div>
        </div>
      </Modal>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }

        .font-manrope {
          font-family: 'Manrope', sans-serif;
        }

        .dark-modal .ant-modal-close-x { color: white; }
        .dark-modal .ant-modal-content {
          background-color: #141414 !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        .dark-modal .ant-modal-header {
          background-color: #141414 !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        .dark-modal .ant-modal-title {
          color: white !important;
          font-family: 'Manrope', sans-serif !important;
        }

        body .ant-btn,
        body .ant-modal-title,
        body .ant-modal-content {
          font-family: 'Manrope', sans-serif !important;
        }

.ant-tabs-tab {
  background: transparent !important;
}

.ant-tabs-tab-btn {
  color: rgba(255, 255, 255, 0.6) !important;
  font-family: 'Manrope', sans-serif !important;
}

.ant-tabs-tab-active .ant-tabs-tab-btn {
  color: white !important;
}

.ant-tabs-ink-bar {
  background: #5CC49D !important;
}

.ant-tabs-nav::before {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
}

.flex.gap-6.overflow-x-auto.hide-scrollbar button {
  background: transparent !important;
}

.flex.gap-6.overflow-x-auto.hide-scrollbar button:hover {
  background: rgba(255, 255, 255, 0.05) !important;
}

.flex.gap-6.overflow-x-auto.hide-scrollbar button.border-\\[#5CC49D\\] {
  background: transparent !important;
}

.ant-btn {
  background: transparent !important;
}

.ant-btn:hover {
  background: rgba(255, 255, 255, 0.05) !important;
}

      `}</style>
    </div>
  );
};

export default AdWriterDetailView;