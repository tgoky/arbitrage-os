// app/dashboard/[workspace]/cold-email-writer/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { 
  MailOutlined, 
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
  BarChartOutlined
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
  Tooltip
} from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { GeneratedEmail } from '@/types/coldEmail';
import { useWorkspaceContext } from '../../../../hooks/useWorkspaceContext';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface EmailGenerationDetail {
  id: string;
  inputData: any;
  emails: GeneratedEmail[];
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
  method: string;
  status: 'completed' | 'processing' | 'failed';
  metrics?: {
    openRate?: number;
    replyRate?: number;
    clickRate?: number;
  };
}

const ColdEmailDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  const [loading, setLoading] = useState(true);
  const [emailDetail, setEmailDetail] = useState<EmailGenerationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmailIndex, setSelectedEmailIndex] = useState(0);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);

  const generationId = params.id as string;

  useEffect(() => {
    if (isWorkspaceReady && currentWorkspace) {
      fetchEmailDetail();
    }
  }, [isWorkspaceReady, currentWorkspace, generationId]);

  const fetchEmailDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/cold-email/${generationId}?workspaceId=${currentWorkspace?.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch email details: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setEmailDetail(data.data);
      } else {
        throw new Error(data.error || 'Failed to load email details');
      }
    } catch (err) {
      console.error('Error fetching email detail:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      message.error('Failed to load email details');
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

  const downloadEmail = (email: GeneratedEmail) => {
    try {
      const content = `Subject: ${email.subject}\n\n${email.body}\n\n${email.signature || ''}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `cold-email-${generationId}-${selectedEmailIndex + 1}.txt`;
      anchor.style.display = 'none';
      
      document.body.appendChild(anchor);
      anchor.click();
      
      URL.revokeObjectURL(url);
      document.body.removeChild(anchor);
      
      message.success('Email downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      message.error('Failed to download email');
    }
  };

  const getMethodDisplayName = (method: string) => {
    const methodMap: Record<string, string> = {
      'interview': 'Interview Method',
      'podcast': 'Podcast Method',
      'direct': 'Direct Method',
      'masterclass': 'Masterclass Method',
      'referral': 'Referral Method',
      'problem': 'Problem-Solution Method'
    };
    
    return methodMap[method] || method;
  };

   const handleBack = () => {
    router.push(`/submissions`);
  };


  const navigateToEditor = () => {
    if (emailDetail) {
      router.push(`/dashboard/${currentWorkspace?.slug}/cold-email-writer?load=${generationId}`);
    }
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
        <p className="mt-4">Loading email details...</p>
      </div>
    );
  }

  if (error || !emailDetail) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Alert
          message="Error Loading Email"
          description={error || "Could not find the requested email generation"}
          type="error"
          showIcon
          action={
            <Button type="primary" onClick={fetchEmailDetail}>
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

  const currentEmail = emailDetail.emails[selectedEmailIndex];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
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
          {/* <Button 
            type="primary" 
            icon={<ShareAltOutlined />}
            onClick={() => setPreviewModalVisible(true)}
          >
            Preview & Share
          </Button> */}
        </Space>
      </div>

      <div className="text-center mb-8">
        <Title level={2} className="flex items-center justify-center">
          <MailOutlined className="mr-2" />
          Cold Email Details
        </Title>
        <Text type="secondary">
          Generated on {new Date(emailDetail.createdAt).toLocaleDateString()}
        </Text>
      </div>

      {/* Generation Info */}
      <Card className="mb-6">
        <Descriptions title="Generation Information" bordered column={1}>
          <Descriptions.Item label="Method">
            <Tag color="blue" icon={<ThunderboltOutlined />}>
              {getMethodDisplayName(emailDetail.method)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            <Space>
              <CalendarOutlined />
              {new Date(emailDetail.createdAt).toLocaleString()}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Badge 
              status={emailDetail.status === 'completed' ? 'success' : 'processing'} 
              text={emailDetail.status.toUpperCase()}
            />
          </Descriptions.Item>
          <Descriptions.Item label="Number of Variations">
            {emailDetail.emails.length}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Input Data Summary */}
    

      {/* Email Variations */}
      <Card 
        title={
          <Space>
            <MailOutlined />
            <span>Email Variations</span>
            <Tag>{emailDetail.emails.length} versions</Tag>
          </Space>
        }
        className="mb-6"
        extra={
          <Text type="secondary">
            Select a variation to view details
          </Text>
        }
      >
        <div className="mb-4">
          <Space wrap>
            {emailDetail.emails.map((_, index) => (
              <Button
                key={index}
                type={selectedEmailIndex === index ? 'primary' : 'default'}
                onClick={() => setSelectedEmailIndex(index)}
              >
                Variation {index + 1}
              </Button>
            ))}
          </Space>
        </div>

        <Divider />

        {/* Selected Email Display */}
        {currentEmail && (
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <Title level={4}>Subject: {currentEmail.subject}</Title>
                <Text type="secondary">
                  Method: {getMethodDisplayName(currentEmail.method || emailDetail.method)}
                </Text>
              </div>
              <Space>
                <Tooltip title="Copy to clipboard">
                  <Button 
                    icon={<CopyOutlined />} 
                    onClick={() => copyToClipboard(`Subject: ${currentEmail.subject}\n\n${currentEmail.body}\n\n${currentEmail.signature || ''}`)}
                  />
                </Tooltip>
                <Tooltip title="Download as text file">
                  <Button 
                    icon={<DownloadOutlined />} 
                    onClick={() => downloadEmail(currentEmail)}
                  />
                </Tooltip>
              </Space>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-4">
              <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                {currentEmail.body}
                {currentEmail.signature && `\n\n${currentEmail.signature}`}
              </pre>
            </div>

            {/* Email Metadata */}
            {currentEmail.metadata && (
              <Collapse className="mb-4">
                <Panel header="Email Metadata" key="1">
                  <Descriptions column={1} size="small">
                    {currentEmail.metadata.targetIndustry && (
                      <Descriptions.Item label="Target Industry">
                        {currentEmail.metadata.targetIndustry}
                      </Descriptions.Item>
                    )}
                    {currentEmail.metadata.targetRole && (
                      <Descriptions.Item label="Target Role">
                        {currentEmail.metadata.targetRole}
                      </Descriptions.Item>
                    )}
                    {currentEmail.metadata.generatedAt && (
                      <Descriptions.Item label="Generated At">
                        {new Date(currentEmail.metadata.generatedAt).toLocaleString()}
                      </Descriptions.Item>
                    )}
                    {currentEmail.metadata.optimizationType && (
                      <Descriptions.Item label="Optimized For">
                        <Tag color="green">{currentEmail.metadata.optimizationType}</Tag>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Panel>
              </Collapse>
            )}

            {/* Follow-up Sequence */}
            {currentEmail.followUpSequence && currentEmail.followUpSequence.length > 0 && (
              <div className="mt-6">
                <Title level={5}>Follow-up Sequence</Title>
                <List
                  itemLayout="horizontal"
                  dataSource={currentEmail.followUpSequence}
                  renderItem={(followUp, index) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Badge count={index + 1} />}
                        title={`Day ${followUp.metadata?.dayInterval || index + 1}: ${followUp.subject}`}
                        description={
                          <div>
                            <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: 'more' }}>
                              {followUp.body}
                            </Paragraph>
                            <Space>
                              <Button 
                                size="small" 
                                icon={<CopyOutlined />}
                                onClick={() => copyToClipboard(`Subject: ${followUp.subject}\n\n${followUp.body}\n\n${followUp.signature || ''}`)}
                              >
                                Copy
                              </Button>
                              <Button 
                                size="small" 
                                icon={<DownloadOutlined />}
                                onClick={() => downloadEmail(followUp)}
                              >
                                Download
                              </Button>
                            </Space>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Preview Modal */}
      <Modal
        title="Email Preview"
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
              if (currentEmail) {
                copyToClipboard(`Subject: ${currentEmail.subject}\n\n${currentEmail.body}\n\n${currentEmail.signature || ''}`);
                setPreviewModalVisible(false);
              }
            }}
          >
            Copy All
          </Button>
        ]}
        width={800}
      >
        {currentEmail && (
          <div className="p-4">
            <div className="border-b pb-2 mb-4">
              <Text strong>Subject: </Text>
              <Text>{currentEmail.subject}</Text>
            </div>
            <div className="whitespace-pre-wrap font-sans">
              {currentEmail.body}
              {currentEmail.signature && `\n\n${currentEmail.signature}`}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ColdEmailDetailPage;