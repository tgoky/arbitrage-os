"use client";

import { 
  Button, 
  Card, 
  Typography, 
  Input, 
  Select, 
  DatePicker, 
  Upload, 
  message,
  Form,
  Steps,
  Progress,
  Alert,
  Spin,
  ConfigProvider,
  theme
} from 'antd';
import { 
  UploadOutlined, 
  CloseOutlined,
  LinkOutlined,
  UserOutlined,
  BankOutlined,
  EnvironmentOutlined,
  SoundOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  FileTextOutlined, 
} from '@ant-design/icons';
import { useGo } from "@refinedev/core";
import type { UploadChangeParam } from 'antd/es/upload';
import type { UploadFile } from 'antd/es/upload/interface';
import { useWorkspaceContext } from '../../hooks/useWorkspaceContext';
import { useSalesCallAnalyzer } from '../../hooks/useSalesCallAnalyzer';

import LoadingOverlay from '../loadingOverlay';

import { useState } from 'react';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

// Color constants (matching the main page)
const SPACE_COLOR = '#9DA2B3';
const BRAND_GREEN = '#5CC49D';
const DARK_BG = '#0f172a';
const SURFACE_BG = '#000000';
const SURFACE_LIGHTER = '#334155';
const TEXT_PRIMARY = '#f1f5f9';
const TEXT_SECONDARY = '#94a3b8';
const BORDER_COLOR = '#334155';

