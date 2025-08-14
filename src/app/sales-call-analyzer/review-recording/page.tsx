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
  Progress
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
  CheckCircleOutlined
} from '@ant-design/icons';
import { useGo } from "@refinedev/core";
import type { UploadChangeParam } from 'antd/es/upload';
import type { UploadFile } from 'antd/es/upload/interface';
import { useSalesCallAnalyzer } from '../../hooks/useSalesCallAnalyzer';

import { useState } from 'react';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

export default function ReviewRecordingPage() {
  const go = useGo();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [transcriptionData, setTranscriptionData] = useState<any>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { analyzeCall, validateInput } = useSalesCallAnalyzer();

  const handleUpload = (info: UploadChangeParam<UploadFile>) => {
    let fileList = [...info.fileList];
    fileList = fileList.slice(-1); // Limit to 1 file
    setFileList(fileList);
    
    if (info.file.status === 'done') {
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  const handleTranscribe = async () => {
    if (fileList.length === 0) {
      message.error('Please upload an audio file first');
      return;
    }

    setIsTranscribing(true);
    setCurrentStep(1);

    try {
      const formData = new FormData();
      formData.append('audio', fileList[0].originFileObj as File);

      const response = await fetch('/api/sales-call-analyzer/transcribe', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setTranscriptionData(result.data);
        form.setFieldsValue({ transcript: result.data.transcript });
        message.success('Audio transcribed successfully!');
        setCurrentStep(2);
      } else {
        throw new Error(result.error || 'Transcription failed');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      message.error('Failed to transcribe audio. Please try again.');
      setCurrentStep(0);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleAnalyze = async (values: any) => {
    // Validate the input first
    const validation = validateInput(values);
    if (!validation.isValid) {
      validation.errors.forEach(error => message.error(error));
      return;
    }

    setIsAnalyzing(true);
    setCurrentStep(3);

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
      setCurrentStep(4);
      
      // Redirect to the analysis page after a brief delay
      setTimeout(() => {
        go({ to: `/sales-call-analyzer/analysis/${result.analysisId}` });
      }, 2000);

    } catch (error) {
      console.error('Analysis error:', error);
      message.error('Failed to analyze call. Please try again.');
      setCurrentStep(2);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const steps = [
    {
      title: 'Upload',
      icon: <UploadOutlined />,
      description: 'Upload audio file'
    },
    {
      title: 'Transcribe',
      icon: <SoundOutlined />,
      description: 'Convert to text'
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
      <div className="flex justify-between items-center mb-8">
        <Title level={3}>Review Sales Call Recording</Title>
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
        {isTranscribing && (
          <div className="mt-4">
            <Progress percent={50} status="active" />
            <Text type="secondary">Transcribing audio...</Text>
          </div>
        )}
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
        
        <Card title="Upload Recording" className="mb-6">
          <Upload.Dragger
            fileList={fileList}
            onChange={handleUpload}
            beforeUpload={() => false}
            accept=".mp3,.wav,.m4a,.aac,.ogg,.wma,.flac,.mp4,.mov"
            maxCount={1}
            className="py-8"
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined className="text-3xl" />
            </p>
            <p className="ant-upload-text">Drag & drop your recording here, or click to select</p>
            <p className="ant-upload-hint">
              Supports audio/video files (MP3, WAV, M4A, MP4, etc.) up to 25MB
            </p>
          </Upload.Dragger>
          
          {fileList.length > 0 && currentStep === 0 && (
            <div className="mt-4 text-center">
              <Button 
                type="primary" 
                onClick={handleTranscribe}
                loading={isTranscribing}
                icon={<SoundOutlined />}
              >
                Transcribe Audio
              </Button>
            </div>
          )}

          {transcriptionData && (
            <div className="mt-4">
              <Text strong>Transcription Quality:</Text>
              <div className="flex items-center mt-2">
                <Progress 
                  percent={Math.round(transcriptionData.confidence * 100)} 
                  size="small" 
                  className="mr-4" 
                />
                <Text type="secondary">
                  Duration: {Math.floor(transcriptionData.duration / 60)}:{String(transcriptionData.duration % 60).padStart(2, '0')} • 
                  Words: {transcriptionData.wordCount} • 
                  Language: {transcriptionData.language}
                </Text>
              </div>
            </div>
          )}
          
          <div className="mt-4">
            <Form.Item name="transcript" label="Transcript">
              <TextArea 
                rows={6} 
                placeholder="Transcript will appear here after audio processing, or you can paste it manually..." 
                disabled={isTranscribing}
              />
            </Form.Item>
          </div>
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
          <Button 
            type="primary" 
            htmlType="submit"
            loading={isAnalyzing}
            disabled={!form.getFieldValue('transcript') || isTranscribing}
            icon={<RobotOutlined />}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Call'}
          </Button>
        </div>
      </Form>

      {/* Success State */}
      {currentStep === 4 && analysisData && (
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