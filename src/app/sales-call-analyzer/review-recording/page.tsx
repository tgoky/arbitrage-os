// app/sales-call-analyzer/review-recording.tsx
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
  Spin
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

export default function ReviewRecordingPage() {
  const go = useGo();
  const [form] = Form.useForm();

  const [currentStep, setCurrentStep] = useState(0);

  const [analysisData, setAnalysisData] = useState<any>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { analyzeCall, validateInput , loading} = useSalesCallAnalyzer();
    const { currentWorkspace, isWorkspaceReady } = useWorkspaceContext();

      // ADD WORKSPACE VALIDATION (same as other components)
  if (!isWorkspaceReady) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <Spin size="large" tip="Loading workspace..."/>
        {/* <p className="mt-4"></p> */}
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Alert
          message="Workspace Required"
          description="The sales call analyzer must be accessed from within a workspace."
          type="error"
          showIcon
          action={<Button type="primary" href="/dashboard">Go to Dashboard</Button>}
        />
      </div>
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
      const analysisInput = {
        title: values.title || `${values.callType} call with ${values.companyName || 'prospect'}`,
        callType: values.callType,
        actualDate: values.actualDate ? dayjs(values.actualDate).toDate() : new Date(),
        transcript: values.transcript,
        prospectName: values.prospectName,
        prospectTitle: values.prospectTitle,
        prospectEmail: values.prospectEmail,
        prospectLinkedin: values.prospectLinkedin,
        companyName: values.companyName,
        companyWebsite: values.companyWebsite,
        companyIndustry: values.companyIndustry,
        companyHeadcount: values.companyHeadcount,
        companyRevenue: values.companyRevenue,
        companyLocation: values.companyLocation,
        companyLinkedin: values.companyLinkedin,
        additionalContext: values.additionalContext,
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
    icon: <FileTextOutlined />, // Changed from UploadOutlined
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
    <div className="max-w-6xl mx-auto px-4 py-8">
           <LoadingOverlay visible={loading} />
      <div className="flex justify-between items-center mb-8">
        <Title level={3}>Native Call Analysis</Title>
        <Button 
          icon={<CloseOutlined />} 
          onClick={() => go({ to: "/sales-call-analyzer" })}
        >
          Cancel
        </Button>
      </div>
      
      <Text type="secondary" className="block mb-6">
        Upload your sales call recording to get AI-powered analysis and feedback.
      </Text>

    {/* Progress Steps */}
<Card className="mb-6">
  <Steps current={currentStep} items={steps} />
  {isAnalyzing && (
    <div className="mt-4">
      <Progress percent={75} status="active" />
      <Text type="secondary">Analyzing call with AI...</Text>
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
          <Card title="Call Information" className="h-full">
            <Form.Item name="callType" label="Call Type">
              <Select>
                <Option value="discovery">Discovery Call</Option>
                <Option value="interview">Interview Call</Option>
                <Option value="sales">Sales Call</Option>
                <Option value="podcast">Podcast Call</Option>
              </Select>
            </Form.Item>
            
            <Form.Item name="actualDate" label="Call Date">
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item name="title" label="Call Title (Optional)">
              <Input placeholder="e.g., Discovery call with Acme Corp" />
            </Form.Item>
          </Card>
          
          <Card title="Prospect Information" className="h-full">
            <div className="space-y-4">
              <Form.Item name="prospectName">
                <Input prefix={<UserOutlined />} placeholder="Name" />
              </Form.Item>
              <Form.Item name="prospectTitle">
                <Input prefix={<UserOutlined />} placeholder="Title (e.g. VP of Sales)" />
              </Form.Item>
              <Form.Item name="prospectEmail">
                <Input prefix={<UserOutlined />} placeholder="Email" />
              </Form.Item>
              <Form.Item name="prospectLinkedin">
                <Input prefix={<LinkOutlined />} placeholder="LinkedIn URL" />
              </Form.Item>
            </div>
          </Card>
          
          <Card title="Company Information" className="h-full">
            <div className="space-y-4">
              <Form.Item name="companyName">
                <Input prefix={<BankOutlined />} placeholder="Company Name" />
              </Form.Item>
              <Form.Item name="companyWebsite">
                <Input prefix={<LinkOutlined />} placeholder="Website" />
              </Form.Item>
              <Form.Item name="companyIndustry">
                <Input prefix={<BankOutlined />} placeholder="Industry (Software, Healthcare, etc.)" />
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
                <Input prefix={<EnvironmentOutlined />} placeholder="Location" />
              </Form.Item>
              <Form.Item name="companyLinkedin">
                <Input prefix={<LinkOutlined />} placeholder="LinkedIn Company Page" />
              </Form.Item>
            </div>
          </Card>
        </div>
      
      <Card title="Call Transcript" className="mb-6">
  <Form.Item 
    name="transcript" 
    label="Paste your call transcript here"
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
  
  <Text type="secondary" className="block mt-2">
    💡 <strong>Tip:</strong> Include speaker names (e.g., John: Hello, thanks for joining) 
    for better speaker analysis and insights.
  </Text>
</Card>

        <Card title="Additional Context" className="mb-6">
          <Form.Item name="additionalContext" label="Context & Background">
            <TextArea 
              rows={3} 
              placeholder="Add any specific context about this call, the prospect's situation, or background information..." 
            />
          </Form.Item>

          <Form.Item name="specificQuestions" label="Specific Questions (one per line)">
            <TextArea 
              rows={3} 
              placeholder={`What objections did the prospect raise?\nHow well did I handle their concerns?\nWhat follow-up actions should I take?`}
            />
          </Form.Item>

          <Form.Item name="analysisGoals" label="Analysis Goals (one per line)">
            <TextArea 
              rows={2} 
              placeholder={`Improve discovery questioning\nBetter objection handling\nIncrease close rate`}
            />
          </Form.Item>
          
          <Text type="secondary" className="block mt-2">
            The AI will analyze these specific points and provide targeted insights based on your questions and goals.
          </Text>
        </Card>
        
        <div className="flex justify-end space-x-4">
          <Button onClick={() => go({ to: "/sales-call-analyzer" })}>
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
    backgroundColor: '#5CC49D',
    borderColor: '#5CC49D',
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
        <Card className="mt-6 border-green-200">
          <div className="text-center">
            <CheckCircleOutlined className="text-4xl text-green-500 mb-4" />
            <Title level={4}>Analysis Complete!</Title>
            <Text type="secondary" className="block mb-4">
              Your call has been successfully analyzed. Redirecting to results...
            </Text>
            <div className="flex justify-center space-x-4">
              <Button 
                type="primary"
                onClick={() => go({ to: `/sales-call-analyzer/analysis/${analysisData.analysisId}` })}
              >
                View Analysis
              </Button>
              <Button onClick={() => go({ to: "/sales-call-analyzer" })}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}