export default function ReviewRecordingPage() {
  const go = useGo();
  const [form] = Form.useForm();

  const [currentStep, setCurrentStep] = useState(0);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { analyzeCall, validateInput, loading } = useSalesCallAnalyzer();
  const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();

  // ADD WORKSPACE VALIDATION (same as other components)
  if (!isWorkspaceReady) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">

        <ConfigProvider
  theme={{
    token: {
      colorPrimary: '#5CC49D',
    },
  }}
>

     <Spin size="large" tip="Loading workspace..."/>

</ConfigProvider>

     
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            fontFamily: 'Manrope, sans-serif',
          },
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-8" style={{ background: DARK_BG, minHeight: '100vh' }}>
          <Alert
            message="Workspace Required"
            description="The sales call analyzer must be accessed from within a workspace."
            type="error"
            showIcon
            action={
              <Button 
                type="primary" 
                href="/dashboard"
                style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' }}
              >
                Go to Dashboard
              </Button>
            }
          />
        </div>
      </ConfigProvider>
    );
  }

  const handleAnalyze = async (values: any) => {
    // Validate the input first
    const validation = validateInput(values);
    if (!validation.isValid) {
      validation.errors.forEach(error => message.error(error));
      return;
    }

    setIsAnalyzing(true);
    setCurrentStep(2); // When starting analysis

    try {
      // Strip empty strings to undefined so optional validators don't fail
      const stripEmpty = (val: string | undefined) => val?.trim() || undefined;

      const analysisInput = {
        title: values.title || `${values.callType} call with ${values.companyName || 'prospect'}`,
        callType: values.callType,
        actualDate: values.actualDate ? dayjs(values.actualDate).toDate() : new Date(),
        transcript: values.transcript,
        prospectName: stripEmpty(values.prospectName),
        prospectTitle: stripEmpty(values.prospectTitle),
        prospectEmail: stripEmpty(values.prospectEmail),
        prospectLinkedin: stripEmpty(values.prospectLinkedin),
        companyName: stripEmpty(values.companyName),
        companyWebsite: stripEmpty(values.companyWebsite),
        companyIndustry: stripEmpty(values.companyIndustry),
        companyHeadcount: values.companyHeadcount || undefined,
        companyRevenue: values.companyRevenue || undefined,
        companyLocation: stripEmpty(values.companyLocation),
        companyLinkedin: stripEmpty(values.companyLinkedin),
        additionalContext: stripEmpty(values.additionalContext),
        scheduledDate: undefined,
        specificQuestions: values.specificQuestions ? values.specificQuestions.split('\n').filter(Boolean) : undefined,
        analysisGoals: values.analysisGoals ? values.analysisGoals.split('\n').filter(Boolean) : undefined,
      };

      const result = await analyzeCall(analysisInput);
      setAnalysisData(result);
      message.success('Analysis completed successfully!');
      setCurrentStep(3); // ✅ Set step 3 only on success
      
      // Redirect to the analysis page after a brief delay
      setTimeout(() => {
        go({ to: `/sales-call-analyzer/analysis/${result.analysisId}` });
      }, 2000);

    } catch (error) {
      console.error('Analysis error:', error);
      message.error('Failed to analyze call. Please try again.');
      setCurrentStep(1); // ✅ Go back to review step on error
    } finally {
      setIsAnalyzing(false);
    }
  };

  const steps = [
    {
      title: 'Input',
      icon: <FileTextOutlined />,
      description: 'Enter transcript'
    },
    {
      title: 'Review',
      icon: <UserOutlined />,
      description: 'Add context & details'
    },
    {
      title: 'Analyze',
      icon: <RobotOutlined />,
      description: 'AI analysis'
    },
    {
      title: 'Complete',
      icon: <CheckCircleOutlined />,
      description: 'View results'
    }
  ];

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
          Input: {
            paddingBlock: 10,
            // borderColor: SURFACE_LIGHTER,
            activeBorderColor: BRAND_GREEN,
            hoverBorderColor: BRAND_GREEN,
            colorBgContainer: SURFACE_BG,
            colorText: TEXT_PRIMARY,
          },
          Select: {
            controlHeight: 44,
            colorPrimary: BRAND_GREEN,
            optionSelectedBg: SURFACE_LIGHTER,
            colorBgContainer: SURFACE_BG,
            colorText: TEXT_PRIMARY,
            hoverBorderColor: BRAND_GREEN,
          },
          Card: {
            headerBg: SURFACE_BG,
            colorBgContainer: SURFACE_BG,
            colorTextHeading: TEXT_PRIMARY,
            colorBorder: BORDER_COLOR,
          },
          Steps: {
            colorPrimary: BRAND_GREEN,
            colorText: TEXT_SECONDARY,
            colorTextDescription: TEXT_SECONDARY,
          },
          Progress: {
            defaultColor: BRAND_GREEN,
            colorSuccess: BRAND_GREEN,
            remainingColor: SURFACE_LIGHTER,
          },
          Form: {
            labelColor: TEXT_SECONDARY,
          }
        }
      }}
    >
      <div className="min-h-screen bg-black font-manrope">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <LoadingOverlay visible={loading} />
          <div className="flex justify-between items-center mb-8">
            <Title level={3} style={{ color: TEXT_PRIMARY }}>Native Call Analysis</Title>
            <Button 
              icon={<CloseOutlined />} 
              onClick={() => go({ to: "/sales-call-analyzer" })}
              style={{ color: TEXT_SECONDARY }}
            >
              Cancel
            </Button>
          </div>
          
          <Text type="secondary" className="block mb-6" style={{ color: TEXT_SECONDARY }}>
            Upload your sales call recording to get AI-powered analysis and feedback.
          </Text>

          {/* Progress Steps */}
          <Card className="mb-6" style={{ background: SURFACE_BG }}>
            <Steps 
              current={currentStep} 
              items={steps.map(step => ({
                ...step,
                title: <span style={{ color: TEXT_PRIMARY }}>{step.title}</span>,
                description: <span style={{ color: TEXT_SECONDARY }}>{step.description}</span>
              }))} 
            />
            {isAnalyzing && (
              <div className="mt-4">
                <Progress percent={75} status="active" />
                <Text type="secondary" style={{ color: TEXT_SECONDARY }}>Analyzing call with AI...</Text>
              </div>
            )}
          </Card>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleAnalyze}
            initialValues={{
              callType: 'discovery',
              actualDate: dayjs()
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Card title="Call Information" className="h-full" style={{ background: SURFACE_BG }}>
                <Form.Item name="callType" label={<span style={{ color: TEXT_SECONDARY }}>Call Type</span>}>
                  <Select>
                    <Option value="discovery">Discovery Call</Option>
                    <Option value="interview">Interview Call</Option>
                    <Option value="sales">Sales Call</Option>
                    <Option value="podcast">Podcast Call</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item name="actualDate" label={<span style={{ color: TEXT_SECONDARY }}>Call Date</span>}>
                  <DatePicker className="w-full" />
                </Form.Item>

                <Form.Item name="title" label={<span style={{ color: TEXT_SECONDARY }}>Call Title (Optional)</span>}>
                  <Input placeholder="e.g., Discovery call with Acme Corp" />
                </Form.Item>
              </Card>
              
              <Card title="Prospect Information" className="h-full" style={{ background: SURFACE_BG }}>
                <div className="space-y-4">
                  <Form.Item name="prospectName">
                    <Input prefix={<UserOutlined style={{ color: BRAND_GREEN }} />} placeholder="Name" />
                  </Form.Item>
                  <Form.Item name="prospectTitle">
                    <Input prefix={<UserOutlined style={{ color: BRAND_GREEN }} />} placeholder="Title (e.g. VP of Sales)" />
                  </Form.Item>
                  <Form.Item name="prospectEmail">
                    <Input prefix={<UserOutlined style={{ color: BRAND_GREEN }} />} placeholder="Email" />
                  </Form.Item>
                  <Form.Item name="prospectLinkedin">
                    <Input prefix={<LinkOutlined style={{ color: BRAND_GREEN }} />} placeholder="LinkedIn URL" />
                  </Form.Item>
                </div>
              </Card>
              
              <Card title="Company Information" className="h-full" style={{ background: SURFACE_BG }}>
                <div className="space-y-4">
                  <Form.Item name="companyName">
                    <Input prefix={<BankOutlined style={{ color: BRAND_GREEN }} />} placeholder="Company Name" />
                  </Form.Item>
                  <Form.Item name="companyWebsite">
                    <Input prefix={<LinkOutlined style={{ color: BRAND_GREEN }} />} placeholder="Website" />
                  </Form.Item>
                  <Form.Item name="companyIndustry">
                    <Input prefix={<BankOutlined style={{ color: BRAND_GREEN }} />} placeholder="Industry (Software, Healthcare, etc.)" />
                  </Form.Item>
                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item name="companyHeadcount">
                      <Select placeholder="Headcount range">
                        <Option value="1-10">1-10</Option>
                        <Option value="11-50">11-50</Option>
                        <Option value="51-200">51-200</Option>
                        <Option value="201-500">201-500</Option>
                        <Option value="501-1000">501-1000</Option>
                        <Option value="1000+">1000+</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item name="companyRevenue">
                      <Select placeholder="Revenue range">
                        <Option value="0-1M">$0-$1M</Option>
                        <Option value="1M-10M">$1M-$10M</Option>
                        <Option value="10M-50M">$10M-$50M</Option>
                        <Option value="50M-100M">$50M-$100M</Option>
                        <Option value="100M+">$100M+</Option>
                      </Select>
                    </Form.Item>
                  </div>
                  <Form.Item name="companyLocation">
                    <Input prefix={<EnvironmentOutlined style={{ color: BRAND_GREEN }} />} placeholder="Location" />
                  </Form.Item>
                  <Form.Item name="companyLinkedin">
                    <Input prefix={<LinkOutlined style={{ color: BRAND_GREEN }} />} placeholder="LinkedIn Company Page" />
                  </Form.Item>
                </div>
              </Card>
            </div>
          
          <Card title="Call Transcript" className="mb-6" style={{ background: SURFACE_BG }}>
            <Form.Item 
              name="transcript" 
              label={<span style={{ color: TEXT_SECONDARY }}>Paste your call transcript here</span>}
              rules={[
                { required: true, message: 'Transcript is required' },
                { min: 50, message: 'Transcript must be at least 50 characters' }
              ]}
            >
              <TextArea 
                rows={12} 
                placeholder="Paste your call transcript here. Make sure to include speaker names like 'John:' or 'Sarah:' to help with analysis..."
                showCount
                maxLength={100000}
              />
            </Form.Item>
            
            <Text type="secondary" className="block mt-2" style={{ color: TEXT_SECONDARY }}>
              💡 <strong style={{ color: TEXT_PRIMARY }}>Tip:</strong> Include speaker names (e.g., John: Hello, thanks for joining) 
              for better speaker analysis and insights.
            </Text>
          </Card>

            <Card title="Additional Context" className="mb-6" style={{ background: SURFACE_BG }}>
              <Form.Item name="additionalContext" label={<span style={{ color: TEXT_SECONDARY }}>Context & Background</span>}>
                <TextArea 
                  rows={3} 
                  placeholder="Add any specific context about this call, the prospect's situation, or background information..." 
                />
              </Form.Item>

              <Form.Item name="specificQuestions" label={<span style={{ color: TEXT_SECONDARY }}>Specific Questions (one per line)</span>}>
                <TextArea 
                  rows={3} 
                  placeholder={`What objections did the prospect raise?\nHow well did I handle their concerns?\nWhat follow-up actions should I take?`}
                />
              </Form.Item>

              <Form.Item name="analysisGoals" label={<span style={{ color: TEXT_SECONDARY }}>Analysis Goals (one per line)</span>}>
                <TextArea 
                  rows={2} 
                  placeholder={`Improve discovery questioning\nBetter objection handling\nIncrease close rate`}
                />
              </Form.Item>
              
              <Text type="secondary" className="block mt-2" style={{ color: TEXT_SECONDARY }}>
                The AI will analyze these specific points and provide targeted insights based on your questions and goals.
              </Text>
            </Card>
            
            <div className="flex justify-end space-x-4">
              <Button 
                onClick={() => go({ to: "/sales-call-analyzer" })}
                style={{ color: TEXT_SECONDARY }}
              >
                Cancel
              </Button>
        
          <Form.Item shouldUpdate>
            {(form) => (
              <div className="flex justify-end space-x-4">
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={isAnalyzing}
                  disabled={!form.getFieldValue('transcript') || form.getFieldValue('transcript')?.length < 50 || isAnalyzing}
                  icon={<RobotOutlined />}
                  style={{
                    backgroundColor: BRAND_GREEN,
                    borderColor: BRAND_GREEN,
                    color: '#000000',
                    fontWeight: '500'
                  }}
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Call'}
                </Button>
              </div>
            )}
          </Form.Item>
            </div>
          </Form>

          {/* Success State */}
          {currentStep === 3 && analysisData && (
            <Card className="mt-6" style={{ background: SURFACE_BG, borderColor: BRAND_GREEN }}>
              <div className="text-center">
                <CheckCircleOutlined className="text-4xl mb-4" style={{ color: BRAND_GREEN }} />
                <Title level={4} style={{ color: TEXT_PRIMARY }}>Analysis Complete!</Title>
                <Text type="secondary" className="block mb-4" style={{ color: TEXT_SECONDARY }}>
                  Your call has been successfully analyzed. Redirecting to results...
                </Text>
                <div className="flex justify-center space-x-4">
                  <Button 
                    type="primary"
                    onClick={() => go({ to: `/sales-call-analyzer/analysis/${analysisData.analysisId}` })}
                    style={{ background: BRAND_GREEN, borderColor: BRAND_GREEN, color: '#000' }}
                  >
                    View Analysis
                  </Button>
                  <Button 
                    onClick={() => go({ to: "/sales-call-analyzer" })}
                    style={{ color: TEXT_SECONDARY }}
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Custom CSS for hover effects */}
        <style jsx global>{`
          .ant-input:hover, .ant-input:focus {
            border-color: ${BRAND_GREEN} !important;
            box-shadow: 0 0 0 2px rgba(92, 196, 157, 0.1) !important;
          }
          
          .ant-select-selector:hover, .ant-select-focused .ant-select-selector {
            border-color: ${BRAND_GREEN} !important;
            box-shadow: 0 0 0 2px rgba(92, 196, 157, 0.1) !important;
          }
          
          .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
            background-color: rgba(92, 196, 157, 0.1) !important;
          }
          
          .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
            background-color: rgba(92, 196, 157, 0.2) !important;
            color: ${BRAND_GREEN} !important;
          }
          
          .ant-btn:hover, .ant-btn:focus {
            border-color: ${BRAND_GREEN} !important;
            color: ${BRAND_GREEN} !important;
          }
          
          .ant-btn-primary:hover, .ant-btn-primary:focus {
            background: #4cb08d !important;
            border-color: #4cb08d !important;
            color: #000 !important;
          }
          
          .ant-card-hoverable:hover {
            border-color: ${BRAND_GREEN} !important;
          }
          
          .ant-form-item-label > label {
            color: ${TEXT_SECONDARY} !important;
          }
          
          .ant-steps-item-title {
            color: ${TEXT_PRIMARY} !important;
          }
          
          .ant-steps-item-description {
            color: ${TEXT_SECONDARY} !important;
          }
        `}</style>
      </div>
    </ConfigProvider>
  );
}