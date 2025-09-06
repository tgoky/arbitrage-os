// app/dashboard/[workspace]/ad-writer/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileTextOutlined, 
  ArrowLeftOutlined, 
  DownloadOutlined, 
  CopyOutlined,
  EditOutlined,
  ShareAltOutlined,
  EyeOutlined,
  CalendarOutlined,
  UserOutlined,

  TagOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  ReloadOutlined,
  LeftOutlined,
  RightOutlined
} from '@ant-design/icons';
import { 
  Button, 
  Card, 
  Typography, 
  Divider, 
  Space, 
  Tag, 
  Alert, 
  Spin, 
  message,
  Badge,
  Descriptions,
  Collapse,
  List,
  Modal,
  Tooltip,
  Tabs,
  Select,
  notification
} from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { GeneratedAd, FullScript } from '@/types/adWriter';
import { useWorkspaceContext } from '../../../../hooks/useWorkspaceContext';
import { motion } from 'framer-motion';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { TabPane } = Tabs;
const { Option } = Select;

interface AdWriterGenerationDetail {
  id: string;
  title: string;
  inputData: any;
  ads: GeneratedAd[];
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
  status: 'completed' | 'processing' | 'failed';
  metadata: {
    businessName: string;
    offerName: string;
    platforms: string[];
    adCount: number;
  };
}

