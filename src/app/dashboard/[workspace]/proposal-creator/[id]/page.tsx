
// app/proposal-creator/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import {
  FileTextOutlined,
  ArrowLeftOutlined,
  DownloadOutlined,
  CopyOutlined,
  EyeOutlined,
  SaveOutlined,
  CalendarOutlined,
  TeamOutlined,
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
  Row,
  Col,
  Tabs,
  ConfigProvider,
  theme
} from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useWorkspaceContext } from '../../../../hooks/useWorkspaceContext';

const { Title, Text } = Typography;

// Color constants - matching proposal generator
const SPACE_COLOR = '#9DA2B3';
const BRAND_GREEN = '#5CC49D';
const SURFACE_BG = '#000000';
const SURFACE_LIGHTER = '#000000';
const TEXT_PRIMARY = '#f1f5f9';
const TEXT_SECONDARY = '#94a3b8';
const BORDER_COLOR = '#334155';

interface ProposalDetail {
  id: string;
  title: string;
  proposalData: any;
  proposalType: string;
  clientName: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  totalValue: number;
  createdAt: string;
  updatedAt: string;
  metadata: {
    industry: string;
    projectSize: 'small' | 'medium' | 'large';
    complexity: 'low' | 'moderate' | 'high';
    winProbability: number;
    version: string;
  };
  workspace: {
    id: string;
    name: string;
  };
}

const ProposalDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();
  const [loading, setLoading] = useState(true);
  const [proposalDetail, setProposalDetail] = useState<ProposalDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState<'complete' | 'agreement' | 'sow'>('complete');

  const proposalId = params.id as string;

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
    if (isWorkspaceReady && currentWorkspace) {
      fetchProposalDetail();
    }
  }, [isWorkspaceReady, currentWorkspace, proposalId]);

  const fetchProposalDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/proposal-creator/${proposalId}?workspaceId=${currentWorkspace?.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch proposal details: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setProposalDetail(data.data);
      } else {
        throw new Error(data.error || 'Failed to load proposal details');
      }
    } catch (err) {
      console.error('Error fetching proposal detail:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      message.error('Failed to load proposal details');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(`${type} copied to clipboard!`);
    } catch {
      message.error('Failed to copy to clipboard');
    }
  };

  const exportProposal = async (format: 'html' | 'pdf' | 'json' = 'html') => {
    if (!proposalDetail) return;

    try {
      setExportLoading(true);

      if (format === 'html') {
        const url = `/api/proposal-creator/${proposalId}/export?format=html`;
        window.open(url, '_blank');
        message.success('Proposal opened in new tab!');
        return;
      }

      const response = await fetch(`/api/proposal-creator/${proposalId}/export?format=${format}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      if (format === 'json') {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `proposal-${proposalId}-${new Date().toISOString().split('T')[0]}.json`;
        anchor.style.display = 'none';
        document.body.appendChild(anchor);
        anchor.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(anchor);
      } else if (format === 'pdf') {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `proposal-${proposalId}-${new Date().toISOString().split('T')[0]}.pdf`;
        anchor.style.display = 'none';
        document.body.appendChild(anchor);
        anchor.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(anchor);
      }

      message.success(`Proposal exported successfully as ${format.toUpperCase()}!`);
    } catch (err) {
      console.error('Export error:', err);
      message.error('Failed to export proposal');
    } finally {
      setExportLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (!isWorkspaceReady) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <ConfigProvider theme={{ token: { colorPrimary: '#5CC49D' } }}>
          <Spin size="large" tip="Loading workspace..." />
        </ConfigProvider>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <ConfigProvider theme={{ token: { colorPrimary: '#5CC49D' } }}>
            <Spin size="large" tip="Loading proposal details..." />
          </ConfigProvider>
        </div>
      </div>
    );
  }

  if (error || !proposalDetail) {
    return (
      <div className="min-h-screen bg-black">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Alert
            message="Error Loading Proposal"
            description={error || "Could not find the requested proposal"}
            type="error"
            showIcon
            action={
              <Button type="primary" onClick={fetchProposalDetail}>
                Try Again
              </Button>
            }
          />
          <div className="mt-4 text-center">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
            >
              Back to Proposals
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { proposalData } = proposalDetail;

  // Extract contract data - handle both shapes (contracts vs contractTemplates)
  const contracts = proposalData?.proposal?.contractTemplates || proposalData?.contracts;
  const serviceAgreementBase = contracts?.serviceAgreement || '';
  const statementOfWorkBase = contracts?.statementOfWork || '';

  // Extract original input for signature blocks
  const originalInput = proposalData?.originalInput || {};
  const serviceProvider = originalInput?.serviceProvider || {};
  const clientInfo = originalInput?.clientInfo || {};
  const effectiveDate = originalInput?.effectiveDate || new Date(proposalDetail.createdAt).toLocaleDateString();

  // Generate HTML with side-by-side signatures (matching ProposalPreview)
  const generateDocumentHTML = (documentText: string, documentType: 'agreement' | 'sow') => {
    if (!documentText) return '';

    const title = documentType === 'agreement' ? 'Service Agreement' : 'Statement of Work';

    return `
      <div style="font-family: 'Times New Roman', Times, serif; line-height: 1.6; white-space: pre-wrap; color: #333;">
        ${documentText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
      </div>

      <div style="margin-top: 60px;">
        <p style="font-weight: bold; margin-bottom: 30px; color: #333;">IN WITNESS WHEREOF, the Parties have executed this ${title} as of the Effective Date.</p>

        <div style="display: table; width: 100%; margin-top: 40px;">
          <div style="display: table-cell; width: 50%; vertical-align: top; padding-right: 20px;">
            <div><strong style="color: #333;">${(serviceProvider.name || 'SERVICE PROVIDER').toUpperCase()}</strong></div>
            <div style="font-size: 10pt; margin-top: 5px; color: #666;">${serviceProvider.address || ''}</div>
            <div style="border-top: 1px solid #000; margin: 40px 0 5px 0; padding-top: 5px;"></div>
            <div style="font-size: 10pt; margin: 3px 0; color: #333;">By: _________________________</div>
            <div style="font-size: 10pt; margin: 3px 0; color: #333;">Name: ${serviceProvider.signatoryName || '_________________________'}</div>
            <div style="font-size: 10pt; margin: 3px 0; color: #333;">Title: ${serviceProvider.signatoryTitle || '_________________________'}</div>
            <div style="font-size: 10pt; margin: 3px 0; color: #333;">Date: _________________________</div>
          </div>

          <div style="display: table-cell; width: 50%; vertical-align: top; padding-left: 20px;">
            <div><strong style="color: #333;">${(clientInfo.legalName || proposalDetail.clientName || 'CLIENT').toUpperCase()}</strong></div>
            <div style="font-size: 10pt; margin-top: 5px; color: #666;">${clientInfo.address || ''}</div>
            <div style="border-top: 1px solid #000; margin: 40px 0 5px 0; padding-top: 5px;"></div>
            <div style="font-size: 10pt; margin: 3px 0; color: #333;">By: _________________________</div>
            <div style="font-size: 10pt; margin: 3px 0; color: #333;">Name: ${clientInfo.signatoryName || '_________________________'}</div>
            <div style="font-size: 10pt; margin: 3px 0; color: #333;">Title: ${clientInfo.signatoryTitle || '_________________________'}</div>
            <div style="font-size: 10pt; margin: 3px 0; color: #333;">Date: _________________________</div>
          </div>
        </div>
      </div>
    `;
  };

  // Generate HTML versions for display
  const serviceAgreementHTML = serviceAgreementBase ? generateDocumentHTML(serviceAgreementBase, 'agreement') : null;
  const statementOfWorkHTML = statementOfWorkBase ? generateDocumentHTML(statementOfWorkBase, 'sow') : null;

  // For copying - add plain text signatures
  const addSignatureBlocksPlainText = (documentText: string, documentType: 'agreement' | 'sow') => {
    if (!documentText) return documentText;

    const signatureBlock = `

IN WITNESS WHEREOF, the Parties have executed this ${documentType === 'agreement' ? 'Service Agreement' : 'Statement of Work'} as of the Effective Date.

${(serviceProvider.name || 'SERVICE PROVIDER').toUpperCase()}
${serviceProvider.address || ''}

By: _________________________
Name: ${serviceProvider.signatoryName || '_________________________'}
Title: ${serviceProvider.signatoryTitle || '_________________________'}
Date: _________________________


${(clientInfo.legalName || proposalDetail.clientName || 'CLIENT').toUpperCase()}
${clientInfo.address || ''}

By: _________________________
Name: ${clientInfo.signatoryName || '_________________________'}
Title: ${clientInfo.signatoryTitle || '_________________________'}
Date: _________________________`;

    return documentText + signatureBlock;
  };

  const serviceAgreementPlainText = serviceAgreementBase ? addSignatureBlocksPlainText(serviceAgreementBase, 'agreement') : null;
  const statementOfWorkPlainText = statementOfWorkBase ? addSignatureBlocksPlainText(statementOfWorkBase, 'sow') : null;

  const completeProposalPlainText = serviceAgreementPlainText && statementOfWorkPlainText
    ? `${serviceAgreementPlainText}\n\n${'='.repeat(80)}\n\n${statementOfWorkPlainText}`
    : "Contracts not available.";

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
        }
      }}
    >
      <div className="min-h-screen bg-black font-manrope">
         <div className="px-4 py-8 w-full">
          {/* Back Button */}
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
             className="group flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 bg-white/5 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white mb-6">
           
          
            Back to Proposals
          </Button>

          {/* Page Header */}
          <div className="text-center mb-8">
            <Title level={1} className="m-0 mb-2" style={{ color: TEXT_PRIMARY }}>Proposal Details</Title>
            <Text style={{ color: SPACE_COLOR }} className="text-lg">
              {proposalDetail.title}
            </Text>
          </div>

          {/* Header Card with Actions */}
          <Card style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }} className="mb-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <Title level={3} style={{ color: TEXT_PRIMARY }}>Generated Proposal</Title>
                <Text style={{ color: SPACE_COLOR }}>
                  Created for {clientInfo.legalName || proposalDetail.clientName} • Effective {effectiveDate}
                </Text>
              </div>
              <Space>
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(completeProposalPlainText, 'Complete Proposal')}
                  style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                >
                  Copy Complete
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => exportProposal('html')}
                  loading={exportLoading}
                  type="primary"
                  style={{
                    backgroundColor: BRAND_GREEN,
                    borderColor: BRAND_GREEN,
                    color: '#000000',
                    fontWeight: '500'
                  }}
                >
                  Export & Download Proposal
                </Button>
              </Space>
            </div>
          </Card>

          {/* Document Tabs - Matching ProposalPreview */}
          <Card style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }} className="mb-6">
            <Tabs
              activeKey={activeDocTab}
              onChange={(key) => setActiveDocTab(key as 'complete' | 'agreement' | 'sow')}
              type="card"
              items={[
                {
                  key: 'complete',
                  label: 'Complete Proposal',
                  children: (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <Title level={4} style={{ color: TEXT_PRIMARY }}>Complete Proposal Document</Title>
                        <Button
                          icon={<CopyOutlined />}
                          onClick={() => copyToClipboard(completeProposalPlainText, 'Complete Proposal')}
                          size="small"
                          style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                        >
                          Copy Complete
                        </Button>
                      </div>
                      <div
                        className="border rounded p-6 bg-white"
                        style={{ maxHeight: '600px', overflowY: 'auto', borderColor: SURFACE_LIGHTER }}
                      >
                        {serviceAgreementHTML ? (
                          <>
                            <div dangerouslySetInnerHTML={{ __html: serviceAgreementHTML }} />
                            <div style={{ margin: '40px 0', borderTop: '2px solid #000' }}></div>
                          </>
                        ) : null}
                        {statementOfWorkHTML ? (
                          <div dangerouslySetInnerHTML={{ __html: statementOfWorkHTML }} />
                        ) : null}
                        {!serviceAgreementHTML && !statementOfWorkHTML && (
                          <div style={{ color: '#999', textAlign: 'center', padding: '40px' }}>
                            No contract documents available for this proposal.
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'agreement',
                  label: 'Service Agreement',
                  children: serviceAgreementHTML ? (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <Title level={4} style={{ color: TEXT_PRIMARY }}>Service Agreement</Title>
                        <Button
                          icon={<CopyOutlined />}
                          onClick={() => copyToClipboard(serviceAgreementPlainText || '', 'Service Agreement')}
                          size="small"
                          style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                        >
                          Copy Agreement
                        </Button>
                      </div>
                      <div
                        className="border rounded p-6 bg-white"
                        style={{ maxHeight: '600px', overflowY: 'auto', borderColor: SURFACE_LIGHTER }}
                        dangerouslySetInnerHTML={{ __html: serviceAgreementHTML }}
                      />
                    </div>
                  ) : (
                    <Alert
                      message="Service Agreement Not Available"
                      description="The service agreement could not be found. Please try regenerating the proposal."
                      type="warning"
                      showIcon
                      style={{ background: 'rgba(250, 173, 20, 0.1)', borderColor: '#faad14' }}
                    />
                  ),
                },
                {
                  key: 'sow',
                  label: 'Statement of Work',
                  children: statementOfWorkHTML ? (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <Title level={4} style={{ color: TEXT_PRIMARY }}>Statement of Work</Title>
                        <Button
                          icon={<CopyOutlined />}
                          onClick={() => copyToClipboard(statementOfWorkPlainText || '', 'Statement of Work')}
                          size="small"
                          style={{ background: SURFACE_LIGHTER, borderColor: BORDER_COLOR, color: TEXT_PRIMARY }}
                        >
                          Copy SOW
                        </Button>
                      </div>
                      <div
                        className="border rounded p-6 bg-white"
                        style={{ maxHeight: '600px', overflowY: 'auto', borderColor: SURFACE_LIGHTER }}
                        dangerouslySetInnerHTML={{ __html: statementOfWorkHTML }}
                      />
                    </div>
                  ) : (
                    <Alert
                      message="Statement of Work Not Available"
                      description="The statement of work could not be found. Please try regenerating the proposal."
                      type="warning"
                      showIcon
                      style={{ background: 'rgba(250, 173, 20, 0.1)', borderColor: '#faad14' }}
                    />
                  ),
                },
              ]}
            />
          </Card>

          {/* Proposal Summary - Matching ProposalPreview */}
          <Card style={{ background: SURFACE_BG, borderColor: BORDER_COLOR }}>
            <Title level={4} style={{ color: TEXT_PRIMARY }}>Proposal Summary</Title>
            <Divider style={{ borderColor: BORDER_COLOR }} />
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong style={{ color: TEXT_SECONDARY }}>Client:</Text>
                <br />
                <Text style={{ color: TEXT_PRIMARY }}>{clientInfo.legalName || proposalDetail.clientName}</Text>
              </Col>
              <Col span={12}>
                <Text strong style={{ color: TEXT_SECONDARY }}>Service Provider:</Text>
                <br />
                <Text style={{ color: TEXT_PRIMARY }}>{serviceProvider.name || 'N/A'}</Text>
              </Col>
              <Col span={12}>
                <Text strong style={{ color: TEXT_SECONDARY }}>Effective Date:</Text>
                <br />
                <Text style={{ color: TEXT_PRIMARY }}>{effectiveDate}</Text>
              </Col>
              <Col span={12}>
                <Text strong style={{ color: TEXT_SECONDARY }}>Status:</Text>
                <br />
                <Tag color="blue" style={{ background: 'rgba(24, 144, 255, 0.1)', color: '#1890ff' }}>
                  {proposalDetail.status?.toUpperCase() || 'DRAFT'}
                </Tag>
              </Col>
              <Col span={12}>
                <Text strong style={{ color: TEXT_SECONDARY }}>Service Agreement:</Text>
                <br />
                <Tag color={serviceAgreementHTML ? "green" : "red"}
                  style={{
                    background: serviceAgreementHTML ? 'rgba(82, 196, 26, 0.1)' : 'rgba(255, 77, 79, 0.1)',
                    color: serviceAgreementHTML ? '#52c41a' : '#ff4d4f'
                  }}
                >
                  {serviceAgreementHTML ? "Generated" : "Not Available"}
                </Tag>
              </Col>
              <Col span={12}>
                <Text strong style={{ color: TEXT_SECONDARY }}>Statement of Work:</Text>
                <br />
                <Tag color={statementOfWorkHTML ? "green" : "red"}
                  style={{
                    background: statementOfWorkHTML ? 'rgba(82, 196, 26, 0.1)' : 'rgba(255, 77, 79, 0.1)',
                    color: statementOfWorkHTML ? '#52c41a' : '#ff4d4f'
                  }}
                >
                  {statementOfWorkHTML ? "Generated" : "Not Available"}
                </Tag>
              </Col>
            </Row>
          </Card>
        </div>

        {/* Custom CSS for hover effects - matching proposal generator */}
        <style jsx global>{`
          .ant-btn:hover, .ant-btn:focus {
            border-color: #5CC49D !important;
            color: #5CC49D !important;
          }

          .ant-btn-primary:hover, .ant-btn-primary:focus {
            background: #4cb08d !important;
            border-color: #4cb08d !important;
            color: #000 !important;
          }

          .ant-tabs-tab:hover {
            color: #5CC49D !important;
          }

          .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
            color: #5CC49D !important;
          }
        `}</style>
      </div>
    </ConfigProvider>
  );
};

export default ProposalDetailPage;
