// app/dashboard/[workspace]/offer-creator/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Card, 
  Typography, 
  Button, 
  Space, 
  Spin, 
  Alert,
  message,
  Tag,
  Tooltip,
  Popconfirm,
  ConfigProvider
} from 'antd';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  CopyOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useWorkspaceContext } from '../../../../hooks/useWorkspaceContext';
import { OfferOutputView } from '../../../../../components/offer/OfferOutputView';

const { Title, Text } = Typography;

interface OfferData {
  id: string;
  title: string;
  content: any;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

export default function OfferCreatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  
  const [offerData, setOfferData] = useState<OfferData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const offerId = params.id as string;
  const workspace = params.workspace as string;

  useEffect(() => {
    if (isWorkspaceReady && currentWorkspace && offerId) {
      fetchOfferDetails();
    }
  }, [isWorkspaceReady, currentWorkspace, offerId]);

  const fetchOfferDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/deliverables/${offerId}?workspaceId=${currentWorkspace?.id}`, {
        credentials: 'include',
        headers: {
          'X-Workspace-Id': currentWorkspace?.id || '',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        let parsedContent = data.data.content;
        if (typeof parsedContent === 'string') {
          try {
            parsedContent = JSON.parse(parsedContent);
          } catch (parseError) {
            throw new Error('Invalid offer content format');
          }
        }
        
        setOfferData({
          ...data.data,
          content: parsedContent
        });
      } else {
        throw new Error(data.error || 'Failed to load offer - no data returned');
      }
    } catch (error) {
      console.error('Error fetching offer:', error);
      setError(error instanceof Error ? error.message : 'Failed to load offer');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push(`/submissions`);
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/deliverables/${offerId}?workspaceId=${currentWorkspace?.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-Workspace-Id': currentWorkspace?.id || '',
        }
      });

      if (response.ok) {
        message.success('Offer deleted successfully');
        router.push(`/submissions`);
      } else {
        throw new Error('Failed to delete offer');
      }
    } catch (error) {
      console.error('Error deleting offer:', error);
      message.error('Failed to delete offer');
    }
  };

  const handleExport = (format: 'json' | 'html') => {
    if (!offerData) return;

    const filename = `${offerData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'json') {
      const dataStr = JSON.stringify(offerData.content, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      // Simple HTML export
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${offerData.title}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; }
            .offer-tier { margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
            .price { font-size: 24px; color: #1890ff; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>${offerData.title}</h1>
          <p>Generated on ${new Date(offerData.createdAt).toLocaleDateString()}</p>
          <div class="offer-content">
            ${JSON.stringify(offerData.content, null, 2).replace(/\n/g, '<br>')}
          </div>
        </body>
        </html>
      `;
      const dataBlob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.html`;
      link.click();
      URL.revokeObjectURL(url);
    }
    
    message.success(`Exported as ${format.toUpperCase()}`);
  };

  if (!isWorkspaceReady) {
    return (
      <div className="flex justify-center items-center min-h-screen">

           <ConfigProvider
  theme={{
    token: {
      colorPrimary: '#5CC49D',
    },
  }}
>
     <Spin size="large" />
</ConfigProvider>

   
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">

             <ConfigProvider
  theme={{
    token: {
      colorPrimary: '#5CC49D',
    },
  }}
>
          <Spin size="large" tip="Loading offer details..." />
</ConfigProvider>


        </div>
      </div>
    );
  }

  if (error || !offerData) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Alert
          message="Error Loading Offer"
          description={error || 'Offer not found'}
          type="error"
          showIcon
          action={
            <Space>
              <Button onClick={handleBack}>
                Back to Dashboard
              </Button>
              <Button type="primary" onClick={fetchOfferDetails}>
                Retry
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#5CC49D',
          colorBgBase: '#0f172a',
          colorTextBase: '#f1f5f9',
          colorBorder: '#334155',
        },
      }}
    >
      <div className="min-h-screen bg-black" style={{ fontFamily: "'Manrope', sans-serif" }}>
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <Button 
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              className="mb-6 hover:text-white"
              style={{ background: 'transparent', color: '#9DA2B3', borderColor: '#334155' }}
            >
              Back to Submissions
            </Button>
            
            <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-6">
              <div>
                <Title level={1} className="mb-0" style={{ color: '#f1f5f9' }}>
                  {offerData.title}
                </Title>
                <Text style={{ color: '#94a3b8' }} className="offer-dates">
                  Created {new Date(offerData.createdAt).toLocaleDateString()} • 
                  Updated {new Date(offerData.updatedAt).toLocaleDateString()}
                </Text>
              </div>
              
              <Space size="middle" className="flex-wrap">
                <Tooltip title="Copy JSON to clipboard">
                  <Button 
                    icon={<CopyOutlined />} 
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(offerData.content, null, 2));
                      message.success('Copied to clipboard');
                    }}
                    style={{ background: '#000000', borderColor: '#475569', color: '#f1f5f9' }}
                    size="middle"
                  >
                    Copy
                  </Button>
                </Tooltip>
                <Button 
                  icon={<DownloadOutlined />} 
                  onClick={() => handleExport('html')}
                  style={{ background: '#000000', borderColor: '#475569', color: '#f1f5f9' }}
                  size="middle"
                >
                  Export HTML
                </Button>
                <Popconfirm
                  title="Delete Offer"
                  description="Are you sure you want to delete this offer? This action cannot be undone."
                  onConfirm={handleDelete}
                  okText="Yes"
                  cancelText="No"
                  placement="topRight"
                >
                  <Button 
                    danger 
                    icon={<DeleteOutlined />}
                    style={{ background: '#dc2626', borderColor: '#dc2626', color: '#fff' }}
                    size="middle"
                  >
                    Delete
                  </Button>
                </Popconfirm>
              </Space>
            </div>

            {/* Metadata Tags */}
            <div className="flex flex-wrap gap-3 mb-4">
              {offerData.metadata?.targetMarket && (
                <Tag color="blue" style={{ background: 'transparent', borderColor: '#60a5fa', color: '#60a5fa' }}>
                  {offerData.metadata.targetMarket}
                </Tag>
              )}
              {offerData.metadata?.pricePosture && (
                <Tag color="green" style={{ background: 'transparent', borderColor: '#5CC49D', color: '#5CC49D' }}>
                  {offerData.metadata.pricePosture}
                </Tag>
              )}
              {offerData.metadata?.industries?.map((industry: string, idx: number) => (
                <Tag key={idx} color="purple" style={{ background: 'transparent', borderColor: '#a855f7', color: '#a855f7' }}>
                  {industry}
                </Tag>
              ))}
            </div>
          </div>

          {/* Main Content - Using the shared component */}
          <OfferOutputView 
            offer={offerData.content}
            title="Signature Offer Details"
            onExport={handleExport}
            onCopy={() => {
              navigator.clipboard.writeText(JSON.stringify(offerData.content, null, 2));
              message.success('Copied to clipboard');
            }}
          />
        </div>
      </div>
    </ConfigProvider>
  );
}