// Component for displaying full scripts
const FullScriptDisplay: React.FC<{
  fullScripts: Array<{framework: string; script: string}>;
  platform: string;
  onCopy: (text: string) => void;
}> = ({ fullScripts, platform, onCopy }) => {
  const [currentScriptIndex, setCurrentScriptIndex] = useState(0);

  if (!fullScripts || fullScripts.length === 0) {
    return (
      <Alert
        message="No full scripts available"
        description="Script sections are still being generated."
        type="info"
      />
    );
  }

  const currentScript = fullScripts[currentScriptIndex];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Title level={5} className="mb-2">
          Ad Scripts ({currentScriptIndex + 1} of {fullScripts.length})
        </Title>
        <Space>
          <Button
            icon={<LeftOutlined />}
            onClick={() => setCurrentScriptIndex(Math.max(0, currentScriptIndex - 1))}
            disabled={currentScriptIndex === 0}
            size="small"
          />
          <Button
            icon={<RightOutlined />}
            onClick={() => setCurrentScriptIndex(Math.min(fullScripts.length - 1, currentScriptIndex + 1))}
            disabled={currentScriptIndex === fullScripts.length - 1}
            size="small"
          />
        </Space>
      </div>

      <Card style={{
        border: "2px solid green",
      }}>
        <div className="flex justify-between items-start mb-3">
          <Tag color="blue">{currentScript.framework}</Tag>
          <Button
            type="text"
            icon={<CopyOutlined />}
            onClick={() => onCopy(currentScript.script)}
          >
            Copy Script
          </Button>
        </div>
        <pre className="whitespace-pre-wrap text-sm leading-relaxed font-medium">
          {currentScript.script}
        </pre>
      </Card>

      {fullScripts.length > 1 && (
        <div className="flex justify-center space-x-2">
          {fullScripts.map((_, index) => (
            <Button
              key={index}
              size="small"
              type={currentScriptIndex === index ? "primary" : "default"}
              onClick={() => setCurrentScriptIndex(index)}
              className="w-8 h-8"
            >
              {index + 1}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

const AdWriterDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  const [loading, setLoading] = useState(true);
  const [adDetail, setAdDetail] = useState<AdWriterGenerationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatformIndex, setSelectedPlatformIndex] = useState(0);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const generationId = params.id as string;

  useEffect(() => {
    if (isWorkspaceReady && currentWorkspace) {
      fetchAdDetail();
    }
  }, [isWorkspaceReady, currentWorkspace, generationId]);

  const fetchAdDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/ad-writer/${generationId}?workspaceId=${currentWorkspace?.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ad details: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setAdDetail(data.data);
      } else {
        throw new Error(data.error || 'Failed to load ad details');
      }
    } catch (err) {
      console.error('Error fetching ad detail:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      message.error('Failed to load ad details');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('Copied to clipboard!');
    } catch (error) {
      message.error('Failed to copy to clipboard');
    }
  };

  const downloadAd = (ad: GeneratedAd) => {
    try {
      const content = `=== ${ad.platform.toUpperCase()} ===\n\n` +
        `Headlines:\n${ad.headlines.map((h: string) => `- ${h}`).join('\n')}\n\n` +
        `Descriptions:\n${ad.descriptions.map((d: string) => `- ${d}`).join('\n')}\n\n` +
        `CTAs:\n${ad.ctas.map((c: string) => `- ${c}`).join('\n')}\n\n` +
        (ad.hooks ? `Hooks:\n${ad.hooks.map((h: string) => `- ${h}`).join('\n')}\n\n` : '') +
        (ad.visualSuggestions ? `Visual Suggestions:\n${ad.visualSuggestions.map((v: string) => `- ${v}`).join('\n')}\n\n` : '') +
        (ad.fullScripts ? `Full Scripts:\n${ad.fullScripts.map((s: FullScript) => `--- ${s.framework} ---\n${s.script}`).join('\n\n')}\n\n` : '');

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `ad-copy-${ad.platform}-${generationId}.txt`;
      anchor.style.display = 'none';
      
      document.body.appendChild(anchor);
      anchor.click();
      
      URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
      
      message.success('Ad downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      message.error('Failed to download ad');
    }
  };

  const downloadAllAds = () => {
    if (!adDetail) return;
    
    try {
      const content = adDetail.ads.map(ad => 
        `=== ${ad.platform.toUpperCase()} ===\n\n` +
        `Headlines:\n${ad.headlines.map((h: string) => `- ${h}`).join('\n')}\n\n` +
        `Descriptions:\n${ad.descriptions.map((d: string) => `- ${d}`).join('\n')}\n\n` +
        `CTAs:\n${ad.ctas.map((c: string) => `- ${c}`).join('\n')}\n\n` +
        (ad.hooks ? `Hooks:\n${ad.hooks.map((h: string) => `- ${h}`).join('\n')}\n\n` : '') +
        (ad.visualSuggestions ? `Visual Suggestions:\n${ad.visualSuggestions.map((v: string) => `- ${v}`).join('\n')}\n\n` : '') +
        (ad.fullScripts ? `Full Scripts:\n${ad.fullScripts.map((s: FullScript) => `--- ${s.framework} ---\n${s.script}`).join('\n\n')}\n\n` : '')
      ).join('\n\n');

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `all-ad-copy-${generationId}.txt`;
      anchor.style.display = 'none';
      
      document.body.appendChild(anchor);
      anchor.click();
      
      URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
      
      message.success('All ads downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      message.error('Failed to download ads');
    }
  };

  const handleOptimizeAd = async (adCopy: string, optimizationType: string) => {
    setOptimizing(true);
    try {
      const response = await fetch('/api/ad-writer/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adCopy, optimizationType })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Optimization failed');
      }

      if (!result.data || typeof result.data !== 'string') {
        throw new Error('Invalid optimization result');
      }

      Modal.info({
        title: `Optimized for ${optimizationType}`,
        content: (
          <div>
            <Text strong>Original:</Text>
            <div className="bg-gray-50 p-2 rounded mb-2">{adCopy}</div>
            <Text strong>Optimized:</Text>
            <div className="bg-blue-50 p-2 rounded">{result.data}</div>
            <div className="mt-2">
              <Button 
                onClick={() => copyToClipboard(result.data)}
                icon={<CopyOutlined />}
              >
                Copy Optimized Version
              </Button>
            </div>
          </div>
        ),
        width: 600,
      });
      
      return result.data;
    } catch (err) {
      console.error('Optimization error:', err);
      notification.error({
        message: 'Optimization Failed',
        description: err instanceof Error ? err.message : 'Please try again later',
        placement: 'topRight',
      });
      return null;
    } finally {
      setOptimizing(false);
    }
  };

  const navigateToEditor = () => {
    if (adDetail) {
      router.push(`/dashboard/${currentWorkspace?.slug}/ad-writer?load=${generationId}`);
    }
  };

    const handleBack = () => {
    router.push(`/submissions`);
  };


  const getPlatformDisplayName = (platform: string) => {
    const platformMap: Record<string, string> = {
      'facebook': 'Facebook/Instagram',
      'google': 'Google Ads',
      'linkedin': 'LinkedIn',
      'tiktok': 'TikTok',
      'generic': 'Generic'
    };
    
    return platformMap[platform] || platform;
  };

  if (!isWorkspaceReady) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <Spin size="large" />
        <p className="mt-4">Loading workspace...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <Spin size="large" />
        <p className="mt-4">Loading ad details...</p>
      </div>
    );
  }

  if (error || !adDetail) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Alert
          message="Error Loading Ad"
          description={error || "Could not find the requested ad generation"}
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={fetchAdDetail}>
              Try Again
            </Button>
          }
        />
        <div className="mt-4 text-center">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => router.push(`/dashboard/${currentWorkspace?.slug}/work`)}
          >
            Back to Work Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const currentAd = adDetail.ads[selectedPlatformIndex];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button 
          icon={<ArrowLeftOutlined />} 
             onClick={handleBack}
        >
          Back to Work
        </Button>
        
        <Space>
          {/* <Button 
            icon={<EditOutlined />} 
            onClick={navigateToEditor}
          >
            Edit & Regenerate
          </Button> */}
          <Button 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={downloadAllAds}
          >
            Download All
          </Button>
        </Space>
      </div>

      <div className="text-center mb-8">
        <Title level={2} className="flex items-center justify-center">
          <FileTextOutlined className="mr-2" />
          Ad Copy Details
        </Title>
        <Text type="secondary">
          Generated on {new Date(adDetail.createdAt).toLocaleDateString()}
        </Text>
      </div>

      {/* Generation Info */}
      <Card className="mb-6">
        <Descriptions title="Generation Information" bordered column={1}>
          <Descriptions.Item label="Title">
            <Text strong>{adDetail.title}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Business">
            {adDetail.metadata.businessName}
          </Descriptions.Item>
          <Descriptions.Item label="Offer">
            {adDetail.metadata.offerName}
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            <Space>
              <CalendarOutlined />
              {new Date(adDetail.createdAt).toLocaleString()}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Badge 
              status={adDetail.status === 'completed' ? 'success' : 'processing'} 
              text={adDetail.status.toUpperCase()}
            />
          </Descriptions.Item>
          <Descriptions.Item label="Platforms">
            <Space wrap>
              {adDetail.metadata.platforms.map(platform => (
                <Tag key={platform} color="blue">
                  {getPlatformDisplayName(platform)}
                </Tag>
              ))}
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Input Data Summary */}
      <Collapse className="mb-6" defaultActiveKey={['1']}>
        <Panel header="Input Parameters" key="1">
          <Descriptions column={1}>
            <Descriptions.Item label="Value Proposition">
              {adDetail.inputData.valueProposition}
            </Descriptions.Item>
            <Descriptions.Item label="Ideal Customer">
              {adDetail.inputData.idealCustomer}
            </Descriptions.Item>
            <Descriptions.Item label="Primary Pain Point">
              {adDetail.inputData.primaryPainPoint}
            </Descriptions.Item>
            <Descriptions.Item label="Core Result">
              {adDetail.inputData.coreResult}
            </Descriptions.Item>
            <Descriptions.Item label="Ad Type">
              {adDetail.inputData.adType}
            </Descriptions.Item>
            <Descriptions.Item label="Tone">
              {adDetail.inputData.tone}
            </Descriptions.Item>
          </Descriptions>
        </Panel>
      </Collapse>

      {/* Ad Variations */}
      <Card 
        title={
          <Space>
            <FileTextOutlined />
            <span>Generated Ad Copy</span>
            <Tag>{adDetail.ads.length} platform variations</Tag>
          </Space>
        }
        className="mb-6"
        extra={
          <Text type="secondary">
            Select a platform to view details
          </Text>
        }
      >
        <div className="mb-4">
          <Space wrap>
            {adDetail.ads.map((ad, index) => (
              <Button
                key={index}
                type={selectedPlatformIndex === index ? 'primary' : 'default'}
                onClick={() => setSelectedPlatformIndex(index)}
              >
                {getPlatformDisplayName(ad.platform)}
              </Button>
            ))}
          </Space>
        </div>

        <Divider />

        {/* Selected Ad Display */}
        {currentAd && (
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <Title level={4}>{getPlatformDisplayName(currentAd.platform)} Ad Copy</Title>
              </div>
              <Space>
                <Tooltip title="Download this platform's ads">
                  <Button 
                    icon={<DownloadOutlined />} 
                    onClick={() => downloadAd(currentAd)}
                  />
                </Tooltip>
                <Tooltip title="Preview all content">
                  <Button 
                    icon={<EyeOutlined />}
                    onClick={() => setPreviewModalVisible(true)}
                  >
                    Preview
                  </Button>
                </Tooltip>
              </Space>
            </div>

            <Tabs defaultActiveKey="scripts" type="card">
              {/* Full Scripts Tab */}
              {currentAd.fullScripts && currentAd.fullScripts.length > 0 && (
                <TabPane tab="Full Scripts" key="scripts">
                  <FullScriptDisplay 
                    fullScripts={currentAd.fullScripts}
                    platform={currentAd.platform}
                    onCopy={copyToClipboard}
                  />
                </TabPane>
              )}

              {/* Headlines Tab */}
          <TabPane tab="Headlines" key="headlines">
  <List
    dataSource={currentAd.headlines}
    renderItem={(headline: string, index: number) => (
      <List.Item
        actions={[
          <Tooltip key={`optimize-${index}`} title="Optimize for emotion">
            <Button 
              type="text" 
              size="small"
              loading={optimizing}
              onClick={() => handleOptimizeAd(headline, 'emotional')}
            >
              ✨
            </Button>
          </Tooltip>,
          <Button 
            key={`copy-${index}`}
            type="text" 
            icon={<CopyOutlined />} 
            onClick={() => copyToClipboard(headline)}
          />
        ]}
      >
        <Text>{headline}</Text>
      </List.Item>
    )}
  />
</TabPane>


              {/* Descriptions Tab */}
              <TabPane tab="Descriptions" key="descriptions">
                <List
                  dataSource={currentAd.descriptions}
                  renderItem={(description: string, index: number) => (
                    <List.Item
                      actions={[
                        <Button 
                         key={`copy-${index}`}
                          type="text" 
                          icon={<CopyOutlined />} 
                          onClick={() => copyToClipboard(description)}
                        />
                      ]}
                    >
                      <Text>{description}</Text>
                    </List.Item>
                  )}
                />
              </TabPane>

              {/* CTAs Tab */}
              <TabPane tab="Call-to-Actions" key="ctas">
                <List
                  dataSource={currentAd.ctas}
                  renderItem={(cta: string, index: number) => (
                    <List.Item
                      actions={[
                        <Button 
                         key={`copy-${index}`}
                          type="text" 
                          icon={<CopyOutlined />} 
                          onClick={() => copyToClipboard(cta)}
                        />
                      ]}
                    >
                      <Text>{cta}</Text>
                    </List.Item>
                  )}
                />
              </TabPane>

              {/* Additional Sections */}
              {currentAd.hooks && currentAd.hooks.length > 0 && (
                <TabPane tab="Hooks" key="hooks">
                  <List
                    dataSource={currentAd.hooks}
                    renderItem={(hook: string, index: number) => (
                      <List.Item
                        actions={[
                          <Button 
                           key={`copy-${index}`}
                            type="text" 
                            icon={<CopyOutlined />} 
                            onClick={() => copyToClipboard(hook)}
                          />
                        ]}
                      >
                        <Text>{hook}</Text>
                      </List.Item>
                    )}
                  />
                </TabPane>
              )}

              {currentAd.fixes && currentAd.fixes.length > 0 && (
                <TabPane tab="Fixes" key="fixes">
                  <List
                    dataSource={currentAd.fixes}
                    renderItem={(fix: string, index: number) => (
                      <List.Item
                        actions={[
                          <Button 
                           key={`copy-${index}`}
                            type="text" 
                            icon={<CopyOutlined />} 
                            onClick={() => copyToClipboard(fix)}
                          />
                        ]}
                      >
                        <Text>{fix}</Text>
                      </List.Item>
                    )}
                  />
                </TabPane>
              )}

            {currentAd.results && currentAd.results.length > 0 && (
  <TabPane tab="Results" key="results">
    <List
      dataSource={currentAd.results}
      renderItem={(result: string, index: number) => (
        <List.Item
          actions={[
            <Button
              key={`copy-${index}`} // ✅ added key here
              type="text"
              icon={<CopyOutlined />}
              onClick={() => copyToClipboard(result)}
            />
          ]}
        >
          <Text>{result}</Text>
        </List.Item>
      )}
    />
  </TabPane>
)}


              {currentAd.proofs && currentAd.proofs.length > 0 && (
                <TabPane tab="Proofs" key="proofs">
                  <List
                    dataSource={currentAd.proofs}
                    renderItem={(proof: string, index: number) => (
                      <List.Item
                        actions={[
                          <Button 
                           key={`copy-${index}`}
                            type="text" 
                            icon={<CopyOutlined />} 
                            onClick={() => copyToClipboard(proof)}
                          />
                        ]}
                      >
                        <Text>{proof}</Text>
                      </List.Item>
                    )}
                  />
                </TabPane>
              )}

              {currentAd.visualSuggestions && currentAd.visualSuggestions.length > 0 && (
                <TabPane tab="Visual Suggestions" key="visuals">
                  <List
                    dataSource={currentAd.visualSuggestions}
                    renderItem={(suggestion: string, index: number) => (
                      <List.Item
                        actions={[
                          <Button 
                           key={`copy-${index}`}
                            type="text" 
                            icon={<CopyOutlined />} 
                            onClick={() => copyToClipboard(suggestion)}
                          />
                        ]}
                      >
                        <Text>{suggestion}</Text>
                      </List.Item>
                    )}
                  />
                </TabPane>
              )}
            </Tabs>
          </div>
        )}
      </Card>

      {/* Preview Modal */}
      <Modal
        title={`${getPlatformDisplayName(currentAd.platform)} Ad Preview`}
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setPreviewModalVisible(false)}>
            Close
          </Button>,
          <Button 
            key="copy" 
            icon={<CopyOutlined />}
            onClick={() => {
              const allText = [
                ...currentAd.headlines.map(h => `Headline: ${h}`),
                ...currentAd.descriptions.map(d => `Description: ${d}`),
                ...currentAd.ctas.map(c => `CTA: ${c}`),
                ...(currentAd.hooks || []).map(h => `Hook: ${h}`),
                ...(currentAd.fullScripts || []).map(s => `Script (${s.framework}): ${s.script}`)
              ].join('\n\n');
              copyToClipboard(allText);
              setPreviewModalVisible(false);
            }}
          >
            Copy All
          </Button>
        ]}
        width={800}
      >
        {currentAd && (
          <div className="p-4 space-y-4">
            {/* Headlines */}
            <div>
              <Text strong className="block mb-2">Headlines:</Text>
              {currentAd.headlines.map((headline, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded mb-2">
                  {headline}
                </div>
              ))}
            </div>

            {/* Descriptions */}
            <div>
              <Text strong className="block mb-2">Descriptions:</Text>
              {currentAd.descriptions.map((description, index) => (
                <div key={index} className="bg-blue-50 p-3 rounded mb-2">
                  {description}
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div>
              <Text strong className="block mb-2">Call-to-Actions:</Text>
              {currentAd.ctas.map((cta, index) => (
                <div key={index} className="bg-green-50 p-3 rounded mb-2">
                  {cta}
                </div>
              ))}
            </div>

            {/* Full Scripts */}
            {currentAd.fullScripts && currentAd.fullScripts.length > 0 && (
              <div>
                <Text strong className="block mb-2">Full Scripts:</Text>
                {currentAd.fullScripts.map((script, index) => (
                  <div key={index} className="bg-yellow-50 p-3 rounded mb-2">
                    <Text strong className="block mb-1">{script.framework}:</Text>
                    <pre className="whitespace-pre-wrap text-sm">{script.script}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdWriterDetailPage;